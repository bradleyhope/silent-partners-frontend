/**
 * Silent Partners - Chat Input
 * 
 * Input textarea and send button for the chat interface.
 * Extracted from InvestigativeAssistant.tsx.
 */

import { useRef, useCallback, useImperativeHandle, forwardRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Loader2, Trash2 } from 'lucide-react';

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onClear: () => void;
  isProcessing: boolean;
  showClear: boolean;
}

export interface ChatInputRef {
  focus: () => void;
}

export const ChatInput = forwardRef<ChatInputRef, ChatInputProps>(({
  value,
  onChange,
  onSend,
  onClear,
  isProcessing,
  showClear,
}, ref) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useImperativeHandle(ref, () => ({
    focus: () => textareaRef.current?.focus(),
  }));

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  }, [onSend]);

  return (
    <div className="border-t border-border p-3 shrink-0 bg-muted/20">
      <div className="flex items-end gap-2">
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask me to research someone, find connections, analyze patterns..."
          className="min-h-[44px] max-h-32 text-sm resize-none"
          rows={1}
          disabled={isProcessing}
        />
        <Button 
          size="sm" 
          className="h-[44px] w-[44px] p-0 shrink-0"
          onClick={onSend}
          disabled={!value.trim() || isProcessing}
        >
          {isProcessing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </Button>
      </div>
      <div className="flex items-center justify-between mt-2">
        <span className="text-[10px] text-muted-foreground">
          Press Enter to send, Shift+Enter for new line
        </span>
        {showClear && (
          <Button
            variant="ghost"
            size="sm"
            className="h-5 text-[10px] px-1.5"
            onClick={onClear}
          >
            <Trash2 className="w-3 h-3 mr-1" />
            Clear
          </Button>
        )}
      </div>
    </div>
  );
});

ChatInput.displayName = 'ChatInput';

export default ChatInput;
