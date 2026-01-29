/**
 * Silent Partners - Header
 * 
 * Header with logo, Lombardi quote, and account controls.
 * Design: Archival Investigator with Playfair Display logo
 * Mobile: Includes hamburger menu to toggle sidebar
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { FolderOpen, User, LogOut, LogIn, Settings, CreditCard, Menu, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useMobileSidebar } from '@/contexts/MobileSidebarContext';
import AuthModal from './AuthModal';
import MyNetworksModal from './MyNetworksModal';

export default function Header() {
  const { user, isAuthenticated, logout } = useAuth();
  const { isOpen: sidebarOpen, toggle: toggleSidebar } = useMobileSidebar();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showNetworksModal, setShowNetworksModal] = useState(false);

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user?.username && !user?.email) return 'U';
    const name = user.username || user.email?.split('@')[0] || '';
    return name.charAt(0).toUpperCase();
  };

  // Get display name
  const getDisplayName = () => {
    return user?.username || user?.email?.split('@')[0] || 'User';
  };

  return (
    <>
      <header className="px-3 sm:px-4 py-2 sm:py-3 flex flex-col border-b border-border bg-background">
        {/* Top row: Logo and controls */}
        <div className="flex items-center justify-between">
          {/* Left side: Menu button (mobile) + Logo */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 md:hidden"
              onClick={toggleSidebar}
              aria-label={sidebarOpen ? 'Close menu' : 'Open menu'}
            >
              {sidebarOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>

            {/* Logo */}
            <div className="flex items-center gap-2">
              {/* Lombardi-inspired logo mark */}
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-primary hidden sm:block">
                <circle cx="6" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
                <circle cx="18" cy="6" r="3" stroke="currentColor" strokeWidth="1.5" />
                <circle cx="18" cy="18" r="3" stroke="currentColor" strokeWidth="1.5" />
                <path d="M9 12 C12 12, 12 6, 15 6" stroke="currentColor" strokeWidth="1.5" fill="none" />
                <path d="M9 12 C12 12, 12 18, 15 18" stroke="currentColor" strokeWidth="1.5" fill="none" />
              </svg>
              <h1 className="font-display text-base sm:text-lg font-medium tracking-tight">
                Silent Partners
              </h1>
            </div>
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-1 sm:gap-2">
            {isAuthenticated ? (
              <>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 text-xs gap-1.5 hidden sm:flex"
                  onClick={() => setShowNetworksModal(true)}
                >
                  <FolderOpen className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">My Networks</span>
                </Button>

                {/* User Profile Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 gap-1 sm:gap-2 px-2 sm:pl-2 sm:pr-3"
                    >
                      {/* User Avatar */}
                      <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-xs font-medium text-primary">
                          {getUserInitials()}
                        </span>
                      </div>
                      <span className="text-xs font-medium hidden sm:inline">
                        {getDisplayName()}
                      </span>
                      {(user?.ai_credits_remaining !== undefined || user?.credits !== undefined) && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary hidden sm:inline">
                          {user.ai_credits_remaining ?? user.credits} credits
                        </span>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {getDisplayName()}
                        </p>
                        {user?.email && (
                          <p className="text-xs leading-none text-muted-foreground">
                            {user.email}
                          </p>
                        )}
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setShowNetworksModal(true)}>
                      <FolderOpen className="mr-2 h-4 w-4" />
                      <span>My Networks</span>
                    </DropdownMenuItem>
                    {(user?.ai_credits_remaining !== undefined || user?.credits !== undefined) && (
                      <DropdownMenuItem disabled>
                        <CreditCard className="mr-2 h-4 w-4" />
                        <span>AI Credits: {user.ai_credits_remaining ?? user.credits}</span>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={logout}
                      className="text-red-600 focus:text-red-600"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Sign Out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 text-xs gap-1.5"
                onClick={() => setShowAuthModal(true)}
              >
                <LogIn className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">Sign In</span>
              </Button>
            )}
          </div>
        </div>

        {/* Lombardi quote - hidden on mobile */}
        <p className="mt-2 text-xs text-muted-foreground italic max-w-2xl hidden sm:block">
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
