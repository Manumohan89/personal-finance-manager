import { useEffect, useState, useCallback } from 'react';
import { Plus, Trash2, Pencil, Tag } from 'lucide-react';
import { categoryService, paymentMethodService } from '../services/categoryService';
import { useToast } from '../context/ToastContext';
import { getErrorMessage } from '../services/api';
import Spinner from '../components/Spinner';
import EmptyState from '../components/EmptyState';
import Modal from '../components/Modal';
import ConfirmModal from '../components/ConfirmModal';

const ICON_COLORS = ['#6366F1', '#F97316', '#22C55E', '#EF4444', '#0EA5E9', '#A855F7', '#EC4899', '#F59E0B', '#14B8A6', '#84CC16'];

const Categories = () => {
  const toast = useToast();
  const [tab, setTab] = useState('expense'); // expense | income | payment
  const [categories, setCategories] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [reassignTo, setReassignTo] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([categoryService.list(), paymentMethodService.list()])
      .then(([cRes, pRes]) => { setCategories(cRes.data.categories); setPaymentMethods(pRes.data.paymentMethods); })
      .catch((err) => toast.error(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load(); }, [load]);

  const filteredCategories = categories.filter((c) => c.type === tab);
  const sameTypeCategories = filteredCategories.filter((c) => c._id !== deleteTarget?._id);

  const handleDelete = async () => {
    setDeleting(true);
    setDeleteError('');
    try {
      if (tab === 'payment') {
        await paymentMethodService.remove(deleteTarget._id);
      } else {
        await categoryService.remove(deleteTarget._id, reassignTo || undefined);
      }
      toast.success('Deleted successfully');
      setDeleteTarget(null);
      setReassignTo('');
      load();
    } catch (err) {
      setDeleteError(getErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Categories & Payment Methods</h1>
        <button className="btn-primary" onClick={() => { setEditing(null); setFormOpen(true); }}><Plus size={16} /> New</button>
      </div>

      <div className="flex rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 w-fit">
        {['expense', 'income', 'payment'].map((t) => (
          <button key={t} className={`px-4 py-2 text-sm capitalize ${tab === t ? 'bg-primary-600 text-white' : 'bg-white dark:bg-gray-900'}`} onClick={() => setTab(t)}>
            {t === 'payment' ? 'Payment Methods' : `${t} Categories`}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size={28} /></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {(tab === 'payment' ? paymentMethods : filteredCategories).length === 0 ? (
            <div className="col-span-full"><EmptyState icon={Tag} title="Nothing here yet" /></div>
          ) : (
            (tab === 'payment' ? paymentMethods : filteredCategories).map((item) => (
              <div key={item._id} className="card p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {tab !== 'payment' && <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />}
                  <span className="font-medium">{item.name}</span>
                </div>
                <div className="flex gap-1">
                  <button className="text-gray-400 hover:text-primary-600" onClick={() => { setEditing(item); setFormOpen(true); }}><Pencil size={14} /></button>
                  <button className="text-gray-400 hover:text-red-600" onClick={() => { setDeleteTarget(item); setDeleteError(''); }}><Trash2 size={14} /></button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {formOpen && (
        <CategoryFormModal
          tab={tab}
          item={editing}
          onClose={() => setFormOpen(false)}
          onSaved={() => { setFormOpen(false); load(); }}
        />
      )}

      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete?" maxWidth="max-w-sm">
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
          Delete &quot;{deleteTarget?.name}&quot;? {tab !== 'payment' && 'If transactions use it, choose a category to reassign them to.'}
        </p>
        {deleteError && (
          <div className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2 mb-3">{deleteError}</div>
        )}
        {tab !== 'payment' && deleteError && (
          <select className="input mb-3" value={reassignTo} onChange={(e) => setReassignTo(e.target.value)}>
            <option value="">Select reassignment category...</option>
            {sameTypeCategories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
        )}
        <div className="flex justify-end gap-2">
          <button className="btn-secondary" onClick={() => setDeleteTarget(null)} disabled={deleting}>Cancel</button>
          <button className="btn-danger" onClick={handleDelete} disabled={deleting}>{deleting ? 'Deleting...' : 'Delete'}</button>
        </div>
      </Modal>
    </div>
  );
};

const CategoryFormModal = ({ tab, item, onClose, onSaved }) => {
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: item?.name || '',
    type: item?.type || (tab === 'income' ? 'income' : 'expense'),
    color: item?.color || ICON_COLORS[0],
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (tab === 'payment') {
        const res = item ? await paymentMethodService.update(item._id, { name: form.name }) : await paymentMethodService.create({ name: form.name });
        toast.success(res.message);
      } else {
        const res = item
          ? await categoryService.update(item._id, { name: form.name, color: form.color })
          : await categoryService.create({ name: form.name, type: form.type, color: form.color });
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
    <Modal isOpen onClose={onClose} title={item ? 'Edit' : tab === 'payment' ? 'New Payment Method' : `New ${tab} Category`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Name</label>
          <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        {tab !== 'payment' && !item && (
          <div>
            <label className="label">Type</label>
            <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
          </div>
        )}
        {tab !== 'payment' && (
          <div>
            <label className="label">Color</label>
            <div className="flex gap-2 flex-wrap">
              {ICON_COLORS.map((c) => (
                <button
                  type="button"
                  key={c}
                  className={`w-7 h-7 rounded-full ${form.color === c ? 'ring-2 ring-offset-2 ring-primary-500' : ''}`}
                  style={{ backgroundColor: c }}
                  onClick={() => setForm({ ...form, color: c })}
                />
              ))}
            </div>
          </div>
        )}
        <button type="submit" className="btn-primary w-full" disabled={saving}>
          {saving ? <Spinner size={16} className="text-white" /> : item ? 'Save Changes' : 'Create'}
        </button>
      </form>
    </Modal>
  );
};

export default Categories;
