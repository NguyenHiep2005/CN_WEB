const ProductsRoutes = require('./ProductsRoutes');
const UserRoute = require('./RoutesUser');
const ProductRoute = require('./ProductsRoutes');
const CartRoute = require('./RoutesCart');
const CategoryRoutes = require('./RoutesCategory');

const modelUser = require('../models/ModelUser');
const { jwtDecode } = require('jwt-decode');

function route(app) {
    // products
    app.get('/api/products', ProductsRoutes);
    app.post('/api/addproduct', ProductsRoutes);
    app.get('/api/product', ProductsRoutes);
    app.get('/api/search', ProductsRoutes);
    app.post('/api/editpro', ProductsRoutes);
    app.delete('/api/deleteproduct', ProductsRoutes);
    app.post('/api/editorder', ProductRoute);
    app.get('/api/similarproduct', ProductRoute);
    app.get('/api/refresh-token', UserRoute);

    // Categories
    app.get('/api/categories', CategoryRoutes);
    app.get('/api/category', CategoryRoutes);
    app.post('/api/category/create', CategoryRoutes);
    app.post('/api/category/update', CategoryRoutes);
    app.delete('/api/category/delete', CategoryRoutes);
    app.post('/api/category/update-order', CategoryRoutes);
    app.post('/api/category/apply-discount', CategoryRoutes);
    app.post('/api/category/remove-discount', CategoryRoutes);
    app.get('/api/category/discount-status', CategoryRoutes);

    // User
    app.post('/api/register', UserRoute);
    app.post('/api/login', UserRoute);
    app.get('/api/auth', UserRoute);
    app.post('/api/logout', UserRoute);
    app.post('/api/forgotpassword', UserRoute);
    app.post('/api/resetpassword', UserRoute);

    // payment - removed Momo and VNPay, only COD available

    // Cart
    app.post('/api/addtocart', CartRoute);
    app.get('/api/cart', CartRoute);
    app.post('/api/deletecart', CartRoute);
    app.post('/api/updatecart', CartRoute);
    app.post('/api/update-info-cart', CartRoute);

    //admin
    app.get('/api/getallorder', UserRoute);
    app.get('/api/getalluser', UserRoute);
    app.delete('/api/deleteuser', UserRoute);

    app.get('/api/admin', async (req, res, next) => {
        const token = req.cookies.Token;
        const decoded = jwtDecode(token);
        const findUser = await modelUser.findOne({ email: decoded.email });
        if (findUser.isAdmin === true) {
            return res.status(200).json({ message: 'Bạn có quyền truy cập' });
        } else {
            return res.status(403).json({ message: 'Bạn không có quyền truy cập' });
        }
    });
}

module.exports = route;
