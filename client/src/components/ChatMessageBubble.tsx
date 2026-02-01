/**
 * Chat Message Bubble Component
 * Renders chat messages with proper markdown formatting
 */

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Brain } from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  metadata?: {
    entitiesFound?: number;
    relationshipsFound?: number;
    claimsCreated?: number;
    toolsUsed?: string[];
  };
}

function formatTime(timestamp: string) {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

export function ChatMessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';
  
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
      <div className={`max-w-[85%] ${
        isUser 
          ? 'bg-primary text-primary-foreground rounded-2xl rounded-br-md' 
          : isSystem
            ? 'bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg'
            : 'bg-muted rounded-2xl rounded-bl-md'
      } px-4 py-2.5`}>
        {!isUser && !isSystem && (
          <div className="flex items-center gap-1.5 mb-1">
            <Brain className="w-3.5 h-3.5 text-primary" />
            <span className="text-[10px] font-medium text-muted-foreground">Assistant</span>
          </div>
        )}
        {isUser ? (
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        ) : (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <ReactMarkdown 
              remarkPlugins={[remarkGfm]}
              components={{
                // Custom heading styles - make them smaller and cleaner
                h1: ({children}) => (
                  <h2 className="text-sm font-semibold mt-3 mb-1.5 text-foreground border-b border-border/50 pb-1">
                    {children}
                  </h2>
                ),
                h2: ({children}) => (
                  <h3 className="text-sm font-semibold mt-3 mb-1 text-foreground">
                    {children}
                  </h3>
                ),
                h3: ({children}) => (
                  <h4 className="text-xs font-semibold mt-2 mb-1 text-foreground">
                    {children}
                  </h4>
                ),
                // Paragraphs
                p: ({children}) => (
                  <p className="text-sm my-1.5 leading-relaxed text-foreground">
                    {children}
                  </p>
                ),
                // Lists
                ul: ({children}) => (
                  <ul className="text-sm my-1.5 ml-4 space-y-1 list-disc marker:text-muted-foreground">
                    {children}
                  </ul>
                ),
                ol: ({children}) => (
                  <ol className="text-sm my-1.5 ml-4 space-y-1 list-decimal marker:text-muted-foreground">
                    {children}
                  </ol>
                ),
                li: ({children}) => (
                  <li className="text-sm leading-relaxed text-foreground">
                    {children}
                  </li>
                ),
                // Bold and emphasis
                strong: ({children}) => (
                  <strong className="font-semibold text-foreground">
                    {children}
                  </strong>
                ),
                em: ({children}) => (
                  <em className="italic text-foreground/90">
                    {children}
                  </em>
                ),
                // Code
                code: ({children, className}) => {
                  // Check if it's inline code or code block
                  const isInline = !className;
                  if (isInline) {
                    return (
                      <code className="bg-muted-foreground/10 px-1.5 py-0.5 rounded text-xs font-mono text-foreground">
                        {children}
                      </code>
                    );
                  }
                  return (
                    <code className={className}>
                      {children}
                    </code>
                  );
                },
                // Code blocks
                pre: ({children}) => (
                  <pre className="bg-muted-foreground/5 p-3 rounded-lg my-2 overflow-x-auto text-xs">
                    {children}
                  </pre>
                ),
                // Blockquotes
                blockquote: ({children}) => (
                  <blockquote className="border-l-2 border-primary/50 pl-3 my-2 italic text-muted-foreground text-sm">
                    {children}
                  </blockquote>
                ),
                // Links
                a: ({href, children}) => (
                  <a 
                    href={href} 
                    className="text-primary underline underline-offset-2 hover:text-primary/80 transition-colors" 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    {children}
                  </a>
                ),
                // Horizontal rules
                hr: () => (
                  <hr className="my-3 border-border/50" />
                ),
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        )}
        <div className="flex items-center justify-between mt-1.5">
          <span className={`text-[10px] ${isUser ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
            {formatTime(message.timestamp)}
          </span>
          {message.metadata && (
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
              {message.metadata.entitiesFound !== undefined && (
                <span>+{message.metadata.entitiesFound} entities</span>
              )}
              {message.metadata.relationshipsFound !== undefined && (
                <span>+{message.metadata.relationshipsFound} connections</span>
              )}
              {message.metadata.claimsCreated !== undefined && message.metadata.claimsCreated > 0 && (
                <span className="text-amber-600">+{message.metadata.claimsCreated} pending</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export type { ChatMessage };
