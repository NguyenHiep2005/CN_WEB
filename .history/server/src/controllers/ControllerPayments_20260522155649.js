const axios = require('axios');
const crypto = require('crypto');
const ModelCart = require('../models/ModelCart');
const ModelPayment = require('../models/ModelPayment');
const ModelUser = require('../models/ModelUser');
const ModelProducts = require('../models/ModelProducts');
const ModelBuyNowPending = require('../models/ModelBuyNowPending');
const { jwtDecode } = require('jwt-decode');

const sendMailOrder = require('../SendMail/SendMailOrder');

const { VNPay, ignoreLogger, ProductCode, VnpLocale, dateFormat } = require('vnpay');

require('dotenv').config();

class ControllerPayments {
    async updateProductQuantity(products) {
        try {
            if (!products || products.length === 0) {
                return;
            }

            for (const product of products) {
                try {
                    // Tìm sản phẩm trong database
                    const productInDb = await ModelProducts.findOne({ name: product.nameProduct });
                    
                    if (!productInDb) {
                        console.warn(`Product not found: ${product.nameProduct}`);
                        continue;
                    }

                    if (!productInDb.sizes || productInDb.sizes.length === 0) {
                        console.warn(`No sizes found for product: ${product.nameProduct}`);
                        continue;
                    }

                    // Tìm size phù hợp - so sánh cả dạng string và number
                    const size = product.size ? String(product.size) : '';
                    const sizeIndex = productInDb.sizes.findIndex(s => 
                        String(s.size) === size
                    );
                    
                    if (sizeIndex === -1) {
                        console.warn(`Size ${size} not found for product: ${product.nameProduct}`);
                        continue;
                    }

                    // Giảm số lượng
                    const quantity = parseInt(product.quantity) || 0;
                    productInDb.sizes[sizeIndex].quantity = Math.max(
                        0, 
                        (productInDb.sizes[sizeIndex].quantity || 0) - quantity
                    );
                    
                    // Lưu lại
                    await productInDb.save();
                    console.log(`✓ Updated: ${product.nameProduct} (size: ${size}), remaining: ${productInDb.sizes[sizeIndex].quantity}`);
                } catch (err) {
                    console.error(`Error updating product quantity for ${product.nameProduct}:`, err.message);
                }
            }
        } catch (error) {
            console.error('Error in updateProductQuantity:', error);
        }
    }

    async restoreProductQuantity(products) {
        try {
            if (!products || products.length === 0) {
                return;
            }

            for (const product of products) {
                try {
                    // Tìm sản phẩm trong database
                    const productInDb = await ModelProducts.findOne({ name: product.nameProduct });
                    
                    if (!productInDb) {
                        console.warn(`Product not found for restore: ${product.nameProduct}`);
                        continue;
                    }

                    if (!productInDb.sizes || productInDb.sizes.length === 0) {
                        console.warn(`No sizes found for restore: ${product.nameProduct}`);
                        continue;
                    }

                    // Tìm size phù hợp - so sánh cả dạng string và number
                    const size = product.size ? String(product.size) : '';
                    const sizeIndex = productInDb.sizes.findIndex(s => 
                        String(s.size) === size
                    );
                    
                    if (sizeIndex === -1) {
                        console.warn(`Size ${size} not found for restore: ${product.nameProduct}`);
                        continue;
                    }

                    // Hoàn lại số lượng
                    const quantity = parseInt(product.quantity) || 0;
                    productInDb.sizes[sizeIndex].quantity = (productInDb.sizes[sizeIndex].quantity || 0) + quantity;
                    
                    // Lưu lại
                    await productInDb.save();
                    console.log(`✓ Restored: ${product.nameProduct} (size: ${size}), now: ${productInDb.sizes[sizeIndex].quantity}`);
                } catch (err) {
                    console.error(`Error restoring product quantity for ${product.nameProduct}:`, err.message);
                }
            }
        } catch (error) {
            console.error('Error in restoreProductQuantity:', error);
        }
    }

