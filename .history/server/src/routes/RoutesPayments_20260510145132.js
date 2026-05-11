const express = require('express');
const router = express.Router();

const ControllerPayments = require('../controllers/ControllerPayments');

router.post('/api/payment', ControllerPayments.PaymentsMomo);
router.get('/api/checkdata', ControllerPayments.checkData);
router.get('/api/payment', ControllerPayments.getPayment);
router.post('/api/paymentcod', ControllerPayments.PaymentCod);
router.get('/api/payments', ControllerPayments.getPayments);
router.get('/api/dataorderuser', ControllerPayments.GetOrderUser);
router.post('/api/cancelorder', ControllerPayments.CancelOrder);
router.post('/api/updateorder', ControllerPayments.UpdateOrder);
router.get('/api/revenue-statistics', ControllerPayments.getRevenueStatistics);
router.get('/api/product-statistics', ControllerPayments.getProductStatistics);
// VNPay payment disabled
// router.post('/api/paymentvnpay', ControllerPayments.paymentVnpay);
// router.get('/api/check-payment-vnpay', ControllerPayments.checkPaymentVnpay);

module.exports = router;
