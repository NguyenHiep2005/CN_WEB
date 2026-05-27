import classNames from 'classnames/bind';
import styles from '../Styles/ManageOrder.module.scss';
import Pagination from './Pagination';

import { useEffect, useState } from 'react';
import request from '../Config/api';
import ModalEditOrder from '../utils/Modal/ModalEditOrder';
import { formatVietnamDate } from '../utils/formatVietnamTime';

import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ModalCancelOrder from '../utils/Modal/CancelOrder';

const cx = classNames.bind(styles);

function ManageOrder() {
    const [dataCart, setDataCart] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [idPro, setIdPro] = useState(0);
    const [address, setAddress] = useState('');
    const [showModalCancelOrder, setShowModalCancelOrder] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState({});
    const [searchName, setSearchName] = useState('');
    const [searchPhone, setSearchPhone] = useState('');
    const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'pending', 'completed'

    useEffect(() => {
        const fetchData = async () => {
            const cartResponse = await request.get('api/getallorder');
            setDataCart(cartResponse.data);
            setFilteredData(cartResponse.data);
        };

        fetchData();
    }, [showModal, showModalCancelOrder]);

    // Filter and search logic
    useEffect(() => {
        let result = dataCart;

        // Filter by status
        if (statusFilter !== 'all') {
            result = result.filter(item => {
                if (statusFilter === 'pending') return !item.tinhtrang;
                if (statusFilter === 'completed') return item.tinhtrang;
                return true;
            });
        }

        // Search by name
        if (searchName.trim()) {
            result = result.filter(item =>
                item.username.toLowerCase().includes(searchName.toLowerCase())
            );
        }

        // Search by phone - include "0" prefix in search
        if (searchPhone.trim()) {
            result = result.filter(item => {
                const phoneWithZero = `0${item.phone}`;
                return phoneWithZero.includes(searchPhone);
            });
        }

        // Sort by date - newest (today) first
        result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        setFilteredData(result);
    }, [searchName, searchPhone, statusFilter, dataCart]);

    const [page, setPage] = useState(1);
    const productsPerPage = 5;
    const startIndex = (page - 1) * productsPerPage;
    const totalPages = Math.ceil(filteredData.length / productsPerPage);
    const currentProducts = filteredData.slice(startIndex, startIndex + productsPerPage);

    const handlePageChange = (event, value) => {
        setPage(value);
    };

    const handleShowModalEdit = (id, orderData = {}) => {
        setShowModal(true);
        setIdPro(id);
        setAddress(orderData);
    };

    const handleShowModalCancelOrder = (item) => {
        setSelectedProduct(item);
        setShowModalCancelOrder(true);
    };

    return (
        <div className={cx('manage-product')}>
            <ToastContainer />
            <h2 style={{ fontSize: '25px', marginBottom: '20px' }}>Quản Lý Đơn Hàng</h2>
            
            {/* Search and Filter Section */}
            <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '5px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                    <div>
                        <label style={{ fontSize: '14px', fontWeight: 'bold' }}>Tìm theo tên:</label>
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Nhập tên khách hàng..."
                            value={searchName}
                            onChange={(e) => {
                                setSearchName(e.target.value);
                                setPage(1);
                            }}
                        />
                    </div>
                    <div>
                        <label style={{ fontSize: '14px', fontWeight: 'bold' }}>Tìm theo số điện thoại:</label>
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Nhập số điện thoại..."
                            value={searchPhone}
                            onChange={(e) => {
                                setSearchPhone(e.target.value);
                                setPage(1);
                            }}
                        />
                    </div>
                    <div>
                        <label style={{ fontSize: '14px', fontWeight: 'bold' }}>Lọc theo trạng thái:</label>
                        <select
                            className="form-control"
                            value={statusFilter}
                            onChange={(e) => {
                                setStatusFilter(e.target.value);
                                setPage(1);
                            }}
                        >
                            <option value="all">Tất cả</option>
                            <option value="pending">Chuẩn Bị Hàng</option>
                            <option value="completed">Đã Giao Thành Công</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="table-responsive">
                <table className="table table-bordered border-primary">
                    <thead style={{ border: 'inherit' }} className="table-light">
                        <tr>
                            <th scope="col">Người Dùng</th>
                            <th scope="col">Số Điện Thoại</th>
                            <th scope="col">Tỉnh/Thành Phố</th>
                            <th scope="col">Quận/Huyện</th>
                            <th scope="col">Xã/Phường</th>
                            <th scope="col">Địa Chỉ</th>
                            <th scope="col">Tên Đơn Hàng</th>
                            <th scope="col">Size</th>
                            <th scope="col">Số Lượng</th>
                            <th scope="col">Tổng Giá Tiền</th>
                            <th scope="col">Thời Gian Đặt</th>
                            <th scope="col">Tình Trạng</th>
                            <th scope="col">Hành Động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentProducts.map((item) =>
                            item.products.map((item2, index) => (
                                <tr key={item2._id}>
                                    {index === 0 && (
                                        <>
                                            <td rowSpan={item.products.length}>{item.username}</td>
                                            <td rowSpan={item.products.length}>{`0${item.phone}`}</td>
                                            <td rowSpan={item.products.length}>{item.province || 'N/A'}</td>
                                            <td rowSpan={item.products.length}>{item.district || 'N/A'}</td>
                                            <td rowSpan={item.products.length} style={{ maxWidth: '150px', wordBreak: 'break-word' }}>{item.address}</td>
                                        </>
                                    )}
                                    <td>{item2.nameProduct}</td>
                                    <td>{item2.size || 'N/A'}</td>
                                    <td>{item2.quantity}</td>
                                    {index === 0 && (
                                        <>
                                            <td rowSpan={item.products.length}>{item.sumprice.toLocaleString()} đ</td>
                                            <td rowSpan={item.products.length}>
                                                {formatVietnamDate(item.createdAt)}
                                            </td>
                                            <td rowSpan={item.products.length}>
                                                {item.tinhtrang ? 'Đã Giao Thành Công' : 'Chuẩn Bị Hàng'}
                                            </td>
                                            <td rowSpan={item.products.length}>
                                                <button
                                                    onClick={() => handleShowModalEdit(item._id, {
                                                        name: item.username,
                                                        phone: item.phone,
                                                        province: item.province,
                                                        district: item.district,
                                                        address: item.address,
                                                        notes: item.notes
                                                    })}
                                                    className="btn btn-primary"
                                                    style={{ marginRight: '10px', fontSize: '12px', padding: '5px 10px' }}
                                                >
                                                    Xác Nhận
                                                </button>
                                                <button
                                                    onClick={() => handleShowModalCancelOrder(item._id)}
                                                    className="btn btn-danger"
                                                    style={{ fontSize: '12px', padding: '5px 10px' }}
                                                >
                                                    Hủy
                                                </button>
                                            </td>
                                        </>
                                    )}
                                </tr>
                            )),
                        )}
                    </tbody>
                </table>
                <div className={cx('pagination')}>
                    <Pagination page={page} totalPages={totalPages} handlePageChange={handlePageChange} />
                </div>
            </div>
            <ModalEditOrder show={showModal} setShow={setShowModal} id={idPro} address={address} />
            <ModalCancelOrder show={showModalCancelOrder} setShow={setShowModalCancelOrder} item={selectedProduct} />
        </div>
    );
}

export default ManageOrder;
