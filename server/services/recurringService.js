const RecurringTransaction = require('../models/RecurringTransaction');
const Transaction = require('../models/Transaction');

/**
 * Advances lastGeneratedDate by one period for a given frequency.
 */
const nextDate = (date, frequency) => {
  const d = new Date(date);
  switch (frequency) {
    case 'daily':
      d.setDate(d.getDate() + 1);
      break;
    case 'weekly':
      d.setDate(d.getDate() + 7);
      break;
    case 'monthly':
      d.setMonth(d.getMonth() + 1);
      break;
    case 'yearly':
      d.setFullYear(d.getFullYear() + 1);
      break;
    default:
      break;
  }
  return d;
};

/**
 * Generates any due occurrences for a single recurring rule, one period at a time,
 * so it self-heals even if the app wasn't running for a while. Never creates more
 * than one transaction per period (guarded by lastGeneratedDate).
 */
const generateDueForRule = async (rule) => {
  const now = new Date();
  const created = [];

  let cursor = rule.lastGeneratedDate ? new Date(rule.lastGeneratedDate) : new Date(rule.startDate);
  // First occurrence: if never generated, the startDate itself is due immediately.
  let nextOccurrence = rule.lastGeneratedDate ? nextDate(cursor, rule.frequency) : cursor;

  let safety = 0;
  while (nextOccurrence <= now && safety < 500) {
    if (rule.endDate && nextOccurrence > new Date(rule.endDate)) break;

    // eslint-disable-next-line no-await-in-loop
    await Transaction.create({
      user: rule.user,
      type: rule.type,
      amount: rule.amount,
      category: rule.category,
      paymentMethod: rule.paymentMethod,
      description: rule.description || '',
      date: nextOccurrence,
      isRecurring: true,
      recurringId: rule._id,
    });

    created.push(nextOccurrence);
    rule.lastGeneratedDate = nextOccurrence;
    nextOccurrence = nextDate(nextOccurrence, rule.frequency);
    safety += 1;
  }

  if (created.length > 0) {
    // eslint-disable-next-line no-await-in-loop
    await rule.save();
  }

  return created;
};

/**
 * Generates due transactions for every active recurring rule belonging to a user.
 * Called both on-demand (when the user visits Recurring/Dashboard) and by the cron job.
 */
const generateDueTransactionsForUser = async (userId) => {
  const rules = await RecurringTransaction.find({ user: userId, isActive: true });
  const results = [];
  for (const rule of rules) {
    // eslint-disable-next-line no-await-in-loop
    const created = await generateDueForRule(rule);
    if (created.length) results.push({ ruleId: rule._id, occurrences: created.length });
  }
  return results;
};

/**
 * Generates due transactions across all users. Used by the scheduled job.
 */
const generateDueTransactionsAllUsers = async () => {
  const rules = await RecurringTransaction.find({ isActive: true });
  let totalCreated = 0;
  for (const rule of rules) {
    // eslint-disable-next-line no-await-in-loop
    const created = await generateDueForRule(rule);
    totalCreated += created.length;
  }
  return totalCreated;
};

module.exports = { generateDueTransactionsForUser, generateDueTransactionsAllUsers };
