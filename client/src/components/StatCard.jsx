import { formatCurrency, formatPercent } from '../utils/formatters';

const StatCard = ({ icon: Icon, label, amount, change, currency = 'INR', accent = 'primary' }) => {
  const accentClasses = {
    primary: 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400',
    green: 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400',
    red: 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400',
    amber: 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
  };

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${accentClasses[accent]}`}>
          <Icon size={18} />
        </div>
        {change !== undefined && (
          <span className={`text-xs font-medium ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatPercent(change)}
          </span>
        )}
      </div>
      <p className="text-xl font-semibold">{formatCurrency(amount, currency)}</p>
      <p className="text-sm text-gray-500">{label}</p>
    </div>
  );
};

export default StatCard;
