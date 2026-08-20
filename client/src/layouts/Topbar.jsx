import { useState } from 'react';
import { Plus, Sun, Moon, Monitor, LogOut, User as UserIcon, Bell } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';

const Topbar = ({ onQuickAddExpense, onQuickAddIncome }) => {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [addMenuOpen, setAddMenuOpen] = useState(false);

  const themeIcons = { light: Sun, dark: Moon, system: Monitor };
  const ThemeIcon = themeIcons[theme];

  const cycleTheme = () => {
    const order = ['light', 'dark', 'system'];
    setTheme(order[(order.indexOf(theme) + 1) % order.length]);
  };

  return (
    <header className="h-16 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 sticky top-0 z-30 flex items-center justify-between px-4 lg:px-6">
      <div className="lg:hidden flex items-center gap-2 font-semibold">Finance Manager</div>
      <div className="hidden lg:block" />

      <div className="flex items-center gap-2">
        <div className="relative hidden sm:block">
          <button className="btn-primary" onClick={() => setAddMenuOpen((v) => !v)}>
            <Plus size={16} /> Quick Add
          </button>
          {addMenuOpen && (
            <div className="absolute right-0 mt-2 w-44 card py-1 z-10" onMouseLeave={() => setAddMenuOpen(false)}>
              <button
                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
                onClick={() => { onQuickAddExpense(); setAddMenuOpen(false); }}
              >
                Add Expense
              </button>
              <button
                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
                onClick={() => { onQuickAddIncome(); setAddMenuOpen(false); }}
              >
                Add Income
              </button>
            </div>
          )}
        </div>

        <button onClick={cycleTheme} className="btn-ghost !px-2" title={`Theme: ${theme}`}>
          <ThemeIcon size={18} />
        </button>

        <button onClick={() => navigate('/settings')} className="btn-ghost !px-2" title="Notifications">
          <Bell size={18} />
        </button>

        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="w-9 h-9 rounded-full flex items-center justify-center text-white font-medium text-sm"
            style={{ backgroundColor: user?.avatarColor || '#4F46E5' }}
          >
            {user?.name?.charAt(0)?.toUpperCase() || <UserIcon size={16} />}
          </button>
          {menuOpen && (
            <div className="absolute right-0 mt-2 w-48 card py-1 z-10" onMouseLeave={() => setMenuOpen(false)}>
              <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-800">
                <p className="text-sm font-medium truncate">{user?.name}</p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
              </div>
              <button
                className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
                onClick={() => { navigate('/settings'); setMenuOpen(false); }}
              >
                Profile & Settings
              </button>
              <button
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-2"
                onClick={logout}
              >
                <LogOut size={14} /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Topbar;
