'use client';

// =============================================================================
// Auth Gate — Protects the main app behind authentication
// =============================================================================
// Shows a sign-in/sign-up form when not authenticated.
// Renders children (the main app) when authenticated.
// =============================================================================

import { useSession, signIn, signOut } from 'next-auth/react';
import { useState, useEffect, FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Loader2, Mail, Lock, User, Sparkles, Eye, EyeOff } from 'lucide-react';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/sonner';

interface AuthGateProps {
  children: React.ReactNode;
}

export function AuthGate({ children }: AuthGateProps) {
  const { data: session, status } = useSession();
  const [showPassword, setShowPassword] = useState(false);

  // Show loading spinner while checking session
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Show auth form if not authenticated
  if (!session) {
    return (
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <div className="w-full max-w-md">
            {/* Logo & Title */}
            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-2 mb-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-primary-foreground" />
                </div>
                <h1 className="text-2xl font-bold tracking-tight">StoreCraft AI</h1>
              </div>
              <p className="text-muted-foreground text-sm">Voice-to-Website Builder — Sign in to continue</p>
            </div>

            {/* Auth Tabs */}
            <AuthTabs showPassword={showPassword} setShowPassword={setShowPassword} />
          </div>
        </div>
        <Toaster />
      </ThemeProvider>
    );
  }

  // Authenticated — render the main app
  return <>{children}</>;
}

// =============================================================================
// Auth Tabs Component (Sign In / Sign Up)
// =============================================================================

function AuthTabs({ showPassword, setShowPassword }: { showPassword: boolean; setShowPassword: (v: boolean) => void }) {
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');

  // Sign In state
  const [signinEmail, setSigninEmail] = useState('');
  const [signinPassword, setSigninPassword] = useState('');
  const [signinLoading, setSigninLoading] = useState(false);
  const [signinError, setSigninError] = useState('');

  // Sign Up state
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [signupLoading, setSignupLoading] = useState(false);
  const [signupError, setSignupError] = useState('');
  const [signupSuccess, setSignupSuccess] = useState(false);

  const handleSignIn = async (e: FormEvent) => {
    e.preventDefault();
    setSigninError('');
    setSigninLoading(true);

    try {
      const result = await signIn('credentials', {
        email: signinEmail,
        password: signinPassword,
        redirect: false,
      });

      if (result?.error) {
        setSigninError(result.error === 'CredentialsSignin'
          ? 'Invalid email or password'
          : result.error
        );
      }
    } catch (err) {
      setSigninError('An unexpected error occurred. Please try again.');
    } finally {
      setSigninLoading(false);
    }
  };

  const handleSignUp = async (e: FormEvent) => {
    e.preventDefault();
    setSignupError('');
    setSignupLoading(true);
    setSignupSuccess(false);

    if (signupPassword !== signupConfirmPassword) {
      setSignupError('Passwords do not match');
      setSignupLoading(false);
      return;
    }

    if (signupPassword.length < 8) {
      setSignupError('Password must be at least 8 characters');
      setSignupLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: signupEmail,
          password: signupPassword,
          name: signupName || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setSignupError(data.error?.message || data.message || 'Registration failed');
        return;
      }

      setSignupSuccess(true);

      // Auto sign in after successful registration
      const result = await signIn('credentials', {
        email: signupEmail,
        password: signupPassword,
        redirect: false,
      });

      if (result?.error) {
        setSignupSuccess(false);
        setSignupError('Account created but sign-in failed. Please sign in manually.');
      }
    } catch (err) {
      setSignupError('An unexpected error occurred. Please try again.');
    } finally {
      setSignupLoading(false);
    }
  };

  return (
    <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'signin' | 'signup')}>
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="signin">Sign In</TabsTrigger>
        <TabsTrigger value="signup">Create Account</TabsTrigger>
      </TabsList>

      {/* Sign In Tab */}
      <TabsContent value="signin">
        <Card>
          <CardHeader>
            <CardTitle>Welcome Back</CardTitle>
            <CardDescription>Sign in to your StoreCraft AI account</CardDescription>
          </CardHeader>
          <form onSubmit={handleSignIn}>
            <CardContent className="space-y-4">
              {signinError && (
                <Alert variant="destructive">
                  <AlertDescription>{signinError}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="signin-email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="signin-email"
                    type="email"
                    placeholder="you@example.com"
                    value={signinEmail}
                    onChange={(e) => setSigninEmail(e.target.value)}
                    className="pl-9"
                    required
                    disabled={signinLoading}
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="signin-password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="signin-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={signinPassword}
                    onChange={(e) => setSigninPassword(e.target.value)}
                    className="pl-9 pr-9"
                    required
                    disabled={signinLoading}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full" disabled={signinLoading || !signinEmail || !signinPassword}>
                {signinLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Sign In
              </Button>
            </CardFooter>
          </form>
        </Card>
      </TabsContent>

      {/* Sign Up Tab */}
      <TabsContent value="signup">
        <Card>
          <CardHeader>
            <CardTitle>Create Account</CardTitle>
            <CardDescription>Get started with StoreCraft AI for free</CardDescription>
          </CardHeader>
          <form onSubmit={handleSignUp}>
            <CardContent className="space-y-4">
              {signupError && (
                <Alert variant="destructive">
                  <AlertDescription>{signupError}</AlertDescription>
                </Alert>
              )}
              {signupSuccess && (
                <Alert>
                  <AlertDescription className="text-green-600 dark:text-green-400">
                    Account created successfully! Signing you in...
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="signup-name">Name (optional)</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder="Your name"
                    value={signupName}
                    onChange={(e) => setSignupName(e.target.value)}
                    className="pl-9"
                    disabled={signupLoading}
                    autoComplete="name"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="you@example.com"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    className="pl-9"
                    required
                    disabled={signupLoading}
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="signup-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Min. 8 characters"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    className="pl-9 pr-9"
                    required
                    disabled={signupLoading}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-confirm-password">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="signup-confirm-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Confirm your password"
                    value={signupConfirmPassword}
                    onChange={(e) => setSignupConfirmPassword(e.target.value)}
                    className="pl-9"
                    required
                    disabled={signupLoading}
                    autoComplete="new-password"
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full" disabled={signupLoading || !signupEmail || !signupPassword || !signupConfirmPassword}>
                {signupLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Create Account
              </Button>
            </CardFooter>
          </form>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
