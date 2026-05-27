import { useState } from 'react';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import request from '../../Config/api';

import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function ModalEditOrder({ show, setShow, id, address }) {
    const handleClose = () => setShow(false);

    const [valueOption, setValueOption] = useState(0);

    const handleEditOrder = () => {
        request.post('/api/editorder', { valueOption: parseInt(valueOption), id }).then((res) => {
            toast.success(res.data.message);
        });

        setValueOption(0);
    };

    // Handle both old format (string address) and new format (object with address details)
    const isOldFormat = typeof address === 'string';
    const addressText = isOldFormat 
        ? address 
        : `${address?.address || ''}, ${address?.ward || ''}, ${address?.province || ''}`;

    const phoneDisplay = isOldFormat ? address : `0${address?.phone || ''}`;

    return (
        <>
            <Modal show={show} onHide={handleClose}>
                <Modal.Header closeButton>
                    <Modal.Title>Chỉnh Sửa Đơn Hàng</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div style={{ marginBottom: '15px' }}>
                        <h6 style={{ fontWeight: 'bold', marginBottom: '10px' }}>📍 Thông Tin Giao Hàng</h6>
                        {!isOldFormat && (
                            <>
                                <p><strong>Tên:</strong> {address?.name || 'N/A'}</p>
                                <p><strong>Điện thoại:</strong> {phoneDisplay}</p>
                                <p><strong>Tỉnh/Thành phố:</strong> {address?.province || 'N/A'}</p>
                                <p><strong>Xã/Phường:</strong> {address?.ward || 'N/A'}</p>
                                <p><strong>Địa chỉ chi tiết:</strong> {address?.address || 'N/A'}</p>
                                {address?.notes && <p><strong>Ghi chú:</strong> {address.notes}</p>}
                            </>
                        )}
                        {isOldFormat && <p>{address}</p>}
                    </div>
                    
                    <div style={{ marginTop: '15px', borderTop: '1px solid #ddd', paddingTop: '15px' }}>
                        <label style={{ fontWeight: 'bold', marginBottom: '10px', display: 'block' }}>
                            🚚 Cập Nhật Trạng Thái Giao Hàng
                        </label>
                        <select
                            className="form-select mt-3"
                            aria-label="Default select example"
                            onChange={(e) => setValueOption(e.target.value)}
                            value={valueOption}
                        >
                            <option value={0}>Đang vận chuyển</option>
                            <option value={1}>Đã Giao Hàng</option>
                        </select>
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleClose}>
                        Đóng
                    </Button>
                    <Button variant="primary" onClick={handleEditOrder}>
                        Lưu lại
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
}

export default ModalEditOrder;
