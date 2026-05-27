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
                    // Lấy tên sản phẩm và loại bỏ khoảng trắng
                    const productName = product.nameProduct ? String(product.nameProduct).trim() : '';
                    
                    console.log(`[updateProductQuantity] Processing: ${productName}, Size: ${product.size}, Qty: ${product.quantity}`);

                    // Tìm sản phẩm trong database - flexible matching
                    let productInDb = await ModelProducts.findOne({ 
                        name: { $regex: `^${productName}$`, $options: 'i' }
                    });
                    
                    if (!productInDb) {
                        console.warn(`[updateProductQuantity] Product not found: ${productName}`);
                        // Thử tìm lại bằng exact match không case-sensitive
                        const allProducts = await ModelProducts.find({});
                        const found = allProducts.find(p => p.name && p.name.trim().toLowerCase() === productName.toLowerCase());
                        if (!found) {
                            console.warn(`[updateProductQuantity] Even after retry, product not found: ${productName}`);
                            continue;
                        }
                        productInDb = found;
                    }

                    if (!productInDb.sizes || productInDb.sizes.length === 0) {
                        console.warn(`[updateProductQuantity] No sizes found for product: ${productName}`);
                        continue;
                    }

                    // Tìm size phù hợp - so sánh cả dạng string và number
                    const size = product.size ? String(product.size).trim() : '';
                    const sizeIndex = productInDb.sizes.findIndex(s => 
                        String(s.size).trim() === size
                    );
                    
                    if (sizeIndex === -1) {
                        console.warn(`[updateProductQuantity] Size ${size} not found for product: ${productName}`);
                        console.warn(`[updateProductQuantity] Available sizes:`, productInDb.sizes.map(s => s.size));
                        continue;
                    }

                    // Giảm số lượng
                    const quantity = parseInt(product.quantity) || 0;
                    const oldQty = productInDb.sizes[sizeIndex].quantity || 0;
                    productInDb.sizes[sizeIndex].quantity = Math.max(0, oldQty - quantity);
                    
                    // Lưu lại
                    await productInDb.save();
                    console.log(`✓ [updateProductQuantity] Updated: ${productName} (size: ${size}), ${oldQty} -> ${productInDb.sizes[sizeIndex].quantity}`);
                } catch (err) {
                    console.error(`[updateProductQuantity] Error for ${product.nameProduct}:`, err.message);
                }
            }
        } catch (error) {
            console.error('[updateProductQuantity] Error:', error);
        }
    }

    async restoreProductQuantity(products) {
        try {
            if (!products || products.length === 0) {
                return;
            }

            for (const product of products) {
                try {
                    // Lấy tên sản phẩm và loại bỏ khoảng trắng
                    const productName = product.nameProduct ? String(product.nameProduct).trim() : '';
                    
                    console.log(`[restoreProductQuantity] Processing: ${productName}, Size: ${product.size}, Qty: ${product.quantity}`);

                    // Tìm sản phẩm trong database - flexible matching
                    let productInDb = await ModelProducts.findOne({ 
                        name: { $regex: `^${productName}$`, $options: 'i' }
                    });
                    
                    if (!productInDb) {
                        console.warn(`[restoreProductQuantity] Product not found: ${productName}`);
                        // Thử tìm lại bằng exact match không case-sensitive
                        const allProducts = await ModelProducts.find({});
                        const found = allProducts.find(p => p.name && p.name.trim().toLowerCase() === productName.toLowerCase());
                        if (!found) {
                            console.warn(`[restoreProductQuantity] Even after retry, product not found: ${productName}`);
                            continue;
                        }
                        productInDb = found;
                    }

                    if (!productInDb.sizes || productInDb.sizes.length === 0) {
                        console.warn(`[restoreProductQuantity] No sizes found for restore: ${productName}`);
                        continue;
                    }

                    // Tìm size phù hợp - so sánh cả dạng string và number
                    const size = product.size ? String(product.size).trim() : '';
                    const sizeIndex = productInDb.sizes.findIndex(s => 
                        String(s.size).trim() === size
                    );
                    
                    if (sizeIndex === -1) {
                        console.warn(`[restoreProductQuantity] Size ${size} not found for restore: ${productName}`);
                        console.warn(`[restoreProductQuantity] Available sizes:`, productInDb.sizes.map(s => s.size));
                        continue;
                    }

                    // Hoàn lại số lượng
                    const quantity = parseInt(product.quantity) || 0;
                    const oldQty = productInDb.sizes[sizeIndex].quantity || 0;
                    productInDb.sizes[sizeIndex].quantity = oldQty + quantity;
                    
                    // Lưu lại
                    await productInDb.save();
                    console.log(`✓ [restoreProductQuantity] Restored: ${productName} (size: ${size}), ${oldQty} -> ${productInDb.sizes[sizeIndex].quantity}`);
                } catch (err) {
                    console.error(`[restoreProductQuantity] Error for ${product.nameProduct}:`, err.message);
                }
            }
        } catch (error) {
            console.error('[restoreProductQuantity] Error:', error);
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

            // Nếu thanh toán từ giỏ hàng
            const cart = await ModelCart.findOne({ user: userEmail });
            if (!cart || cart.products.length === 0) {
                return res.status(404).json({ message: 'Cart is empty' });
            }

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
            res.status(200).json({ message: 'Thanh Toán Thành Công !!!' });
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

            // Hoàn lại số lượng sản phẩm
            if (order.products && order.products.length > 0) {
                try {
                    await this.restoreProductQuantity(order.products);
                } catch (err) {
                    console.error('Error restoring product quantities:', err);
                }
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

            return res.status(200).json({
                weekData,
                totalOrders,
                totalRevenue,
                totalUserCount
            });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Lỗi lấy dữ liệu thống kê' });
        }
    }

    async getProductStatistics(req, res) {
        try {
            const payments = await ModelPayment.find({});
            const productStats = {};

            payments.forEach(payment => {
                if (payment.products && payment.products.length > 0) {
                    payment.products.forEach(product => {
                        const productName = product.nameProduct;
                        if (!productStats[productName]) {
                            productStats[productName] = {
                                name: productName,
                                quantity: 0,
                                revenue: 0
                            };
                        }
                        productStats[productName].quantity += product.quantity || 0;
                        productStats[productName].revenue += (product.price * product.quantity) || 0;
                    });
                }
            });

            const data = Object.values(productStats);
            return res.status(200).json(data);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Lỗi lấy dữ liệu thống kê sản phẩm' });
        }
    }
}

module.exports = new ControllerPayments();
