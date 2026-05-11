import classNames from 'classnames/bind';
import styles from '../Styles/ManageCategories.module.scss';
import React, { useState, useEffect } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import request from '../Config/api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowUp, faArrowDown, faEdit, faTrash, faTag, faTimesCircle } from '@fortawesome/free-solid-svg-icons';

const cx = classNames.bind(styles);

// Category Type constants
const CATEGORY_TYPES = {
    1: 'Giày Nam',
    2: 'Giày Nữ',
    3: 'Giày Trẻ Em',
};

const BRANDS = ['Nike', 'Adidas', 'Puma', 'Vans'];

function ManageCategories() {
    const [categories, setCategories] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showDiscountModal, setShowDiscountModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [filterType, setFilterType] = useState('all');
    const [filterBrand, setFilterBrand] = useState('all');
    const [sortOrder, setSortOrder] = useState('asc');
    const [searchTerm, setSearchTerm] = useState('');
    const [discountPercentage, setDiscountPercentage] = useState(0);

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        icon: '',
        categoryType: 1,
        brand: 'Nike',
        order: 0,
    });

    // Fetch categories
    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const response = await request.get('/api/categories');
            setCategories(response.data);
        } catch (error) {
            console.error('Error fetching categories:', error);
            toast.error('Lỗi khi tải danh mục');
        }
    };

    // Filter and search categories
    const filteredCategories = categories.filter((cat) => {
        const typeMatch = filterType === 'all' || cat.categoryType === parseInt(filterType);
        const brandMatch = filterBrand === 'all' || cat.brand === filterBrand;
        const searchMatch = cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          cat.description.toLowerCase().includes(searchTerm.toLowerCase());
        return typeMatch && brandMatch && searchMatch;
    });

    // Sort categories
    const sortedCategories = [...filteredCategories].sort((a, b) => {
        if (sortOrder === 'asc') {
            return a.order - b.order;
        } else {
            return b.order - a.order;
        }
    });

    const handleOpenModal = (category = null) => {
        if (category) {
            setEditingCategory(category);
            setFormData({
                name: category.name,
                description: category.description,
                icon: category.icon,
                categoryType: category.categoryType,
                brand: category.brand,
                order: category.order,
            });
        } else {
            setEditingCategory(null);
            setFormData({
                name: '',
                description: '',
                icon: '',
                categoryType: 1,
                brand: 'Nike',
                order: 0,
            });
        }
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingCategory(null);
    };

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: name === 'categoryType' || name === 'order' ? parseInt(value) : value,
        });
    };

    const handleSaveCategory = async () => {
        try {
            if (!formData.name.trim()) {
                toast.error('Vui lòng nhập tên danh mục');
                return;
            }

            if (editingCategory) {
                // Update category
                const response = await request.post(`/api/category/update?id=${editingCategory._id}`, formData);
                toast.success(response.data.message);
            } else {
                // Create new category
                const response = await request.post('/api/category/create', formData);
                toast.success(response.data.message);
            }
            handleCloseModal();
            fetchCategories();
        } catch (error) {
            console.error('Error saving category:', error);
            toast.error(error.response?.data?.message || 'Lỗi khi lưu danh mục');
        }
    };

    const handleOpenDeleteModal = (category) => {
        setSelectedCategory(category);
        setShowDeleteModal(true);
    };

    const handleConfirmDelete = async () => {
        try {
            const response = await request.delete(`/api/category/delete?id=${selectedCategory._id}`);
            toast.success(response.data.message);
            setShowDeleteModal(false);
            fetchCategories();
        } catch (error) {
            console.error('Error deleting category:', error);
            toast.error('Lỗi khi xóa danh mục');
        }
    };

    const handleOpenDiscountModal = (category) => {
        setSelectedCategory(category);
        setDiscountPercentage(category.discountPercentage || 0);
        setShowDiscountModal(true);
    };

    const handleApplyDiscount = async () => {
        try {
            if (discountPercentage < 0 || discountPercentage > 100) {
                toast.error('Phần trăm giảm giá phải từ 0-100');
                return;
            }

            const response = await request.post(
                `/api/category/apply-discount?id=${selectedCategory._id}`,
                { discountPercentage }
            );
            toast.success(response.data.message);
            setShowDiscountModal(false);
            fetchCategories();
        } catch (error) {
            console.error('Error applying discount:', error);
            toast.error(error.response?.data?.message || 'Lỗi khi áp dụng khuyến mại');
        }
    };

    const handleRemoveDiscount = async () => {
        try {
            const response = await request.post(`/api/category/remove-discount?id=${selectedCategory._id}`);
            toast.success(response.data.message);
            setShowDiscountModal(false);
            fetchCategories();
        } catch (error) {
            console.error('Error removing discount:', error);
            toast.error('Lỗi khi dừng khuyến mại');
        }
    };

    const handleChangeOrder = async (category, newOrder) => {
        try {
            await request.post(`/api/category/update?id=${category._id}`, {
                ...category,
                order: newOrder,
            });
            fetchCategories();
            toast.success('Cập nhật thứ tự thành công');
        } catch (error) {
            console.error('Error updating order:', error);
            toast.error('Lỗi khi cập nhật thứ tự');
        }
    };

    const handleMoveUp = (index) => {
        if (index > 0) {
            const currentOrder = sortedCategories[index].order;
            const previousOrder = sortedCategories[index - 1].order;
            handleChangeOrder(sortedCategories[index], previousOrder - 1);
        }
    };

    const handleMoveDown = (index) => {
        if (index < sortedCategories.length - 1) {
            const currentOrder = sortedCategories[index].order;
            const nextOrder = sortedCategories[index + 1].order;
            handleChangeOrder(sortedCategories[index], nextOrder + 1);
        }
    };

    return (
        <div className={cx('wrapper')}>
            <ToastContainer />

            {/* Header and Add Button */}
            <div className={cx('header')}>
                <h2>Quản Lý Danh Mục</h2>
                <button
                    onClick={() => handleOpenModal()}
                    type="button"
                    className="btn btn-primary"
                >
                    + Thêm Danh Mục
                </button>
            </div>

            {/* Search and Filter */}
            <div className={cx('controls')}>
                <div className={cx('search-box')}>
                    <input
                        type="text"
                        className="form-control"
                        placeholder="Tìm kiếm danh mục..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className={cx('filter-box')}>
                    <select
                        className="form-select"
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                    >
                        <option value="all">Tất cả loại giày</option>
                        <option value="1">Giày Nam</option>
                        <option value="2">Giày Nữ</option>
                        <option value="3">Giày Trẻ Em</option>
                    </select>
                </div>
                <div className={cx('filter-box')}>
                    <select
                        className="form-select"
                        value={filterBrand}
                        onChange={(e) => setFilterBrand(e.target.value)}
                    >
                        <option value="all">Tất cả thương hiệu</option>
                        {BRANDS.map((brand) => (
                            <option key={brand} value={brand}>
                                {brand}
                            </option>
                        ))}
                    </select>
                </div>
                <div className={cx('filter-box')}>
                    <select
                        className="form-select"
                        value={sortOrder}
                        onChange={(e) => setSortOrder(e.target.value)}
                    >
                        <option value="asc">Thứ tự tăng dần</option>
                        <option value="desc">Thứ tự giảm dần</option>
                    </select>
                </div>
            </div>

            {/* Categories Table */}
            <div className="table-responsive mt-4">
                <table className="table table-bordered border-primary">
                    <thead>
                        <tr>
                            <th>Tên Danh Mục</th>
                            <th>Loại Giày</th>
                            <th>Thương Hiệu</th>
                            <th>Mô Tả</th>
                            <th>Thứ Tự</th>
                            <th>Hành Động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedCategories.map((category, index) => (
                            <tr key={category._id}>
                                <td>{category.name}</td>
                                <td>{CATEGORY_TYPES[category.categoryType]}</td>
                                <td>{category.brand}</td>
                                <td>{category.description || '-'}</td>
                                <td>{category.order}</td>
                                <td className={cx('actions')}>
                                    <button
                                        className="btn btn-sm btn-info"
                                        onClick={() => handleMoveUp(index)}
                                        title="Di chuyển lên"
                                    >
                                        <FontAwesomeIcon icon={faArrowUp} />
                                    </button>
                                    <button
                                        className="btn btn-sm btn-info ms-2"
                                        onClick={() => handleMoveDown(index)}
                                        title="Di chuyển xuống"
                                    >
                                        <FontAwesomeIcon icon={faArrowDown} />
                                    </button>
                                    <button
                                        className="btn btn-sm btn-warning ms-2"
                                        onClick={() => handleOpenModal(category)}
                                        title="Chỉnh sửa"
                                    >
                                        <FontAwesomeIcon icon={faEdit} />
                                    </button>
                                    <button
                                        className="btn btn-sm btn-danger ms-2"
                                        onClick={() => handleOpenDeleteModal(category)}
                                        title="Xóa"
                                    >
                                        <FontAwesomeIcon icon={faTrash} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {sortedCategories.length === 0 && (
                    <div className={cx('no-data')}>
                        <p>Không có danh mục nào</p>
                    </div>
                )}
            </div>

            {/* Create/Edit Modal */}
            {showModal && (
                <div className={cx('modal-overlay')} onClick={handleCloseModal}>
                    <div className={cx('modal-content')} onClick={(e) => e.stopPropagation()}>
                        <div className={cx('modal-header')}>
                            <h5>{editingCategory ? 'Chỉnh Sửa Danh Mục' : 'Thêm Danh Mục Mới'}</h5>
                            <button type="button" className="btn-close" onClick={handleCloseModal}></button>
                        </div>
                        <div className={cx('modal-body')}>
                            <div className="mb-3">
                                <label className="form-label">Tên Danh Mục *</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleFormChange}
                                    placeholder="Nhập tên danh mục"
                                />
                            </div>
                            <div className="mb-3">
                                <label className="form-label">Mô Tả</label>
                                <textarea
                                    className="form-control"
                                    name="description"
                                    value={formData.description}
                                    onChange={handleFormChange}
                                    placeholder="Nhập mô tả danh mục"
                                    rows="3"
                                ></textarea>
                            </div>
                            <div className="mb-3">
                                <label className="form-label">Biểu Tượng (URL)</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    name="icon"
                                    value={formData.icon}
                                    onChange={handleFormChange}
                                    placeholder="Nhập URL biểu tượng"
                                />
                            </div>
                            <div className="mb-3">
                                <label className="form-label">Loại Giày *</label>
                                <select
                                    className="form-select"
                                    name="categoryType"
                                    value={formData.categoryType}
                                    onChange={handleFormChange}
                                >
                                    <option value="1">Giày Nam</option>
                                    <option value="2">Giày Nữ</option>
                                    <option value="3">Giày Trẻ Em</option>
                                </select>
                            </div>
                            <div className="mb-3">
                                <label className="form-label">Thương Hiệu *</label>
                                <select
                                    className="form-select"
                                    name="brand"
                                    value={formData.brand}
                                    onChange={handleFormChange}
                                >
                                    {BRANDS.map((brand) => (
                                        <option key={brand} value={brand}>
                                            {brand}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="mb-3">
                                <label className="form-label">Thứ Tự (Ưu Tiên)</label>
                                <input
                                    type="number"
                                    className="form-control"
                                    name="order"
                                    value={formData.order}
                                    onChange={handleFormChange}
                                    placeholder="Nhập số thứ tự (số cao hơn = ưu tiên cao hơn)"
                                />
                            </div>
                        </div>
                        <div className={cx('modal-footer')}>
                            <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                                Hủy
                            </button>
                            <button type="button" className="btn btn-primary" onClick={handleSaveCategory}>
                                Lưu
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className={cx('modal-overlay')} onClick={() => setShowDeleteModal(false)}>
                    <div className={cx('modal-content')} onClick={(e) => e.stopPropagation()}>
                        <div className={cx('modal-header')}>
                            <h5>Xác Nhận Xóa</h5>
                            <button type="button" className="btn-close" onClick={() => setShowDeleteModal(false)}></button>
                        </div>
                        <div className={cx('modal-body')}>
                            <p>Bạn có chắc chắn muốn xóa danh mục <strong>"{selectedCategory?.name}"</strong> không?</p>
                            <p style={{ color: '#999', fontSize: '12px' }}>Thao tác này không thể hoàn tác.</p>
                        </div>
                        <div className={cx('modal-footer')}>
                            <button type="button" className="btn btn-secondary" onClick={() => setShowDeleteModal(false)}>
                                Hủy
                            </button>
                            <button type="button" className="btn btn-danger" onClick={handleConfirmDelete}>
                                Xóa
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ManageCategories;
