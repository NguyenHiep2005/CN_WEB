const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const Product = require('./src/models/ModelProducts');
const User = require('./src/models/ModelUser');
const Cart = require('./src/models/ModelCart');
const Payment = require('./src/models/ModelPayment');

const sampleProducts = [
    // Nike
    {
        name: 'Nike Air Max 90',
        price: 3500000,
        slug: 'nike-air-max-90',
        img: ['/images/products/img/adidas1.jpg'],
        description: 'Giày thể thao Nike Air Max 90 với công nghệ đệm khí thoải mái. Đây là mẫu giày kinh điển được yêu thích từ những năm 1990.',
        type: 1,
        brand: 'Nike',
    },
    {
        name: 'Nike Revolution 7',
        price: 1800000,
        slug: 'nike-revolution-7',
        img: ['/images/products/img/adidas2.jpg'],
        description: 'Giày chạy bộ Nike Revolution 7 nhẹ nhàng và thoải mái cho mọi người',
        type: 1,
        brand: 'Nike',
    },
    {
        name: 'Nike Blazer Mid',
        price: 2500000,
        slug: 'nike-blazer-mid',
        img: ['/images/products/img/adidas3.jpg'],
        description: 'Giày Nike Blazer Mid cổ điển với thiết kế năm 1973',
        type: 1,
        brand: 'Nike',
    },
    // Adidas
    {
        name: 'Adidas Ultraboost 21',
        price: 4200000,
        slug: 'adidas-ultraboost-21',
        img: ['/images/products/img/adidas4.jpg'],
        description: 'Giày chạy bộ Adidas Ultraboost với công nghệ Boost mới nhất. Cải thiện hiệu suất chạy bộ',
        type: 1,
        brand: 'Adidas',
    },
    {
        name: 'Adidas Stan Smith',
        price: 2300000,
        slug: 'adidas-stan-smith',
        img: ['/images/products/img/adidas5.jpg'],
        description: 'Giày Adidas Stan Smith trắng xanh kinh điển',
        type: 1,
        brand: 'Adidas',
    },
    {
        name: 'Adidas NMD R1',
        price: 3100000,
        slug: 'adidas-nmd-r1',
        img: ['/images/products/img/adidas6.jpg'],
        description: 'Giày Adidas NMD R1 hiện đại với design độc đáo',
        type: 1,
        brand: 'Adidas',
    },
    // Puma
    {
        name: 'Puma RS-X',
        price: 2800000,
        slug: 'puma-rs-x',
        img: ['/images/products/img/puma1.jpg'],
        description: 'Giày sneaker Puma RS-X phong cách retro',
        type: 1,
        brand: 'Puma',
    },
    {
        name: 'Puma Future Rider',
        price: 2200000,
        slug: 'puma-future-rider',
        img: ['/images/products/img/puma2.jpg'],
        description: 'Giày Puma Future Rider với technology tiên tiến',
        type: 1,
        brand: 'Puma',
    },
    // New Balance
    {
        name: 'New Balance 990v5',
        price: 3800000,
        slug: 'new-balance-990v5',
        img: ['/images/products/img/adidas7.jpg'],
        description: 'Giày New Balance 990v5 chính hãng cao cấp',
        type: 1,
        brand: 'New Balance',
    },
    {
        name: 'New Balance 574',
        price: 2600000,
        slug: 'new-balance-574',
        img: ['/images/products/img/adidas8.jpg'],
        description: 'Giày New Balance 574 phổ biến với nhiều màu sắc',
        type: 1,
        brand: 'New Balance',
    },
    // Casual/Street
    {
        name: 'Converse Chuck Taylor',
        price: 1500000,
        slug: 'converse-chuck-taylor',
        img: ['/images/products/img/mau1.jpg'],
        description: 'Giày Converse Chuck Taylor cổ điển vượt thời gian',
        type: 2,
        brand: 'Converse',
    },
    {
        name: 'Vans Old Skool',
        price: 1800000,
        slug: 'vans-old-skool',
        img: ['/images/products/img/mau3.jpg'],
        description: 'Giày Vans Old Skool truyền thống được yêu thích',
        type: 2,
        brand: 'Vans',
    },
    {
        name: 'Vans Authentic',
        price: 1600000,
        slug: 'vans-authentic',
        img: ['/images/products/img/mau4.jpg'],
        description: 'Giày Vans Authentic đơn giản và thanh lịch',
        type: 2,
        brand: 'Vans',
    },
    {
        name: 'DC Skate Shoes',
        price: 2100000,
        slug: 'dc-skate-shoes',
        img: ['/images/products/img/mau5.jpg'],
        description: 'Giày trượt ván DC chuyên dụng',
        type: 2,
        brand: 'DC',
    },
];

