import { useEffect, useState, useCallback } from 'react';
import { Search, Pencil, Trash2, Download, Upload, Plus } from 'lucide-react';
import { transactionService } from '../services/transactionService';
import { categoryService, paymentMethodService } from '../services/categoryService';
import { getErrorMessage } from '../services/api';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, formatDate } from '../utils/formatters';
import Spinner from '../components/Spinner';
import EmptyState from '../components/EmptyState';
import ConfirmModal from '../components/ConfirmModal';
import Modal from '../components/Modal';
import QuickAddModal from '../components/QuickAddModal';

const Transactions = () => {
  const toast = useToast();
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);

  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState({ type: '', category: '', paymentMethod: '', startDate: '', endDate: '' });
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [page, setPage] = useState(1);

  const [quickAddType, setQuickAddType] = useState(null);
  const [editTx, setEditTx] = useState(null);
  const [deleteTx, setDeleteTx] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  const loadOptions = useCallback(() => {
    Promise.all([categoryService.list(), paymentMethodService.list()]).then(([c, p]) => {
      setCategories(c.data.categories);
      setPaymentMethods(p.data.paymentMethods);
    });
  }, []);

  const loadTransactions = useCallback(() => {
    setLoading(true);
    transactionService
      .list({ page, limit: 15, search: search || undefined, sortBy, sortOrder, ...filters })
      .then((res) => {
        setTransactions(res.data.transactions);
        setMeta(res.meta);
      })
      .catch((err) => toast.error(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [page, search, sortBy, sortOrder, filters]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { loadOptions(); }, [loadOptions]);
  useEffect(() => {
    const t = setTimeout(loadTransactions, 300); // debounce search/filter changes
    return () => clearTimeout(t);
  }, [loadTransactions]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await transactionService.remove(deleteTx._id);
      toast.success('Transaction deleted successfully');
      setDeleteTx(null);
      loadTransactions();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  const handleExport = async () => {
    try {
      const res = await transactionService.exportCsv(filters);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `transactions-${Date.now()}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold">Transactions</h1>
        <div className="flex gap-2">
          <button className="btn-secondary" onClick={handleExport}><Download size={16} /> Export</button>
          <button className="btn-secondary" onClick={() => setImportOpen(true)}><Upload size={16} /> Import</button>
          <button className="btn-primary" onClick={() => setQuickAddType('expense')}><Plus size={16} /> Add</button>
        </div>
      </div>

      <div className="card p-4 space-y-3">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="input pl-9"
            placeholder="Search by description, category, or amount"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          <select className="input" value={filters.type} onChange={(e) => { setFilters({ ...filters, type: e.target.value }); setPage(1); }}>
            <option value="">All Types</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
          <select className="input" value={filters.category} onChange={(e) => { setFilters({ ...filters, category: e.target.value }); setPage(1); }}>
            <option value="">All Categories</option>
            {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
          <select className="input" value={filters.paymentMethod} onChange={(e) => { setFilters({ ...filters, paymentMethod: e.target.value }); setPage(1); }}>
            <option value="">All Payment Methods</option>
            {paymentMethods.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
          </select>
          <input type="date" className="input" value={filters.startDate} onChange={(e) => { setFilters({ ...filters, startDate: e.target.value }); setPage(1); }} />
          <input type="date" className="input" value={filters.endDate} onChange={(e) => { setFilters({ ...filters, endDate: e.target.value }); setPage(1); }} />
        </div>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16"><Spinner size={28} /></div>
        ) : transactions.length === 0 ? (
          <EmptyState title="No transactions yet" action={<button className="btn-primary" onClick={() => setQuickAddType('expense')}>+ Add your first transaction</button>} />
        ) : (
          <>
            {/* Desktop table */}
            <table className="w-full text-sm hidden sm:table">
              <thead className="bg-gray-50 dark:bg-gray-800/50 text-left text-gray-500">
                <tr>
                  <th className="px-4 py-3 cursor-pointer" onClick={() => { setSortBy('date'); setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); }}>Date</th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Payment</th>
                  <th className="px-4 py-3 cursor-pointer" onClick={() => { setSortBy('amount'); setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); }}>Amount</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {transactions.map((t) => (
                  <tr key={t._id}>
                    <td className="px-4 py-3 whitespace-nowrap">{formatDate(t.date)}</td>
                    <td className="px-4 py-3">{t.description || '—'}</td>
                    <td className="px-4 py-3">{t.category?.name}</td>
                    <td className="px-4 py-3">{t.paymentMethod?.name}</td>
                    <td className={`px-4 py-3 font-medium ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                      {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount, user?.currency)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button className="text-gray-400 hover:text-primary-600 mr-2" onClick={() => setEditTx(t)}><Pencil size={15} /></button>
                      <button className="text-gray-400 hover:text-red-600" onClick={() => setDeleteTx(t)}><Trash2 size={15} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Mobile cards */}
            <div className="sm:hidden divide-y divide-gray-100 dark:divide-gray-800">
              {transactions.map((t) => (
                <div key={t._id} className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{t.description || t.category?.name}</p>
                    <p className="text-xs text-gray-500">{t.category?.name} · {formatDate(t.date)} · {t.paymentMethod?.name}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-semibold ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                      {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount, user?.currency)}
                    </p>
                    <div className="flex gap-2 justify-end mt-1">
                      <button className="text-gray-400" onClick={() => setEditTx(t)}><Pencil size={14} /></button>
                      <button className="text-gray-400" onClick={() => setDeleteTx(t)}><Trash2 size={14} /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 dark:border-gray-800 text-sm">
              <span className="text-gray-500">{meta.total} transaction(s)</span>
              <div className="flex gap-2">
                <button className="btn-secondary !px-3 !py-1" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Prev</button>
                <span className="px-2 py-1">{meta.page} / {meta.totalPages || 1}</span>
                <button className="btn-secondary !px-3 !py-1" disabled={page >= meta.totalPages} onClick={() => setPage((p) => p + 1)}>Next</button>
              </div>
            </div>
          </>
        )}
      </div>

      <QuickAddModal isOpen={!!quickAddType} type={quickAddType} onClose={() => setQuickAddType(null)} onSaved={loadTransactions} />
      {editTx && (
        <EditTransactionModal
          transaction={editTx}
          categories={categories}
          paymentMethods={paymentMethods}
          onClose={() => setEditTx(null)}
          onSaved={() => { setEditTx(null); loadTransactions(); }}
        />
      )}
      <ConfirmModal
        isOpen={!!deleteTx}
        onClose={() => setDeleteTx(null)}
        onConfirm={handleDelete}
        loading={deleting}
        message={`Delete this ${deleteTx?.type} of ${deleteTx ? formatCurrency(deleteTx.amount, user?.currency) : ''}? This cannot be undone.`}
      />
      <ImportModal isOpen={importOpen} onClose={() => setImportOpen(false)} onImported={loadTransactions} />
    </div>
  );
};

const EditTransactionModal = ({ transaction, categories, paymentMethods, onClose, onSaved }) => {
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    type: transaction.type,
    amount: transaction.amount,
    category: transaction.category?._id,
    paymentMethod: transaction.paymentMethod?._id,
    date: transaction.date?.split('T')[0],
    description: transaction.description || '',
  });

  const relevantCategories = categories.filter((c) => c.type === form.type);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await transactionService.update(transaction._id, form);
      toast.success(res.message);
      onSaved();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen onClose={onClose} title="Edit Transaction">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">Type</label>
          <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>
        </div>
        <div>
          <label className="label">Amount</label>
          <input type="number" step="0.01" className="input" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
        </div>
        <div>
          <label className="label">Category</label>
          <select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
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
          <label className="label">Date</label>
          <input type="date" className="input" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
        </div>
        <div>
          <label className="label">Description</label>
          <input className="input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
        <button type="submit" className="btn-primary w-full" disabled={saving}>
          {saving ? <Spinner size={16} className="text-white" /> : 'Save Changes'}
        </button>
      </form>
    </Modal>
  );
};

