import classNames from 'classnames/bind';
import styles from '../Styles/InfoUser.module.scss';
import Header from '../Components/Header';
import Footer from '../Components/Footer';
import request from '../Config/api';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope, faLock, faMoneyCheckDollar, faPhone, faTrash } from '@fortawesome/free-solid-svg-icons';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatVietnamDate } from '../utils/formatVietnamTime';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ModalCancelOrder from '../utils/Modal/CancelOrder';

const cx = classNames.bind(styles);

function InfoUser() {
    const [dataUser, setDataUser] = useState({});
    const [dataPayments, setDataPayments] = useState([]);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [selectedOrderId, setSelectedOrderId] = useState(null);

    const navigate = useNavigate();
    useEffect(() => {
        if (document.cookie) {
            request.get('/api/auth').then((res) => setDataUser(res.data));
        }
    }, []);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    useEffect(() => {
        if (document.cookie) {
            request.get('/api/payments').then((res) => {
                // Sort by creation date (newest first)
                const sorted = res.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                setDataPayments(sorted);
            });
        }
    }, []);

    const handleLogOut = () => {
        request.post('/api/logout').then((res) => {});
        setTimeout(() => {
            navigate('/');
        }, 2000);
    };

    const handleDeleteOrder = (orderId, tinhtrang) => {
        if (tinhtrang === true) {
            toast.error('Không thể xóa đơn hàng đã giao');
            return;
        }
        setSelectedOrderId(orderId);
        setShowCancelModal(true);
    };

    const handleCancelSuccess = () => {
        // Reload payments data after successful cancel
        if (document.cookie) {
            request.get('/api/payments').then((res) => {
                const sorted = res.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                setDataPayments(sorted);
            });
        }
        setShowCancelModal(false);
    };

    return (
        <>
            <header>
                <Header />
            </header>

            <main className={cx('main')}>
                {/* User Information Section */}
                <div className={cx('info-user')}>
                    <div className={cx('user-info-card')}>
                        <div className={cx('column-left')}>
                            <img
                                src="https://media.istockphoto.com/id/1300845620/vector/user-icon-flat-isolated-on-white-background-user-symbol-vector-illustration.jpg?s=612x612&w=0&k=20&c=yBeyba0hUkh14_jgv1OKqIH0CCSWU_4ckRkAoy2p73o="
                                alt=""
                            />
                            <div>
                                <ul>
                                    <li id={cx('name')}>{dataUser?.fullname}</li>
                                    <li>
                                        <FontAwesomeIcon id={cx('icons')} icon={faEnvelope} />
                                        {dataUser?.email}
                                    </li>
                                    <li>
                                        <FontAwesomeIcon id={cx('icons')} icon={faLock} />
                                        **********
                                    </li>
                                    <li>
                                        <FontAwesomeIcon id={cx('icons')} icon={faPhone} />0{dataUser?.phone}
                                    </li>
                                    <li>
                                        <FontAwesomeIcon id={cx('icons')} icon={faMoneyCheckDollar} />
                                        {dataUser?.surplus?.toLocaleString()} đ
                                    </li>
                                </ul>
                            </div>
                            <button onClick={handleLogOut} type="button" className="btn btn-danger">
                                Đăng Xuất
                            </button>
                        </div>
                    </div>
                </div>

                {/* Order History Section */}
                <div className={cx('order-history')}>
                    <h2>Hoạt Động Gần Đây</h2>
                    <div style={{ overflowX: 'auto' }} className="table-responsive">
                        <table
                            style={{ marginTop: '20px', width: '100%' }}
                            className="table table-bordered border-primary"
                        >
                            <thead>
                                <tr>
                                    <th scope="col">ID</th>
                                    <th scope="col">Tên Sản Phẩm</th>
                                    <th scope="col">Size</th>
                                    <th scope="col">Số Lượng</th>
                                    <th scope="col">Tổng Tiền</th>
                                    <th scope="col">Địa Chỉ</th>
                                    <th scope="col">Thời Gian Đặt</th>
                                    <th scope="col">Phương Thức Thanh Toán</th>
                                    <th scope="col">Trạng Thái</th>
                                    <th scope="col">Hành Động</th>
                                </tr>
                            </thead>
                            <tbody>
                                {dataPayments.map((item, orderIndex) => (
                                    <>
                                        {item.products.map((item2, index) => (
                                            <tr key={item._id || 12}>
                                                {index === 0 && (
                                                    <td
                                                        style={{
                                                            overflow: 'hidden',
                                                        }}
                                                        rowSpan={item.products.length}
                                                    >
                                                        {orderIndex + 1}
                                                    </td>
                                                )}
                                                <td>{item2.nameProduct}</td>
                                                <td>{item2.size}</td>
                                                <td>{item2.quantity}</td>
                                                {index === 0 && (
                                                    <>
                                                        <td rowSpan={item.products.length}>
                                                            {item.sumprice.toLocaleString()} đ
                                                        </td>
                                                        <td rowSpan={item.products.length}>
                                                            {item.address}
                                                        </td>
                                                        <td rowSpan={item.products.length}>
                                                            {formatVietnamDate(item.createdAt)}
                                                        </td>
                                                        <td rowSpan={item.products.length}>
                                                            {item.trangthai ? 'Đã Thanh Toán' : 'Thanh Toán Khi Nhận Hàng'}
                                                        </td>
                                                        <td rowSpan={item.products.length}>
                                                            {item.tinhtrang
                                                                ? 'Đã Giao Thành Công'
                                                                : 'Người Bán Đang Chuẩn Bị Hàng'}
                                                        </td>
                                                        <td rowSpan={item.products.length}>
                                                            <button
                                                                className="btn btn-sm btn-danger"
                                                                onClick={() => handleDeleteOrder(item._id, item.tinhtrang)}
                                                                title="Xóa đơn hàng"
                                                                disabled={item.tinhtrang === true}
                                                            >
                                                                <FontAwesomeIcon icon={faTrash} />
                                                            </button>
                                                        </td>
                                                    </>
                                                )}
                                            </tr>
                                        ))}
                                    </>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>

            <ModalCancelOrder
                show={showCancelModal}
                setShow={setShowCancelModal}
                item={selectedOrderId}
                onDeleteSuccess={handleCancelSuccess}
            />

            <ToastContainer />

            <footer>
                <Footer />
            </footer>
        </>
    );
}

export default InfoUser;