const sampleUsers = [];

async function createSampleUsers() {
    const users = [
        {
            fullname: 'Admin User',
            email: 'admin@example.com',
            password: '123456',
            isAdmin: true,
            phone: 912345678,
        },
        {
            fullname: 'Nguyễn Văn A',
            email: 'nguyenvana@example.com',
            password: '123456',
            isAdmin: false,
            phone: 909876543,
        },
        {
            fullname: 'Trần Thị B',
            email: 'tranthib@example.com',
            password: '123456',
            isAdmin: false,
            phone: 918765432,
        },
        {
            fullname: 'Lê Văn C',
            email: 'levanc@example.com',
            password: '123456',
            isAdmin: false,
            phone: 907654321,
        },
    ];

    for (let user of users) {
        const hash = await bcrypt.hash(user.password, 10);
        sampleUsers.push({
            ...user,
            password: hash,
        });
    }
    return sampleUsers;
}

const sampleCarts = [
    {
        user: 'nguyenvana@example.com',
        products: [
            {
                nameProduct: 'Nike Air Max 90',
                quantity: 100,
                price: 3500000,
                size: 42,
                img: '/images/products/img/adidas1.jpg',
                type: 1,
            },
            {
                nameProduct: 'Adidas Stan Smith',
                quantity: 100,
                price: 2300000,
                size: 40,
                img: '/images/products/img/adidas5.jpg',
                type: 1,
            },
        ],
        address: '123 Đường Lê Lợi, Quận 1, TP.HCM',
        name: 'Nguyễn Văn A',
        phone: 909876543,
        sumprice: 8100000,
    },
];

const samplePayments = [
    {
        products: [
            {
                nameProduct: 'Nike Air Max 90',
                quantity: 1,
                price: 3500000,
                size: 42,
                img: '/images/products/img/adidas1.jpg',
                type: 1,
            },
        ],
        sumprice: 3500000,
        tinhtrang: true, // đã thanh toán
        trangthai: false, // chưa giao hàng
        phone: 909876543,
        user: 'nguyenvana@example.com',
        address: '123 Đường Lê Lợi, Quận 1, TP.HCM',
        size: 42,
        username: 'Nguyễn Văn A',
    },
    {
        products: [
            {
                nameProduct: 'Adidas Ultraboost 21',
                quantity: 1,
                price: 4200000,
                size: 43,
                img: '/images/products/img/adidas4.jpg',
                type: 1,
            },
        ],
        sumprice: 4200000,
        tinhtrang: true,
        trangthai: true, // đã giao hàng
        phone: 918765432,
        user: 'tranthib@example.com',
        address: '456 Đường Nguyễn Huệ, Quận 1, TP.HCM',
        size: 43,
        username: 'Trần Thị B',
    },
];

async function seedDatabase() {
    try {
        await mongoose.connect(process.env.CONNECT_DB, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('✓ Kết nối MongoDB thành công');

        // Xóa toàn bộ dữ liệu cũ
        await Product.deleteMany({});
        await User.deleteMany({});
        await Cart.deleteMany({});
        await Payment.deleteMany({});
        console.log('✓ Xóa dữ liệu cũ');

        // Thêm Products
        const products = await Product.insertMany(sampleProducts);
        console.log(`✓ Thêm ${products.length} sản phẩm`);

        // Hash password và thêm Users
        const hashedUsers = await createSampleUsers();
        const users = await User.insertMany(hashedUsers);
        console.log(`✓ Thêm ${users.length} người dùng`);

        // Thêm Carts
        const carts = await Cart.insertMany(sampleCarts);
        console.log(`✓ Thêm ${carts.length} giỏ hàng`);

        // Thêm Payments
        const payments = await Payment.insertMany(samplePayments);
        console.log(`✓ Thêm ${payments.length} đơn hàng`);

        console.log('\n✓ Seeding dữ liệu thành công!');
        console.log(`
📊 Tóm tắt:
  - ${products.length} sản phẩm giày
  - ${users.length} người dùng
  - ${carts.length} giỏ hàng
  - ${payments.length} đơn hàng

🔑 Test Accounts:
  Admin: admin@example.com / 123456
  User1: nguyenvana@example.com / 123456
  User2: tranthib@example.com / 123456
        `);

        mongoose.connection.close();
    } catch (error) {
        console.error('❌ Lỗi:', error.message);
        process.exit(1);
    }
}

seedDatabase();
