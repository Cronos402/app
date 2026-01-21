'use client';

import { FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { ChatTextarea } from './chat-textarea';
import { Send } from 'lucide-react';
import { WalletIndicator } from './wallet-indicator';

interface ChatInputProps {
  input: string;
  setInput: (value: string) => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
  disabled?: boolean;
}

export function ChatInput({ input, setInput, onSubmit, disabled }: ChatInputProps) {
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim() || disabled) return;
    onSubmit(e);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit on Enter (without Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() && !disabled) {
        // Create a synthetic form event
        const form = e.currentTarget.form;
        if (form) {
          form.requestSubmit();
        }
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      {/* Wallet Status */}
      <div className="flex justify-end">
        <WalletIndicator />
      </div>

      {/* Input Area */}
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <ChatTextarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message... (Enter to send, Shift+Enter for new line)"
            disabled={disabled}
          />
        </div>

        <Button
          type="submit"
          size="icon"
          disabled={!input.trim() || disabled}
          className="h-10 w-10 flex-shrink-0"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </form>
  );
}
