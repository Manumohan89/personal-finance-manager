import { useEffect, useState, useCallback } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Legend } from 'recharts';
import { Download } from 'lucide-react';
import { reportService } from '../services/reportService';
import { useToast } from '../context/ToastContext';
import { getErrorMessage } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, MONTH_NAMES } from '../utils/formatters';
import Spinner from '../components/Spinner';

const now = new Date();
const COLORS = ['#6366f1', '#f97316', '#22c55e', '#ef4444', '#0ea5e9', '#a855f7', '#ec4899', '#f59e0b'];

const Reports = () => {
  const toast = useToast();
  const { user } = useAuth();
  const [tab, setTab] = useState('monthly');
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [monthlyReport, setMonthlyReport] = useState(null);
  const [yearlyReport, setYearlyReport] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadMonthly = useCallback(() => {
    setLoading(true);
    reportService.monthly(year, month).then((res) => setMonthlyReport(res.data)).catch((err) => toast.error(getErrorMessage(err))).finally(() => setLoading(false));
  }, [year, month]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadYearly = useCallback(() => {
    setLoading(true);
    reportService.yearly(year).then((res) => setYearlyReport(res.data)).catch((err) => toast.error(getErrorMessage(err))).finally(() => setLoading(false));
  }, [year]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (tab === 'monthly') loadMonthly();
    else loadYearly();
  }, [tab, loadMonthly, loadYearly]);

  const handleExport = () => {
    const rows = tab === 'monthly'
      ? [
        ['Report', `${MONTH_NAMES[month - 1]} ${year}`],
        ['Income', monthlyReport.income],
        ['Expenses', monthlyReport.expenses],
        ['Savings', monthlyReport.savings],
        ['Savings Rate', `${monthlyReport.savingsRate}%`],
        [],
        ['Category', 'Amount'],
        ...monthlyReport.categoryBreakdown.map((category) => [category.name, category.total]),
      ]
      : [
        ['Report', `${year}`],
        ['Total Income', yearlyReport.totalIncome],
        ['Total Expenses', yearlyReport.totalExpenses],
        ['Total Savings', yearlyReport.totalSavings],
        ['Average Monthly Savings', yearlyReport.averageMonthlySavings],
        [],
        ['Month', 'Income', 'Expenses', 'Savings'],
        ...yearlyReport.months.map((item) => [MONTH_NAMES[item.month - 1], item.income, item.expense, item.savings]),
      ];

    const csv = rows.map((row) => row.map((value) => `"${String(value ?? '').replaceAll('"', '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `${tab}-report-${year}${tab === 'monthly' ? `-${String(month).padStart(2, '0')}` : ''}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Reports</h1>
          <p className="text-sm text-gray-500">Review your patterns and download a copy for your records.</p>
        </div>
        <div className="flex gap-2">
          <div className="flex rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
            <button className={`px-4 py-2 text-sm ${tab === 'monthly' ? 'bg-primary-600 text-white' : 'bg-white dark:bg-gray-900'}`} onClick={() => setTab('monthly')}>Monthly</button>
            <button className={`px-4 py-2 text-sm ${tab === 'yearly' ? 'bg-primary-600 text-white' : 'bg-white dark:bg-gray-900'}`} onClick={() => setTab('yearly')}>Yearly</button>
          </div>
          {tab === 'monthly' && (
            <select className="input !w-auto" value={month} onChange={(e) => setMonth(Number(e.target.value))}>
              {MONTH_NAMES.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
            </select>
          )}
          <input type="number" className="input !w-24" value={year} onChange={(e) => setYear(Number(e.target.value))} />
          <button className="btn-secondary" onClick={handleExport} disabled={loading || (tab === 'monthly' ? !monthlyReport : !yearlyReport)} title="Download report as CSV">
            <Download size={16} />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size={28} /></div>
      ) : tab === 'monthly' && monthlyReport ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="card p-4"><p className="text-xs text-gray-500">Income</p><p className="text-lg font-semibold text-green-600">{formatCurrency(monthlyReport.income, user?.currency)}</p></div>
            <div className="card p-4"><p className="text-xs text-gray-500">Expenses</p><p className="text-lg font-semibold text-red-600">{formatCurrency(monthlyReport.expenses, user?.currency)}</p></div>
            <div className="card p-4"><p className="text-xs text-gray-500">Savings</p><p className="text-lg font-semibold">{formatCurrency(monthlyReport.savings, user?.currency)}</p></div>
            <div className="card p-4"><p className="text-xs text-gray-500">Savings Rate</p><p className="text-lg font-semibold">{monthlyReport.savingsRate}%</p></div>
          </div>

          {monthlyReport.insights.length > 0 && (
            <div className="card p-4 space-y-2">
              <h3 className="font-medium mb-1">Insights</h3>
              {monthlyReport.insights.map((ins, i) => (
                <p key={i} className={`text-sm ${ins.type === 'danger' ? 'text-red-600' : ins.type === 'warning' ? 'text-amber-600' : ins.type === 'positive' ? 'text-green-600' : 'text-gray-600 dark:text-gray-400'}`}>
                  • {ins.message}
                </p>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="card p-4">
              <h3 className="font-medium mb-3">Category Breakdown</h3>
              {monthlyReport.categoryBreakdown.length === 0 ? (
                <p className="text-sm text-gray-500">No expenses this month.</p>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie data={monthlyReport.categoryBreakdown} dataKey="total" nameKey="name" outerRadius={80}>
                      {monthlyReport.categoryBreakdown.map((c, i) => <Cell key={c.name} fill={c.color || COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v) => formatCurrency(v, user?.currency)} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
            <div className="card p-4">
              <h3 className="font-medium mb-3">Income vs Expense (Daily)</h3>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={monthlyReport.dailySeries}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => formatCurrency(v, user?.currency)} />
                  <Bar dataKey="income" fill="#22c55e" />
                  <Bar dataKey="expense" fill="#ef4444" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      ) : tab === 'yearly' && yearlyReport ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="card p-4"><p className="text-xs text-gray-500">Total Income</p><p className="text-lg font-semibold text-green-600">{formatCurrency(yearlyReport.totalIncome, user?.currency)}</p></div>
            <div className="card p-4"><p className="text-xs text-gray-500">Total Expenses</p><p className="text-lg font-semibold text-red-600">{formatCurrency(yearlyReport.totalExpenses, user?.currency)}</p></div>
            <div className="card p-4"><p className="text-xs text-gray-500">Total Savings</p><p className="text-lg font-semibold">{formatCurrency(yearlyReport.totalSavings, user?.currency)}</p></div>
            <div className="card p-4"><p className="text-xs text-gray-500">Avg Monthly Savings</p><p className="text-lg font-semibold">{formatCurrency(yearlyReport.averageMonthlySavings, user?.currency)}</p></div>
          </div>
          <div className="flex gap-4 text-sm text-gray-500">
            {yearlyReport.bestSavingMonth && <p>Best saving month: <span className="font-medium text-gray-800 dark:text-gray-200">{MONTH_NAMES[yearlyReport.bestSavingMonth - 1]}</span></p>}
            {yearlyReport.highestExpenseMonth && <p>Highest expense month: <span className="font-medium text-gray-800 dark:text-gray-200">{MONTH_NAMES[yearlyReport.highestExpenseMonth - 1]}</span></p>}
          </div>
          <div className="card p-4">
            <h3 className="font-medium mb-3">Monthly Income vs Expenses</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={yearlyReport.months.map((m) => ({ ...m, name: MONTH_NAMES[m.month - 1].slice(0, 3) }))}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => formatCurrency(v, user?.currency)} />
                <Legend />
                <Bar dataKey="income" fill="#22c55e" name="Income" />
                <Bar dataKey="expense" fill="#ef4444" name="Expense" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default Reports;
