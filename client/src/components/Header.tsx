/**
 * Silent Partners - Header
 * 
 * Header with logo, Lombardi quote, and account controls.
 * Design: Archival Investigator with Playfair Display logo
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FolderOpen, User, LogOut, LogIn } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import AuthModal from './AuthModal';
import MyNetworksModal from './MyNetworksModal';

export default function Header() {
  const { user, isAuthenticated, logout } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showNetworksModal, setShowNetworksModal] = useState(false);

  return (
    <>
      <header className="px-4 py-3 flex flex-col border-b border-border bg-background">
        {/* Top row: Logo and controls */}
        <div className="flex items-center justify-between">
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
            {isAuthenticated ? (
              <>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 text-xs gap-1.5"
                  onClick={() => setShowNetworksModal(true)}
                >
                  <FolderOpen className="w-3.5 h-3.5" />
                  My Networks
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 text-xs gap-1.5"
                  onClick={logout}
                >
                  <LogOut className="w-3.5 h-3.5" />
                  {user?.email?.split('@')[0] || 'Logout'}
                </Button>
              </>
            ) : (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 text-xs gap-1.5"
                onClick={() => setShowAuthModal(true)}
              >
                <LogIn className="w-3.5 h-3.5" />
                Sign In
              </Button>
            )}
          </div>
        </div>

        {/* Lombardi quote */}
        <p className="mt-2 text-xs text-muted-foreground italic max-w-2xl">
          "The basic unit is the individual and the corporation, and the 'silent partners' are the covert relationships."
          <span className="not-italic"> — </span>
          <a 
            href="https://brazen.fm/podcasts/the-illuminator" 
            target="_blank" 
            rel="noopener noreferrer"
            className="not-italic text-primary hover:underline"
          >
            Mark Lombardi
          </a>
        </p>
      </header>

      {/* Auth Modal */}
      <AuthModal open={showAuthModal} onOpenChange={setShowAuthModal} />

      {/* My Networks Modal */}
      <MyNetworksModal open={showNetworksModal} onOpenChange={setShowNetworksModal} />
    </>
  );
}
