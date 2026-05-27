const ModelProducts = require('../models/ModelProducts');
const modelProducts = require('../models/ModelProducts');
const ModelPayment = require('../models/ModelPayment');
var slugify = require('slugify');
var fs = require('fs/promises');
const path = require('path');

const mongoose = require('mongoose');

class controllerProducts {
    AddProducts(req, res, next) {
        const { nameProduct, priceProduct, description, checkType, brand, sizes } = req.body;
        const imgUrls = req.files.map((file) => `images/products/uploads/${file.filename}`);
        const slug = slugify(nameProduct, '-', {
            replacement: '-',
            remove: undefined,
            lower: false,
            strict: false,
            locale: 'vi',
            trim: true,
        });
        const newProducts = new modelProducts({
            name: nameProduct,
            price: priceProduct,
            description: description,
            slug,
            img: imgUrls,
            type: checkType,
            brand: brand,
            sizes: sizes ? JSON.parse(sizes) : [],
        });
        newProducts.save();
        res.status(200).json({ message: 'Thêm sản phẩm thành công' });
    }

        modelProducts.find({}).then((dataProduct) => {
            return res.status(200).json(dataProduct);
        });
    }
    async GetOneProducts(req, res) {
        try {
            const id = req.query.id;
            const dataProduct = await modelProducts.findOne({ _id: id });
            if (!dataProduct) {
                return res.status(200).json([]);
            }
            return res.status(200).json([dataProduct]);
        } catch (error) {}
    }
    async SearchProduct(req, res) {
        try {
            const { nameProduct } = req.query;
            if (!nameProduct || nameProduct.trim() === '' || nameProduct === 'undefined') {
                return res.status(200).json([]);
            }

            const dataProducts = await modelProducts.find({ name: { $regex: nameProduct, $options: 'i' } });
            if (!dataProducts) {
                return res.status(200).json([]);
            }
            const validProducts = dataProducts.filter((product) => mongoose.Types.ObjectId.isValid(product._id));

            if (validProducts.length === 0) {
                return res.status(200).json([]);
            }

            return res.status(200).json(validProducts);
        } catch (error) {
            console.error('Lỗi tìm kiếm sản phẩm:', error);
            return res.status(500).json({ message: 'Lỗi server, vui lòng thử lại sau' });
        }
    }
    async EditPro(req, res) {
        try {
            const { id, nameProduct, priceProduct, description } = req.body;
            ModelProducts.findOne({ _id: id }).then((data) => {
                if (data) {
                    data.updateOne({
                        name: nameProduct,
                        price: priceProduct,
                        description: description,
                    }).then(() => res.status(200).json({ message: 'Cập Nhật Thành Công !!!' }));
                }
            });
        } catch (error) {
            console.log(error);
        }
    }
    async deletePro(req, res) {
        try {
            const { id } = req.query;
            const dataPro = await modelProducts.findOne({ _id: id });

            console.log(id);

            if (!dataPro) {
                return res.status(404).json({ message: 'Sản phẩm không tồn tại!' });
            }

            // Lấy danh sách ảnh từ sản phẩm
            const arrayImg = dataPro.img || [];
            const filePaths = arrayImg.map((item) => path.join(__dirname, '../uploads', item));

            // Xóa sản phẩm trong database
            await modelProducts.deleteOne({ _id: id });

            // Xóa từng file ảnh trong thư mục uploads
            await Promise.all(filePaths.map((file) => fs.unlink(file).catch(() => {})));

            return res.status(200).json({ message: 'Xóa thành công!' });
        } catch (error) {
            return res.status(500).json({ message: 'Lỗi server!', error });
        }
    }

    async EditOrder(req, res) {
        const id = req.body.id;

        const dataOrder = await ModelPayment.findOne({ _id: id });

        if (dataOrder) {
            dataOrder
                .updateOne({ tinhtrang: req.body.valueOption === 0 ? false : true })
                .then(() => res.status(200).json({ message: 'Cập Nhật Thành Công !!!' }));
        } else {
            return;
        }
    }
    async SimilarProduct(req, res) {
        try {
            console.log("=====================================");
            console.log("1. Có người vừa gọi API SimilarProduct!");
            console.log("2. Dữ liệu Frontend gửi lên (req.query) là:", req.query);
            
            const { name, id } = req.query;
            
            if (!name || typeof name !== 'string' || name.trim() === '') {
                console.log("❌ 3. LỖI: Biến 'name' bị rỗng hoặc không tồn tại. Đã trả về []");
                return res.status(200).json([]);
            }
            
            console.log(`🔎 4. Đang tìm trong DB các giày có tên chứa chữ: "${name.trim()}"`);
            console.log(`🚫 5. Và loại trừ giày có ID là: "${id}"`);
            
            const dataProducts = await modelProducts.find({ 
                name: { $regex: name.trim(), $options: 'i' },
                _id: { $ne: id }
            }).limit(10);
            
            console.log("✅ 6. Số lượng sản phẩm tìm thấy trong DB:", dataProducts.length);
            console.log("=====================================");
            
            if (dataProducts.length <= 0) {
                return res.status(200).json([]);
            }
            
            return res.status(200).json(dataProducts);
        } catch (error) {
            console.error('❌ Lỗi Sever ở SimilarProduct:', error);
            return res.status(200).json([]);
        }
    }
}

module.exports = new controllerProducts();
