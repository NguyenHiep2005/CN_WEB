import classNames from 'classnames/bind';
import { useState } from 'react';
import { toast } from 'react-toastify';
import request from '../../Config/api';
import styles from '../../Styles/ModalDetailProduct.module.scss';

const cx = classNames.bind(styles);

// Dữ liệu tỉnh/thành phố của Việt Nam
const PROVINCES = [
    { name: 'Hà Nội', districts: ['Ba Đình', 'Hoàn Kiếm', 'Hai Bà Trưng', 'Đống Đa', 'Tây Hồ', 'Cầu Giấy', 'Thanh Xuân', 'Hoàng Mai', 'Long Biên', 'Bắc Từ Liêm', 'Nam Từ Liêm'] },
    { name: 'TP. Hồ Chí Minh', districts: ['Quận 1', 'Quận 2', 'Quận 3', 'Quận 4', 'Quận 5', 'Quận 6', 'Quận 7', 'Quận 8', 'Quận 9', 'Quận 10', 'Quận 11', 'Quận 12', 'Tân Bình', 'Tân Phú', 'Phú Nhuận', 'Bình Thạnh', 'Gò Vấp', 'Bình Tân'] },
    { name: 'Đà Nẵng', districts: ['Hải Châu', 'Thanh Khê', 'Sơn Trà', 'Ngũ Hành Sơn', 'Liên Chiểu', 'Cẩm Lệ'] },
    { name: 'Cần Thơ', districts: ['Ninh Kiều', 'Bình Thủy', 'Cái Răng', 'Phong Điền', 'Thốt Nót', 'Ô Môn'] },
    { name: 'An Giang', districts: ['Long Xuyên', 'Châu Đốc', 'Tân Châu', 'Chợ Mới'] },
    { name: 'Bà Rịa - Vũng Tàu', districts: ['Vũng Tàu', 'Bà Rịa', 'Long Điền', 'Đất Đỏ'] },
    { name: 'Bắc Giang', districts: ['Bắc Giang', 'Việt Yên', 'Hiệp Hòa', 'Yên Thế'] },
    { name: 'Bắc Kạn', districts: ['Bắc Kạn', 'Pác Nặm', 'Ba Bể', 'Ngân Sơn'] },
    { name: 'Bạc Liêu', districts: ['Bạc Liêu', 'Vị Thanh', 'Châu Thành'] },
    { name: 'Bắc Ninh', districts: ['Bắc Ninh', 'Yên Phong', 'Tiên Du', 'Từ Sơn'] },
    { name: 'Bến Tre', districts: ['Bến Tre', 'Châu Thành', 'Chợ Lách', 'Mỏ Cày Nam'] },
    { name: 'Bình Dương', districts: ['Thủ Dầu Một', 'Dĩ An', 'Bến Cát', 'Thuận An', 'Tân Uyên'] },
    { name: 'Bình Phước', districts: ['Đồng Xoài', 'Phú Riềng', 'Chơn Thành', 'Bình Long'] },
    { name: 'Bình Thuận', districts: ['Phan Thiết', 'La Gi', 'Tuy Phong', 'Hàm Tân'] },
    { name: 'Cà Mau', districts: ['Cà Mau', 'Năm Căn', 'Cái Nước', 'Gành Hào'] },
    { name: 'Cao Bằng', districts: ['Cao Bằng', 'Bảo Lâm', 'Thạch An', 'Hà Quản'] },
    { name: 'Đắk Lắk', districts: ['Buôn Ma Thuột', 'Gia Nghĩa', 'Buôn Hồ', 'Ea H\'leo'] },
    { name: 'Đắk Nông', districts: ['Gia Nghĩa', 'Đắk Glong', 'Tuy Đức', 'Cuco'] },
    { name: 'Điện Biên', districts: ['Điện Biên Phủ', 'Mường Ảng', 'Nước Ngoài', 'Tủa Chùa'] },
    { name: 'Đồng Nai', districts: ['Biên Hòa', 'Long Khánh', 'Nhơn Trạch', 'Vĩnh Cửu', 'Long Thành', 'Xuân Lộc'] },
    { name: 'Đồng Tháp', districts: ['Cao Lãnh', 'Sa Đéc', 'Hồng Ngu', 'Tân Hồng'] },
    { name: 'Gia Lai', districts: ['Pleiku', 'An Khê', 'Ayun Pa', 'Chư Sê'] },
    { name: 'Hà Giang', districts: ['Hà Giang', 'Vị Xuyên', 'Bắc Quang', 'Yên Minh'] },
    { name: 'Hà Nam', districts: ['Phủ Lý', 'Dương Anh', 'Kim Bảng', 'Lý Nhân'] },
    { name: 'Hà Tĩnh', districts: ['Hà Tĩnh', 'Hồng Lĩnh', 'Vũ Quang', 'Can Lộc'] },
    { name: 'Hải Dương', districts: ['Hải Dương', 'Chí Linh', 'Nam Sách', 'Thanh Hà', 'Kim Thành', 'Kiến Xương'] },
    { name: 'Hải Phòng', districts: ['Hồng Bàng', 'Ngô Quyền', 'Lê Chân', 'Kiến An', 'Đồ Sơn', 'Cát Bà'] },
    { name: 'Hàm Rồng', districts: [] },
    { name: 'Hưng Yên', districts: ['Hưng Yên', 'Phố Nối', 'Ân Thi', 'Yên Mỹ', 'Khoái Châu'] },
    { name: 'Khánh Hòa', districts: ['Nha Trang', 'Cam Ranh', 'Cam Lâm', 'Vạn Ninh'] },
    { name: 'Kiên Giang', districts: ['Rạch Giá', 'Hà Tiên', 'Phú Quốc', 'An Biên'] },
    { name: 'Kon Tum', districts: ['Kon Tum', 'Tu Mơ Rông', 'Sa Thầy', 'Ngọc Hồi'] },
    { name: 'Lai Châu', districts: ['Lai Châu', 'Tam Đường', 'Phong Thổ', 'Si Ma Cai'] },
    { name: 'Lâm Đồng', districts: ['Đà Lạt', 'Thành phố Đà Lạt', 'Lâm Hà', 'Di Linh'] },
    { name: 'Lạng Sơn', districts: ['Lạng Sơn', 'Chi Lăng', 'Tràng Định', 'Văn Lãng'] },
    { name: 'Lào Cai', districts: ['Lào Cai', 'Sa Pa', 'Bảo Thắng', 'Bảo Yên'] },
    { name: 'Long An', districts: ['Tân An', 'Mỹ Tho', 'Tân Hưng', 'Cần Đước'] },
    { name: 'Nam Định', districts: ['Nam Định', 'Giao Thủy', 'Ý Yên', 'Hải Hậu'] },
    { name: 'Nghệ An', districts: ['Vinh', 'Cửa Lò', 'Thanh Chương', 'Tân Kỳ'] },
    { name: 'Ninh Bình', districts: ['Ninh Bình', 'Tam Điệp', 'Yên Mô', 'Gia Viễn'] },
    { name: 'Ninh Thuận', districts: ['Phan Rang-Tháp Chàm', 'Ninh Hải', 'Thuận Bắc', 'Thuận Nam'] },
    { name: 'Phú Thọ', districts: ['Việt Trì', 'Phú Thọ', 'Tân Sơn', 'Cẩm Khê'] },
    { name: 'Phú Yên', districts: ['Tuy Hòa', 'Sông Cầu', 'Tuy An', 'Phú Hòa'] },
    { name: 'Quảng Bình', districts: ['Đông Hà', 'Quảng Trị', 'Gio Linh', 'Cồn Cỏ'] },
    { name: 'Quảng Nam', districts: ['Đà Nẵng', 'Hội An', 'Tam Kỳ', 'Điện Bàn'] },
    { name: 'Quảng Ngãi', districts: ['Quảng Ngãi', 'Dung Quất', 'Bình Sơn', 'Mộ Đức'] },
    { name: 'Quảng Ninh', districts: ['Hạ Long', 'Móng Cái', 'Cẩm Phả', 'Uông Bí'] },
    { name: 'Quảng Trị', districts: ['Đông Hà', 'Quảng Trị', 'Gio Linh', 'Triệu Phong'] },
    { name: 'Sóc Trăng', districts: ['Sóc Trăng', 'Kế Sách', 'Mỹ Xuyên', 'Vĩnh Châu'] },
    { name: 'Sơn La', districts: ['Sơn La', 'Mường La', 'Yên Châu', 'Phù Yên'] },
    { name: 'Tây Ninh', districts: ['Tây Ninh', 'Gò Dầu', 'Dương Minh Châu', 'Bến Cát'] },
    { name: 'Thái Bình', districts: ['Thái Bình', 'Thái Thủy', 'Vũ Thư', 'Quỳnh Côi'] },
    { name: 'Thái Nguyên', districts: ['Thái Nguyên', 'Sông Côn', 'Định Hóa', 'Phú Lương'] },
    { name: 'Thanh Hóa', districts: ['Thanh Hóa', 'Sầm Sơn', 'Bỉm Sơn', 'Lam Sơn'] },
    { name: 'Thừa Thiên Huế', districts: ['Huế', 'A Lưới', 'Phong Điều', 'Quảng Điền'] },
    { name: 'Tiền Giang', districts: ['Mỹ Tho', 'Gò Công', 'Cái Lậy', 'Tân Phú Đông'] },
    { name: 'Trà Vinh', districts: ['Trà Vinh', 'Càng Long', 'Cầu Kè', 'Duyên Hải'] },
    { name: 'Tuyên Quang', districts: ['Tuyên Quang', 'Nà Hang', 'Hàm Yên', 'Yên Sơn'] },
    { name: 'Vĩnh Long', districts: ['Vĩnh Long', 'Mang Thít', 'Tam Bình', 'Bình Minh'] },
    { name: 'Vĩnh Phúc', districts: ['Vĩnh Yên', 'Phúc Yên', 'Bình Xuyên', 'Tam Dương'] },
    { name: 'Yên Bái', districts: ['Yên Bái', 'Lục Yên', 'Văn Yên', 'Văn Chấn'] },
];

