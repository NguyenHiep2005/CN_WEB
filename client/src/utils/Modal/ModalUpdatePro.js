import { useState, useRef, useEffect } from 'react';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import { Editor } from '@tinymce/tinymce-react';
import request from '../../Config/api';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function ModalUpdatePro({ show, setShow, data }) {
    const [nameProduct, setNameProduct] = useState('');
    const [priceProduct, setPriceProduct] = useState(0);
    const [description, setDescription] = useState('');
    const [sizes, setSizes] = useState([]);
    const handleClose = () => setShow(false);
    const editorRef = useRef(null);

    useEffect(() => {
        setNameProduct(data.name || '');
        setPriceProduct(data.price || 0);
        setDescription(data.description || '');
        setSizes(data.sizes && data.sizes.length > 0 ? data.sizes : [{ size: '', quantity: 0 }]);
        if (editorRef.current && show) {
            editorRef.current.setContent(data.description || '');
        }
    }, [data, show]);

    const handleSizeChange = (index, field, value) => {
        const newSizes = [...sizes];
        if (field === 'size') {
            newSizes[index].size = value;
        } else if (field === 'quantity') {
            newSizes[index].quantity = parseInt(value) || 0;
        }
        setSizes(newSizes);
    };

    const handleAddSize = () => {
        setSizes([...sizes, { size: '', quantity: 0 }]);
    };

    const handleRemoveSize = (index) => {
        if (sizes.length > 1) {
            setSizes(sizes.filter((_, i) => i !== index));
        }
    };

    const handleUpdatePro = async () => {
        if (editorRef.current) {
            setDescription(editorRef.current.getContent());
        }

        if (!nameProduct || !priceProduct || sizes.some(s => !s.size || s.quantity < 0)) {
            toast.error('Vui lòng điền đầy đủ thông tin size. Số lượng có thể từ 0 trở lên');
            return;
        }

        const res = await request.post('/api/editpro', {
            id: data._id,
            nameProduct: nameProduct,
            priceProduct: priceProduct,
            description: editorRef.current ? editorRef.current.getContent() : '',
            sizes: sizes,
        });
        toast.success(res.data.message);
        setShow(false);
    };

    return (
        <>
            <Modal show={show} onHide={handleClose}>
                <ToastContainer />
                <Modal.Header closeButton>
                    <Modal.Title>Chỉnh Sửa Sản Phẩm</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div className="form-floating mb-3">
                        <input
                            className="form-control"
                            id="floatingInput"
                            onChange={(e) => setNameProduct(e.target.value)}
                            value={nameProduct}
                        />
                        <label htmlFor="floatingInput">Tên Sản Phẩm</label>
                    </div>
                    <div className="form-floating mb-3">
                        <input
                            className="form-control"
                            id="floatingPassword"
                            value={priceProduct}
                            type="number"
                            onChange={(e) => setPriceProduct(e.target.value)}
                        />
                        <label htmlFor="floatingPassword">Giá Sản Phẩm</label>
                    </div>

                    <div className="form-floating mb-3">
                        <Editor
                            apiKey="n4hxnmi16uwk9dmdgfx6nscsf8oc30528dlcub1mzsk8deqy"
                            onInit={(_evt, editor) => {
                                editorRef.current = editor;
                                editor.setContent(description);
                            }}
                            initialValue={description}
                            init={{
                                height: 500,
                                menubar: false,
                                plugins: [
                                    'advlist',
                                    'autolink',
                                    'lists',
                                    'link',
                                    'image',
                                    'charmap',
                                    'preview',
                                    'anchor',
                                    'searchreplace',
                                    'visualblocks',
                                    'code',
                                    'fullscreen',
                                    'insertdatetime',
                                    'media',
                                    'table',
                                    'code',
                                    'help',
                                    'wordcount',
                                ],
                                toolbar:
                                    'undo redo | blocks | bold italic forecolor | alignleft aligncenter ' +
                                    'alignright alignjustify | bullist numlist outdent indent | ' +
                                    'removeformat | help',
                                content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }',
                            }}
                        />
                    </div>

                    {/* Size and Quantity Section */}
                    <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
                        <h6 style={{ marginBottom: '15px' }}>Kích Thước & Số Lượng</h6>
                        {sizes.map((size, index) => (
                            <div key={index} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '10px', marginBottom: '10px' }}>
                                <div className="form-floating">
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="Size (VD: 37, 38, M, L...)"
                                        value={size.size}
                                        onChange={(e) => handleSizeChange(index, 'size', e.target.value)}
                                    />
                                    <label>Size</label>
                                </div>
                                <div className="form-floating">
                                    <input
                                        type="number"
                                        className="form-control"
                                        placeholder="Số lượng"
                                        value={size.quantity}
                                        onChange={(e) => handleSizeChange(index, 'quantity', e.target.value)}
                                        min="0"
                                    />
                                    <label>Số Lượng</label>
                                </div>
                                <Button
                                    variant="danger"
                                    onClick={() => handleRemoveSize(index)}
                                    disabled={sizes.length === 1}
                                    style={{ height: 'fit-content', marginTop: '8px' }}
                                >
                                    Xóa
                                </Button>
                            </div>
                        ))}
                        <Button
                            variant="secondary"
                            onClick={handleAddSize}
                            style={{ marginTop: '10px', width: '100%' }}
                        >
                            + Thêm Size
                        </Button>
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleClose}>
                        Đóng
                    </Button>
                    <Button variant="primary" onClick={handleUpdatePro}>
                        Lưu Lại
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
}

export default ModalUpdatePro;
