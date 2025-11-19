import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Button } from '../ui/button';
import { Sun, Moon, Search, Bell } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';

interface MainLayoutProps {
  children: React.ReactNode;
  activeTab: string;
  navigate?: ReturnType<typeof useNavigate>;
}

export function MainLayout({ children, activeTab, navigate }: MainLayoutProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { user, signOut } = useAuth();
  const routerNavigate = navigate || useNavigate();

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        navigate={routerNavigate}
        isCollapsed={isSidebarCollapsed}
        toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        signOut={signOut}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Decorative Background Elements */}
        <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-accent/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header */}
        <header className="h-16 px-8 flex items-center justify-between z-10 backdrop-blur-sm border-b border-white/10 dark:border-gray-700/30">
          {/* Search Bar */}
          <div className="flex-1 max-w-xl relative">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <input 
                type="text" 
                placeholder="Search anything..." 
                className="w-full pl-10 pr-4 py-2 rounded-full glass-input text-sm outline-none placeholder:text-muted-foreground/70"
              />
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-4 ml-4">
            <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/20 dark:hover:bg-gray-800/50">
              <Bell className="h-5 w-5 text-muted-foreground" />
            </Button>
            
            <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-full hover:bg-white/20 dark:hover:bg-gray-800/50">
              {theme === 'light' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>

            <div className="flex items-center gap-3 pl-4 border-l border-border/50">
              <div className="text-right hidden md:block">
                <p className="text-sm font-medium leading-none">{user?.name || 'User'}</p>
                <p className="text-xs text-muted-foreground mt-1">{user?.role || 'Admin'}</p>
              </div>
              <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-primary to-accent p-[2px]">
                <div className="h-full w-full rounded-full bg-background flex items-center justify-center">
                  <span className="font-bold text-xs text-foreground">
                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto p-8 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700">
          <div className="max-w-7xl mx-auto animate-enter">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