function ModalCheckout({ show, handleClose, products, totalPrice, onSuccess }) {
    console.log('ModalCheckout props:', { show, totalPrice, products });
    
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        province: '',
        district: '',
        address: '',
        notes: '',
    });
    const [loading, setLoading] = useState(false);

    // Ensure totalPrice is a number
    const displayPrice = typeof totalPrice === 'number' ? totalPrice : 0;

    // Lấy danh sách quận/huyện theo tỉnh
    const getDistricts = () => {
        const province = PROVINCES.find(p => p.name === formData.province);
        return province ? province.districts : [];
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        console.log(`Input changed: ${name} = ${value}`);
        
        // Reset district khi thay đổi province
        if (name === 'province') {
            setFormData(prev => ({
                ...prev,
                [name]: value,
                district: '', // Reset district
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value,
            }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log('Form submitted, loading state:', loading);

        if (loading) {
            console.log('Already processing, ignoring duplicate submit');
            return;
        }

        if (!formData.name || !formData.phone || !formData.address || !formData.province || !formData.district) {
            console.log('Form validation failed:', formData);
            toast.error('Vui lòng điền đầy đủ thông tin bắt buộc (*)');
            return;
        }

        console.log('Form data valid:', formData);
        setLoading(true);
        try {
            // Check if there's a "buy now" product in localStorage
            const buyNowProduct = localStorage.getItem('buyNowProduct');
            console.log('Buy now product:', buyNowProduct);
            
            if (buyNowProduct) {
                // Payment for single product (buy now)
                const product = JSON.parse(buyNowProduct);
                const paymentData = {
                    dataProducts: [{
                        name: product.name,
                        nameProduct: product.name,
                        price: product.price,
                        priceProduct: product.price,
                        quantity: product.quantity,
                        size: product.size,
                        img: product.img,
                        imgProduct: product.img,
                        type: product.type,
                    }],
                    name: formData.name,
                    phone: formData.phone,
                    province: formData.province,
                    district: formData.district,
                    address: formData.address,
                    notes: formData.notes,
                };

                console.log('Sending payment data:', paymentData);
                const res = await request.post('/api/paymentcod', paymentData);
                console.log('Payment response:', res);
                console.log('Response data:', res.data);
                toast.success(res.data?.message || 'Thanh toán thành công!');
                localStorage.removeItem('buyNowProduct');
            } else {
                // Payment for cart
                console.log('Processing cart payment');
                const paymentData = {
                    name: formData.name,
                    phone: formData.phone,
                    province: formData.province,
                    district: formData.district,
                    address: formData.address,
                    notes: formData.notes,
                };

                console.log('Sending cart payment data:', paymentData);
                const res = await request.post('/api/paymentcod', paymentData);
                console.log('Payment response:', res);
                console.log('Response data:', res.data);
                toast.success(res.data?.message || 'Thanh toán thành công!');
            }

            // Clear form
            setFormData({
                name: '',
                phone: '',
                province: '',
                district: '',
                address: '',
                notes: '',
            });

            // Call success callback
            if (onSuccess) {
                setTimeout(() => {
                    onSuccess();
                }, 1500);
            }

            handleClose();
        } catch (error) {
            console.error('Payment error:', error);
            toast.error(error.response?.data?.message || 'Lỗi thanh toán');
        } finally {
            setLoading(false);
        }
    };

    if (!show) return null;

    const districts = getDistricts();

    return (
        <div 
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 9999
            }}
            onClick={handleClose}
        >
            <div 
                style={{
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    maxWidth: '600px',
                    width: '90%',
                    maxHeight: '90vh',
                    overflow: 'auto',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                }}
                onClick={(e) => e.stopPropagation()}
            >
                <div 
                    style={{
                        borderBottom: '1px solid #e0e0e0',
                        padding: '20px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        backgroundColor: '#f9f9f9'
                    }}
                >
                    <h2 style={{ margin: 0, color: '#333' }}>Thông Tin Đặt Hàng</h2>
                    <button 
                        onClick={handleClose}
                        style={{
                            background: 'none',
                            border: 'none',
                            fontSize: '28px',
                            cursor: 'pointer',
                            color: '#666'
                        }}
                    >
                        ×
                    </button>
                </div>

                <div style={{ padding: '20px' }}>
                    <div style={{ marginBottom: '20px', paddingBottom: '15px', borderBottom: '1px solid #ddd' }}>
                        <h3 style={{ marginBottom: '10px', color: '#333' }}>Tóm Tắt Đơn Hàng</h3>
                        <p><strong>Tổng Tiền:</strong> {displayPrice.toLocaleString()} đ</p>
                        <p><strong>Phí Vận Chuyển:</strong> Miễn phí</p>
                        <p style={{ marginTop: '10px', fontSize: '16px' }}>
                            <strong>Thành Tiền:</strong> <span style={{ color: '#ff6b6b', fontWeight: 'bold' }}>{displayPrice.toLocaleString()} đ</span>
                        </p>
                        <p style={{ marginTop: '10px', fontSize: '13px', color: '#666' }}>
                            <strong>Phương thức:</strong> Thanh toán khi nhận hàng (COD)
                        </p>
                    </div>

                    <form onSubmit={handleSubmit}>
                        {/* Họ và Tên */}
                        <div style={{ marginBottom: '15px' }}>
                            <label htmlFor="name" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px' }}>
                                Họ và Tên <span style={{ color: 'red' }}>*</span>
                            </label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                placeholder="Nhập họ và tên"
                                style={{
                                    width: '100%',
                                    padding: '10px',
                                    border: '1px solid #ddd',
                                    borderRadius: '4px',
                                    fontSize: '14px',
                                    boxSizing: 'border-box',
                                }}
                                disabled={loading}
                            />
                        </div>

                        {/* Số Điện Thoại */}
                        <div style={{ marginBottom: '15px' }}>
                            <label htmlFor="phone" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px' }}>
                                Số Điện Thoại <span style={{ color: 'red' }}>*</span>
                            </label>
                            <input
                                type="tel"
                                id="phone"
                                name="phone"
                                value={formData.phone}
                                onChange={handleInputChange}
                                placeholder="Nhập số điện thoại (10-11 chữ số)"
                                pattern="[0-9]{10,11}"
                                style={{
                                    width: '100%',
                                    padding: '10px',
                                    border: '1px solid #ddd',
                                    borderRadius: '4px',
                                    fontSize: '14px',
                                    boxSizing: 'border-box',
                                }}
                                disabled={loading}
                            />
                        </div>

                        {/* Tỉnh/Thành Phố */}
                        <div style={{ marginBottom: '15px' }}>
                            <label htmlFor="province" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px' }}>
                                Tỉnh / Thành Phố <span style={{ color: 'red' }}>*</span>
                            </label>
                            <select
                                id="province"
                                name="province"
                                value={formData.province}
                                onChange={handleInputChange}
                                style={{
                                    width: '100%',
                                    padding: '10px',
                                    border: '1px solid #ddd',
                                    borderRadius: '4px',
                                    fontSize: '14px',
                                    boxSizing: 'border-box',
                                }}
                                disabled={loading}
                            >
                                <option value="">-- Chọn Tỉnh / Thành Phố --</option>
                                {PROVINCES.map((province) => (
                                    <option key={province.name} value={province.name}>
                                        {province.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Quận/Huyện */}
                        <div style={{ marginBottom: '15px' }}>
                            <label htmlFor="district" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px' }}>
                                Quận / Huyện <span style={{ color: 'red' }}>*</span>
                            </label>
                            <select
                                id="district"
                                name="district"
                                value={formData.district}
                                onChange={handleInputChange}
                                disabled={!formData.province || loading}
                                style={{
                                    width: '100%',
                                    padding: '10px',
                                    border: '1px solid #ddd',
                                    borderRadius: '4px',
                                    fontSize: '14px',
                                    boxSizing: 'border-box',
                                    backgroundColor: !formData.province ? '#f5f5f5' : 'white',
                                }}
                            >
                                <option value="">-- Chọn Quận / Huyện --</option>
                                {districts.map((district) => (
                                    <option key={district} value={district}>
                                        {district}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Địa chỉ giao hàng */}
                        <div style={{ marginBottom: '15px' }}>
                            <label htmlFor="address" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px' }}>
                                Địa Chỉ Giao Hàng (Số nhà, tên đường) <span style={{ color: 'red' }}>*</span>
                            </label>
                            <textarea
                                id="address"
                                name="address"
                                value={formData.address}
                                onChange={handleInputChange}
                                placeholder="Nhập địa chỉ giao hàng (ví dụ: 123 Đường Nguyễn Huệ)"
                                rows="2"
                                style={{
                                    width: '100%',
                                    padding: '10px',
                                    border: '1px solid #ddd',
                                    borderRadius: '4px',
                                    fontSize: '14px',
                                    boxSizing: 'border-box',
                                    fontFamily: 'inherit',
                                    resize: 'vertical'
                                }}
                                disabled={loading}
                            />
                        </div>

                        {/* Ghi chú */}
                        <div style={{ marginBottom: '15px' }}>
                            <label htmlFor="notes" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px' }}>
                                Ghi Chú (Tùy chọn)
                            </label>
                            <textarea
                                id="notes"
                                name="notes"
                                value={formData.notes}
                                onChange={handleInputChange}
                                placeholder="Ghi chú thêm cho đơn hàng (ví dụ: giao giờ hành chính, để tại cửa, v.v.)"
                                rows="2"
                                style={{
                                    width: '100%',
                                    padding: '10px',
                                    border: '1px solid #ddd',
                                    borderRadius: '4px',
                                    fontSize: '14px',
                                    boxSizing: 'border-box',
                                    fontFamily: 'inherit',
                                    resize: 'vertical'
                                }}
                                disabled={loading}
                            />
                        </div>

                        {/* Nút hành động */}
                        <div style={{ marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                            <button
                                type="button"
                                onClick={handleClose}
                                style={{
                                    padding: '10px 20px',
                                    border: '1px solid #ddd',
                                    backgroundColor: '#f5f5f5',
                                    borderRadius: '4px',
                                    cursor: loading ? 'not-allowed' : 'pointer',
                                    fontSize: '14px',
                                    fontWeight: '500',
                                }}
                                disabled={loading}
                            >
                                Hủy
                            </button>
                            <button
                                type="submit"
                                style={{
                                    padding: '10px 20px',
                                    backgroundColor: '#ff6b6b',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: loading ? 'not-allowed' : 'pointer',
                                    fontSize: '14px',
                                    fontWeight: '500',
                                }}
                                disabled={loading}
                            >
                                {loading ? 'Đang Xử Lý...' : 'Đặt Hàng'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default ModalCheckout;
