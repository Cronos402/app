'use client';

import { useChat } from '@ai-sdk/react';
import { useEffect, useRef, useState } from 'react';
import { Message } from './messages/message';
import { ChatInput } from './input/chat-input';
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { withX402Client } from 'cronos402/client';
import { createInjectedSigner } from '@/lib/client/signer';
import { useWalletClient, useAccount } from 'wagmi';
import type { MultiNetworkSigner } from 'cronos402';
import { Account } from 'viem/accounts';

interface ChatContentProps {
  serverId: string;
  conversationId: string;
  serverUrl: string; // The actual MCP server URL (origin)
}

export function ChatContent({ serverId, conversationId, serverUrl }: ChatContentProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { data: walletClient } = useWalletClient();
  const { address: connectedWalletAddress, isConnected: isBrowserWalletConnected } = useAccount();
  const [mcpClient, setMcpClient] = useState<Client | null>(null);
  const [isInitializingMcp, setIsInitializingMcp] = useState(true); // Start as true
  const [mcpError, setMcpError] = useState<string | null>(null);
  const [input, setInput] = useState('');

  // Wallet connection status (for paid tools only)
  const hasWalletClient = !!walletClient;
  const paymentWalletAddress = connectedWalletAddress;
  const isWalletConnected = isBrowserWalletConnected && hasWalletClient && !!paymentWalletAddress;

  // Initialize MCP client - ALWAYS, regardless of wallet state
  useEffect(() => {
    if (!serverUrl) {
      setMcpError('No server URL provided');
      setIsInitializingMcp(false);
      return;
    }

    let mounted = true;

    const initMcpClient = async () => {
      try {
        setIsInitializingMcp(true);
        setMcpError(null);

        // Create MCP client
        const client = new Client({ name: 'cronos402-chat-client', version: '1.0.0' });

        // Create transport to MCP proxy - use the actual server URL
        const base64ServerUrl = btoa(serverUrl);
        const mcpUrl = new URL(
          `/api/mcp-proxy?target-url=${encodeURIComponent(base64ServerUrl)}`,
          window.location.origin
        );

        const transport = new StreamableHTTPClientTransport(mcpUrl, {
          requestInit: {
            credentials: 'include',
            mode: 'cors',
            headers: {
              'X-Wallet-Type': paymentWalletAddress ? 'external' : 'none',
              'X-Wallet-Address': paymentWalletAddress || '',
              'X-Wallet-Provider': paymentWalletAddress ? 'metamask' : '',
            },
          },
        });

        await client.connect(transport);

        // If wallet is connected, wrap with x402 for automatic payment handling
        let finalClient: Client = client;
        if (isWalletConnected && walletClient?.account) {
          const evmSigner = createInjectedSigner('cronos', walletClient.account as Account) as unknown as MultiNetworkSigner['evm'];

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          finalClient = withX402Client(client as any, {
            wallet: { evm: evmSigner },
            maxPaymentValue: BigInt(0.1 * 10 ** 6), // 0.1 USDC max
            confirmationCallback: async (accepts) => {
              console.log('[Chat] Payment required:', accepts);
              return true;
            },
          }) as unknown as Client;
        }

        if (mounted) {
          setMcpClient(finalClient);
          setIsInitializingMcp(false);
        }
      } catch (error) {
        console.error('[Chat] Failed to initialize MCP client:', error);
        if (mounted) {
          setMcpError(error instanceof Error ? error.message : 'Failed to initialize MCP client');
          setIsInitializingMcp(false);
        }
      }
    };

    initMcpClient();

    return () => {
      mounted = false;
    };
  }, [serverUrl, isWalletConnected, walletClient, paymentWalletAddress]);

  const {
    messages,
    sendMessage,
    status,
    error,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } = useChat({
    api: '/api/chat',
    id: conversationId,
    body: {
      chatId: conversationId,
      mcpServerId: serverId,
    },
    // Handle tool calls client-side with MCP client
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async onToolCall({ toolCall }: { toolCall: any }) {
      if (!mcpClient) {
        throw new Error('MCP client not ready. Please wait for connection.');
      }

      try {
        console.log('[Chat] Executing tool:', toolCall.toolName, toolCall.args);

        // Call tool via MCP client - if wrapped with x402, payment handled automatically
        const result = await mcpClient.callTool({
          name: toolCall.toolName,
          arguments: toolCall.args as Record<string, unknown>,
        });

        console.log('[Chat] Tool execution success:', result);

        // Extract content from MCP response
        interface McpContentItem {
          type: string;
          text?: string;
        }
        const content = (result as { content?: McpContentItem[] }).content || [];
        const textItems = content
          .filter((item) => item.type === 'text')
          .map((item) => item.text);

        return textItems.length > 0 ? textItems.join('\n') : JSON.stringify(result);
      } catch (error) {
        console.error('[Chat] Tool execution failed:', error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        // If payment required but no wallet, give helpful message
        if (errorMessage.includes('402') && !isWalletConnected) {
          throw new Error('This is a paid tool. Please connect your wallet to continue.');
        }
        throw error;
      }
    },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any);

  const isLoading = status === 'streaming';

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        {/* Connection Status Banner */}
        {isInitializingMcp && (
          <div className="flex items-center gap-3 p-3 rounded-md bg-blue-500/10 border border-blue-500/20">
            <Loader2 className="h-4 w-4 animate-spin text-blue-600 dark:text-blue-400" />
            <div className="flex-1 text-sm text-blue-600 dark:text-blue-400">
              Connecting to MCP server...
            </div>
          </div>
        )}

        {mcpError && (
          <div className="flex items-center gap-3 p-3 rounded-md bg-red-500/10 border border-red-500/20">
            <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
            <div className="flex-1 text-sm text-red-600 dark:text-red-400">
              Failed to connect: {mcpError}
            </div>
          </div>
        )}

        {messages.length === 0 && !isInitializingMcp && !mcpError ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
            <div className="max-w-md space-y-4">
              <h3 className="text-xl font-semibold">Start a conversation</h3>
              <p className="text-sm">
                Ask questions or call tools from this MCP server.
              </p>
              {isWalletConnected ? (
                <div className="flex items-center justify-center gap-2 text-green-600 dark:text-green-400">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm">Wallet connected - Paid tools ready</span>
                </div>
              ) : (
                <div className="text-xs text-muted-foreground">
                  Connect wallet for paid tools (optional)
                </div>
              )}
            </div>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <Message
                key={message.id}
                message={message}
                serverId={serverId}
                conversationId={conversationId}
              />
            ))}
            {isLoading && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">AI is thinking...</span>
              </div>
            )}
          </>
        )}
        <div ref={scrollRef} />
      </div>

      {/* Error Display */}
      {error && (
        <div className="px-4 py-2 bg-destructive/10 border-t border-destructive/20">
          <p className="text-sm text-destructive">
            Error: {error.message || 'Something went wrong'}
          </p>
        </div>
      )}

      {/* Input Area */}
      <div className="border-t px-4 py-4">
        <ChatInput
          input={input}
          setInput={setInput}
          onSubmit={(e) => {
            e.preventDefault();
            if (input.trim() && !isLoading && mcpClient) {
              sendMessage({ text: input });
              setInput('');
            }
          }}
          disabled={isLoading || isInitializingMcp || !!mcpError}
        />
      </div>
    </div>
  );
}
