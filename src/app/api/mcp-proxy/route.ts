import { headers } from "next/headers"
import { env } from '@/env'
import { serverAuth } from "@/lib/client/auth"
// TODO: add withProxy and LoggingHook back in
// import { withProxy, LoggingHook } from "cronos402/handler'

// Helper function to validate and extract origin
function getValidOrigin(request: Request): string | null {
  const origin = request.headers.get('origin')
  const referer = request.headers.get('referer')
  
  // Extract origin from referer if origin header is missing
  const extractedOrigin = origin || (referer ? new URL(referer).origin : null)
  
  // In production, only allow specific domains
  if (env.NODE_ENV === 'production') {
    const allowedOrigins = [
      'https://cronos402.tech',
      'https://www.cronos402.tech',
      // Add your production domains here
    ]
    
    if (extractedOrigin && allowedOrigins.includes(extractedOrigin)) {
      return extractedOrigin
    }
    
    return null
  }
  
  // In development, allow localhost and local IPs
  if (extractedOrigin && (
    extractedOrigin.startsWith('http://localhost:') ||
    extractedOrigin.startsWith('http://127.0.0.1:') ||
    extractedOrigin.startsWith('https://localhost:') ||
    extractedOrigin.startsWith('https://127.0.0.1:')
  )) {
    return extractedOrigin
  }
  
  return extractedOrigin
}

export async function POST(request: Request) {
  const h = await headers()
  const url = new URL(request.url)

  // Extract target-url manually from the raw query string to avoid parsing issues
  // The URL might be: /api/mcp-proxy?target-url=aHR0...
  const queryString = url.search
  const targetUrlMatch = queryString.match(/[?&]target-url=([^&]+)/)
  const targetUrl = targetUrlMatch ? decodeURIComponent(targetUrlMatch[1]) : null

  const session = await serverAuth.getSession({
    fetchOptions: {
      headers: {
        cookie: h.get('cookie') ?? '',
      },
      credentials: 'include',
    },
  })

  if (!session.data) {
    return new Response("Unauthorized", { status: 401 })
  }

  if (!targetUrl) {
    return new Response("target-url parameter is required", { status: 400 })
  }

  // Decode the target URL (it should be base64-encoded)
  let decodedTargetUrl: string
  try {
    decodedTargetUrl = atob(targetUrl)
    // Validate it's a proper URL
    new URL(decodedTargetUrl)
  } catch {
    // If decoding fails, assume it's already a plain URL
    try {
      new URL(targetUrl)
      decodedTargetUrl = targetUrl
    } catch (e) {
      console.error('Failed to parse targetUrl:', e)
      return new Response("Invalid target-url parameter", { status: 400 })
    }
  }

  console.log('targetUrl (original):', targetUrl.substring(0, 50))
  console.log('decodedTargetUrl:', decodedTargetUrl)
  console.log('Incoming cookies:', h.get('cookie'))
  console.log('Request origin:', request.headers.get('origin'))
  console.log('Request referer:', request.headers.get('referer'))

  // Forward directly to the decoded target URL
  // This could be mcp2 (http://localhost:3006/mcp?id=xxx) or a direct upstream
  const mcpUrl = decodedTargetUrl

  console.log('mcpUrl', mcpUrl)
  
  // Forward the request to the local MCP server with original headers (preserve MCP session headers)
  const forwardHeaders = new Headers()
  // Copy all incoming headers except hop-by-hop ones
  request.headers.forEach((value, key) => {
    const lower = key.toLowerCase()
    if (lower === 'host' || lower === 'connection' || lower === 'content-length' || lower === 'transfer-encoding' || lower === 'content-encoding') {
      return
    }
    forwardHeaders.set(key, value)
  })
  // Note: We're forwarding directly to the target URL, no need to set x-cronos402-target-url
  // Ensure cookies are forwarded from Next headers API
  if (h.get('cookie')) {
    forwardHeaders.set('Cookie', h.get('cookie') || '')
  }
  // Ensure Accept header supports streaming
  if (!forwardHeaders.has('Accept')) {
    forwardHeaders.set('Accept', 'application/json, text/event-stream')
  }
  // Default content-type for JSON-RPC
  if (!forwardHeaders.has('Content-Type')) {
    forwardHeaders.set('Content-Type', 'application/json')
  }

  // Read body once to check if it's an initialize request and reuse for forwarding
  let bodyText: string | null = null
  let isInitializeRequest = false
  try {
    bodyText = await request.text()
    if (bodyText) {
      const bodyJson = JSON.parse(bodyText)
      isInitializeRequest = bodyJson?.method === 'initialize'
    }
  } catch {
    // If parsing fails, assume it's not initialize (will add session ID)
  }

  // Generate new MCP session ID if missing, but NOT for initialize requests
  if (!isInitializeRequest && !forwardHeaders.has('MCP-Session-Id') && !forwardHeaders.has('mcp-session-id')) {
    const newSessionId = crypto.randomUUID()
    forwardHeaders.set('MCP-Session-Id', newSessionId)
  } else if (isInitializeRequest) {
    // Remove session ID header for initialize requests
    forwardHeaders.delete('MCP-Session-Id')
    forwardHeaders.delete('mcp-session-id')
  }

  console.log('Forwarding to:', mcpUrl)
  console.log('Request headers:', {
    'content-type': forwardHeaders.get('content-type'),
    'authorization': forwardHeaders.get('authorization') ? 'present' : 'missing',
  })

  const response = await fetch(mcpUrl, {
    method: 'POST',
    headers: forwardHeaders,
    body: bodyText ?? '',
    credentials: 'include',
  })

  console.log('MCP server response status:', response.status, response.statusText)

  // Get the validated origin for CORS
  const validOrigin = getValidOrigin(request)
  const upstreamSessionId = response.headers.get('MCP-Session-Id') || response.headers.get('mcp-session-id') || ''
  
  // Build response headers - include Content-Encoding if present to handle gzip
  const responseHeaders: Record<string, string> = {
    'Content-Type': response.headers.get('Content-Type') || 'application/json',
    'Access-Control-Allow-Origin': validOrigin || '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Wallet-Type, X-Wallet-Address, X-Wallet-Provider, MCP-Session-Id, mcp-session-id, x-api-key, WWW-Authenticate',
    'Access-Control-Expose-Headers': 'MCP-Session-Id, WWW-Authenticate, Content-Encoding',
    'Access-Control-Allow-Credentials': validOrigin ? 'true' : 'false',
  }

  // Forward Content-Encoding if present (handles gzip responses)
  const contentEncoding = response.headers.get('Content-Encoding')
  if (contentEncoding) {
    responseHeaders['Content-Encoding'] = contentEncoding
  }

  if (upstreamSessionId) {
    responseHeaders['MCP-Session-Id'] = upstreamSessionId
  }

  return new Response(response.body, {
    status: response.status,
    headers: responseHeaders,
  })
}

