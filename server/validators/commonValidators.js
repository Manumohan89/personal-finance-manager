const { body, param } = require('express-validator');

const mongoIdParam = (name = 'id') => param(name).isMongoId().withMessage('Invalid id');

const categoryValidator = [
  body('name').trim().notEmpty().withMessage('Category name is required'),
  body('type').isIn(['income', 'expense']).withMessage('Type must be income or expense'),
];

const budgetValidator = [
  body('category').isMongoId().withMessage('Valid category is required'),
  body('amount').isFloat({ gt: 0 }).withMessage('Budget amount must be greater than 0'),
  body('month').isInt({ min: 1, max: 12 }).withMessage('Month must be between 1 and 12'),
  body('year').isInt({ min: 2000 }).withMessage('Valid year is required'),
];

const goalValidator = [
  body('name').trim().notEmpty().withMessage('Goal name is required'),
  body('targetAmount').isFloat({ gt: 0 }).withMessage('Target amount must be greater than 0'),
];

const recurringValidator = [
  body('type').isIn(['income', 'expense']).withMessage('Type must be income or expense'),
  body('amount').isFloat({ gt: 0 }).withMessage('Amount must be greater than 0'),
  body('category').isMongoId().withMessage('Valid category is required'),
  body('paymentMethod').isMongoId().withMessage('Valid payment method is required'),
  body('frequency').isIn(['daily', 'weekly', 'monthly', 'yearly']).withMessage('Invalid frequency'),
  body('startDate').isISO8601().withMessage('Valid start date is required'),
];

const planValidator = [
  body('planName').trim().notEmpty().withMessage('Plan name is required'),
  body('initialAmount').isFloat({ gt: -1 }).withMessage('Initial amount must be 0 or greater'),
];

module.exports = { mongoIdParam, categoryValidator, budgetValidator, goalValidator, recurringValidator, planValidator };
