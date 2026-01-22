import { notFound } from 'next/navigation';
import { mcpDataApi } from '@/lib/client/utils';
import { ArrowLeft, MessageSquare, Sparkles, Wrench } from 'lucide-react';
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
      <div className="flex-1 relative overflow-hidden bg-gradient-to-br from-background via-background to-primary/5">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
        </div>

        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '50px 50px'
          }}
        />

        {/* Main content */}
        <div className="relative z-10 flex flex-col items-center justify-center h-full px-4">
          {/* Icon group */}
          <div className="relative mb-8">
            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary/20 to-cyan-500/20 flex items-center justify-center border border-primary/20 shadow-2xl shadow-primary/10">
              <MessageSquare className="w-12 h-12 text-primary" />
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center shadow-lg">
              <Wrench className="w-4 h-4 text-white" />
            </div>
            <div className="absolute -bottom-1 -left-1 w-6 h-6 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
              <Sparkles className="w-3 h-3 text-white" />
            </div>
          </div>

          {/* Text content */}
          <div className="text-center max-w-md">
            <h2 className="text-4xl font-bold bg-gradient-to-r from-foreground via-foreground to-primary bg-clip-text text-transparent mb-4">
              Coming Soon
            </h2>
            <p className="text-lg text-muted-foreground mb-2">
              Our team is building something amazing
            </p>
            <p className="text-sm text-muted-foreground/70">
              The AI chat interface is currently under development. We&apos;re working hard to bring you a seamless experience for interacting with MCP servers.
            </p>
          </div>

          {/* Progress indicator */}
          <div className="mt-10 flex flex-col items-center gap-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
              <span>In Development</span>
            </div>
            <div className="w-48 h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-cyan-500 rounded-full animate-pulse"
                style={{ width: '65%' }}
              />
            </div>
          </div>

          {/* Back button */}
          <Link
            href={`/servers/${serverId}`}
            className="mt-10 inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary font-medium transition-all hover:scale-105"
          >
            <ArrowLeft className="w-4 h-4" />
            Explore Server Details
          </Link>
        </div>
      </div>
    </div>
  );
}
