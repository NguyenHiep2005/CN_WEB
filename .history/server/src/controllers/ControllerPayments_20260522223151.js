const axios = require('axios');
const ModelCart = require('../models/ModelCart');
const ModelPayment = require('../models/ModelPayment');
const ModelUser = require('../models/ModelUser');
const ModelProducts = require('../models/ModelProducts');
const { jwtDecode } = require('jwt-decode');

const sendMailOrder = require('../SendMail/SendMailOrder');

require('dotenv').config();

class ControllerPayments {
    async updateProductQuantity(products) {
        try {
            if (!products || products.length === 0) {
                return;
            }

            for (const product of products) {
                try {
                    // Find product in database
                    const productInDb = await ModelProducts.findOne({ name: product.nameProduct });
                    
                    if (!productInDb) {
                        console.warn(`Product not found: ${product.nameProduct}`);
                        continue;
                    }

                    if (!productInDb.sizes || productInDb.sizes.length === 0) {
                        console.warn(`No sizes found for product: ${product.nameProduct}`);
                        continue;
                    }

                    // Find matching size
                    const size = product.size ? String(product.size) : '';
                    const sizeIndex = productInDb.sizes.findIndex(s => 
                        String(s.size) === size
                    );
                    
                    if (sizeIndex === -1) {
                        console.warn(`Size ${size} not found for product: ${product.nameProduct}`);
                        continue;
                    }

                    // Reduce quantity
                    const quantity = parseInt(product.quantity) || 0;
                    productInDb.sizes[sizeIndex].quantity = Math.max(
                        0, 
                        (productInDb.sizes[sizeIndex].quantity || 0) - quantity
                    );
                    
                    // Save
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

    async getPayment(req, res) {
        try {
            const token = req.cookies;
            const decoded = jwtDecode(token.Token);
            const data = await ModelPayment.findOne({ user: decoded.email }).sort({ _id: 'desc' });
            res.status(200).json([data]);
        } catch (error) {
            console.error('Error in getPayment:', error);
            res.status(500).json({ message: 'Error retrieving payment' });
        }
    }

    async PaymentCod(req, res) {
        try {
            const token = req.cookies.Token;
            const { dataProducts: productsFromBody, email: emailFromBody } = req.body;
            let userEmail = '';

            if (token) {
                try {
                    const decoded = jwtDecode(token);
                    if (decoded && decoded.email) {
                        userEmail = decoded.email;
                    }
                } catch (err) {
                    console.log('Token decode error, will use email from body');
                }
            } else if (emailFromBody) {
                userEmail = emailFromBody;
            } else {
                return res.status(400).json({ message: 'Email is required' });
            }

            // Extract payment info from request
            const name = req.body.name;
            const phone = req.body.phone;
            const address = req.body.address;
            const province = req.body.province;
            const ward = req.body.ward;
            const notes = req.body.notes || '';

            // Validate required fields (district không bắt buộc)
            if (!address || !name || !phone || !province || !ward) {
                return res.status(400).json({ message: 'Bạn đang thiếu thông tin bắt buộc' });
            }

            // If buying now (single product)
            if (productsFromBody && productsFromBody.length > 0) {
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
                    province: province,
                    ward: ward,
                    notes: notes,
                    paymentMethod: 'COD',
                    phone: phone,
                    name: name,
                    username: name,
                });

                await newPayment.save();
                
                try {
                    await sendMailOrder(userEmail);
                } catch (err) {
                    console.error('Error sending mail:', err.message);
                }
                
                if (newPayment.products.length > 0) {
                    try {
                        await this.updateProductQuantity(newPayment.products);
                    } catch (err) {
                        console.error('Error updating product quantities:', err);
                    }
                }
                
                await ModelCart.deleteOne({ user: userEmail });
                return res.status(200).json({ message: 'Thanh Toán Thành Công !!!' });
            }

            // Payment from cart
            const cart = await ModelCart.findOne({ user: userEmail });
            if (!cart || cart.products.length === 0) {
                return res.status(400).json({ message: 'Giỏ hàng trống, vui lòng thêm sản phẩm' });
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
                province: province,
                ward: ward,
                notes: notes,
                paymentMethod: 'COD',
                phone: phone,
                name: name,
                username: name,
            });

            await newPayment.save();
            
            try {
                await sendMailOrder(userEmail);
            } catch (err) {
                console.error('Error sending mail:', err.message);
            }
            
            if (newPayment.products.length > 0) {
                try {
                    await this.updateProductQuantity(newPayment.products);
                } catch (err) {
                    console.error('Error updating product quantities:', err);
                }
            }
            
            await ModelCart.deleteOne({ user: userEmail });
            return res.status(200).json({ message: 'Thanh Toán Thành Công !!!' });
        } catch (error) {
            console.error('PaymentCod Error:', error);
            res.status(500).json({ message: 'Internal Server Error', error: error.message });
        }
    }

    async getPayments(req, res) {
        try {
            const token = req.cookies;
            const decoded = jwtDecode(token.Token);
            const data = await ModelPayment.find({ user: decoded.email });
            res.status(200).json(data);
        } catch (error) {
            console.error('Error in getPayments:', error);
            res.status(500).json({ message: 'Error retrieving payments' });
        }
    }

    async GetOrderUser(req, res) {
        try {
            const data = await ModelPayment.find({});
            const newData = data.map((item) => item.products);
            res.status(200).json(newData);
        } catch (error) {
            console.error('Error in GetOrderUser:', error);
            res.status(500).json({ message: 'Error retrieving orders' });
        }
    }

    async CancelOrder(req, res) {
        try {
            const token = req.cookies.Token;
            if (!token) {
                return res.status(401).json({ message: 'Không có token, vui lòng đăng nhập lại!' });
            }

            const decoded = jwtDecode(token);
            if (!decoded || !decoded.email) {
                return res.status(400).json({ message: 'Token không hợp lệ' });
            }

            const { id } = req.body;
            
            if (!id) {
                return res.status(400).json({ message: 'ID đơn hàng không hợp lệ!' });
            }

            const order = await ModelPayment.findById(id);
            if (!order) {
                return res.status(404).json({ message: 'Đơn hàng không tồn tại!' });
            }

            if (order.user !== decoded.email) {
                return res.status(403).json({ message: 'Bạn không có quyền hủy đơn hàng này!' });
            }

            if (order.tinhtrang === true) {
                return res.status(403).json({ message: 'Không thể hủy đơn hàng đã giao!' });
            }

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

            const order = await ModelPayment.findById(id);
            if (!order) {
                return res.status(404).json({ message: 'Đơn hàng không tồn tại' });
            }

            if (order.tinhtrang === true) {
                return res.status(403).json({ message: 'Không thể chỉnh sửa đơn hàng đã giao' });
            }

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
            const payments = await ModelPayment.find({});
            
            const weekStats = {};
            let totalOrders = 0;
            let totalRevenue = 0;

            for (let i = 0; i < 7; i++) {
                weekStats[i] = {
                    day: i,
                    quantity: 0,
                    revenue: 0,
                    dayName: ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'][i]
                };
            }

            const today = new Date();
            const currentDay = today.getDay();
            const daysFromMonday = currentDay === 0 ? 6 : currentDay - 1;
            const weekStart = new Date(today);
            weekStart.setDate(today.getDate() - daysFromMonday);
            weekStart.setHours(0, 0, 0, 0);

            const totalUserCount = await ModelUser.countDocuments({ isAdmin: false });

            payments.forEach(payment => {
                if (payment.trangthai === true || payment.tinhtrang === true) {
                    totalOrders++;
                }
            });

            payments.forEach(payment => {
                if (payment.trangthai !== true && payment.tinhtrang !== true) {
                    return;
                }

                const paymentDate = new Date(payment.createdAt);
                paymentDate.setHours(0, 0, 0, 0);

                if (paymentDate >= weekStart) {
                    const dayOfWeek = paymentDate.getDay();
                    const dayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

                    if (dayIndex >= 0 && dayIndex < 7) {
                        if (payment.products && payment.products.length > 0) {
                            const totalQuantity = payment.products.reduce((sum, p) => sum + (p.quantity || 0), 0);
                            weekStats[dayIndex].quantity += totalQuantity;
                        }

                        if (payment.products && payment.products.length > 0) {
                            const weekRevenue = payment.products.reduce((sum, p) => sum + (p.price * p.quantity || 0), 0);
                            weekStats[dayIndex].revenue += weekRevenue;
                            totalRevenue += weekRevenue;
                        }
                    }
                }
            });

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
            const payments = await ModelPayment.find({
                $or: [
                    { trangthai: true },
                    { tinhtrang: true }
                ]
            }).sort({ createdAt: 1 });

            const dailyStats = {};

            payments.forEach(payment => {
                const paymentDate = new Date(payment.createdAt);
                paymentDate.setHours(paymentDate.getHours() + 7);
                const dateKey = paymentDate.toISOString().split('T')[0];

                if (!dailyStats[dateKey]) {
                    dailyStats[dateKey] = {
                        date: dateKey,
                        products: []
                    };
                }

                if (payment.products && payment.products.length > 0) {
                    payment.products.forEach(product => {
                        const existingProduct = dailyStats[dateKey].products.find(p => p.nameProduct === product.nameProduct);
                        
                        if (existingProduct) {
                            existingProduct.quantity += product.quantity;
                        } else {
                            dailyStats[dateKey].products.push({
                                nameProduct: product.nameProduct,
                                quantity: product.quantity,
                                price: product.price,
                                img: product.img
                            });
                        }
                    });
                }
            });

            const result = Object.values(dailyStats);
            res.status(200).json(result);
        } catch (error) {
            console.error('Error in getProductStatistics:', error);
            res.status(500).json({ message: 'Lỗi lấy thống kê sản phẩm' });
        }
    }
}

module.exports = new ControllerPayments();
