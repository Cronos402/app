'use client';

import { MessageContent } from './message-content';
import { cn } from '@/lib/utils';
import { User, Bot } from 'lucide-react';

interface MessagePart {
  type: string;
  text?: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  parts?: MessagePart[];
  createdAt?: Date | string;
}

interface MessageProps {
  message: ChatMessage;
  serverId: string;
  conversationId: string;
}

export function Message({ message, serverId, conversationId }: MessageProps) {
  const isUser = message.role === 'user';

  // Extract text content from parts
  const content = message.parts
    ?.filter((part) => part.type === 'text')
    .map((part) => part.text)
    .join('\n') || '';

  return (
    <div
      className={cn(
        'flex gap-3 group',
        isUser ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-muted-foreground'
        )}
      >
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>

      {/* Message Content */}
      <div className={cn('flex-1 min-w-0', isUser ? 'text-right' : 'text-left')}>
        <div
          className={cn(
            'inline-block max-w-[80%] rounded-lg px-4 py-2',
            isUser
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-foreground'
          )}
        >
          <MessageContent
            content={content}
            role={message.role}
            serverId={serverId}
            conversationId={conversationId}
          />
        </div>

        {/* Timestamp */}
        <div
          className={cn(
            'text-xs text-muted-foreground mt-1 px-1',
            isUser ? 'text-right' : 'text-left'
          )}
        >
          {new Date(message.createdAt || Date.now()).toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
}
