import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Palette, Eye, EyeOff, Moon, Sun, Sparkles } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth, UserRole } from '../contexts/AuthContext';
import { toast } from 'sonner';

export function Login() {
  const { signIn, signUp } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('signin');
  const [loading, setLoading] = useState(false);
  const [showSignInPassword, setShowSignInPassword] = useState(false);
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Sign in form state
  const [signInData, setSignInData] = useState({
    email: '',
    password: '',
  });

  // Sign up form state
  const [signUpData, setSignUpData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    role: 'client' as UserRole,
  });

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const result = await signIn(signInData.email, signInData.password);

    if (result.success) {
      toast.success('Successfully signed in!');
    } else {
      toast.error(result.error || 'Failed to sign in');
    }

    setLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (signUpData.password !== signUpData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (signUpData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    const result = await signUp(
      signUpData.email,
      signUpData.password,
      signUpData.name,
      signUpData.role
    );

    if (result.success) {
      toast.success('Account created successfully! Please sign in.');
      setActiveTab('signin');
      setSignUpData({
        email: '',
        password: '',
        confirmPassword: '',
        name: '',
        role: 'client',
      });
    } else {
      toast.error(result.error || 'Failed to create account');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background Decorations */}
      <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-primary/5 dark:bg-primary/10 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] bg-accent/5 dark:bg-accent/10 rounded-full blur-3xl pointer-events-none animate-pulse delay-1000" />
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-2xl pointer-events-none animate-bounce-slow" />

      <div className="w-full max-w-md space-y-8 relative z-10">
        {/* Header */}
        <div className="text-center space-y-6">
          {/* Logo */}
          <div className="flex justify-center">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl blur-lg opacity-75 group-hover:opacity-100 transition-opacity duration-300 animate-pulse" />
              <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 p-5 rounded-2xl shadow-2xl shadow-primary/30 transform group-hover:scale-105 transition-all duration-300">
                <Palette className="h-11 w-11 text-white" />
              </div>
              <div className="absolute -top-2 -right-2 bg-gradient-to-r from-yellow-400 to-orange-500 p-2 rounded-xl shadow-lg animate-bounce">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
            </div>
          </div>

          {/* Brand */}
          <div className="space-y-3">
            <h1 className="text-4xl font-bold font-display tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Sambright Investment
            </h1>
            <p className="text-muted-foreground/90 text-base font-medium px-4">
              Art & Paint Inventory Management System
            </p>
          </div>

          {/* Theme Toggle */}
          <div className="flex justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleTheme}
              className="rounded-full px-6 border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-md"
            >
              {theme === 'light' ? (
                <>
                  <Moon className="h-4 w-4 mr-2" /> Dark Mode
                </>
              ) : (
                <>
                  <Sun className="h-4 w-4 mr-2" /> Light Mode
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Auth Forms */}
        <Card className="border-border/40 shadow-2xl backdrop-blur-sm bg-card/80 dark:bg-card/60 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full relative">
            <CardHeader className="pb-4 bg-gradient-to-b from-card/50 to-card/20">
              <TabsList className="grid w-full grid-cols-2 bg-muted/50 p-1 rounded-xl">
                <TabsTrigger
                  value="signin"
                  className="text-sm font-medium rounded-lg transition-all duration-300 data-[state=active]:bg-background data-[state=active]:shadow-md cursor-pointer hover:bg-muted/80"
                >
                  Sign In
                </TabsTrigger>
                <TabsTrigger
                  value="signup"
                  className="text-sm font-medium rounded-lg transition-all duration-300 data-[state=active]:bg-background data-[state=active]:shadow-md cursor-pointer hover:bg-muted/80"
                >
                  Sign Up
                </TabsTrigger>
              </TabsList>
            </CardHeader>

            <CardContent className="pt-6">
              {/* Sign In Tab */}
              <TabsContent value="signin" className="space-y-6 mt-0 animate-slide-in-left">
                <div className="space-y-2">
                  <CardTitle className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
                    Welcome back
                  </CardTitle>
                  <CardDescription className="text-base">
                    Sign in to access your dashboard
                  </CardDescription>
                </div>

                <form onSubmit={handleSignIn} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email" className="text-sm font-medium">
                      Email Address
                    </Label>
                    <div className="relative group">
                      <Input
                        id="signin-email"
                        type="email"
                        placeholder="you@example.com"
                        value={signInData.email}
                        onChange={(e) => setSignInData({ ...signInData, email: e.target.value })}
                        required
                        className="h-12 pl-4 transition-all duration-200 group-hover:border-primary/50 focus:border-primary"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signin-password" className="text-sm font-medium">
                      Password
                    </Label>
                    <div className="relative group">
                      <Input
                        id="signin-password"
                        type={showSignInPassword ? 'text' : 'password'}
                        placeholder="Enter your password"
                        value={signInData.password}
                        onChange={(e) => setSignInData({ ...signInData, password: e.target.value })}
                        required
                        className="h-12 pl-4 pr-12 transition-all duration-200 group-hover:border-primary/50 focus:border-primary"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-4 hover:bg-transparent hover:text-foreground transition-colors"
                        onClick={() => setShowSignInPassword(!showSignInPassword)}
                      >
                        {showSignInPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-12 text-base font-medium bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300"
                    disabled={loading}
                  >
                    {loading ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                        Signing In...
                      </div>
                    ) : (
                      'Sign In'
                    )}
                  </Button>
                </form>
              </TabsContent>

              {/* Sign Up Tab */}
              <TabsContent value="signup" className="space-y-6 mt-0 animate-slide-in-right">
                <div className="space-y-2">
                  <CardTitle className="text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
                    Create account
                  </CardTitle>
                  <CardDescription className="text-base">
                    Join Sambright Investment CRM
                  </CardDescription>
                </div>

                <form onSubmit={handleSignUp} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name" className="text-sm font-medium">
                      Full Name
                    </Label>
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="John Doe"
                      value={signUpData.name}
                      onChange={(e) => setSignUpData({ ...signUpData, name: e.target.value })}
                      required
                      className="h-12 pl-4 transition-all duration-200 hover:border-primary/50 focus:border-primary"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-email" className="text-sm font-medium">
                      Email Address
                    </Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="you@example.com"
                      value={signUpData.email}
                      onChange={(e) => setSignUpData({ ...signUpData, email: e.target.value })}
                      required
                      className="h-12 pl-4 transition-all duration-200 hover:border-primary/50 focus:border-primary"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-role" className="text-sm font-medium">
                      Role
                    </Label>
                    <Select
                      value={signUpData.role}
                      onValueChange={(value: UserRole) => setSignUpData({ ...signUpData, role: value })}
                    >
                      <SelectTrigger className="h-12 pl-4 transition-all duration-200 hover:border-primary/50 focus:border-primary">
                        <SelectValue placeholder="Select your role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="client">Client</SelectItem>
                        <SelectItem value="customer_service">Customer Service</SelectItem>
                        <SelectItem value="field">Field Worker</SelectItem>
                        <SelectItem value="production">Production</SelectItem>
                        <SelectItem value="super_admin">Super Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-password" className="text-sm font-medium">
                      Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="signup-password"
                        type={showSignUpPassword ? 'text' : 'password'}
                        placeholder="Create a password"
                        value={signUpData.password}
                        onChange={(e) => setSignUpData({ ...signUpData, password: e.target.value })}
                        required
                        className="h-12 pl-4 pr-12 transition-all duration-200 hover:border-primary/50 focus:border-primary"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-4 hover:bg-transparent hover:text-foreground transition-colors"
                        onClick={() => setShowSignUpPassword(!showSignUpPassword)}
                      >
                        {showSignUpPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-confirm-password" className="text-sm font-medium">
                      Confirm Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="signup-confirm-password"
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="Confirm your password"
                        value={signUpData.confirmPassword}
                        onChange={(e) => setSignUpData({ ...signUpData, confirmPassword: e.target.value })}
                        required
                        className="h-12 pl-4 pr-12 transition-all duration-200 hover:border-primary/50 focus:border-primary"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-4 hover:bg-transparent hover:text-foreground transition-colors"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-12 text-base font-medium bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300"
                    disabled={loading}
                  >
                    {loading ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                        Creating Account...
                      </div>
                    ) : (
                      'Create Account'
                    )}
                  </Button>
                </form>
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>

        {/* Footer */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground/80 font-medium">
            © 2025 Sambright Investment Ltd. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
