import { notFound } from 'next/navigation';
import { mcpDataApi } from '@/lib/client/utils';
import { ChatContent } from '@/components/chat/chat-content';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface ConversationPageProps {
  params: Promise<{
    id: string;
    conversationId: string;
  }>;
}

interface ServerData {
  origin?: string;
  info?: {
    name?: string;
    description?: string;
  };
}

export default async function ConversationPage({ params }: ConversationPageProps) {
  const { id: serverId, conversationId } = await params;

  // Fetch server details
  let serverData: ServerData | null = null;
  try {
    serverData = await mcpDataApi.getServerById(serverId) as ServerData;
  } catch (_error) {
    notFound();
  }

  const serverName = serverData?.info?.name || serverData?.origin || serverId;
  const serverDescription = serverData?.info?.description;

  return (
    <div className="flex flex-col h-[calc(100vh-64px)]">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center gap-4 px-6 py-4">
          <Link
            href={`/servers/${serverId}`}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Server
          </Link>

          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-semibold truncate">{serverName}</h1>
            {serverDescription && (
              <p className="text-sm text-muted-foreground truncate">
                {serverDescription}
              </p>
            )}
          </div>

          <div className="text-xs text-muted-foreground">
            Conversation ID: {conversationId.slice(0, 8)}...
          </div>
        </div>
      </div>

      {/* Chat Content */}
      <div className="flex-1 overflow-hidden">
        <ChatContent
          serverId={serverId}
          conversationId={conversationId}
          serverUrl={serverData?.origin || ''}
        />
      </div>
    </div>
  );
}
