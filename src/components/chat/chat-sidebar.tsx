'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import {  Plus, MessageSquare, Trash2, Loader2 } from 'lucide-react';
import { nanoid } from 'nanoid';

interface Chat {
  id: string;
  title: string;
  mcpServerId: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
}

interface ChatSidebarProps {
  serverId: string;
  activeId: string;
}

export function ChatSidebar({ serverId, activeId }: ChatSidebarProps) {
  const router = useRouter();
  const [chats, setChats] = useState<Chat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Fetch conversations
  useEffect(() => {
    fetchChats();
  }, [serverId]);

  const fetchChats = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/chat/list?serverId=${serverId}`);
      if (response.ok) {
        const data = await response.json();
        setChats(data.chats || []);
      }
    } catch (error) {
      console.error('Failed to fetch chats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewChat = () => {
    const newChatId = nanoid();
    router.push(`/servers/${serverId}/chat/${newChatId}`);
  };

  const handleDeleteChat = async (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    if (!confirm('Are you sure you want to delete this conversation?')) {
      return;
    }

    try {
      setDeletingId(chatId);
      const response = await fetch(`/api/chat/list?chatId=${chatId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setChats((prev) => prev.filter((chat) => chat.id !== chatId));

        // If deleting active chat, navigate to new chat
        if (chatId === activeId) {
          handleNewChat();
        }
      }
    } catch (error) {
      console.error('Failed to delete chat:', error);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="flex flex-col h-full bg-muted/10">
      {/* Header */}
      <div className="p-4 space-y-2">
        <h2 className="text-lg font-semibold">Conversations</h2>
        <Button
          onClick={handleNewChat}
          className="w-full"
          size="sm"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Conversation
        </Button>
      </div>

      <Separator />

      {/* Conversation List */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : chats.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No conversations yet</p>
              <p className="text-xs mt-1">Start a new chat to begin</p>
            </div>
          ) : (
            chats.map((chat) => (
              <button
                key={chat.id}
                onClick={() => router.push(`/servers/${serverId}/chat/${chat.id}`)}
                className={cn(
                  'w-full text-left p-3 rounded-lg transition-colors group',
                  'hover:bg-muted',
                  chat.id === activeId ? 'bg-muted' : ''
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium truncate">
                      {chat.title}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {chat.messageCount} message{chat.messageCount !== 1 ? 's' : ''}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(chat.updatedAt).toLocaleDateString()}
                    </p>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => handleDeleteChat(chat.id, e)}
                    disabled={deletingId === chat.id}
                  >
                    {deletingId === chat.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </button>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
