const express = require('express');
const ControllerPayments = require('../controllers/ControllerPayments');

const router = express.Router();

// COD Payment - only payment method available
router.post('/api/paymentcod', (req, res) => {
    ControllerPayments.PaymentCod(req, res);
});

// Get user's payment history
router.get('/api/payments', (req, res) => {
    ControllerPayments.getPayments(req, res);
});

// Get specific payment
router.get('/api/payment', (req, res) => {
    ControllerPayments.getPayment(req, res);
});

// Get all orders (for admin)
router.get('/api/dataorderuser', (req, res) => {
    ControllerPayments.GetOrderUser(req, res);
});

// Cancel an order
router.post('/api/cancelorder', (req, res) => {
    ControllerPayments.CancelOrder(req, res);
});

// Update order details
router.post('/api/updateorder', (req, res) => {
    ControllerPayments.UpdateOrder(req, res);
});

// Get revenue statistics
router.get('/api/revenue-statistics', (req, res) => {
    ControllerPayments.getRevenueStatistics(req, res);
});

// Get product statistics
router.get('/api/product-statistics', (req, res) => {
    ControllerPayments.getProductStatistics(req, res);
});

module.exports = router;
