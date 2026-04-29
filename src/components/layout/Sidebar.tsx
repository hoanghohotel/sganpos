import { Link, Location } from 'react-router-dom';
import { LogOut, LucideIcon } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../../lib/utils';
import Logo from '../Logo';

interface NavItem {
  to: string;
  icon: LucideIcon;
  label: string;
  badge?: boolean;
}

interface SidebarProps {
  navItems: NavItem[];
  location: Location;
  tenantPrefix: string;
  logout: () => void;
}

const Sidebar = ({ navItems, location, tenantPrefix, logout }: SidebarProps) => {
  return (
    <aside className="hidden sm:flex w-24 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex-col items-center py-8 gap-12 z-50 shadow-sm shrink-0">
      <Link to={`${tenantPrefix}/`} className="transition-all duration-300 hover:scale-110 active:scale-95">
        <Logo variant="icon" size="md" />
      </Link>
      
      <nav className="flex-1 flex flex-col gap-4 overflow-y-auto no-scrollbar w-full px-2">
        {navItems.map((item) => {
          const isActive = (location.pathname === item.to || (item.to === `${tenantPrefix}/` && (location.pathname === tenantPrefix || location.pathname === `${tenantPrefix}/`)));
          return (
            <Link 
              key={item.to}
              to={item.to} 
              className={cn(
                "py-3 px-2 rounded-lg group relative flex flex-col items-center gap-2 w-full transition-all duration-200 active:scale-95", 
                isActive 
                  ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" 
                  : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 dark:text-slate-400"
              )}
              title={item.label}
            >
              <div className="relative">
                <item.icon className={cn("w-6 h-6 transition-all duration-200", isActive ? "text-emerald-600 dark:text-emerald-400" : "group-hover:text-emerald-600 dark:group-hover:text-emerald-400")} />
                {isActive && (
                  <motion.div 
                    layoutId="active-nav-dot"
                    className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-emerald-500 rounded-full"
                  />
                )}
              </div>
              <span className={cn("text-[8px] font-semibold uppercase tracking-wider text-center leading-none", isActive ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300")}>
                {item.label}
              </span>
              {item.badge && (
                <div className="absolute top-2 right-2 w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center shadow-md text-[7px] text-white font-bold">
                  •
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      <button 
        onClick={() => logout()}
        className="p-2.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all shrink-0 mb-4 group active:scale-95"
        title="Đăng xuất"
      >
        <LogOut className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
      </button>
    </aside>
  );
};

export default Sidebar;
