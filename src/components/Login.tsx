import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Palette, Eye, EyeOff, Moon, Sun, Sparkles } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { toast } from 'sonner';

type UserRole = 'super_admin' | 'production' | 'field' | 'customer_service' | 'client';

export function Login() {
  const { theme, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('signin');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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

    // TODO: Implement actual sign in logic
    // For now, just show success
    setTimeout(() => {
      toast.success('Sign in successful! (Auth coming soon)');
      setLoading(false);
    }, 1000);
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

    // TODO: Implement actual sign up logic
    // For now, just show success
    setTimeout(() => {
      toast.success('Account created! Please sign in. (Auth coming soon)');
      setActiveTab('signin');
      setSignUpData({
        email: '',
        password: '',
        confirmPassword: '',
        name: '',
        role: 'client',
      });
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decorative Elements */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-accent/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md space-y-8 relative z-10">
        {/* Header */}
        <div className="text-center space-y-6">
          {/* Logo */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 rounded-2xl shadow-lg shadow-primary/25">
                <Palette className="h-10 w-10 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 bg-gradient-to-r from-yellow-400 to-orange-500 p-1.5 rounded-lg">
                <Sparkles className="h-3 w-3 text-white" />
              </div>
            </div>
          </div>

          {/* Brand */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold font-display tracking-tight">
              Sambright Investment
            </h1>
            <p className="text-muted-foreground text-base">
              Art & Paint Inventory Management System
            </p>
          </div>

          {/* Theme Toggle */}
          <div className="flex justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleTheme}
              className="rounded-full"
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
        <Card className="border-border/40 shadow-xl backdrop-blur-sm">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <CardHeader className="pb-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin" className="text-sm">Sign In</TabsTrigger>
                <TabsTrigger value="signup" className="text-sm">Sign Up</TabsTrigger>
              </TabsList>
            </CardHeader>

            <CardContent>
              {/* Sign In Tab */}
              <TabsContent value="signin" className="space-y-6 mt-0">
                <div className="space-y-2">
                  <CardTitle className="text-xl">Welcome back</CardTitle>
                  <CardDescription>
                    Sign in to access your dashboard
                  </CardDescription>
                </div>

                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Email</Label>
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="you@example.com"
                      value={signInData.email}
                      onChange={(e) => setSignInData({ ...signInData, email: e.target.value })}
                      required
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signin-password">Password</Label>
                    <div className="relative">
                      <Input
                        id="signin-password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter your password"
                        value={signInData.password}
                        onChange={(e) => setSignInData({ ...signInData, password: e.target.value })}
                        required
                        className="h-11 pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <Button type="submit" className="w-full h-11" disabled={loading}>
                    {loading ? 'Signing In...' : 'Sign In'}
                  </Button>
                </form>
              </TabsContent>

              {/* Sign Up Tab */}
              <TabsContent value="signup" className="space-y-6 mt-0">
                <div className="space-y-2">
                  <CardTitle className="text-xl">Create account</CardTitle>
                  <CardDescription>
                    Join Sambright Investment CRM
                  </CardDescription>
                </div>

                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Full Name</Label>
                    <Input
                      id="signup-name"
                      type="text"
                      placeholder="John Doe"
                      value={signUpData.name}
                      onChange={(e) => setSignUpData({ ...signUpData, name: e.target.value })}
                      required
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="you@example.com"
                      value={signUpData.email}
                      onChange={(e) => setSignUpData({ ...signUpData, email: e.target.value })}
                      required
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-role">Role</Label>
                    <Select
                      value={signUpData.role}
                      onValueChange={(value: UserRole) => setSignUpData({ ...signUpData, role: value })}
                    >
                      <SelectTrigger className="h-11">
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
                    <Label htmlFor="signup-password">Password</Label>
                    <div className="relative">
                      <Input
                        id="signup-password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Create a password"
                        value={signUpData.password}
                        onChange={(e) => setSignUpData({ ...signUpData, password: e.target.value })}
                        required
                        className="h-11 pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-confirm-password">Confirm Password</Label>
                    <Input
                      id="signup-confirm-password"
                      type="password"
                      placeholder="Confirm your password"
                      value={signUpData.confirmPassword}
                      onChange={(e) => setSignUpData({ ...signUpData, confirmPassword: e.target.value })}
                      required
                      className="h-11"
                    />
                  </div>

                  <Button type="submit" className="w-full h-11" disabled={loading}>
                    {loading ? 'Creating Account...' : 'Create Account'}
                  </Button>
                </form>
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground">
          <p>© 2025 Sambright Investment Ltd. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
