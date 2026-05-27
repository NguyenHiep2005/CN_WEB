import classNames from 'classnames/bind';
import { useState } from 'react';
import { toast } from 'react-toastify';
import request from '../../Config/api';
import styles from '../../Styles/ModalDetailProduct.module.scss';
import LOCATIONS from './locationData';

const cx = classNames.bind(styles);

const PROVINCES = Object.keys(LOCATIONS);

function ModalCheckout({ show, handleClose, products, totalPrice, onSuccess }) {
    console.log('ModalCheckout props:', { show, totalPrice, products });
    
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        province: '',
        ward: '',
        address: '',
        notes: '',
    });
    const [loading, setLoading] = useState(false);

    // Ensure totalPrice is a number
    const displayPrice = typeof totalPrice === 'number' ? totalPrice : 0;

    // Lấy danh sách xã/phường theo tỉnh
    const getWards = () => {
        return formData.province && LOCATIONS[formData.province] ? LOCATIONS[formData.province] : [];
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        console.log(`Input changed: ${name} = ${value}`);
        
        // Reset dependent fields
        if (name === 'province') {
            setFormData(prev => ({
                ...prev,
                [name]: value,
                ward: '', // Reset ward
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

        if (!formData.name || !formData.phone || !formData.address || !formData.province || !formData.ward) {
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
                    ward: formData.ward,
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
                    ward: formData.ward,
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
                ward: '',
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

    const wards = getWards();

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
                                    <option key={province} value={province}>
                                        {province}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Xã/Phường */}
                        <div style={{ marginBottom: '15px' }}>
                            <label htmlFor="ward" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px' }}>
                                Xã / Phường <span style={{ color: 'red' }}>*</span>
                            </label>
                            <select
                                id="ward"
                                name="ward"
                                value={formData.ward}
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
                                <option value="">-- Chọn Xã / Phường --</option>
                                {wards.map((ward) => (
                                    <option key={ward} value={ward}>
                                        {ward}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Địa chỉ giao hàng */}
                        <div style={{ marginBottom: '15px' }}>
                            <label htmlFor="address" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px' }}>
                                Địa Chỉ Chi Tiết (Số nhà, tên đường) <span style={{ color: 'red' }}>*</span>
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
                                placeholder="Ghi chú thêm cho đơn hàng (ví dụ: giao vào sáng, để tại cửa, v.v.)"
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
