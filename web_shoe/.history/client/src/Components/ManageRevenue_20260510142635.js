import { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ChartOptions,
} from 'chart.js';
import classNames from 'classnames/bind';
import styles from '../Styles/ManageRevenue.module.scss';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const cx = classNames.bind(styles);

function ManageRevenue() {
    const [revenueData, setRevenueData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchRevenueStatistics();
    }, []);

    const fetchRevenueStatistics = async () => {
        try {
            setLoading(true);
            const response = await fetch('http://localhost:5001/api/revenue-statistics');
            if (!response.ok) {
                throw new Error('Failed to fetch revenue statistics');
            }
            const data = await response.json();
            setRevenueData(data);
            setError(null);
        } catch (err) {
            console.error('Error fetching revenue statistics:', err);
            setError(err.message);
            setRevenueData(null);
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

    if (loading) {
        return (
            <div className={cx('manage-revenue')}>
                <p className={cx('loading')}>Đang tải dữ liệu...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className={cx('manage-revenue')}>
                <p className={cx('error')}>Lỗi: {error}</p>
                <button className={cx('retry-btn')} onClick={fetchRevenueStatistics}>
                    Thử lại
                </button>
            </div>
        );
    }

    if (!revenueData) {
        return (
            <div className={cx('manage-revenue')}>
                <p className={cx('no-data')}>Không có dữ liệu</p>
            </div>
        );
    }

    // Prepare chart data
    const chartData = {
        labels: revenueData.weekData.map((item) => item.day),
        datasets: [
            {
                label: 'Số lượng sản phẩm đã bán',
                data: revenueData.weekData.map((item) => item.quantity),
                backgroundColor: 'rgba(75, 192, 192, 0.8)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 2,
                borderRadius: 4,
                yAxisID: 'y',
            },
            {
                label: 'Doanh thu (VND)',
                data: revenueData.weekData.map((item) => item.revenue / 1000000), // Convert to millions for better scale
                backgroundColor: 'rgba(255, 159, 64, 0.8)',
                borderColor: 'rgba(255, 159, 64, 1)',
                borderWidth: 2,
                borderRadius: 4,
                yAxisID: 'y1',
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: true,
        interaction: {
            mode: 'index',
            intersect: false,
        },
        plugins: {
            legend: {
                position: 'top',
                labels: {
                    font: {
                        size: 12,
                        weight: 'bold',
                    },
                    padding: 15,
                },
            },
            title: {
                display: true,
                text: 'Thống kê doanh thu tuần này',
                font: {
                    size: 16,
                    weight: 'bold',
                },
                padding: 20,
            },
            tooltip: {
                callbacks: {
                    label: function (context) {
                        let label = context.dataset.label || '';
                        if (label) {
                            label += ': ';
                        }
                        if (context.datasetIndex === 0) {
                            // Quantity
                            label += context.parsed.y + ' sản phẩm';
                        } else {
                            // Revenue in millions
                            label += context.parsed.y.toFixed(2) + ' triệu VND';
                        }
                        return label;
                    },
                },
            },
        },
        scales: {
            y: {
                type: 'linear',
                display: true,
                position: 'left',
                title: {
                    display: true,
                    text: 'Số lượng sản phẩm',
                    font: {
                        weight: 'bold',
                    },
                },
                grid: {
                    drawBorder: true,
                },
            },
            y1: {
                type: 'linear',
                display: true,
                position: 'right',
                title: {
                    display: true,
                    text: 'Doanh thu (Triệu VND)',
                    font: {
                        weight: 'bold',
                    },
                },
                grid: {
                    drawOnChartArea: false,
                },
            },
            x: {
                grid: {
                    display: false,
                },
            },
        },
    };

    return (
        <div className={cx('manage-revenue')}>
            {/* Overview Section */}
            <div className={cx('overview-section')}>
                <div className={cx('overview-grid')}>
                    {/* Users Card */}
                    <div className={cx('overview-card')}>
                        <div className={cx('card-icon', 'users-icon')}>
                            <i className="fas fa-users"></i>
                        </div>
                        <div className={cx('card-content')}>
                            <h3 className={cx('card-label')}>Người dùng</h3>
                            <p className={cx('card-value')}>{revenueData.overview.users.toLocaleString('vi-VN')}</p>
                        </div>
                    </div>

                    {/* Orders Card */}
                    <div className={cx('overview-card')}>
                        <div className={cx('card-icon', 'orders-icon')}>
                            <i className="fas fa-shopping-bag"></i>
                        </div>
                        <div className={cx('card-content')}>
                            <h3 className={cx('card-label')}>Đơn hàng</h3>
                            <p className={cx('card-value')}>{revenueData.overview.orders.toLocaleString('vi-VN')}</p>
                        </div>
                    </div>

                    {/* Revenue Card */}
                    <div className={cx('overview-card')}>
                        <div className={cx('card-icon', 'revenue-icon')}>
                            <i className="fas fa-chart-line"></i>
                        </div>
                        <div className={cx('card-content')}>
                            <h3 className={cx('card-label')}>Doanh thu</h3>
                            <p className={cx('card-value')}>{formatCurrency(revenueData.overview.revenue)}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Chart Section */}
            <div className={cx('chart-section')}>
                <div className={cx('chart-container')}>
                    <Bar data={chartData} options={chartOptions} />
                </div>
            </div>
        </div>
    );
}

export default ManageRevenue;
