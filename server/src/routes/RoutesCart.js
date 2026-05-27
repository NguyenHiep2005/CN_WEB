const express = require('express');
const router = express.Router();

const ControllerCart = require('../controllers/ControllerCart');

const middlewareController = require('../jwt/ControllerJWT');

router.post('/api/addtocart', middlewareController.verifyToken, ControllerCart.AddToCart);
router.post('/api/deletecart', middlewareController.verifyToken, ControllerCart.DeleteCart);
router.post('/api/updatecart', middlewareController.verifyToken, ControllerCart.UpdateCart);
router.get('/api/cart', middlewareController.verifyToken, ControllerCart.GetCart);
router.post('/api/update-info-cart', middlewareController.verifyToken, ControllerCart.updateInfoCart);

module.exports = router;
