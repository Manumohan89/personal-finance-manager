const { body } = require('express-validator');

const transactionValidator = [
  body('type').isIn(['income', 'expense']).withMessage('Type must be income or expense'),
  body('amount').isFloat({ gt: 0 }).withMessage('Amount must be greater than 0'),
  body('category').isMongoId().withMessage('Valid category is required'),
  body('paymentMethod').isMongoId().withMessage('Valid payment method is required'),
  body('date').optional().isISO8601().withMessage('Date must be valid'),
  body('description').optional().isString().isLength({ max: 200 }),
];

module.exports = { transactionValidator };
