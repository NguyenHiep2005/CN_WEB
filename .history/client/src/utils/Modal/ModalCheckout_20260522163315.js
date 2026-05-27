import classNames from 'classnames/bind';
import { useState } from 'react';
import { toast } from 'react-toastify';
import request from '../../Config/api';
import styles from '../../Styles/ModalDetailProduct.module.scss';

const cx = classNames.bind(styles);

function ModalCheckout({ show, handleClose, products, totalPrice, onSuccess }) {
    console.log('ModalCheckout props:', { show, totalPrice, products });
    
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        address: '',
    });
    const [loading, setLoading] = useState(false);

    // Ensure totalPrice is a number
    const displayPrice = typeof totalPrice === 'number' ? totalPrice : 0;

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        console.log(`Input changed: ${name} = ${value}`);
        setFormData(prev => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log('Form submitted, loading state:', loading);

        if (loading) {
            console.log('Already processing, ignoring duplicate submit');
            return;
        }

        if (!formData.name || !formData.phone || !formData.address) {
            console.log('Form validation failed:', formData);
            toast.error('Vui lòng điền đầy đủ thông tin');
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
                    address: formData.address,
                };

                console.log('Sending payment data:', paymentData);
                const res = await request.post('/api/paymentcod', paymentData);
                console.log('Payment response:', res.data);
                toast.success(res.data.message);
                localStorage.removeItem('buyNowProduct');
            } else {
                // Payment for cart
                const paymentData = {
                    name: formData.name,
                    phone: formData.phone,
                    address: formData.address,
                };

                console.log('Sending cart payment data:', paymentData);
                const res = await request.post('/api/paymentcod', paymentData);
                console.log('Payment response:', res.data);
                toast.success(res.data.message);
            }

            // Clear form
            setFormData({
                name: '',
                phone: '',
                address: '',
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

    return (
        <div className={cx('modal-overlay')} onClick={handleClose}>
            <div className={cx('modal-content')} onClick={(e) => e.stopPropagation()}>
                <div className={cx('modal-header')}>
                    <h2>Thanh Toán COD</h2>
                    <button className={cx('close-btn')} onClick={handleClose}>
                        ×
                    </button>
                </div>

                <div className={cx('modal-body')}>
                    <div style={{ marginBottom: '20px', paddingBottom: '15px', borderBottom: '1px solid #ddd' }}>
                        <h3 style={{ marginBottom: '10px' }}>Tóm Tắt Đơn Hàng</h3>
                        <p><strong>Tổng Tiền:</strong> {displayPrice.toLocaleString()} đ</p>
                        <p><strong>Phí Vận Chuyển:</strong> Miễn phí</p>
                        <p style={{ marginTop: '10px', fontSize: '16px' }}>
                            <strong>Thành Tiền:</strong> <span style={{ color: '#ff6b6b' }}>{displayPrice.toLocaleString()} đ</span>
                        </p>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div style={{ marginBottom: '15px' }}>
                            <label htmlFor="name" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
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

                        <div style={{ marginBottom: '15px' }}>
                            <label htmlFor="phone" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                Số Điện Thoại <span style={{ color: 'red' }}>*</span>
                            </label>
                            <input
                                type="tel"
                                id="phone"
                                name="phone"
                                value={formData.phone}
                                onChange={handleInputChange}
                                placeholder="Nhập số điện thoại"
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

                        <div style={{ marginBottom: '15px' }}>
                            <label htmlFor="address" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                Địa Chỉ Giao Hàng <span style={{ color: 'red' }}>*</span>
                            </label>
                            <textarea
                                id="address"
                                name="address"
                                value={formData.address}
                                onChange={handleInputChange}
                                placeholder="Nhập địa chỉ giao hàng"
                                rows="3"
                                style={{
                                    width: '100%',
                                    padding: '10px',
                                    border: '1px solid #ddd',
                                    borderRadius: '4px',
                                    fontSize: '14px',
                                    boxSizing: 'border-box',
                                    fontFamily: 'inherit',
                                }}
                                disabled={loading}
                            />
                        </div>

                        <div style={{ marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                            <button
                                type="button"
                                onClick={handleClose}
                                style={{
                                    padding: '10px 20px',
                                    border: '1px solid #ddd',
                                    backgroundColor: '#f5f5f5',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '14px',
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
                                    cursor: 'pointer',
                                    fontSize: '14px',
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
