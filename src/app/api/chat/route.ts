import { streamText } from 'ai';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { headers } from 'next/headers';
import { serverAuth } from '@/lib/client/auth';
import { db, chats, messages } from '@/lib/db';
import { eq, desc } from 'drizzle-orm';
import { nanoid } from 'nanoid';

// MCP tool type (from MCP SDK)
interface McpTool {
  name: string;
  description?: string;
  inputSchema?: Record<string, unknown>;
}

// Helper to get MCP server tools
async function getMcpServerTools(_serverId: string): Promise<McpTool[]> {
  // TODO: Implement MCP gateway integration
  // For now, return empty array - will be implemented in Phase 6
  return [];
}

// Helper to convert MCP tools to AI SDK format
function convertMcpToolsToAiTools(_mcpTools: McpTool[]) {
  // TODO: Implement MCP tool conversion
  // For now, return empty object - will be implemented in Phase 6
  return {};
}

export async function POST(req: Request) {
  try {
    // Authenticate user
    const h = await headers();
    const cookies = h.get('cookie') ?? '';

    const session = await serverAuth.getSession({
      fetchOptions: {
        headers: { cookie: cookies },
        credentials: 'include',
      },
    });

    if (!session.data?.user) {
      return Response.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { chatId, mcpServerId, messages: clientMessages, model } = body;

    if (!chatId || !mcpServerId) {
      return Response.json(
        { error: 'Missing required fields: chatId, mcpServerId' },
        { status: 400 }
      );
    }

    // Create or get chat
    let chat = await db.query.chats.findFirst({
      where: eq(chats.id, chatId),
    });

    if (!chat) {
      const [newChat] = await db.insert(chats).values({
        id: chatId,
        userId: session.data.user.id,
        mcpServerId,
        model: model || 'anthropic/claude-3-5-sonnet',
      }).returning();
      chat = newChat;
    }

    // Verify user owns this chat
    if (chat.userId !== session.data.user.id) {
      return Response.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Save new user messages to database
    if (clientMessages && Array.isArray(clientMessages)) {
      const userMessages = clientMessages.filter((msg: { role: string; id?: string; content?: unknown }) => msg.role === 'user');

      for (const msg of userMessages) {
        // Check if message already exists
        const existing = await db.query.messages.findFirst({
          where: eq(messages.id, msg.id || nanoid()),
        });

        if (!existing) {
          await db.insert(messages).values({
            id: msg.id || nanoid(),
            chatId,
            role: 'user',
            parts: msg.content,
          });
        }
      }
    }

    // Get conversation history
    const conversationMessages = await db.query.messages.findMany({
      where: eq(messages.chatId, chatId),
      orderBy: [desc(messages.createdAt)],
      limit: 50, // Limit to last 50 messages for context
    });

    // Reverse to get chronological order
    conversationMessages.reverse();

    // Fetch MCP server tools from indexer
    // TODO: Replace with actual MCP indexer/gateway call
    const serverTools = await getMcpServerTools(mcpServerId);

    // Convert to AI SDK tools (no execution - handled client-side)
    const tools = convertMcpToolsToAiTools(serverTools);

    // Note: Tools don't have execute functions here
    // Tool execution happens client-side via withX402Client

    // Create OpenRouter client
    const openrouter = createOpenRouter({
      apiKey: process.env.OPENROUTER_API_KEY,
    });

    // Stream response
    const result = await streamText({
      // OpenRouter SDK uses v3 spec, cast through unknown for compatibility
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      model: openrouter.chat(model || 'anthropic/claude-3-5-sonnet') as unknown as Parameters<typeof streamText>[0]['model'],
      messages: conversationMessages.map((msg) => ({
        role: msg.role as 'user' | 'assistant' | 'system',
        content: typeof msg.parts === 'string' ? msg.parts : JSON.stringify(msg.parts),
      })),
      tools,
      onFinish: async ({ text, toolCalls, finishReason }) => {
        // Save assistant message to database
        try {
          await db.insert(messages).values({
            id: nanoid(),
            chatId,
            role: 'assistant',
            parts: {
              text,
              toolCalls: toolCalls || [],
              finishReason,
            },
          });

          // Update chat's updatedAt timestamp
          await db.update(chats)
            .set({ updatedAt: new Date() })
            .where(eq(chats.id, chatId));
        } catch (error) {
          console.error('Error saving assistant message:', error);
        }
      },
    });

    return result.toTextStreamResponse();

  } catch (error) {
    console.error('Chat API error:', error);
    return Response.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
