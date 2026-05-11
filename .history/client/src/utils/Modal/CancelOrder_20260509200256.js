import { useState } from 'react';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import request from '../../Config/api';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function ModalCancelOrder({ show, setShow, item, onDeleteSuccess }) {
    const handleClose = () => setShow(false);

    const handleDeletePro = async () => {
        try {
            const res = await request.post('/api/cancelorder', { id: item });
            toast.success(res.data.message);
            handleClose();
            if (onDeleteSuccess) {
                onDeleteSuccess();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Hủy đơn hàng thất bại');
        }
    };

    return (
        <>
            <Modal show={show} onHide={handleClose}>
                <Modal.Header closeButton>
                    <Modal.Title>Hủy Đơn Hàng</Modal.Title>
                </Modal.Header>
                <Modal.Body>Bạn chắc chắn muốn hủy đơn hàng này?</Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleClose}>
                        Đóng
                    </Button>
                    <Button variant="danger" onClick={handleDeletePro}>
                        Hủy Đơn Hàng
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
}

export default ModalCancelOrder;
