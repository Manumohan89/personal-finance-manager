import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Receipt, Plus, Wallet, Target } from 'lucide-react';

const MobileNav = ({ onQuickAddExpense, onQuickAddIncome }) => {
  const [menuOpen, setMenuOpen] = useState(false);

  const links = [
    { to: '/dashboard', label: 'Home', icon: LayoutDashboard },
    { to: '/transactions', label: 'Transactions', icon: Receipt },
  ];
  const rightLinks = [
    { to: '/budgets', label: 'Budgets', icon: Wallet },
    { to: '/goals', label: 'Goals', icon: Target },
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
          onClick={() => setMenuOpen((open) => !open)}
          className="w-12 h-12 -mt-5 rounded-full bg-primary-600 text-white shadow-lg flex items-center justify-center"
          aria-label="Quick add menu"
        >
          <Plus size={24} />
        </button>

        {menuOpen && (
          <div className="absolute bottom-16 left-1/2 -translate-x-1/2 w-40 card py-1 z-20 shadow-lg">
            <button
              className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
              onClick={() => {
                onQuickAddExpense();
                setMenuOpen(false);
              }}
            >
              Add Expense
            </button>
            <button
              className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
              onClick={() => {
                onQuickAddIncome();
                setMenuOpen(false);
              }}
            >
              Add Income
            </button>
          </div>
        )}
      </div>
      {rightLinks.map((l) => <Item key={l.to} {...l} />)}
    </nav>
  );
};

export default MobileNav;
