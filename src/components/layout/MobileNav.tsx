import { Link, Location } from 'react-router-dom';
import { LucideIcon } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../../lib/utils';

interface NavItem {
  to: string;
  icon: LucideIcon;
  label: string;
  badge?: boolean;
}

interface MobileNavProps {
  navItems: NavItem[];
  location: Location;
  tenantPrefix: string;
}

const MobileNav = ({ navItems, location, tenantPrefix }: MobileNavProps) => {
  return (
    <nav className="sm:hidden fixed bottom-4 left-4 right-4 h-16 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex justify-around items-center px-2 z-50 shadow-lg">
      {navItems.map((item) => {
        const isActive = (location.pathname === item.to || (item.to === `${tenantPrefix}/` && (location.pathname === tenantPrefix || location.pathname === `${tenantPrefix}/`)));
        return (
          <Link 
            key={item.to}
            to={item.to} 
            className={cn(
              "p-2 rounded-lg group relative flex flex-col items-center gap-1 transition-all duration-200 flex-1", 
              isActive ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            )}
            title={item.label}
          >
            <div className="relative">
              <item.icon className={cn("w-5 h-5", isActive ? "text-emerald-600 dark:text-emerald-400" : "group-hover:text-emerald-600 dark:group-hover:text-emerald-400")} />
              {isActive && (
                <motion.div 
                  layoutId="mobile-dot"
                  className="absolute -top-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-emerald-500 rounded-full"
                />
              )}
            </div>
            <span className={cn("text-[8px] font-semibold uppercase tracking-wider", isActive ? "text-emerald-600" : "text-slate-400")}>
              {item.label.slice(0, 3)}
            </span>
            {item.badge && (
              <div className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            )}
          </Link>
        );
      })}
    </nav>
  );
};

export default MobileNav;
