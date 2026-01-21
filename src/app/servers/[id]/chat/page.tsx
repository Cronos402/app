import { redirect } from 'next/navigation';
import { nanoid } from 'nanoid';

interface ServerChatPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ServerChatPage({ params }: ServerChatPageProps) {
  const { id } = await params;

  // Generate new conversation ID and redirect
  const conversationId = nanoid();
  redirect(`/servers/${id}/chat/${conversationId}`);
}
