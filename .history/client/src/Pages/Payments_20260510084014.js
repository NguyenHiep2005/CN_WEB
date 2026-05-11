import classNames from 'classnames/bind';
import styles from '../Styles/Payments.module.scss';
import Header from '../Components/Header';
import Footer from '../Components/Footer';
import axios from 'axios';
import request, { requestUpdateInfoCart } from '../Config/api';

import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../hooks/useStore';

const cx = classNames.bind(styles);

function Payments() {
    const [dataCart, setDataCart] = useState([]);
    const [tinhthanh, setTinhThanh] = useState([]);
    const [idTinhThanh, setIdTinhThanh] = useState('');
    const [huyen, setHuyen] = useState([]);
    const [idHuyen, setIdHuyen] = useState('');
    const [phuong, setPhuong] = useState([]);
    const [idPhuong, setIdPhuong] = useState('');
    const [address, setAddress] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('COD');
    const [dataProducts, setDataProducts] = useState([]);
    const [productQuantities, setProductQuantities] = useState({});

    const [dataLengthProducts, setDataLengthProducts] = useState(0);

    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [errors, setErrors] = useState({});

    useEffect(() => {
        const fetchData = async () => {
            try {
                const data = {
                    name,
                    phone,
                    address,
                };
                const res = await requestUpdateInfoCart(data);
                console.log(res);
            } catch (error) {
                console.log(error);
            }
        };

        fetchData();
    }, [name, phone, address]);

    const navigate = useNavigate();

    const { getCart } = useStore();

    const totalProduct = useMemo(() => {
        if (Array.isArray(dataProducts) && dataProducts.length > 0) {
            // Nếu là mảng sản phẩm từ mua ngay (mỗi phần tử có price và quantity)
            if (dataProducts[0]?.price !== undefined) {
                return dataProducts.reduce((total, product) => total + (product.price * product.quantity), 0);
            }
            // Nếu là sản phẩm từ giỏ hàng (có sumprice)
            return dataProducts[0]?.sumprice || 0;
        }
        return 0;
    }, [dataProducts]);

    useEffect(() => {
        axios.get('https://esgoo.net/api-tinhthanh/1/0.htm').then((res) => setTinhThanh(res.data.data));
    }, []);

    useEffect(() => {
        if (idTinhThanh !== '' && idTinhThanh !== '0') {
            axios.get(`https://esgoo.net/api-tinhthanh/2/${idTinhThanh}.htm`).then((res) => setHuyen(res.data.data));
        }
    }, [idTinhThanh]);

    useEffect(() => {
        if (idHuyen !== '' && idHuyen !== '0') {
            axios.get(`https://esgoo.net/api-tinhthanh/3/${idHuyen}.htm`).then((res) => setPhuong(res.data.data));
        }
    }, [idHuyen]);

    useEffect(() => {
        const buyNowProduct = localStorage.getItem('buyNowProduct');
        
        if (buyNowProduct) {
            // Nếu có sản phẩm mua ngay, chỉ thanh toán sản phẩm đó
            const product = JSON.parse(buyNowProduct);
            setDataProducts([product]);
        } else {
            // Nếu không, thanh toán giỏ hàng
            request.get('/api/cart').then((res) => {
                setDataCart(res.data);
                const newDataProducts = res.data?.map((item) => item.products);
                setDataProducts(newDataProducts?.[0]);
            });
        }
    }, []);

    const handleQuantityChange = (productId, newQuantity) => {
        if (newQuantity < 1) return;
        
        setDataProducts(prevProducts =>
            prevProducts.map(product => {
                const id = product._id || product.id;
                if (id === productId) {
                    return { ...product, quantity: newQuantity };
                }
                return product;
            })
        );
    };

    const handlePaymentMethodChange = (e) => {
        setPaymentMethod(e.target.value);
    };

    const validateForm = () => {
        const newErrors = {};

        // Kiểm tra tên
        if (!name.trim()) {
            newErrors.name = 'Họ và tên không được để trống';
        } else if (name.trim().length < 3) {
            newErrors.name = 'Họ và tên phải có ít nhất 3 ký tự';
        }

        // Kiểm tra số điện thoại
        if (!phone.trim()) {
            newErrors.phone = 'Số điện thoại không được để trống';
        } else if (!/^[0-9]{10,11}$/.test(phone.trim())) {
            newErrors.phone = 'Số điện thoại phải có 10-11 chữ số';
        }

        // Kiểm tra email
        if (!email.trim()) {
            newErrors.email = 'Email không được để trống';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
            newErrors.email = 'Email không hợp lệ';
        }

        // Kiểm tra tỉnh/thành
        if (!idTinhThanh || idTinhThanh === '0') {
            newErrors.tinhthanh = 'Vui lòng chọn Tỉnh/Thành';
        }

        // Kiểm tra quận/huyện
        if (!idHuyen || idHuyen === '0') {
            newErrors.huyen = 'Vui lòng chọn Quận/Huyện';
        }

        // Kiểm tra phường/xã
        if (!idPhuong || idPhuong === '0') {
            newErrors.phuong = 'Vui lòng chọn Phường/Xã';
        }

        // Kiểm tra địa chỉ
        if (!address.trim()) {
            newErrors.address = 'Địa chỉ không được để trống';
        } else if (address.trim().length < 5) {
            newErrors.address = 'Địa chỉ phải có ít nhất 5 ký tự';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handlePayment = async () => {
        // Validate form first
        if (!validateForm()) {
            toast.error('Vui lòng điền đầy đủ và đúng thông tin');
            return;
        }

        try {
            if (paymentMethod === 'Momo') {
                const res = await request.post('/api/payment', { dataProducts, address, name, phone, email });
                window.open(res.data.payUrl);
                localStorage.removeItem('buyNowProduct');
                await getCart();
            } else if (paymentMethod === 'COD') {
                const res = await request.post('/api/paymentcod', { dataProducts, address, name, phone, email });
                toast.success(res.data.message);
                localStorage.removeItem('buyNowProduct');
                await getCart();
                navigate('/paymentsuccess');
            }
        } catch (error) {
            toast.error(error.response.data.message);
        }
    };
    useEffect(() => {
        // Tính tổng số lượng sản phẩm
        let totalQuantity = 0;
        
        if (Array.isArray(dataProducts)) {
            if (dataProducts.length > 0 && dataProducts[0]?.quantity !== undefined) {
                // Nếu là sản phẩm từ mua ngay (có quantity riêng)
                totalQuantity = dataProducts.reduce((sum, product) => sum + (product.quantity || 1), 0);
            } else if (dataCart && dataCart.length > 0) {
                // Nếu là sản phẩm từ giỏ hàng
                totalQuantity = dataCart.reduce((total, cartItem) => {
                    return total + cartItem.products.reduce((sum, product) => sum + product.quantity, 0);
                }, 0);
            }
        }

        setDataLengthProducts(totalQuantity);
    }, [dataProducts, dataCart]);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className={cx('wrapper')}>
            <ToastContainer />
            <header>
                <Header />
            </header>

            <main className={cx('main')}>
                <h2>Thanh toán</h2>
                <div className={cx('form-payments')}>
                    <div className={cx('column-left')}>
                        <h3>THÔNG TIN THANH TOÁN</h3>
                        <div className={cx('form-1')}>
                            <div className="form-floating mb-3">
                                <input
                                    type="text"
                                    className="form-control"
                                    id="floatingInput"
                                    onChange={(e) => setName(e.target.value)}
                                    value={name}
                                />
                                <label htmlFor="floatingInput">Họ và tên *</label>
                                {errors.name && <small style={{ color: 'red' }}>{errors.name}</small>}
                            </div>
                            <div className="form-floating">
                                <input
                                    type="text"
                                    className="form-control"
                                    id="floatingPassword"
                                    onChange={(e) => setPhone(e.target.value)}
                                    value={phone}
                                />
                                <label htmlFor="floatingPassword">Số điện thoại *</label>
                                {errors.phone && <small style={{ color: 'red' }}>{errors.phone}</small>}
                            </div>
                        </div>

                        <div>
                            <div className="form-floating mb-3">
                                <input 
                                    type="email" 
                                    className="form-control" 
                                    id="floatingInput" 
                                    onChange={(e) => setEmail(e.target.value)}
                                    value={email}
                                />
                                <label htmlFor="floatingInput">Địa chỉ email *</label>
                                {errors.email && <small style={{ color: 'red' }}>{errors.email}</small>}
                            </div>
                            <select
                                className="form-select"
                                aria-label="Default select example"
                                value={idTinhThanh}
                                onChange={(e) => setIdTinhThanh(e.target.value)}
                            >
                                <option value="">-- Chọn Tỉnh/Thành --</option>
                                {tinhthanh.map((item) => (
                                    <option key={item.id} value={item.id}>
                                        {item.name}
                                    </option>
                                ))}
                            </select>
                            {errors.tinhthanh && <small style={{ color: 'red' }}>{errors.tinhthanh}</small>}
                        </div>

                        <div>
                            <select
                                onChange={(e) => setIdHuyen(e.target.value)}
                                value={idHuyen}
                                className="form-select mt-3"
                                aria-label="Default select example"
                            >
                                <option value="">-- Chọn Quận/Huyện --</option>
                                {huyen.map((item) => (
                                    <option key={item.id} value={item.id}>
                                        {item.name}
                                    </option>
                                ))}
                            </select>
                            {errors.huyen && <small style={{ color: 'red' }}>{errors.huyen}</small>}
                        </div>

                        <div>
                            <select
                                onChange={(e) => setIdPhuong(e.target.value)}
                                value={idPhuong}
                                className="form-select mt-3"
                                aria-label="Default select example"
                            >
                                <option value="">-- Chọn Phường/Xã --</option>
                                {phuong.map((item) => (
                                    <option key={item.id} value={item.id}>
                                        {item.name}
                                    </option>
                                ))}
                            </select>
                            {errors.phuong && <small style={{ color: 'red' }}>{errors.phuong}</small>}
                        </div>

                        <div>
                            <div className="form-floating mt-3">
                                <input
                                    type="text"
                                    className="form-control"
                                    id="floatingInput"
                                    onChange={(e) => setAddress(e.target.value)}
                                    value={address}
                                />
                                <label htmlFor="floatingInput">Địa Chỉ *</label>
                                {errors.address && <small style={{ color: 'red' }}>{errors.address}</small>}
                            </div>
                        </div>

                        <div className="form-floating mt-3">
                            <textarea
                                style={{ height: '100px' }}
                                className="form-control"
                                placeholder="Leave a comment here"
                                id="floatingTextarea"
                            ></textarea>
                            <label htmlFor="floatingTextarea">Ghi Chú Đơn Hàng</label>
                        </div>

                        <div className={cx('select-payment')}>
                            <h4>PHƯƠNG THỨC THANH TOÁN</h4>
                            <div className="form-check">
                                <input
                                    className="form-check-input"
                                    type="radio"
                                    name="paymentMethod"
                                    value="COD"
                                    id="flexRadioDefault1"
                                    onChange={handlePaymentMethodChange}
                                    checked={paymentMethod === 'COD'}
                                />
                                <label className="form-check-label" htmlFor="flexRadioDefault1">
                                    Thanh Toán Khi Nhận Hàng
                                </label>
                            </div>
                            <div className="form-check">
                                <input
                                    className="form-check-input"
                                    type="radio"
                                    name="paymentMethod"
                                    value="Momo"
                                    id="flexRadioDefault2"
                                    onChange={handlePaymentMethodChange}
                                    checked={paymentMethod === 'Momo'}
                                />
                                <label className="form-check-label" htmlFor="flexRadioDefault2">
                                    Thanh Toán Qua Momo
                                </label>
                            </div>

                            <div onClick={handlePayment} className={cx('btn-payment')}>
                                <button id={cx('btn-buy')}>Hoàn Tất Đơn Hàng</button>
                            </div>
                        </div>

                        <div></div>
                    </div>
                    <div className={cx('total-product')}>
                        <h3>TỔNG CỘNG | {dataLengthProducts} SẢN PHẨM</h3>
                        <div>
                            <table className="table table-bordered border-primary">
                                <thead>
                                    <tr>
                                        <th scope="col">Tạm tính</th>
                                        <th scope="col">{totalProduct?.toLocaleString()}đ</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td>Phí Vận Chuyển</td>
                                        <td>Miễn phí vận chuyển</td>
                                    </tr>
                                    <tr>
                                        <td>Tổng Cộng</td>
                                        <th>{totalProduct?.toLocaleString()}đ</th>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        <div className={cx('img-product')}>
                            <h4>SẢN PHẨM ĐÃ ĐẶT HÀNG</h4>
                            <div className={cx('img')}>
                                {dataProducts?.map((item) => (
                                    <div key={item._id || item.id} className={cx('product-item')}>
                                        <img
                                            src={`${process.env.REACT_APP_IMG}/${item.img || item.imgProduct}`}
                                            alt={item.name || item.nameProduct}
                                        />
                                        <p><strong>{item.name || item.nameProduct}</strong></p>
                                        <p>Giá: {(item.price || item.priceProduct)?.toLocaleString()} đ</p>
                                        <div className={cx('quantity-control')}>
                                            <p>Số lượng:</p>
                                            <button onClick={() => handleQuantityChange(item._id || item.id, (item.quantity || 1) - 1)}>
                                                -
                                            </button>
                                            <input type="text" value={item.quantity || 1} readOnly />
                                            <button onClick={() => handleQuantityChange(item._id || item.id, (item.quantity || 1) + 1)}>
                                                +
                                            </button>
                                        </div>
                                        <p>Size: {item.size || 'N/A'}</p>
                                        <p>Thành tiền: {((item.price || item.priceProduct) * (item.quantity || 1))?.toLocaleString()} đ</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <footer>
                <Footer />
            </footer>
        </div>
    );
}

export default Payments;
