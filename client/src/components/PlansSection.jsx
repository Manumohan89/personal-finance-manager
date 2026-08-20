import { useEffect, useState, useCallback } from 'react';
import { Plus, Trash2, Pencil } from 'lucide-react';
import { planService } from '../services/planService';
import { useToast } from '../context/ToastContext';
import { getErrorMessage } from '../services/api';
import { formatCurrency } from '../utils/formatters';
import Modal from './Modal';
import Spinner from './Spinner';
import EmptyState from './EmptyState';
import ConfirmModal from './ConfirmModal';

const PlansSection = ({ currency = 'INR' }) => {
  const toast = useToast();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    planService.list().then((res) => setPlans(res.data.plans)).catch((err) => toast.error(getErrorMessage(err))).finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load(); }, [load]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await planService.remove(deleteTarget._id);
      toast.success('Plan deleted');
      setDeleteTarget(null);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <p className="text-sm text-gray-500">Plan a lump sum — e.g. money received for college — across specific allocations.</p>
        <button className="btn-secondary shrink-0" onClick={() => { setEditing(null); setFormOpen(true); }}><Plus size={14} /> New Plan</button>
      </div>

      {loading ? (
        <div className="flex justify-center py-8"><Spinner /></div>
      ) : plans.length === 0 ? (
        <EmptyState title="No financial plans yet" />
      ) : (
        <div className="space-y-3">
          {plans.map((p) => {
            const totalAllocated = p.allocations.reduce((s, a) => s + a.amount, 0);
            const remaining = p.initialAmount - totalAllocated;
            const pct = p.initialAmount > 0 ? Math.min((totalAllocated / p.initialAmount) * 100, 100) : 0;
            return (
              <div key={p._id} className="border border-gray-200 dark:border-gray-800 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-medium">{p.planName}</p>
                    {p.description && <p className="text-xs text-gray-500">{p.description}</p>}
                  </div>
                  <div className="flex gap-1">
                    <button className="text-gray-400 hover:text-primary-600" onClick={() => { setEditing(p); setFormOpen(true); }}><Pencil size={14} /></button>
                    <button className="text-gray-400 hover:text-red-600" onClick={() => setDeleteTarget(p)}><Trash2 size={14} /></button>
                  </div>
                </div>
                <div className="text-sm flex justify-between mb-1">
                  <span>{formatCurrency(totalAllocated, currency)} allocated</span>
                  <span className="text-gray-500">of {formatCurrency(p.initialAmount, currency)}</span>
                </div>
                <div className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden mb-2">
                  <div className={`h-full ${remaining < 0 ? 'bg-red-500' : 'bg-primary-500'}`} style={{ width: `${pct}%` }} />
                </div>
                <p className={`text-xs mb-2 ${remaining < 0 ? 'text-red-600' : 'text-gray-500'}`}>
                  {remaining < 0 ? `Over-allocated by ${formatCurrency(Math.abs(remaining), currency)}` : `${formatCurrency(remaining, currency)} remaining`}
                </p>
                <div className="space-y-1">
                  {p.allocations.map((a) => (
                    <div key={a._id} className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                      <span>{a.label}</span>
                      <span>{formatCurrency(a.amount, currency)}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {formOpen && <PlanFormModal plan={editing} onClose={() => setFormOpen(false)} onSaved={() => { setFormOpen(false); load(); }} />}
      <ConfirmModal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} loading={deleting} message={`Delete plan "${deleteTarget?.planName}"?`} />
    </div>
  );
};

const PlanFormModal = ({ plan, onClose, onSaved }) => {
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    planName: plan?.planName || '',
    initialAmount: plan?.initialAmount ?? '',
    description: plan?.description || '',
    allocations: plan?.allocations?.map((a) => ({ label: a.label, amount: a.amount })) || [{ label: '', amount: '' }],
  });

  const updateAllocation = (idx, field, value) => {
    const next = [...form.allocations];
    next[idx] = { ...next[idx], [field]: value };
    setForm({ ...form, allocations: next });
  };

  const addAllocation = () => setForm({ ...form, allocations: [...form.allocations, { label: '', amount: '' }] });
  const removeAllocation = (idx) => setForm({ ...form, allocations: form.allocations.filter((_, i) => i !== idx) });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        planName: form.planName,
        initialAmount: Number(form.initialAmount),
        description: form.description,
        allocations: form.allocations
          .filter((a) => a.label && a.amount !== '')
          .map((a) => ({ label: a.label, amount: Number(a.amount) })),
      };
      const res = plan ? await planService.update(plan._id, payload) : await planService.create(payload);
      toast.success(plan ? 'Plan updated' : 'Plan created');
      onSaved();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen onClose={onClose} title={plan ? 'Edit Financial Plan' : 'New Financial Plan'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Plan Name</label>
          <input className="input" placeholder="e.g. College Fund" value={form.planName} onChange={(e) => setForm({ ...form, planName: e.target.value })} />
        </div>
        <div>
          <label className="label">Initial Amount</label>
          <input type="number" className="input" value={form.initialAmount} onChange={(e) => setForm({ ...form, initialAmount: e.target.value })} />
        </div>
        <div>
          <label className="label">Description (optional)</label>
          <input className="input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
        <div>
          <label className="label">Allocations</label>
          <div className="space-y-2">
            {form.allocations.map((a, idx) => (
              <div key={idx} className="flex gap-2">
                <input className="input flex-1" placeholder="e.g. Laptop" value={a.label} onChange={(e) => updateAllocation(idx, 'label', e.target.value)} />
                <input type="number" className="input w-32" placeholder="Amount" value={a.amount} onChange={(e) => updateAllocation(idx, 'amount', e.target.value)} />
                <button type="button" className="text-gray-400 hover:text-red-600" onClick={() => removeAllocation(idx)}><Trash2 size={16} /></button>
              </div>
            ))}
          </div>
          <button type="button" className="btn-secondary mt-2 !text-xs" onClick={addAllocation}><Plus size={12} /> Add Allocation</button>
        </div>
        <button type="submit" className="btn-primary w-full" disabled={saving}>
          {saving ? <Spinner size={16} className="text-white" /> : plan ? 'Save Changes' : 'Create Plan'}
        </button>
      </form>
    </Modal>
  );
};

export default PlansSection;
