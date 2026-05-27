import { useState, useEffect } from 'react';
import classNames from 'classnames/bind';
import styles from '../Styles/ManageProductStatistics.module.scss';
import Pagination from './Pagination';

const cx = classNames.bind(styles);

function ManageProductStatistics() {
    const [statisticsData, setStatisticsData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [page, setPage] = useState(1);
    const [expandedDate, setExpandedDate] = useState(null);

    const itemsPerPage = 5;

    useEffect(() => {
        fetchProductStatistics();
    }, []);

    const fetchProductStatistics = async () => {
        try {
            setLoading(true);
            const response = await fetch('http://localhost:5001/api/product-statistics');
            if (!response.ok) {
                throw new Error('Failed to fetch product statistics');
            }
            const data = await response.json();
            setStatisticsData(data);
            setError(null);
            setPage(1);
        } catch (err) {
            console.error('Error fetching product statistics:', err);
            setError(err.message);
            setStatisticsData(null);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value);
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    if (loading) {
        return (
            <div className={cx('manage-statistics')}>
                <h4>Thống Kê Sản Phẩm Theo Ngày</h4>
                <p className={cx('loading')}>Đang tải dữ liệu...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className={cx('manage-statistics')}>
                <h4>Thống Kê Sản Phẩm Theo Ngày</h4>
                <p className={cx('error')}>Lỗi: {error}</p>
                <button className={cx('retry-btn')} onClick={fetchProductStatistics}>
                    Thử lại
                </button>
            </div>
        );
    }

    if (!statisticsData || statisticsData.data.length === 0) {
        return (
            <div className={cx('manage-statistics')}>
                <h4>Thống Kê Sản Phẩm Theo Ngày</h4>
                <p className={cx('no-data')}>Không có dữ liệu</p>
            </div>
        );
    }

    const totalPages = Math.ceil(statisticsData.data.length / itemsPerPage);
    const startIndex = (page - 1) * itemsPerPage;
    const currentData = statisticsData.data.slice(startIndex, startIndex + itemsPerPage);

    const handlePageChange = (event, value) => {
        setPage(value);
        setExpandedDate(null);
    };

    return (
        <div className={cx('manage-statistics')}>
            <h4>Thống Kê Sản Phẩm Theo Ngày</h4>

            <div className={cx('statistics-info')}>
                <p>
                    Tổng số ngày có bán hàng: <strong>{statisticsData.totalDays}</strong>
                </p>
            </div>

            <div className={cx('daily-list')}>
                {currentData.map((dayData) => (
                    <div key={dayData.date} className={cx('daily-item')}>
                        <div
                            className={cx('daily-header')}
                            onClick={() =>
                                setExpandedDate(expandedDate === dayData.date ? null : dayData.date)
                            }
                        >
                            <div className={cx('date-info')}>
                                <span className={cx('date-label')}>{formatDate(dayData.date)}</span>
                                <span className={cx('product-count')}>
                                    {dayData.products.length} sản phẩm
                                </span>
                            </div>
                            <i
                                className={cx('toggle-icon', {
                                    expanded: expandedDate === dayData.date,
                                })}
                            >
                                {expandedDate === dayData.date ? '▼' : '▶'}
                            </i>
                        </div>

                        {expandedDate === dayData.date && (
                            <div className={cx('daily-products')}>
                                <table className={cx('products-table')}>
                                    <thead>
                                        <tr>
                                            <th>Tên Sản Phẩm</th>
                                            <th>Size</th>
                                            <th>Số Lượng</th>
                                            <th>Giá Bán</th>
                                            <th>Thành Tiền</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {dayData.products.map((product, idx) => (
                                            <tr key={idx}>
                                                <td>{product.nameProduct}</td>
                                                <td>{product.size}</td>
                                                <td className={cx('quantity')}>
                                                    {product.quantity}
                                                </td>
                                                <td>{formatCurrency(product.price)}</td>
                                                <td className={cx('total')}>
                                                    {formatCurrency(product.price * product.quantity)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>

                                <div className={cx('daily-summary')}>
                                    <p>
                                        Tổng sản phẩm:{' '}
                                        <strong>
                                            {dayData.products.reduce(
                                                (sum, p) => sum + p.quantity,
                                                0
                                            )}{' '}
                                            cái
                                        </strong>
                                    </p>
                                    <p>
                                        Tổng doanh thu:{' '}
                                        <strong>
                                            {formatCurrency(
                                                dayData.products.reduce(
                                                    (sum, p) => sum + p.price * p.quantity,
                                                    0
                                                )
                                            )}
                                        </strong>
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <div className={cx('pagination')}>
                <Pagination page={page} totalPages={totalPages} handlePageChange={handlePageChange} />
            </div>
        </div>
    );
}

export default ManageProductStatistics;