export async function GET(request: Request) {
  const h = await headers()
  const url = new URL(request.url)
  const targetUrl = url.searchParams.get('target-url')

  const session = await serverAuth.getSession({
    fetchOptions: {
      headers: {
        cookie: h.get('cookie') ?? '',
      },
      credentials: 'include',
    },
  })

  if (!session.data) {
    return new Response("Unauthorized", { status: 401 })
  }
  
  if (!targetUrl) {
    return new Response("target-url parameter is required", { status: 400 })
  }

  // Decode the target URL (same logic as POST)
  let decodedTargetUrl: string
  try {
    decodedTargetUrl = atob(targetUrl)
    new URL(decodedTargetUrl)
  } catch {
    try {
      new URL(targetUrl)
      decodedTargetUrl = targetUrl
    } catch (e) {
      return new Response("Invalid target-url parameter", { status: 400 })
    }
  }

  // Forward directly to the decoded target URL
  const mcpUrl = decodedTargetUrl

  // Forward the request with original headers (preserve MCP session headers)
  const forwardHeaders = new Headers()
  request.headers.forEach((value, key) => {
    const lower = key.toLowerCase()
    if (lower === 'host' || lower === 'connection' || lower === 'content-length' || lower === 'transfer-encoding' || lower === 'content-encoding') {
      return
    }
    forwardHeaders.set(key, value)
  })
  if (h.get('cookie')) {
    forwardHeaders.set('Cookie', h.get('cookie') || '')
  }
  if (!forwardHeaders.has('Accept')) {
    forwardHeaders.set('Accept', 'application/json, text/event-stream')
  }

  // Generate new MCP session ID if missing
  if (!forwardHeaders.has('MCP-Session-Id') && !forwardHeaders.has('mcp-session-id')) {
    const newSessionId = crypto.randomUUID()
    forwardHeaders.set('MCP-Session-Id', newSessionId)
  }

  const response = await fetch(mcpUrl, {
    method: 'GET',
    headers: forwardHeaders,
    credentials: 'include',
    // @ts-expect-error this is valid and needed
    duplex: 'half',
  })

  // Get the validated origin for CORS
  const validOrigin = getValidOrigin(request)
  const upstreamSessionId = response.headers.get('MCP-Session-Id') || response.headers.get('mcp-session-id') || ''

  // Build response headers - include Content-Encoding if present to handle gzip
  const responseHeaders: Record<string, string> = {
    'Content-Type': response.headers.get('Content-Type') || 'application/json',
    'Access-Control-Allow-Origin': validOrigin || '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Wallet-Type, X-Wallet-Address, X-Wallet-Provider, MCP-Session-Id, mcp-session-id, x-api-key, WWW-Authenticate',
    'Access-Control-Expose-Headers': 'MCP-Session-Id, WWW-Authenticate, Content-Encoding',
    'Access-Control-Allow-Credentials': validOrigin ? 'true' : 'false',
  }

  // Forward Content-Encoding if present (handles gzip responses)
  const getContentEncoding = response.headers.get('Content-Encoding')
  if (getContentEncoding) {
    responseHeaders['Content-Encoding'] = getContentEncoding
  }

  if (upstreamSessionId) {
    responseHeaders['MCP-Session-Id'] = upstreamSessionId
  }

  return new Response(response.body, {
    status: response.status,
    headers: responseHeaders,
  })
}

export async function OPTIONS(request: Request) {
  // Get the validated origin for CORS
  const validOrigin = getValidOrigin(request)
  
  return new Response(null, {
    status: 200,
    headers: {
      'Content-Type': 'application/json, text/event-stream',
      'Access-Control-Allow-Origin': validOrigin || '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Wallet-Type, X-Wallet-Address, X-Wallet-Provider, MCP-Session-Id, mcp-session-id, x-api-key, WWW-Authenticate',
      'Access-Control-Allow-Credentials': validOrigin ? 'true' : 'false',
    },
  })
}
