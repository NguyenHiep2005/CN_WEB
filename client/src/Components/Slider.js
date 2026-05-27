import classNames from 'classnames/bind';
import styles from '../Styles/Slider.module.scss';
import banner from '../assests/imgs/banner.jpg';

const cx = classNames.bind(styles);

function Slider() {
    return (
        <div className={cx('wrapper')}>
            <div id={cx('slider')}>
                <img src={banner} alt="Banner" style={{ height: '600px' }} />
            </div>
            <div className={cx('container')}>
                <div className={cx('box')}>
                    <img
                        src="https://i0.wp.com/peaksport.vn/wp-content/uploads/2023/11/icon-3.png?resize=40%2C41&ssl=1"
                        alt=""
                    />
                    <div id={cx('info')}>
                        <span style={{ fontWeight: '800' }}>Miễn phí vận chuyển</span>
                        <span>Cho đơn hàng từ 2000k</span>
                    </div>
                </div>

                <div className={cx('box')}>
                    <img
                        src="https://i0.wp.com/peaksport.vn/wp-content/uploads/2023/11/icon.png?resize=40%2C41&ssl=1"
                        alt=""
                    />
                    <div id={cx('info')}>
                        <span style={{ fontWeight: '800' }}>Bảo hành 12 tháng</span>
                        
                    </div>
                </div>

                <div className={cx('box')}>
                    <img
                        src="https://i0.wp.com/peaksport.vn/wp-content/uploads/2023/11/icon-1-1.png?resize=40%2C41&ssl=1"
                        alt=""
                    />
                    <div id={cx('info')}>
                        <span style={{ fontWeight: '800' }}>Thanh toán đa dạng</span>
                        
                    </div>
                </div>

                <div style={{ borderRight: 'none' }} className={cx('box')}>
                    <img
                        src="https://i0.wp.com/peaksport.vn/wp-content/uploads/2023/11/icon-2-1.png?resize=40%2C41&ssl=1"
                        alt=""
                    />
                    <div id={cx('info')}>
                        <span style={{ fontWeight: '800' }}>Hotline: 115</span>
                        <span>Hỗ trợ bạn 24/7</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Slider;
