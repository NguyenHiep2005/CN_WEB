const express = require('express');
const router = express.Router();

const ControllerPayments = require('../controllers/ControllerPayments');

router.post('/api/paymentcod', ControllerPayments.PaymentCod);
router.get('/api/payment', ControllerPayments.getPayment);
router.get('/api/payments', ControllerPayments.getPayments);
router.get('/api/dataorderuser', ControllerPayments.GetOrderUser);
router.post('/api/cancelorder', ControllerPayments.CancelOrder);
router.post('/api/updateorder', ControllerPayments.UpdateOrder);
router.get('/api/revenue-statistics', ControllerPayments.getRevenueStatistics);
router.get('/api/product-statistics', ControllerPayments.getProductStatistics);

module.exports = router;
