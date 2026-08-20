import { useEffect, useState, useCallback } from 'react';
import { Plus, Trash2, Pencil, ArrowUpCircle, ArrowDownCircle, Target } from 'lucide-react';
import { goalService } from '../services/goalService';
import { useToast } from '../context/ToastContext';
import { getErrorMessage } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, formatDate } from '../utils/formatters';
import Spinner from '../components/Spinner';
import EmptyState from '../components/EmptyState';
import Modal from '../components/Modal';
import ConfirmModal from '../components/ConfirmModal';

const Goals = () => {
  const toast = useToast();
  const { user } = useAuth();
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [fundGoal, setFundGoal] = useState(null); // { goal, mode: 'deposit' | 'withdraw' }
  const [deleteGoal, setDeleteGoal] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    goalService.list().then((res) => setGoals(res.data.goals)).catch((err) => toast.error(getErrorMessage(err))).finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load(); }, [load]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await goalService.remove(deleteGoal._id);
      toast.success('Goal deleted');
      setDeleteGoal(null);
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
        <h1 className="text-xl font-semibold">Savings Goals</h1>
        <button className="btn-primary" onClick={() => { setEditingGoal(null); setFormOpen(true); }}><Plus size={16} /> New Goal</button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size={28} /></div>
      ) : goals.length === 0 ? (
        <EmptyState icon={Target} title="No savings goals yet" action={<button className="btn-primary" onClick={() => setFormOpen(true)}>+ Create your first goal</button>} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {goals.map((g) => (
            <div key={g._id} className="card p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">{g.name}</span>
                <div className="flex gap-1">
                  <button className="text-gray-400 hover:text-primary-600" onClick={() => { setEditingGoal(g); setFormOpen(true); }}><Pencil size={14} /></button>
                  <button className="text-gray-400 hover:text-red-600" onClick={() => setDeleteGoal(g)}><Trash2 size={14} /></button>
                </div>
              </div>
              {g.description && <p className="text-xs text-gray-500 mb-2">{g.description}</p>}
              <div className="flex justify-between text-sm mb-1">
                <span>{formatCurrency(g.currentAmount, user?.currency)}</span>
                <span className="text-gray-500">of {formatCurrency(g.targetAmount, user?.currency)}</span>
              </div>
              <div className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <div className={`h-full ${g.isCompleted ? 'bg-green-500' : 'bg-primary-500'}`} style={{ width: `${g.percentage}%` }} />
              </div>
              <div className="flex justify-between text-xs mt-2 text-gray-500">
                <span>{g.percentage}% complete</span>
                {g.deadline && <span>Due {formatDate(g.deadline)}</span>}
              </div>
              <div className="flex gap-2 mt-3">
                <button className="btn-secondary flex-1 !text-xs" onClick={() => setFundGoal({ goal: g, mode: 'deposit' })}>
                  <ArrowUpCircle size={14} /> Add Money
                </button>
                <button className="btn-secondary flex-1 !text-xs" onClick={() => setFundGoal({ goal: g, mode: 'withdraw' })}>
                  <ArrowDownCircle size={14} /> Withdraw
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {formOpen && <GoalFormModal goal={editingGoal} onClose={() => setFormOpen(false)} onSaved={() => { setFormOpen(false); load(); }} />}
      {fundGoal && <FundModal goal={fundGoal.goal} mode={fundGoal.mode} onClose={() => setFundGoal(null)} onSaved={() => { setFundGoal(null); load(); }} />}
      <ConfirmModal isOpen={!!deleteGoal} onClose={() => setDeleteGoal(null)} onConfirm={handleDelete} loading={deleting} message={`Delete goal "${deleteGoal?.name}"?`} />
    </div>
  );
};

const GoalFormModal = ({ goal, onClose, onSaved }) => {
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: goal?.name || '',
    targetAmount: goal?.targetAmount || '',
    currentAmount: goal?.currentAmount || 0,
    deadline: goal?.deadline ? goal.deadline.split('T')[0] : '',
    description: goal?.description || '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (goal) {
        const res = await goalService.update(goal._id, form);
        toast.success(res.message);
      } else {
        const res = await goalService.create(form);
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
    <Modal isOpen onClose={onClose} title={goal ? 'Edit Goal' : 'New Savings Goal'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Goal Name</label>
          <input className="input" placeholder="e.g. Laptop" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div>
          <label className="label">Target Amount</label>
          <input type="number" className="input" value={form.targetAmount} onChange={(e) => setForm({ ...form, targetAmount: e.target.value })} />
        </div>
        {!goal && (
          <div>
            <label className="label">Starting Amount (optional)</label>
            <input type="number" className="input" value={form.currentAmount} onChange={(e) => setForm({ ...form, currentAmount: e.target.value })} />
          </div>
        )}
        <div>
          <label className="label">Deadline (optional)</label>
          <input type="date" className="input" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
        </div>
        <div>
          <label className="label">Description (optional)</label>
          <input className="input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
        <button type="submit" className="btn-primary w-full" disabled={saving}>
          {saving ? <Spinner size={16} className="text-white" /> : goal ? 'Save Changes' : 'Create Goal'}
        </button>
      </form>
    </Modal>
  );
};

const FundModal = ({ goal, mode, onClose, onSaved }) => {
  const toast = useToast();
  const { user } = useAuth();
  const [amount, setAmount] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) return;
    setSaving(true);
    try {
      const res = mode === 'deposit' ? await goalService.deposit(goal._id, Number(amount)) : await goalService.withdraw(goal._id, Number(amount));
      toast.success(res.message);
      onSaved();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen onClose={onClose} title={`${mode === 'deposit' ? 'Add Money to' : 'Withdraw from'} "${goal.name}"`} maxWidth="max-w-sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-gray-500">Current: {formatCurrency(goal.currentAmount, user?.currency)}</p>
        <div>
          <label className="label">Amount</label>
          <input type="number" autoFocus className="input" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </div>
        <button type="submit" className="btn-primary w-full" disabled={saving}>
          {saving ? <Spinner size={16} className="text-white" /> : 'Confirm'}
        </button>
      </form>
    </Modal>
  );
};

export default Goals;
