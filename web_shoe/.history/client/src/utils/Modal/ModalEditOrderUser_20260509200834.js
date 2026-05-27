import { useState, useEffect } from 'react';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import request from '../../Config/api';

import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function ModalEditOrderUser({ show, setShow, orderId, currentData, onUpdateSuccess }) {
    const handleClose = () => setShow(false);

    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        address: '',
    });

    useEffect(() => {
        if (currentData) {
            setFormData({
                name: currentData.name || '',
                phone: currentData.phone || '',
                address: currentData.address || '',
            });
        }
    }, [currentData, show]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleEditOrder = async () => {
        if (!formData.name || !formData.phone || !formData.address) {
            toast.error('Vui lòng điền đầy đủ thông tin');
            return;
        }

        try {
            const res = await request.post('/api/updateorder', {
                id: orderId,
                name: formData.name,
                phone: String(formData.phone),
                address: formData.address,
            });
            toast.success(res.data.message || 'Cập nhật đơn hàng thành công');
            handleClose();
            if (onUpdateSuccess) {
                onUpdateSuccess();
            }
        } catch (error) {
            console.error('Error updating order:', error);
            toast.error(error.response?.data?.message || 'Cập nhật thất bại');
        }
    };

    return (
        <>
            <Modal show={show} onHide={handleClose}>
                <Modal.Header closeButton>
                    <Modal.Title>Chỉnh Sửa Thông Tin Đơn Hàng</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div className="mb-3">
                        <label htmlFor="name" className="form-label">
                            Tên Người Nhận
                        </label>
                        <input
                            type="text"
                            className="form-control"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="Nhập tên người nhận"
                        />
                    </div>
                    <div className="mb-3">
                        <label htmlFor="phone" className="form-label">
                            Số Điện Thoại
                        </label>
                        <input
                            type="tel"
                            className="form-control"
                            id="phone"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            placeholder="Nhập số điện thoại"
                        />
                    </div>
                    <div className="mb-3">
                        <label htmlFor="address" className="form-label">
                            Địa Chỉ Giao Hàng
                        </label>
                        <textarea
                            className="form-control"
                            id="address"
                            name="address"
                            value={formData.address}
                            onChange={handleChange}
                            placeholder="Nhập địa chỉ giao hàng"
                            rows="3"
                        />
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleClose}>
                        Đóng
                    </Button>
                    <Button variant="primary" onClick={handleEditOrder}>
                        Lưu Lại
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
}

export default ModalEditOrderUser;
