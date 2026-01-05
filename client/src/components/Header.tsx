/**
 * Silent Partners - Header
 * 
 * Minimal header with logo and account controls.
 * Design: Archival Investigator with Playfair Display logo
 */

import { Button } from '@/components/ui/button';
import { FolderOpen, User } from 'lucide-react';
import { toast } from 'sonner';

export default function Header() {
  return (
    <header className="h-12 px-4 flex items-center justify-between border-b border-border bg-background">
      {/* Logo */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          {/* Lombardi-inspired logo mark */}
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-primary">
            <circle cx="6" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="18" cy="6" r="3" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="18" cy="18" r="3" stroke="currentColor" strokeWidth="1.5" />
            <path d="M9 12 C12 12, 12 6, 15 6" stroke="currentColor" strokeWidth="1.5" fill="none" />
            <path d="M9 12 C12 12, 12 18, 15 18" stroke="currentColor" strokeWidth="1.5" fill="none" />
          </svg>
          <h1 className="font-display text-lg font-medium tracking-tight">
            Silent Partners
          </h1>
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-2">
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-8 text-xs gap-1.5"
          onClick={() => toast.info('My Networks feature coming soon')}
        >
          <FolderOpen className="w-3.5 h-3.5" />
          My Networks
        </Button>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-8 text-xs gap-1.5"
          onClick={() => toast.info('Account feature coming soon')}
        >
          <User className="w-3.5 h-3.5" />
          Account
        </Button>
      </div>
    </header>
  );
}