    async PaymentsMomo(req, res) {
        try {
            const token = req.cookies.Token;
            const { dataProducts: productsFromBody, email: emailFromBody } = req.body;
            let userEmail = '';

            if (token) {
                // If token exists, use email from token
                try {
                    const decoded = jwtDecode(token);
                    if (decoded && decoded.email) {
                        userEmail = decoded.email;
                    }
                } catch (err) {
                    console.log('Token decode error, will use email from body');
                }
            } else if (emailFromBody) {
                // If no token, use email from body
                userEmail = emailFromBody;
            } else {
                // No token and no email
                return res.status(400).json({ message: 'Email is required' });
            }

            // Lấy dữ liệu từ request body (cho mua ngay)
            let amount = 0;
            let pendingOrderId = null;

            // Nếu có dữ liệu từ mua ngay
            if (productsFromBody && productsFromBody.length > 0) {
                const name = req.body.name || '';
                const phone = req.body.phone || '';
                const address = req.body.address || '';

                if (!address || !name || !phone) {
                    return res.status(400).json({ message: 'Bạn đang thiếu thông tin' });
                }

                // Store buy now order data temporarily for Momo
                const buyNowOrder = new ModelBuyNowPending({
                    name: name,
                    phone: phone,
                    address: address,
                    products: productsFromBody.map((product) => ({
                        nameProduct: product.name || product.nameProduct,
                        quantity: product.quantity || 1,
                        price: product.price || product.priceProduct,
                        size: product.size || 0,
                        img: product.img || product.imgProduct,
                        type: product.type || 0,
                    })),
                    sumprice: productsFromBody.reduce((total, product) => total + (product.price * product.quantity), 0),
                    user: userEmail,
                    typePayments: 'MOMO',
                });
                await buyNowOrder.save();
                pendingOrderId = buyNowOrder._id.toString();

                amount = productsFromBody.reduce((total, product) => total + (product.price * product.quantity), 0);
            } else {
                // Nếu thanh toán từ giỏ hàng
                const dataCart = await ModelCart.findOne({ user: userEmail });
                if (!dataCart) {
                    return res.status(401).json({ message: 'Please add product to cart' });
                }

                const name = req.body.name || dataCart.name;
                const phone = req.body.phone || dataCart.phone;
                const address = req.body.address || dataCart.address;

                if (!address || !name || !phone) {
                    return res.status(400).json({ message: 'Bạn đang thiếu thông tin' });
                }

                amount = dataCart.sumprice;
            }

            const partnerCode = 'MOMO';
            const accessKey = 'F8BBA842ECF85';
            const secretKey = 'K951B6PE1waDMi640xX08PD3vg6EkVlz';
            const requestId = partnerCode + new Date().getTime();
            const orderId = requestId;
            // Pass pending order ID or email for callback
            const orderInfo = pendingOrderId || userEmail;
            const redirectUrl = `http://localhost:5001/api/checkdata`;
            const ipnUrl = `http://localhost:5001/api/checkdata`;
            const requestType = 'captureWallet';
            const extraData = req.body.address || '';

            const rawSignature = `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${partnerCode}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=${requestType}`;

            const signature = crypto.createHmac('sha256', secretKey).update(rawSignature).digest('hex');

            const requestBody = {
                partnerCode,
                accessKey,
                requestId,
                amount,
                orderId,
                orderInfo,
                redirectUrl,
                ipnUrl,
                extraData,
                requestType,
                signature,
                lang: 'en',
            };

            const response = await axios.post('https://test-payment.momo.vn/v2/gateway/api/create', requestBody, {
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            res.status(200).json(response.data);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Internal Server Error' });
        }
    }

    async paymentVnpay(req, res) {
        try {
            const token = req.cookies.Token;
            const { dataProducts: productsFromBody, email: emailFromBody } = req.body;
            let userEmail = '';

            if (token) {
                // If token exists, use email from token
                try {
                    const decoded = jwtDecode(token);
                    if (decoded && decoded.email) {
                        userEmail = decoded.email;
                    }
                } catch (err) {
                    console.log('Token decode error, will use email from body');
                }
            } else if (emailFromBody) {
                // If no token, use email from body
                userEmail = emailFromBody;
            } else {
                // No token and no email
                return res.status(400).json({ message: 'Email is required' });
            }

            // Lấy dữ liệu từ request body (cho mua ngay)
            const { dataProducts: productsFromBody2 } = req.body;
            let amount = 0;
            let orderId = '';

            // Nếu có dữ liệu từ mua ngay
            if (productsFromBody && productsFromBody.length > 0) {
                const name = req.body.name || '';
                const phone = req.body.phone || '';
                const address = req.body.address || '';

                if (!address || !name || !phone) {
                    return res.status(400).json({ message: 'Bạn đang thiếu thông tin' });
                }

                // Store buy now order data temporarily
                const buyNowOrder = new ModelBuyNowPending({
                    name: name,
                    phone: phone,
                    address: address,
                    products: productsFromBody.map((product) => ({
                        nameProduct: product.name || product.nameProduct,
                        quantity: product.quantity || 1,
                        price: product.price || product.priceProduct,
                        size: product.size || 0,
                        img: product.img || product.imgProduct,
                        type: product.type || 0,
                    })),
                    sumprice: productsFromBody.reduce((total, product) => total + (product.price * product.quantity), 0),
                    user: userEmail,
                    typePayments: 'VNPAY',
                });
                await buyNowOrder.save();
                
                amount = productsFromBody.reduce((total, product) => total + (product.price * product.quantity), 0);
                orderId = buyNowOrder._id.toString();
            } else {
                // Nếu thanh toán từ giỏ hàng
                const dataCart = await ModelCart.findOne({ user: userEmail });
                if (!dataCart) {
                    return res.status(401).json({ message: 'Please add product to cart' });
                }
                if (!dataCart.address || !dataCart.name || !dataCart.phone) {
                    return res.status(403).json({ message: 'Bạn đang thiếu thông tin' });
                }

                amount = dataCart.sumprice;
                orderId = dataCart._id;
            }

            const vnpay = new VNPay({
                tmnCode: 'DH2F13SW',
                secureSecret: 'NXZM3DWFR0LC4R5VBK85OJZS1UE9KI6F',
                vnpayHost: 'https://sandbox.vnpayment.vn',
                testMode: true, // tùy chọn
                hashAlgorithm: 'SHA512', // tùy chọn
                loggerFn: ignoreLogger, // tùy chọn
            });
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const vnpayResponse = await vnpay.buildPaymentUrl({
                vnp_Amount: amount,
                vnp_IpAddr: '127.0.0.1',
                vnp_TxnRef: orderId,
                vnp_OrderInfo: `${orderId}`,
                vnp_OrderType: ProductCode.Other,
                vnp_ReturnUrl: `http://localhost:5001/api/check-payment-vnpay`,
                vnp_Locale: VnpLocale.VN,
                vnp_CreateDate: dateFormat(new Date()),
                vnp_ExpireDate: dateFormat(tomorrow),
            });

            return res.status(201).json({ vnpayResponse });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Lỗi tạo thanh toán VNPay' });
        }
    }

    async checkPaymentVnpay(req, res) {
        try {
            const { vnp_ResponseCode, vnp_OrderInfo } = req.query;
            if (vnp_ResponseCode === '00') {
                // Check if it's a MongoDB ObjectId (buy now) or cart ID
                // MongoDB ObjectId is 24 hex characters
                const isBuyNow = vnp_OrderInfo.match(/^[0-9a-f]{24}$/) && !vnp_OrderInfo.includes('BUYNOW');
                
                if (!isBuyNow) {
                    // Payment từ cart
                    try {
                        const idCart = vnp_OrderInfo;
                        const findCart = await ModelCart.findOne({ _id: idCart });

                        if (!findCart) {
                            return res.redirect(`http://localhost:3000/paymentsuccess`);
                        }

                        const newPayment = new ModelPayment({
                            products: findCart.products,
                            address: findCart.address,
                            phone: findCart.phone,
                            name: findCart.name || '',
                            typePayments: 'VNPAY',
                            username: findCart.username,
                            sumprice: findCart.sumprice,
                            tinhtrang: false,
                            trangthai: true,
                            user: findCart.user,
                        });
                        await newPayment.save();
                        
                        // Send email (non-blocking - don't fail payment if email fails)
                        try {
                            await sendMailOrder(findCart.user);
                        } catch (err) {
                            console.error('Error sending mail:', err.message);
                        }
                        
                        // Giảm số lượng sản phẩm
                        if (newPayment.products.length > 0) {
                            try {
                                await this.updateProductQuantity(newPayment.products);
                            } catch (err) {
                                console.error('Error updating product quantities:', err);
                            }
                        }
                        
                        await findCart.deleteOne();
                        return res.redirect(`http://localhost:3000/paymentsuccess`);
                    } catch (err) {
                        console.error('Error processing cart payment:', err);
                        return res.redirect(`http://localhost:3000/paymentsuccess`);
                    }
                } else {
                    // Payment từ mua ngay - retrieve from pending collection
                    try {
                        const pendingOrder = await ModelBuyNowPending.findById(vnp_OrderInfo);
                        
                        if (!pendingOrder) {
                            console.error('Pending order not found:', vnp_OrderInfo);
                            return res.redirect(`http://localhost:3000/paymentsuccess`);
                        }

                        const newPayment = new ModelPayment({
                            products: pendingOrder.products,
                            address: pendingOrder.address,
                            phone: pendingOrder.phone,
                            name: pendingOrder.name || '',
                            typePayments: 'VNPAY',
                            username: pendingOrder.name,
                            sumprice: pendingOrder.sumprice,
                            tinhtrang: false,
                            trangthai: true,
                            user: pendingOrder.user,
                        });
                        await newPayment.save();
                        
                        // Send email (non-blocking - don't fail payment if email fails)
                        try {
                            await sendMailOrder(pendingOrder.user);
                        } catch (err) {
                            console.error('Error sending mail:', err.message);
                        }
                        
                        // Giảm số lượng sản phẩm
                        if (newPayment.products.length > 0) {
                            try {
                                await this.updateProductQuantity(newPayment.products);
                            } catch (err) {
                                console.error('Error updating product quantities:', err);
                            }
                        }
                        
                        await ModelBuyNowPending.deleteOne({ _id: vnp_OrderInfo });
                        return res.redirect(`http://localhost:3000/paymentsuccess`);
                    } catch (err) {
                        console.error('Error processing buy now payment:', err);
                        return res.redirect(`http://localhost:3000/paymentsuccess`);
                    }
                }
            } else {
                return res.redirect(`http://localhost:3000/payments`);
            }
        } catch (error) {
            console.error('Error in checkPaymentVnpay:', error);
            return res.redirect(`http://localhost:3000/paymentsuccess`);
        }
    }

    async checkData(req, res) {
        try {
            const orderInfo = req.query.orderInfo;
            const amount = req.query.amount;
            const address = req.query.extraData;

            if (req.query.resultCode === '1006') {
                return res.redirect(`${process.env.REACT_APP_URL_DOMAIN}/payments`);
            }

            if (!orderInfo) {
                return res.status(400).json({ message: 'Invalid order info' });
            }

            let products = [];
            let phone = '';
            let username = '';
            let userEmail = '';
            let isBuyNow = false;

            // Kiểm tra xem orderInfo có phải là MongoDB ObjectId không (24 hex characters)
            const isObjectId = orderInfo.match(/^[0-9a-f]{24}$/i);

            if (isObjectId) {
                // Đây là mua ngay - lấy dữ liệu từ ModelBuyNowPending
                try {
                    const pendingOrder = await ModelBuyNowPending.findById(orderInfo);
                    
                    if (!pendingOrder) {
                        console.error('Pending order not found:', orderInfo);
                        return res.redirect(`${process.env.REACT_APP_URL_DOMAIN}/paymentsuccess`);
                    }

                    products = pendingOrder.products.map((product) => ({
                        nameProduct: product.nameProduct,
                        quantity: product.quantity,
                        price: product.price,
                        size: product.size,
                        img: product.img,
                        type: product.type,
                    }));
                    phone = pendingOrder.phone;
                    username = pendingOrder.name;
                    userEmail = pendingOrder.user;
                    isBuyNow = true;
                    
                    console.log('✓ Momo buy-now order found:', orderInfo);
                } catch (err) {
                    console.error('Error retrieving pending order:', err);
                    return res.redirect(`${process.env.REACT_APP_URL_DOMAIN}/paymentsuccess`);
                }
            } else {
                // Đây là thanh toán từ cart - lấy dữ liệu từ cart
                userEmail = orderInfo;
                const dataUser = await ModelUser.findOne({ email: userEmail });
                const cart = await ModelCart.findOne({ user: userEmail });

                if (cart && cart.products.length > 0) {
                    products = cart.products.map((product) => ({
                        nameProduct: product.nameProduct,
                        quantity: product.quantity,
                        price: product.price,
                        size: product.size,
                        img: product.img,
                        type: product.type,
                    }));
                    phone = cart.phone;
                } else {
                    phone = '';
                }

                username = dataUser ? dataUser.fullname : '';
                
                // Xóa cart nếu tồn tại
                if (cart) {
                    await ModelCart.deleteOne({ user: userEmail });
                }
            }

            const lastPayment = await ModelPayment.findOne({ user: userEmail }).sort({ id: -1 });
            const newProductId = lastPayment && lastPayment.id !== undefined ? lastPayment.id + 1 : 0;

            const newPayment = new ModelPayment({
                id: newProductId,
                products: products,
                sumprice: amount,
                tinhtrang: false,
                trangthai: true,
                user: userEmail,
                address: address,
                phone: phone,
                name: username || '',
                username: username,
            });

            await newPayment.save();
            
            // Send email (non-blocking - don't fail payment if email fails)
            try {
                await sendMailOrder(userEmail);
            } catch (err) {
                console.error('Error sending mail:', err.message);
            }
            
            // Giảm số lượng sản phẩm
            if (products.length > 0) {
                try {
                    await this.updateProductQuantity(products);
                    console.log('✓ Product quantities updated successfully');
                } catch (err) {
                    console.error('Error updating product quantities:', err);
                }
            }
            
            // Xóa pending order nếu đây là mua ngay
            if (isBuyNow) {
                try {
                    await ModelBuyNowPending.deleteOne({ _id: orderInfo });
                    console.log('✓ Pending order deleted:', orderInfo);
                } catch (err) {
                    console.error('Error deleting pending order:', err);
                }
            }

            res.redirect(`${process.env.REACT_APP_URL_DOMAIN}/paymentsuccess`);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Internal Server Error' });
        }
    }

    async getPayment(req, res) {
        const token = req.cookies;
        const decoded = jwtDecode(token.Token);
        ModelPayment.findOne({ user: decoded.email })
            .sort({ _id: 'desc' })
            .then((data) => res.status(200).json([data]));
    }
    async PaymentCod(req, res) {
        try {
            const token = req.cookies.Token;
            const { dataProducts: productsFromBody, email: emailFromBody } = req.body;
            let userEmail = '';

            if (token) {
                // If token exists, use email from token
                try {
                    const decoded = jwtDecode(token);
                    if (decoded && decoded.email) {
                        userEmail = decoded.email;
                    }
                } catch (err) {
                    console.log('Token decode error, will use email from body');
                }
            } else if (emailFromBody) {
                // If no token, use email from body
                userEmail = emailFromBody;
            } else {
                // No token and no email
                return res.status(400).json({ message: 'Email is required' });
            }

            // Lấy dữ liệu từ request body (cho mua ngay)
            
            // Nếu có dữ liệu từ mua ngay
            if (productsFromBody && productsFromBody.length > 0) {
                const name = req.body.name;
                const phone = req.body.phone;
                const address = req.body.address;

                if (!address || !name || !phone) {
                    return res.status(400).json({ message: 'Bạn đang thiếu thông tin' });
                }

                const sumprice = productsFromBody.reduce((total, product) => total + (product.price * product.quantity), 0);

                const newPayment = new ModelPayment({
                    products: productsFromBody.map((product) => ({
                        nameProduct: product.name || product.nameProduct,
                        quantity: product.quantity || 1,
                        price: product.price || product.priceProduct,
                        size: product.size || 0,
                        img: product.img || product.imgProduct,
                        type: product.type || 0,
                    })),
                    sumprice: sumprice,
                    tinhtrang: false,
                    trangthai: false,
                    user: userEmail,
                    address: address,
                    phone: phone,
                    name: name,
                    username: name,
                });

                await newPayment.save();
                
                // Send email (non-blocking - don't fail payment if email fails)
                try {
                    await sendMailOrder(userEmail);
                } catch (err) {
                    console.error('Error sending mail:', err.message);
                }
                
                // Giảm số lượng sản phẩm
                if (newPayment.products.length > 0) {
                    try {
                        await this.updateProductQuantity(newPayment.products);
                    } catch (err) {
                        console.error('Error updating product quantities:', err);
                    }
                }
                
                // Delete cart after successful payment for buy now
                await ModelCart.deleteOne({ user: userEmail });
                return res.status(200).json({ message: 'Thanh Toán Thành Công !!!' });
            }

            // Nếu thanh toán từ giỏ hàng
            const cart = await ModelCart.findOne({ user: userEmail });
            if (!cart || cart.products.length === 0) {
                return res.status(404).json({ message: 'Cart is empty' });
            }

            // Lấy dữ liệu từ request body hoặc từ cart
            const name = req.body.name || cart.name;
            const phone = req.body.phone || cart.phone;
            const address = req.body.address || cart.address;

            if (!address || !name || !phone) {
                return res.status(400).json({ message: 'Bạn đang thiếu thông tin' });
            }

            const sumprice = cart.products.reduce((total, product) => total + product.price * product.quantity, 0);

            const newPayment = new ModelPayment({
                products: cart.products.map((product) => ({
                    nameProduct: product.nameProduct,
                    quantity: product.quantity,
                    price: product.price,
                    size: product.size,
                    img: product.img,
                    type: product.type,
                })),
                sumprice: sumprice,
                tinhtrang: false,
                trangthai: false,
                user: userEmail,
                address: address,
                phone: phone,
                name: cart.name || name || '',
                username: name,
            });

            await newPayment.save();
            
            // Send email (non-blocking - don't fail payment if email fails)
            try {
                await sendMailOrder(userEmail);
            } catch (err) {
                console.error('Error sending mail:', err.message);
            }
            
            // Giảm số lượng sản phẩm
            if (newPayment.products.length > 0) {
                try {
                    await this.updateProductQuantity(newPayment.products);
                } catch (err) {
                    console.error('Error updating product quantities:', err);
                }
            }
            
            await ModelCart.deleteOne({ user: userEmail });
            res.status(200).json({ message: 'Thanh Toán Thành Công !!!' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Internal Server Error' });
        }
    }

    async getPayments(req, res) {
        const token = req.cookies;
        const decoded = jwtDecode(token.Token);
        ModelPayment.find({ user: decoded.email }).then((data) => res.status(200).json(data));
    }

    async GetOrderUser(req, res) {
        ModelPayment.find({}).then((data) => {
            const newData = data.map((item) => item.products);
            return res.status(200).json(newData);
        });
    }

    async CancelOrder(req, res) {
        try {
            // Verify token
            const token = req.cookies.Token;
            if (!token) {
                return res.status(401).json({ message: 'Không có token, vui lòng đăng nhập lại!' });
            }

            const decoded = jwtDecode(token);
            if (!decoded || !decoded.email) {
                return res.status(400).json({ message: 'Token không hợp lệ' });
            }

            const { id } = req.body;
            
            // Validate id
            if (!id) {
                return res.status(400).json({ message: 'ID đơn hàng không hợp lệ!' });
            }

            // Check if order exists and belongs to user
            const order = await ModelPayment.findById(id);
            if (!order) {
                return res.status(404).json({ message: 'Đơn hàng không tồn tại!' });
            }

            if (order.user !== decoded.email) {
                return res.status(403).json({ message: 'Bạn không có quyền hủy đơn hàng này!' });
            }

            // Check if order is already shipped
            if (order.tinhtrang === true) {
                return res.status(403).json({ message: 'Không thể hủy đơn hàng đã giao!' });
            }

            // Hoàn lại số lượng sản phẩm trước khi xóa đơn hàng
            if (order.products && order.products.length > 0) {
                try {
                    await this.restoreProductQuantity(order.products);
                } catch (err) {
                    console.error('Error restoring product quantities:', err);
                }
            }

            // Delete the order
            const result = await ModelPayment.deleteOne({ _id: id });
            
            if (result.deletedCount === 0) {
                return res.status(400).json({ message: 'Không thể hủy đơn hàng!' });
            }

            return res.status(200).json({ message: 'Hủy đơn hàng thành công !!!' });
        } catch (error) {
            console.error('Error in CancelOrder:', error);
            return res.status(500).json({ message: 'Có lỗi xảy ra khi hủy đơn hàng!', error: error.message });
        }
    }

    async UpdateOrder(req, res) {
        try {
            const { id, name, phone, address } = req.body;

            if (!id || !name || !phone || !address) {
                return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin' });
            }

            // Check if order exists and is not yet shipped
            const order = await ModelPayment.findById(id);
            if (!order) {
                return res.status(404).json({ message: 'Đơn hàng không tồn tại' });
            }

            if (order.tinhtrang === true) {
                return res.status(403).json({ message: 'Không thể chỉnh sửa đơn hàng đã giao' });
            }

            // Update order
            const updatedOrder = await ModelPayment.findByIdAndUpdate(
                id,
                { name, phone, address },
                { new: true }
            );

            return res.status(200).json({
                message: 'Cập nhật đơn hàng thành công',
                data: updatedOrder,
            });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Lỗi cập nhật đơn hàng' });
        }
    }

    async getRevenueStatistics(req, res) {
        try {
            // Get all payments
            const payments = await ModelPayment.find({});
            
            console.log(`Total payments in DB: ${payments.length}`);
            
            // Initialize statistics
            const weekStats = {};
            let totalOrders = 0;
            let totalRevenue = 0;

            // Initialize week days (0 = Monday, 6 = Sunday)
            for (let i = 0; i < 7; i++) {
                weekStats[i] = {
                    day: i,
                    quantity: 0,
                    revenue: 0,
                    dayName: ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'][i]
                };
            }

            // Get today's date and calculate week start
            const today = new Date();
            const currentDay = today.getDay(); // 0 = Sunday, 1 = Monday
            const daysFromMonday = currentDay === 0 ? 6 : currentDay - 1;
            const weekStart = new Date(today);
            weekStart.setDate(today.getDate() - daysFromMonday);
            weekStart.setHours(0, 0, 0, 0);

            console.log(`Week start: ${weekStart}, Today: ${today}`);

            // Get total users count from database (excluding admin)
            const totalUserCount = await ModelUser.countDocuments({ isAdmin: false });
            console.log(`Total users (non-admin): ${totalUserCount}`);

            // Count total orders (all time)
            // Count orders that are paid (trangthai === true) OR delivered (tinhtrang === true)
            payments.forEach(payment => {
                // Count total orders: those that are paid OR delivered
                if (payment.trangthai === true || payment.tinhtrang === true) {
                    totalOrders++;
                }
            });

            // Second pass: Calculate weekly stats for paid/delivered orders only
            payments.forEach(payment => {
                // Only process orders that are paid OR delivered
                if (payment.trangthai !== true && payment.tinhtrang !== true) {
                    return;
                }

                const paymentDate = new Date(payment.createdAt);
                paymentDate.setHours(0, 0, 0, 0);

                // Check if payment is within current week
                if (paymentDate >= weekStart) {
                    const dayOfWeek = paymentDate.getDay();
                    const dayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Convert Sunday to 6

                    if (dayIndex >= 0 && dayIndex < 7) {
                        // Count quantity
                        if (payment.products && payment.products.length > 0) {
                            const totalQuantity = payment.products.reduce((sum, p) => sum + (p.quantity || 0), 0);
                            weekStats[dayIndex].quantity += totalQuantity;
                        }

                        // Add revenue (sum price of all products)
                        if (payment.products && payment.products.length > 0) {
                            const weekRevenue = payment.products.reduce((sum, p) => sum + (p.price * p.quantity || 0), 0);
                            weekStats[dayIndex].revenue += weekRevenue;
                            totalRevenue += weekRevenue;
                        }
                    }
                }
            });

            console.log(`Total orders (paid or delivered): ${totalOrders}, Total revenue: ${totalRevenue}`);

            // Prepare response
            const weekData = Object.values(weekStats).map(stat => ({
                day: stat.dayName,
                quantity: stat.quantity,
                revenue: stat.revenue
            }));

            res.status(200).json({
                overview: {
                    users: totalUserCount,
                    orders: totalOrders,
                    revenue: totalRevenue
                },
                weekData: weekData
            });
        } catch (error) {
            console.error('Error in getRevenueStatistics:', error);
            res.status(500).json({ message: 'Lỗi lấy thống kê doanh thu' });
        }
    }

    async getProductStatistics(req, res) {
        try {
            // Get all payments that are paid or delivered
            const payments = await ModelPayment.find({
                $or: [
                    { trangthai: true },
                    { tinhtrang: true }
                ]
            }).sort({ createdAt: 1 });

            console.log(`Total paid/delivered orders: ${payments.length}`);

            // Group by date and collect product details
            const dailyStats = {};

            payments.forEach(payment => {
                const paymentDate = new Date(payment.createdAt);
                // Adjust for Vietnam timezone (UTC+7)
                paymentDate.setHours(paymentDate.getHours() + 7);
                const dateKey = paymentDate.toISOString().split('T')[0]; // YYYY-MM-DD format

                if (!dailyStats[dateKey]) {
                    dailyStats[dateKey] = {
                        date: dateKey,
                        products: []
                    };
                }

                // Add each product from this order
                if (payment.products && payment.products.length > 0) {
                    payment.products.forEach(product => {
                        dailyStats[dateKey].products.push({
                            nameProduct: product.nameProduct || 'Unknown',
                            size: product.size || 'N/A',
                            quantity: product.quantity || 0,
                            price: product.price || 0,
                            orderId: payment._id
                        });
                    });
                }
            });

            // Convert to array and sort by date descending
            const statsArray = Object.values(dailyStats).sort((a, b) => {
                return new Date(b.date) - new Date(a.date);
            });

            console.log(`Total days with sales: ${statsArray.length}`);

            res.status(200).json({
                success: true,
                totalDays: statsArray.length,
                data: statsArray
            });
        } catch (error) {
            console.error('Error in getProductStatistics:', error);
            res.status(500).json({ message: 'Lỗi lấy thống kê sản phẩm' });
        }
    }
}

module.exports = new ControllerPayments();
