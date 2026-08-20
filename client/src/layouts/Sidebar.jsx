import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Receipt, Wallet, Target, Repeat, BarChart3, Tags, Settings, PiggyBank,
} from 'lucide-react';

const links = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/transactions', label: 'Transactions', icon: Receipt },
  { to: '/budgets', label: 'Budgets', icon: Wallet },
  { to: '/goals', label: 'Goals', icon: Target },
  { to: '/recurring', label: 'Recurring', icon: Repeat },
  { to: '/reports', label: 'Reports', icon: BarChart3 },
  { to: '/categories', label: 'Categories', icon: Tags },
  { to: '/settings', label: 'Settings', icon: Settings },
];

const Sidebar = () => (
  <aside className="hidden lg:flex lg:flex-col w-64 shrink-0 border-r border-gray-200 dark:border-gray-800 h-screen sticky top-0 bg-white dark:bg-gray-900">
    <div className="flex items-center gap-2 px-5 h-16 border-b border-gray-200 dark:border-gray-800">
      <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center">
        <PiggyBank size={18} className="text-white" />
      </div>
      <span className="font-semibold text-lg">Finance Manager</span>
    </div>
    <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
      {links.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              isActive
                ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`
          }
        >
          <Icon size={18} />
          {label}
        </NavLink>
      ))}
    </nav>
  </aside>
);

export default Sidebar;
