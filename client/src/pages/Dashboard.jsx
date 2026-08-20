import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Wallet, TrendingUp, TrendingDown, PiggyBank, AlertTriangle } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';
import { dashboardService } from '../services/dashboardService';
import { budgetService } from '../services/budgetService';
import { transactionService } from '../services/transactionService';
import { useAuth } from '../context/AuthContext';
import StatCard from '../components/StatCard';
import Spinner from '../components/Spinner';
import EmptyState from '../components/EmptyState';
import { formatCurrency, formatDate } from '../utils/formatters';
import { getErrorMessage } from '../services/api';
import { useToast } from '../context/ToastContext';

const Dashboard = () => {
  const { user } = useAuth();
  const toast = useToast();
  const { refreshKey } = useOutletContext();
  const [summary, setSummary] = useState(null);
  const [categoryBreakdown, setCategoryBreakdown] = useState([]);
  const [dailySeries, setDailySeries] = useState([]);
  const [budgetAlerts, setBudgetAlerts] = useState([]);
  const [recentTx, setRecentTx] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      dashboardService.summary(),
      dashboardService.categories(),
      dashboardService.monthly(),
      budgetService.list(),
      transactionService.list({ limit: 6, sortBy: 'date', sortOrder: 'desc' }),
    ])
      .then(([summaryRes, catRes, monthlyRes, budgetRes, txRes]) => {
        setSummary(summaryRes.data);
        setCategoryBreakdown(catRes.data.breakdown);
        setDailySeries(monthlyRes.data.series);
        setBudgetAlerts(budgetRes.data.budgets.filter((b) => b.status !== 'ok'));
        setRecentTx(txRes.data.transactions);
      })
      .catch((err) => toast.error(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [refreshKey]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Welcome back, {user?.name?.split(' ')[0]}</h1>
        <p className="text-sm text-gray-500">Here&apos;s your financial overview</p>
      </div>

      {budgetAlerts.length > 0 && (
        <div className="card p-4 border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/10 space-y-1">
          {budgetAlerts.map((b) => (
            <div key={b._id} className="flex items-center gap-2 text-sm text-amber-800 dark:text-amber-300">
              <AlertTriangle size={14} />
              {b.status === 'exceeded'
                ? `You have exceeded your ${b.category.name} budget.`
                : `${b.category.name} budget is ${b.percentage}% used.`}
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Wallet} label="Total Balance" amount={summary.totalBalance} currency={user?.currency} accent="primary" />
        <StatCard icon={TrendingUp} label="Total Income" amount={summary.totalIncome} accent="green" />
        <StatCard icon={TrendingDown} label="Total Expenses" amount={summary.totalExpenses} accent="red" />
        <StatCard icon={PiggyBank} label="Total Savings" amount={summary.totalSavings} accent="amber" />
      </div>

      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">This Month</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard icon={TrendingUp} label="Income" amount={summary.currentMonth.income} change={summary.currentMonth.incomeChangePct} currency={user?.currency} accent="green" />
          <StatCard icon={TrendingDown} label="Expenses" amount={summary.currentMonth.expenses} change={summary.currentMonth.expenseChangePct} currency={user?.currency} accent="red" />
          <StatCard icon={PiggyBank} label={`Savings (${summary.savingsRate}% rate)`} amount={summary.currentMonth.savings} change={summary.currentMonth.savingsChangePct} currency={user?.currency} accent="primary" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-4">
          <h3 className="font-medium mb-3">Expense Breakdown</h3>
          {categoryBreakdown.length === 0 ? (
            <EmptyState title="No expenses recorded yet" />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={categoryBreakdown} dataKey="total" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2}>
                  {categoryBreakdown.map((c) => <Cell key={c.name} fill={c.color} />)}
                </Pie>
                <Tooltip formatter={(v) => formatCurrency(v, user?.currency)} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card p-4">
          <h3 className="font-medium mb-3">Daily Spending This Month</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={dailySeries}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="day" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v) => formatCurrency(v, user?.currency)} />
              <Line type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="income" stroke="#22c55e" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card p-4">
        <h3 className="font-medium mb-3">Recent Transactions</h3>
        {recentTx.length === 0 ? (
          <EmptyState title="No transactions yet" />
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {recentTx.map((t) => (
              <div key={t._id} className="flex items-center justify-between py-2.5">
                <div>
                  <p className="text-sm font-medium">{t.description || t.category?.name}</p>
                  <p className="text-xs text-gray-500">{t.category?.name} · {formatDate(t.date)}</p>
                </div>
                <p className={`text-sm font-semibold ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                  {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount, user?.currency)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
