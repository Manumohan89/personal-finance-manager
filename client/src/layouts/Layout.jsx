import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import MobileNav from './MobileNav';
import QuickAddModal from '../components/QuickAddModal';

const Layout = () => {
  const [quickAdd, setQuickAdd] = useState(null); // 'expense' | 'income' | null
  const [refreshKey, setRefreshKey] = useState(0);

  const handleSaved = () => setRefreshKey((k) => k + 1);

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar onQuickAddExpense={() => setQuickAdd('expense')} onQuickAddIncome={() => setQuickAdd('income')} />
        <main className="flex-1 p-4 lg:p-6 pb-24 lg:pb-6">
          <Outlet context={{ refreshKey, triggerRefresh: handleSaved }} />
        </main>
        <MobileNav onQuickAdd={() => setQuickAdd('expense')} />
      </div>

      <QuickAddModal
        isOpen={!!quickAdd}
        type={quickAdd}
        onClose={() => setQuickAdd(null)}
        onSaved={handleSaved}
      />
    </div>
  );
};

export default Layout;