const ImportModal = ({ isOpen, onClose, onImported }) => {
  const toast = useToast();
  const [csvText, setCsvText] = useState('');
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => setCsvText(evt.target.result);
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!csvText.trim()) return;
    setImporting(true);
    try {
      const res = await transactionService.importCsv(csvText);
      setResult(res.data);
      toast.success(res.message);
      onImported();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setImporting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Import Transactions (CSV)">
      <div className="space-y-3">
        <p className="text-xs text-gray-500">
          Header row: Date, Type, Category, Amount, Payment Method, Description, Notes. Category and Payment
          Method names must match your existing ones exactly.
        </p>
        <input type="file" accept=".csv" onChange={handleFile} className="text-sm" />
        {result && (
          <div className="text-sm">
            <p className="text-green-600">{result.importedCount} imported successfully.</p>
            {result.failedRows.length > 0 && (
              <div className="text-red-600 mt-1">
                {result.failedRows.map((f) => <p key={f.row}>Row {f.row}: {f.reason}</p>)}
              </div>
            )}
          </div>
        )}
        <button className="btn-primary w-full" disabled={!csvText || importing} onClick={handleImport}>
          {importing ? <Spinner size={16} className="text-white" /> : 'Import'}
        </button>
      </div>
    </Modal>
  );
};

export default Transactions;
