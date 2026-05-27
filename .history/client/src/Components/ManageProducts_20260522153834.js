import classNames from 'classnames/bind';
import styles from '../Styles/ManageProducts.module.scss';
import Pagination from './Pagination';

import React, { useState, useEffect } from 'react';
import ModalDeletePro from '../utils/Modal/DeleteProduct';
import ModalUpdatePro from '../utils/Modal/ModalUpdatePro';
import { ToastContainer } from 'react-toastify';

import request from '../Config/api';

const cx = classNames.bind(styles);

function ManageProducts({ setCheckOpenAddProduct }) {
    const [page, setPage] = useState(1);

    const [selectedProduct, setSelectedProduct] = useState({});

    const [showModalDelete, setShowModalDelete] = useState(false);
    const [showModalUpdate, setShowModalUpdate] = useState(false);

    const [dataProduct, setDataProduct] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all');

    const productsPerPage = 6;
    
    // Lọc và tìm kiếm
    const filteredProducts = dataProduct.filter((product) => {
        const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = filterType === 'all' || product.type === parseInt(filterType);
        return matchesSearch && matchesType;
    });

    const startIndex = (page - 1) * productsPerPage;
    const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
    const currentProducts = filteredProducts.slice(startIndex, startIndex + productsPerPage);

    const handlePageChange = (event, value) => {
        setPage(value);
    };

    const handleShowModalDelete = (item) => {
        setSelectedProduct(item);
        setShowModalDelete(true);
    };

    const handleShowModalUpdate = (item) => {
        setSelectedProduct(item);
        setShowModalUpdate(true);
    };

    useEffect(() => {
        fetchData();
    }, [showModalDelete, showModalUpdate]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const productsResponse = await request.get('/api/products');
            setDataProduct(productsResponse.data);
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
        setPage(1); // Reset to first page when searching
    };

    const handleFilterChange = (e) => {
        setFilterType(e.target.value);
        setPage(1); // Reset to first page when filtering
    };

    return (
        <div>
            <ToastContainer />
            <div className={cx('manage-product')}>
                <div className={cx('title')}>
                    <h2 style={{ fontWeight: 'bold' }}>Quản Lý Sản Phẩm</h2>
                    <button onClick={() => setCheckOpenAddProduct(true)} type="button" className="btn btn-primary">
                        Thêm Sản Phẩm
                    </button>
                </div>

                {/* Search và Filter */}
                <div className={cx('search-filter')}>
                    <div className={cx('search-box')}>
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Tìm kiếm sản phẩm theo tên..."
                            value={searchTerm}
                            onChange={handleSearchChange}
                        />
                    </div>
                    <div className={cx('filter-box')}>
                        <select
                            className="form-select"
                            value={filterType}
                            onChange={handleFilterChange}
                        >
                            <option value="all">Tất cả loại giày</option>
                            <option value="1">Giày Nam</option>
                            <option value="2">Giày Nữ</option>
                            <option value="3">Giày Trẻ Em</option>
                        </select>
                    </div>
                </div>

                <div className="table-responsive mt-4">
                    <table className="table table-bordered border-primary">
                        <thead>
                            <tr>
                                <th scope="col" style={{ fontWeight: 'bold' }}>Ảnh</th>
                                <th scope="col" style={{ fontWeight: 'bold' }}>Tên Sản Phẩm</th>
                                <th scope="col" style={{ fontWeight: 'bold' }}>Loại Giày</th>
                                <th scope="col" style={{ fontWeight: 'bold' }}>Giá Sản Phẩm</th>
                                <th scope="col" style={{ fontWeight: 'bold' }}>Danh Sách Size</th>
                                <th scope="col" style={{ fontWeight: 'bold' }}>Hành Động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentProducts.map((item) => (
                                <tr key={item._id}>
                                    <td>
                                        <img
                                            style={{ width: '80px' }}
                                            src={`${process.env.REACT_APP_IMG}/${item.img[0]}`}
                                            alt=""
                                        />
                                    </td>
                                    <td>{item.name}</td>
                                    <td>
                                        {item.type === 1 ? 'Giày Nam' : item.type === 2 ? 'Giày Nữ' : 'Giày Trẻ Em'}
                                    </td>
                                    <td>{item.price.toLocaleString()} đ</td>
                                    <td>
                                        {item.sizes && item.sizes.length > 0 ? (
                                            <span>
                                                {item.sizes.map((s, idx) => (
                                                    <div key={idx} style={{ fontSize: '12px', marginBottom: '4px' }}>
                                                        Size {s.size}: {s.quantity} đôi
                                                    </div>
                                                ))}
                                            </span>
                                        ) : (
                                            <span style={{ color: '#999' }}>Không có size</span>
                                        )}
                                    </td>
                                    <td>
                                        <button
                                            style={{ marginRight: '15px' }}
                                            className="btn btn-danger"
                                            onClick={() => handleShowModalDelete(item)}
                                        >
                                            Xóa
                                        </button>
                                        <button
                                            className={cx('btn-update', 'btn', 'btn-warning')}
                                            onClick={() => handleShowModalUpdate(item)}
                                        >
                                            Sửa
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div className={cx('pagination')}>
                        <Pagination totalPages={totalPages} page={page} handlePageChange={handlePageChange} />
                    </div>
                </div>
            </div>
            <ModalDeletePro show={showModalDelete} setShow={setShowModalDelete} nameProduct={selectedProduct} />
            <ModalUpdatePro show={showModalUpdate} setShow={setShowModalUpdate} data={selectedProduct} />
        </div>
    );
}

export default ManageProducts;
