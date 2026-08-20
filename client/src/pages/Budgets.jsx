import { useEffect, useState, useCallback } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { budgetService } from '../services/budgetService';
import { categoryService } from '../services/categoryService';
import { useToast } from '../context/ToastContext';
import { getErrorMessage } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, MONTH_NAMES } from '../utils/formatters';
import Spinner from '../components/Spinner';
import EmptyState from '../components/EmptyState';
import Modal from '../components/Modal';
import ConfirmModal from '../components/ConfirmModal';
import { Wallet } from 'lucide-react';

const now = new Date();

const Budgets = () => {
  const toast = useToast();
  const { user } = useAuth();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [budgets, setBudgets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteBudget, setDeleteBudget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([budgetService.list(year, month), categoryService.list('expense')])
      .then(([bRes, cRes]) => {
        setBudgets(bRes.data.budgets);
        setCategories(cRes.data.categories);
      })
      .catch((err) => toast.error(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [year, month]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load(); }, [load]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await budgetService.remove(deleteBudget._id);
      toast.success('Budget deleted');
      setDeleteBudget(null);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  const usedCategoryIds = new Set(budgets.map((b) => b.category._id));
  const availableCategories = categories.filter((c) => !usedCategoryIds.has(c._id));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Budgets</h1>
        <div className="flex gap-2 items-center">
          <select className="input !w-auto" value={month} onChange={(e) => setMonth(Number(e.target.value))}>
            {MONTH_NAMES.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
          </select>
          <input type="number" className="input !w-24" value={year} onChange={(e) => setYear(Number(e.target.value))} />
          <button className="btn-primary" onClick={() => setCreateOpen(true)}><Plus size={16} /> New Budget</button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size={28} /></div>
      ) : budgets.length === 0 ? (
        <EmptyState icon={Wallet} title="No budgets set for this month" action={<button className="btn-primary" onClick={() => setCreateOpen(true)}>+ Create a budget</button>} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {budgets.map((b) => (
            <div key={b._id} className="card p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: b.category.color }} />
                  <span className="font-medium">{b.category.name}</span>
                </div>
                <button className="text-gray-400 hover:text-red-600" onClick={() => setDeleteBudget(b)}><Trash2 size={15} /></button>
              </div>
              <div className="flex justify-between text-sm text-gray-500 mb-1">
                <span>{formatCurrency(b.spent, user?.currency)} spent</span>
                <span>{formatCurrency(b.amount, user?.currency)} budget</span>
              </div>
              <div className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <div
                  className={`h-full ${b.status === 'exceeded' ? 'bg-red-500' : b.status === 'warning' ? 'bg-amber-500' : 'bg-green-500'}`}
                  style={{ width: `${Math.min(b.percentage, 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-xs mt-2">
                <span className={b.status === 'exceeded' ? 'text-red-600' : b.status === 'warning' ? 'text-amber-600' : 'text-gray-500'}>
                  {b.percentage}% used
                </span>
                <span className="text-gray-500">{formatCurrency(b.remaining, user?.currency)} remaining</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {createOpen && (
        <CreateBudgetModal
          year={year}
          month={month}
          categories={availableCategories}
          onClose={() => setCreateOpen(false)}
          onSaved={() => { setCreateOpen(false); load(); }}
        />
      )}
      <ConfirmModal isOpen={!!deleteBudget} onClose={() => setDeleteBudget(null)} onConfirm={handleDelete} loading={deleting} message={`Delete budget for ${deleteBudget?.category.name}?`} />
    </div>
  );
};

const CreateBudgetModal = ({ year, month, categories, onClose, onSaved }) => {
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ category: categories[0]?._id || '', amount: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.category || !form.amount) return;
    setSaving(true);
    try {
      const res = await budgetService.create({ category: form.category, amount: Number(form.amount), month, year });
      toast.success(res.message);
      onSaved();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (categories.length === 0) {
    return (
      <Modal isOpen onClose={onClose} title="New Budget">
        <p className="text-sm text-gray-500">All expense categories already have a budget for this month.</p>
      </Modal>
    );
  }

  return (
    <Modal isOpen onClose={onClose} title="New Budget">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Category</label>
          <select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Monthly Budget Amount</label>
          <input type="number" className="input" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
        </div>
        <button type="submit" className="btn-primary w-full" disabled={saving}>
          {saving ? <Spinner size={16} className="text-white" /> : 'Create Budget'}
        </button>
      </form>
    </Modal>
  );
};

export default Budgets;
