import classNames from 'classnames/bind';
import styles from '../Styles/FeatureGrid.module.scss';

const cx = classNames.bind(styles);

function FeatureGrid() {
    return (
        <div className={cx('wrapper')}>
            <div className={cx('inner')}>
                <h2>MẪU GIÀY NIKE SẮP RA MẮT</h2>
                <div className={cx('img-grid')}>
                    <div className={cx('img-item')}>
                        <img
                            src="https://static.nike.com/a/images/t_web_pdp_535_v2/f_auto,u_9ddf04c7-2a9a-4d76-add1-d15af8f0263d,c_scale,fl_relative,w_1.0,h_1.0,fl_layer_apply/47b7945e-a379-4c24-b9df-98f4eef178e5/NIKE+AIR+MAX+PLUS.png"
                            alt=""
                        />
                        <span>NIKESHOP BLACKPULL 1 </span>
                    </div>

                    <div className={cx('img-item')}>
                        <img
                            src="https://static.nike.com/a/images/t_web_pdp_535_v2/f_auto,u_9ddf04c7-2a9a-4d76-add1-d15af8f0263d,c_scale,fl_relative,w_1.0,h_1.0,fl_layer_apply/63e4623a-42a1-4983-a2f3-0b02cbbb0b2a/SHOX+TL+%28GS%29.png"
                            alt=""
                        />
                        <span>NIKESHOP SEALONE </span>
                    </div>

                    <div className={cx('img-item')}>
                        <img
                            src="https://static.nike.com/a/images/t_web_pdp_535_v2/f_auto,u_9ddf04c7-2a9a-4d76-add1-d15af8f0263d,c_scale,fl_relative,w_1.0,h_1.0,fl_layer_apply/f630be88-0acf-4d04-bb1e-0be8a179aa61/AIR+MAX+95+BB+LTR+SE+%28GS%29.png"
                            alt=""
                        />
                        <span>NIKESHOP ATALANTA </span>
                    </div>

                    <div className={cx('img-item')}>
                        <img
                            src="https://static.nike.com/a/images/t_web_pdp_535_v2/f_auto,u_9ddf04c7-2a9a-4d76-add1-d15af8f0263d,c_scale,fl_relative,w_1.0,h_1.0,fl_layer_apply/a2b045e0-f73d-45e4-bac8-8510270fde8f/AIR+MAX+95+BB+LTR+%28GS%29.png"
                            alt=""
                        />
                        <span>NIKESHOP SAPHIA </span>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default FeatureGrid;
