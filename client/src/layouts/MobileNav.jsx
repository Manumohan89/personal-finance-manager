import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Receipt, Plus, Wallet, Target, MoreHorizontal, Repeat, BarChart3, Tags, Settings } from 'lucide-react';

const MobileNav = ({ onQuickAddExpense, onQuickAddIncome }) => {
  const [quickMenuOpen, setQuickMenuOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);

  const links = [
    { to: '/dashboard', label: 'Home', icon: LayoutDashboard },
    { to: '/transactions', label: 'Transactions', icon: Receipt },
  ];
  const rightLinks = [
    { to: '/budgets', label: 'Budgets', icon: Wallet },
    { to: '/goals', label: 'Goals', icon: Target },
  ];
  const moreLinks = [
    { to: '/recurring', label: 'Recurring', icon: Repeat },
    { to: '/reports', label: 'Reports', icon: BarChart3 },
    { to: '/categories', label: 'Categories', icon: Tags },
    { to: '/settings', label: 'Settings', icon: Settings },
  ];

  const Item = ({ to, label, icon: Icon }) => (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex flex-col items-center justify-center gap-0.5 flex-1 py-2 text-xs ${
          isActive ? 'text-primary-600' : 'text-gray-500 dark:text-gray-400'
        }`
      }
    >
      <Icon size={20} />
      {label}
    </NavLink>
  );

  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 flex items-center px-2 pb-[env(safe-area-inset-bottom)]">
      {links.map((l) => <Item key={l.to} {...l} />)}
      <div className="flex-1 flex justify-center relative">
        <button
          onClick={() => setQuickMenuOpen((open) => !open)}
          className="w-12 h-12 -mt-5 rounded-full bg-primary-600 text-white shadow-lg flex items-center justify-center"
          aria-label="Quick add menu"
        >
          <Plus size={24} />
        </button>

        {quickMenuOpen && (
          <div className="absolute bottom-16 left-1/2 -translate-x-1/2 w-40 card py-1 z-20 shadow-lg">
            <button
              className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
              onClick={() => {
                onQuickAddExpense();
                setQuickMenuOpen(false);
              }}
            >
              Add Expense
            </button>
            <button
              className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
              onClick={() => {
                onQuickAddIncome();
                setQuickMenuOpen(false);
              }}
            >
              Add Income
            </button>
          </div>
        )}
      </div>
      {rightLinks.map((l) => <Item key={l.to} {...l} />)}
      <div className="flex-1 flex justify-center relative">
        <button
          onClick={() => setMoreMenuOpen((open) => !open)}
          className={`flex flex-col items-center justify-center gap-0.5 py-2 text-xs ${
            moreLinks.some((link) => window.location.pathname === link.to) ? 'text-primary-600' : 'text-gray-500 dark:text-gray-400'
          }`}
          aria-label="More navigation options"
          aria-expanded={moreMenuOpen}
        >
          <MoreHorizontal size={20} />
          More
        </button>
        {moreMenuOpen && (
          <div className="absolute bottom-16 right-0 w-44 card py-1 z-20 shadow-lg">
            {moreLinks.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                onClick={() => setMoreMenuOpen(false)}
                className={({ isActive }) => `flex items-center gap-3 px-4 py-2.5 text-sm ${
                  isActive ? 'text-primary-600 bg-primary-50 dark:bg-primary-900/20' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <Icon size={17} />
                {label}
              </NavLink>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
};

export default MobileNav;
