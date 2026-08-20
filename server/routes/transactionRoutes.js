const express = require('express');
const router = express.Router();
const {
  getTransactions,
  getTransaction,
  createTransaction,
  updateTransaction,
  deleteTransaction,
} = require('../controllers/transactionController');
const { exportTransactions } = require('../controllers/exportController');
const { importTransactions } = require('../controllers/importController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { transactionValidator } = require('../validators/transactionValidators');
const { mongoIdParam } = require('../validators/commonValidators');

router.use(protect);
router.get('/export', exportTransactions);
router.post('/import', importTransactions);
router.route('/').get(getTransactions).post(transactionValidator, validate, createTransaction);
router
  .route('/:id')
  .get(mongoIdParam(), validate, getTransaction)
  .put(mongoIdParam(), validate, updateTransaction)
  .delete(mongoIdParam(), validate, deleteTransaction);

module.exports = router;
