import React from 'react';
import { cn } from '../../lib/utils';
import { 
  FileText, 
  Upload, 
  FolderOpen, 
  Palette, 
  RefreshCw, 
  Search,
  Home,
  Settings,
  User
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  className?: string;
}

const navigationItems = [
  { id: 'dashboard', label: 'Dashboard', icon: Home },
  { id: 'text-to-offer', label: 'Créer une offre', icon: FileText },
  { id: 'pdf-import', label: 'Importer PDF', icon: Upload },
  { id: 'document-library', label: 'Mes documents', icon: FolderOpen },
  { id: 'offer-editor', label: 'Éditeur visuel', icon: Palette },
];

const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange, className }) => {
  return (
    <div className={cn("flex flex-col h-full bg-card border-r border-border/40", className)}>
      {/* Logo/Brand */}
      <div className="p-6 border-b border-border/40">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary rounded-2xl flex items-center justify-center shadow-[0_2px_8px_rgba(0,0,0,0.1)]">
            <span className="text-primary-foreground font-bold text-base">IV</span>
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground">Invitation au Voyage</h1>
            <p className="text-xs text-muted-foreground">Générateur d'offres intelligent</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            
            return (
              <li key={item.id}>
                <button
                  onClick={() => onTabChange(item.id)}
                  className={cn(
                    "w-full flex items-center space-x-3 px-4 py-3 text-sm rounded-xl transition-all duration-200",
                    isActive 
                      ? "bg-primary text-primary-foreground shadow-[0_2px_8px_rgba(0,0,0,0.1)]" 
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/60 hover:shadow-[0_1px_3px_rgba(0,0,0,0.05)]"
                  )}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span className="font-medium">{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Bottom section */}
      <div className="p-4 border-t border-border/40">
        <button className="w-full flex items-center space-x-3 px-4 py-3 text-sm text-muted-foreground hover:text-foreground hover:bg-accent/60 hover:shadow-[0_1px_3px_rgba(0,0,0,0.05)] rounded-xl transition-all duration-200">
          <Settings className="w-4 h-4 flex-shrink-0" />
          <span className="font-medium">Paramètres</span>
        </button>
      </div>
    </div>
  );
};

export { Sidebar };
