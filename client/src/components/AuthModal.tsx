/**
 * Silent Partners - Auth Modal
 * 
 * Login and registration modal dialog.
 */

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTab?: 'login' | 'register';
}

export default function AuthModal({ open, onOpenChange, defaultTab = 'login' }: AuthModalProps) {
  const { login, register } = useAuth();
  const [tab, setTab] = useState<'login' | 'register'>(defaultTab);
  const [isLoading, setIsLoading] = useState(false);
  
  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error('Email and password are required');
      return;
    }

    if (tab === 'register' && !username) {
      toast.error('Username is required');
      return;
    }

    setIsLoading(true);

    try {
      if (tab === 'login') {
        await login(email, password);
        toast.success('Welcome back!');
      } else {
        await register(email, password, username);
        toast.success('Account created successfully!');
      }
      
      onOpenChange(false);
      // Reset form
      setEmail('');
      setPassword('');
      setUsername('');
    } catch (error) {
      console.error('Auth error:', error);
      toast.error(error instanceof Error ? error.message : 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl">
            {tab === 'login' ? 'Sign In' : 'Create Account'}
          </DialogTitle>
        </DialogHeader>

        {/* Tab switcher */}
        <div className="flex gap-2 mb-4">
          <Button
            variant={tab === 'login' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTab('login')}
            className="flex-1"
          >
            Sign In
          </Button>
          <Button
            variant={tab === 'register' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTab('register')}
            className="flex-1"
          >
            Register
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {tab === 'register' && (
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Your username"
                disabled={isLoading}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              disabled={isLoading}
            />
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {tab === 'login' ? 'Signing in...' : 'Creating account...'}
              </>
            ) : (
              tab === 'login' ? 'Sign In' : 'Create Account'
            )}
          </Button>
        </form>

        <p className="text-xs text-center text-muted-foreground mt-4">
          {tab === 'login' 
            ? "Don't have an account? Click Register above."
            : "Already have an account? Click Sign In above."}
        </p>
      </DialogContent>
    </Dialog>
  );
}
