import { useEffect, useState, useCallback } from 'react';
import { Plus, Trash2, Pencil, Repeat, Pause, Play } from 'lucide-react';
import { recurringService } from '../services/recurringService';
import { categoryService, paymentMethodService } from '../services/categoryService';
import { useToast } from '../context/ToastContext';
import { getErrorMessage } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, formatDate } from '../utils/formatters';
import Spinner from '../components/Spinner';
import EmptyState from '../components/EmptyState';
import Modal from '../components/Modal';
import ConfirmModal from '../components/ConfirmModal';

const Recurring = () => {
  const toast = useToast();
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([recurringService.list(), categoryService.list(), paymentMethodService.list()])
      .then(([rRes, cRes, pRes]) => {
        setItems(rRes.data.recurring);
        setCategories(cRes.data.categories);
        setPaymentMethods(pRes.data.paymentMethods);
      })
      .catch((err) => toast.error(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load(); }, [load]);

  const toggleActive = async (item) => {
    try {
      await recurringService.update(item._id, { isActive: !item.isActive });
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await recurringService.remove(deleteItem._id);
      toast.success('Recurring transaction deleted');
      setDeleteItem(null);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Recurring Transactions</h1>
        <button className="btn-primary" onClick={() => { setEditing(null); setFormOpen(true); }}><Plus size={16} /> New Recurring</button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size={28} /></div>
      ) : items.length === 0 ? (
        <EmptyState icon={Repeat} title="No recurring transactions set up" action={<button className="btn-primary" onClick={() => setFormOpen(true)}>+ Add recurring transaction</button>} />
      ) : (
        <div className="card divide-y divide-gray-100 dark:divide-gray-800">
          {items.map((r) => (
            <div key={r._id} className="p-4 flex items-center justify-between flex-wrap gap-2">
              <div>
                <p className="font-medium">{r.description || r.category?.name}</p>
                <p className="text-xs text-gray-500 capitalize">{r.frequency} · {r.category?.name} · {r.paymentMethod?.name} · from {formatDate(r.startDate)}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-sm font-semibold ${r.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                  {r.type === 'income' ? '+' : '-'}{formatCurrency(r.amount, user?.currency)}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${r.isActive ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-800'}`}>
                  {r.isActive ? 'Active' : 'Paused'}
                </span>
                <button className="text-gray-400 hover:text-primary-600" onClick={() => toggleActive(r)}>
                  {r.isActive ? <Pause size={15} /> : <Play size={15} />}
                </button>
                <button className="text-gray-400 hover:text-primary-600" onClick={() => { setEditing(r); setFormOpen(true); }}><Pencil size={15} /></button>
                <button className="text-gray-400 hover:text-red-600" onClick={() => setDeleteItem(r)}><Trash2 size={15} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {formOpen && (
        <RecurringFormModal
          item={editing}
          categories={categories}
          paymentMethods={paymentMethods}
          onClose={() => setFormOpen(false)}
          onSaved={() => { setFormOpen(false); load(); }}
        />
      )}
      <ConfirmModal isOpen={!!deleteItem} onClose={() => setDeleteItem(null)} onConfirm={handleDelete} loading={deleting} message="Delete this recurring transaction? Past generated transactions will remain." />
    </div>
  );
};

const RecurringFormModal = ({ item, categories, paymentMethods, onClose, onSaved }) => {
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    type: item?.type || 'expense',
    amount: item?.amount || '',
    category: item?.category?._id || '',
    paymentMethod: item?.paymentMethod?._id || paymentMethods[0]?._id || '',
    frequency: item?.frequency || 'monthly',
    startDate: item?.startDate ? item.startDate.split('T')[0] : new Date().toISOString().split('T')[0],
    endDate: item?.endDate ? item.endDate.split('T')[0] : '',
    description: item?.description || '',
  });

  const relevantCategories = categories.filter((c) => c.type === form.type);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, endDate: form.endDate || null };
      if (item) {
        const res = await recurringService.update(item._id, payload);
        toast.success(res.message);
      } else {
        const res = await recurringService.create(payload);
        toast.success(res.message);
      }
      onSaved();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen onClose={onClose} title={item ? 'Edit Recurring Transaction' : 'New Recurring Transaction'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Type</label>
          <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value, category: '' })}>
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>
        </div>
        <div>
          <label className="label">Amount</label>
          <input type="number" className="input" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
        </div>
        <div>
          <label className="label">Category</label>
          <select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            <option value="">Select...</option>
            {relevantCategories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Payment Method</label>
          <select className="input" value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}>
            {paymentMethods.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Frequency</label>
          <select className="input" value={form.frequency} onChange={(e) => setForm({ ...form, frequency: e.target.value })}>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Start Date</label>
            <input type="date" className="input" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
          </div>
          <div>
            <label className="label">End Date (optional)</label>
            <input type="date" className="input" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
          </div>
        </div>
        <div>
          <label className="label">Description</label>
          <input className="input" placeholder="e.g. Netflix" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
        <button type="submit" className="btn-primary w-full" disabled={saving}>
          {saving ? <Spinner size={16} className="text-white" /> : item ? 'Save Changes' : 'Create'}
        </button>
      </form>
    </Modal>
  );
};

export default Recurring;
