import { notFound } from 'next/navigation';
import { mcpDataApi } from '@/lib/client/utils';
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
  const { id: serverId } = await params;

  // Fetch server details
  let serverData: ServerData | null = null;
  try {
    serverData = await mcpDataApi.getServerById(serverId) as ServerData;
  } catch (_error) {
    notFound();
  }

  const serverName = serverData?.info?.name || serverData?.origin || serverId;

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
          </div>
        </div>
      </div>

      {/* Coming Soon Content */}
      <div className="flex-1 relative overflow-hidden bg-background">
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.02] to-transparent" />

        {/* Main content */}
        <div className="relative z-10 flex flex-col items-center justify-center h-full px-4">
          {/* Emoji */}
          <div className="mb-6">
            <span className="text-6xl sm:text-7xl">🤫</span>
          </div>

          {/* Text content */}
          <div className="text-center max-w-md">
            <h2 className="text-2xl sm:text-3xl font-semibold text-foreground mb-3">
              Hold tight...
            </h2>
            <p className="text-base text-muted-foreground">
              The AI chat is coming soon. You&apos;re gonna love it.
            </p>
          </div>

          {/* Back button */}
          <Link
            href={`/servers/${serverId}`}
            className="mt-10 inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-border hover:bg-muted text-foreground font-medium transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Server
          </Link>
        </div>
      </div>
    </div>
  );
}
