const express = require('express');
const ControllerPayments = require('../controllers/ControllerPayments');

const router = express.Router();

// COD Payment - only payment method available
router.post('/paymentcod', (req, res) => {
    ControllerPayments.PaymentCod(req, res);
});

// Get user's payment history
router.get('/payments', (req, res) => {
    ControllerPayments.getPayments(req, res);
});

// Get specific payment
router.get('/payment', (req, res) => {
    ControllerPayments.getPayment(req, res);
});

// Get all orders (for admin)
router.get('/dataorderuser', (req, res) => {
    ControllerPayments.GetOrderUser(req, res);
});

// Cancel an order
router.post('/cancelorder', (req, res) => {
    ControllerPayments.CancelOrder(req, res);
});

// Update order details
router.post('/updateorder', (req, res) => {
    ControllerPayments.UpdateOrder(req, res);
});

// Get revenue statistics
router.get('/revenue-statistics', (req, res) => {
    ControllerPayments.getRevenueStatistics(req, res);
});

// Get product statistics
router.get('/product-statistics', (req, res) => {
    ControllerPayments.getProductStatistics(req, res);
});

module.exports = router;
