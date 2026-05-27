import classNames from 'classnames/bind';
import styles from '../Styles/CardBody.module.scss';

import { Link } from 'react-router-dom';

const cx = classNames.bind(styles);

function CardBody({ item }) {
    const hasDiscount = item?.hasDiscount && item?.discountPercentage > 0;

    return (
        <Link style={{ textDecoration: 'none' }} to={`/product/${item?._id}/${item?.slug}`}>
            <div className={cx('wrapper')}>
                <div className={cx('img')}>
                    <img src={`${process.env.REACT_APP_IMG}/${item?.img[0]}`} alt="" />
                    {hasDiscount && (
                        <div className={cx('discount-badge')}>
                            -{item?.discountPercentage}%
                        </div>
                    )}
                </div>
                <div className={cx('info')}>
                    <h2>{item?.name}</h2>
                    <div className={cx('price-section')}>
                        {hasDiscount ? (
                            <>
                                <span className={cx('original-price')}>
                                    {item?.originalPrice?.toLocaleString()} đ
                                </span>
                                <span className={cx('discount-price')}>
                                    {item?.price?.toLocaleString()} đ
                                </span>
                            </>
                        ) : (
                            <span>{item?.price?.toLocaleString()} đ</span>
                        )}
                    </div>
                </div>
            </div>
        </Link>
    );
}

export default CardBody;
