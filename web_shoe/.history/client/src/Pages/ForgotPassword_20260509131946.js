import classNames from 'classnames/bind';
import styles from '../Styles/ForgotPassword.module.scss';
import Header from '../Components/Header';

import request from '../Config/api';

import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const cx = classNames.bind(styles);

function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [isOtpSent, setIsOtpSent] = useState(false);
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const navigate = useNavigate();

    // Step 1: Send OTP to email
    const handleSendOtp = async () => {
        try {
            if (!email.trim()) {
                toast.error('Vui lòng nhập email !!!');
                return;
            }

            const res = await request.post('/api/forgotpassword', { email });
            toast.success(res.data.message);
            setIsOtpSent(true);
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Đã xảy ra lỗi';
            toast.error(errorMessage);
        }
    };

    // Step 2: Verify OTP and reset password
    const handleResetPassword = async () => {
        try {
            if (!otp.trim() || !newPassword.trim() || !confirmPassword.trim()) {
                toast.error('Vui lòng điền đầy đủ thông tin !!!');
                return;
            }

            if (newPassword !== confirmPassword) {
                toast.error('Mật khẩu không trùng khớp !!!');
                return;
            }

            const res = await request.post('/api/resetpassword', {
                email,
                otp,
                newPassword,
            });

            toast.success(res.data.message);
            setTimeout(() => {
                navigate('/login');
            }, 2000);
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Đã xảy ra lỗi';
            toast.error(errorMessage);
        }
    };

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <>
            <ToastContainer />
            <header>
                <Header />
            </header>

            <div className={cx('wrapper')}>
                {!isOtpSent ? (
                    // Step 1: Enter email
                    <main className={cx('main')}>
                        <div className={cx('inner')}>
                            <h1>Quên Mật Khẩu</h1>
                            <p style={{ marginBottom: '20px', color: '#666' }}>Nhập email của bạn để nhận mã OTP</p>
                            <div style={{ marginBottom: '15px' }}>
                                <label>Email</label>
                                <input
                                    placeholder="Nhập email đăng ký"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    type="email"
                                />
                            </div>
                            <button onClick={handleSendOtp}>Gửi Mã OTP</button>
                        </div>
                    </main>
                ) : (
                    // Step 2: Enter OTP and new password
                    <main className={cx('main')}>
                        <div className={cx('inner-reset-password')}>
                            <h1>Đặt Lại Mật Khẩu</h1>
                            <p style={{ marginBottom: '20px', color: '#666' }}>Mã OTP đã được gửi đến {email}</p>

                            <div>
                                <label>Mã OTP (6 chữ số)</label>
                                <input
                                    placeholder="Nhập mã OTP"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    maxLength="6"
                                />
                            </div>

                            <div>
                                <label>Mật Khẩu Mới</label>
                                <input
                                    type="password"
                                    placeholder="Nhập mật khẩu mới"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                />
                            </div>

                            <div>
                                <label>Xác Nhận Mật Khẩu</label>
                                <input
                                    type="password"
                                    placeholder="Xác nhận mật khẩu mới"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                />
                            </div>

                            <button onClick={handleResetPassword}>Đổi Mật Khẩu</button>

                            <div style={{ marginTop: '15px', textAlign: 'center' }}>
                                <button
                                    onClick={() => {
                                        setIsOtpSent(false);
                                        setOtp('');
                                        setNewPassword('');
                                        setConfirmPassword('');
                                    }}
                                    style={{
                                        background: '#f0f0f0',
                                        color: '#666',
                                        border: 'none',
                                        padding: '8px 15px',
                                        cursor: 'pointer',
                                        borderRadius: '5px',
                                    }}
                                >
                                    Quay Lại
                                </button>
                            </div>
                        </div>
                    </main>
                )}
            </div>
        </>
    );
}

export default ForgotPassword;
