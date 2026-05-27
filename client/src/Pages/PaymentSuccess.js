import classNames from 'classnames/bind';
import styles from '../Styles/PaymentsSuccess.module.scss';
import Header from '../Components/Header';
import Footer from '../Components/Footer';
import { useEffect, useState } from 'react';
import request from '../Config/api';
import { formatVietnamDate } from '../utils/formatVietnamTime';

const cx = classNames.bind(styles);

function PaymentSuccess() {
    const [dataPayment, setDataPayment] = useState([]);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const token = document.cookie;

    useEffect(() => {
        if (!token) {
            return;
        }
        request.get('/api/payment').then((res) => setDataPayment(res.data));
    }, [token]);

    return (
        <div className={cx('wrapper')}>
            <header>
                <Header />
            </header>

            <main className={cx('main')}>
                <div className={cx('success-animation')}>
                    <svg className={cx('checkmark')} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
                        <circle className={cx('checkmark__circle')} cx="26" cy="26" r="25" fill="none" />
                        <path className={cx('checkmark__check')} fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
                    </svg>
                </div>
                {dataPayment.map((item) => (
                    <div key={item?.id} className={cx('content')}>
                        <h2>Thanh Toán Thành Công </h2>
                        <div className={cx('info')}>
                            <h3>Cảm ơn Quý Khách!</h3>
                            <span>
                                Chúng tôi xin thông báo rằng thanh toán của quý khách đã được xử lý thành công. Cảm ơn
                                quý khách đã tin tưởng và sử dụng dịch vụ của chúng tôi.
                            </span>
                            <ul>
                                Thông tin thanh toán
                                <li>Số tiền thanh toán : {item?.sumprice.toLocaleString()} đ</li>
                                <li>Thời gian đặt hàng: {formatVietnamDate(item?.createdAt)}</li>
                                <li>
                                    Phương thức thanh toán:{' '}
                                    {item?.trangthai ? 'Đã Thanh Toán' : 'Thanh Toán Khi Nhận Hàng'}
                                </li>
                            </ul>
                            <span>
                                Quý khách có thể kiểm tra chi tiết đơn hàng và theo dõi trạng thái vận chuyển trong tài
                                khoản của mình trên trang web của chúng tôi.
                            </span>
                            <span>
                                Nếu quý khách có bất kỳ câu hỏi hoặc cần hỗ trợ thêm, xin vui lòng liên hệ với đội ngũ
                                chăm sóc khách hàng của chúng tôi qua email [email] hoặc gọi điện thoại tới số [phone ].
                            </span>
                        </div>
                    </div>
                ))}
            </main>

            <footer>
                <Footer />
            </footer>
        </div>
    );
}

export default PaymentSuccess;
