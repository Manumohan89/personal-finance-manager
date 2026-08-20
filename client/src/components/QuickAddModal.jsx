import { useEffect, useState } from 'react';
import Modal from './Modal';
import Spinner from './Spinner';
import { categoryService, paymentMethodService } from '../services/categoryService';
import { transactionService } from '../services/transactionService';
import { getErrorMessage } from '../services/api';
import { useToast } from '../context/ToastContext';

const todayIso = () => new Date().toISOString().split('T')[0];

const QuickAddModal = ({ isOpen, onClose, type, onSaved }) => {
  const toast = useToast();
  const [categories, setCategories] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState({
    amount: '',
    category: '',
    paymentMethod: '',
    date: todayIso(),
    description: '',
  });

  useEffect(() => {
    if (!isOpen) return;
    setForm({ amount: '', category: '', paymentMethod: '', date: todayIso(), description: '' });
    setErrors({});
    setLoadingOptions(true);
    Promise.all([categoryService.list(type), paymentMethodService.list()])
      .then(([catRes, pmRes]) => {
        setCategories(catRes.data.categories);
        setPaymentMethods(pmRes.data.paymentMethods);
        setForm((f) => ({
          ...f,
          category: catRes.data.categories[0]?._id || '',
          paymentMethod: pmRes.data.paymentMethods[0]?._id || '',
        }));
      })
      .catch((err) => toast.error(getErrorMessage(err)))
      .finally(() => setLoadingOptions(false));
  }, [isOpen, type]); // eslint-disable-line react-hooks/exhaustive-deps

  const validate = () => {
    const errs = {};
    if (!form.amount || Number(form.amount) <= 0) errs.amount = 'Enter an amount greater than 0';
    if (!form.category) errs.category = 'Select a category';
    if (!form.paymentMethod) errs.paymentMethod = 'Select a payment method';
    if (!form.date) errs.date = 'Select a date';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const res = await transactionService.create({
        type,
        amount: Number(form.amount),
        category: form.category,
        paymentMethod: form.paymentMethod,
        date: form.date,
        description: form.description,
      });
      toast.success(res.message);
      onSaved?.(res.data.transaction);
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={type === 'expense' ? 'Add Expense' : 'Add Income'}>
      {loadingOptions ? (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Amount</label>
            <input
              type="number"
              step="0.01"
              autoFocus
              className="input text-lg font-semibold"
              placeholder="0.00"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
            />
            {errors.amount && <p className="error-text">{errors.amount}</p>}
          </div>

          <div>
            <label className="label">{type === 'expense' ? 'Category' : 'Source'}</label>
            <select
              className="input"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            >
              {categories.map((c) => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
            {errors.category && <p className="error-text">{errors.category}</p>}
          </div>

          <div>
            <label className="label">Payment Method</label>
            <select
              className="input"
              value={form.paymentMethod}
              onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
            >
              {paymentMethods.map((p) => (
                <option key={p._id} value={p._id}>{p.name}</option>
              ))}
            </select>
            {errors.paymentMethod && <p className="error-text">{errors.paymentMethod}</p>}
          </div>

          <div>
            <label className="label">Date</label>
            <input
              type="date"
              className="input"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
            />
            {errors.date && <p className="error-text">{errors.date}</p>}
          </div>

          <div>
            <label className="label">Description (optional)</label>
            <input
              type="text"
              className="input"
              placeholder={type === 'expense' ? 'e.g. Lunch' : 'e.g. Monthly salary'}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          <button type="submit" className="btn-primary w-full" disabled={saving}>
            {saving ? <Spinner size={16} className="text-white" /> : `Save ${type === 'expense' ? 'Expense' : 'Income'}`}
          </button>
        </form>
      )}
    </Modal>
  );
};

export default QuickAddModal;
