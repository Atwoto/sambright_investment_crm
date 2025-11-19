import React from 'react';
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  Palette, 
  Brush, 
  ShoppingCart, 
  FileBarChart, 
  Sparkles,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Settings
} from 'lucide-react';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils'; // Assuming you have a utils file, if not I'll create/check it
// If utils doesn't exist, I'll use a local helper or standard class concatenation

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isCollapsed: boolean;
  toggleCollapse: () => void;
  signOut: () => void;
}

export function Sidebar({ activeTab, setActiveTab, isCollapsed, toggleCollapse, signOut }: SidebarProps) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'products', label: 'Products', icon: Package },
    { id: 'clients', label: 'Clients', icon: Users },
    { id: 'projects', label: 'Projects', icon: Palette },
    { id: 'suppliers', label: 'Suppliers', icon: Brush },
    { id: 'orders', label: 'Orders', icon: ShoppingCart },
    { id: 'inventory', label: 'Inventory', icon: Package }, // Reusing Package icon, maybe find a better one?
    { id: 'ai-advisor', label: 'AI Advisor', icon: Sparkles, highlight: true },
    { id: 'reports', label: 'Reports', icon: FileBarChart },
  ];

  return (
    <aside 
      className={`
        relative h-screen transition-all duration-300 ease-in-out border-r border-white/20 dark:border-gray-700/30
        ${isCollapsed ? 'w-20' : 'w-72'}
        glass-panel flex flex-col z-50
      `}
    >
      {/* Logo Section */}
      <div className="p-6 flex items-center gap-3 overflow-hidden">
        <div className="min-w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/25">
          <Palette className="h-6 w-6 text-white" />
        </div>
        <div className={`transition-opacity duration-300 ${isCollapsed ? 'opacity-0 w-0' : 'opacity-100'}`}>
          <h1 className="font-bold text-xl tracking-tight text-foreground font-display">Sambright</h1>
          <p className="text-xs text-muted-foreground">Investment CRM</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto scrollbar-hide">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`
                w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group
                ${isActive 
                  ? 'bg-primary/10 text-primary shadow-sm' 
                  : 'hover:bg-white/50 dark:hover:bg-gray-800/50 text-muted-foreground hover:text-foreground'
                }
                ${item.highlight && !isActive ? 'text-gradient-primary font-medium' : ''}
              `}
            >
              <div className={`
                p-2 rounded-lg transition-colors
                ${isActive ? 'bg-primary text-white shadow-md shadow-primary/20' : 'bg-transparent group-hover:bg-gray-100 dark:group-hover:bg-gray-800'}
              `}>
                <Icon className="h-5 w-5" />
              </div>
              
              <span className={`
                font-medium whitespace-nowrap transition-all duration-300
                ${isCollapsed ? 'opacity-0 w-0 translate-x-4' : 'opacity-100 translate-x-0'}
              `}>
                {item.label}
              </span>
              
              {isActive && !isCollapsed && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(139,92,246,0.6)]" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer Actions */}
      <div className="p-4 border-t border-white/10 dark:border-gray-700/30 space-y-2">
        <button
          onClick={toggleCollapse}
          className="w-full flex items-center justify-center p-2 rounded-lg hover:bg-white/50 dark:hover:bg-gray-800/50 text-muted-foreground transition-colors"
        >
          {isCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
        </button>
        
        <button
          onClick={signOut}
          className={`
            w-full flex items-center gap-3 px-3 py-3 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors
            ${isCollapsed ? 'justify-center' : ''}
          `}
        >
          <LogOut className="h-5 w-5" />
          {!isCollapsed && <span className="font-medium">Sign Out</span>}
        </button>
      </div>
    </aside>
  );
}
