const fs = require('fs');
const path = require('path');

const imageNames = [
    'nike-air-max-90.jpg',
    'nike-revolution-7.jpg',
    'nike-blazer-mid.jpg',
    'adidas-ultraboost-21.jpg',
    'adidas-stan-smith.jpg',
    'adidas-nmd-r1.jpg',
    'puma-rs-x.jpg',
    'puma-future-rider.jpg',
    'new-balance-990v5.jpg',
    'new-balance-574.jpg',
    'converse-chuck-taylor.jpg',
    'vans-old-skool.jpg',
    'vans-authentic.jpg',
    'dc-skate-shoes.jpg',
];

const dir = path.join(__dirname, 'public/images/products');

// Tạo thư mục nếu chưa tồn tại
if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
}

// Tạo ảnh placeholder đơn giản (PNG màu xám)
const placeholderPNG = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    'base64'
);

imageNames.forEach(filename => {
    const filepath = path.join(dir, filename.replace('.jpg', '.png'));
    fs.writeFileSync(filepath, placeholderPNG);
    console.log(`✓ Tạo: ${filename}`);
});

console.log(`\n✓ Đã tạo ${imageNames.length} ảnh placeholder!`);
console.log(`📁 Vị trí: ${dir}`);
