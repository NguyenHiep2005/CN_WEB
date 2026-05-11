import className from 'classnames/bind';
import styles from './AddProducts.module.scss';
import { useState, useRef, useEffect } from 'react';
import request from '../../../../Config/api';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faAngleDown } from '@fortawesome/free-solid-svg-icons';

import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { Editor } from '@tinymce/tinymce-react';

const cx = className.bind(styles);

function AddProducts({ setCheckOpenAddProduct, onProductAdded }) {
    const [nameProduct, setNameProduct] = useState('');
    const [priceProduct, setPriceProduct] = useState(0);
    const [description, setDescription] = useState('');
    const [fileImg, setFileImg] = useState([]);
    const [checkType, setCheckType] = useState(0);
    const [brand, setBrand] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [categories, setCategories] = useState([]);
    const [sizes, setSizes] = useState([{ size: '', quantity: 0 }]);

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

    const handleFileChange = (e) => {
        const filesArray = Array.from(e.target.files);
        const newImg = filesArray.sort((a, b) => a.name.localeCompare(b.name));
        setFileImg(newImg);
    };

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

    // const fetchData = async () => {
    //     try {
    //         const productsResponse = await request.get('/api/products');
    //         setDataProduct(productsResponse.data);
    //     } catch (error) {
    //         console.error('Error fetching data:', error);
    //     }
    // };

    const editorRef = useRef(null);

    const handleEditorChange = () => {
        if (editorRef.current) {
            setDescription(editorRef.current.getContent());
        }
    };

    const handleAddProduct = async () => {
        // Validate
        if (!nameProduct || !priceProduct || !checkType || sizes.some(s => !s.size || s.quantity < 0)) {
            toast.error('Vui lòng điền đầy đủ thông tin sản phẩm. Tất cả size phải có tên và số lượng >= 0');
            return;
        }

        const formData = new FormData();
        formData.append('nameProduct', nameProduct);
        formData.append('priceProduct', priceProduct);
        formData.append('description', description);
        formData.append('checkType', checkType);
        formData.append('brand', brand);
        formData.append('sizes', JSON.stringify(sizes));
        fileImg.forEach((file) => {
            formData.append('fileImg', file);
        });

        try {
            const response = await request.post('/api/addproduct', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            toast.success(response.data.message);
            clearForm();
            if (onProductAdded) {
                setTimeout(() => {
                    onProductAdded();
                }, 500);
            }
        } catch (error) {
            console.error('Error uploading product:', error);
            toast.error('Error uploading product');
        }
    };

    const clearForm = () => {
        setNameProduct('');
        setPriceProduct(0);
        setDescription('');
        setCheckType(0);
        setBrand('');
        setFileImg([]);
        setSizes([{ size: '', quantity: 0 }]);
    };

    return (
        <div className={cx('wrapper')}>
            <ToastContainer />
            <div className={cx('title')}>
                <h1>Đăng Sản Phẩm</h1>
                <button onClick={() => setCheckOpenAddProduct(false)} type="button" className="btn btn-primary">
                    Quay Lại
                </button>
            </div>
            <div className="form-floating mb-3">
                <input
                    type="text"
                    className="form-control"
                    id="floatingInput"
                    value={nameProduct}
                    onChange={(e) => setNameProduct(e.target.value)}
                />
                <label htmlFor="floatingInput">Tên Sản Phẩm</label>
            </div>
            <div className="form-floating">
                <input
                    type="number"
                    className="form-control"
                    id="floatingPassword"
                    value={priceProduct}
                    onChange={(e) => setPriceProduct(e.target.value)}
                />
                <label htmlFor="floatingPassword">Giá Sản Phẩm</label>
            </div>
            <select
                className="form-select"
                aria-label="Default select example"
                value={checkType}
                onChange={(e) => setCheckType(e.target.value)}
            >
                <option value="0">Chọn Loại Giày</option>
                <option value="1">Giày Nam</option>
                <option value="2">Giày Nữ</option>
                <option value="3">Giày Trẻ Em</option>
            </select>

            <div className="form-floating mb-3">
                <input
                    type="text"
                    className="form-control"
                    id="floatingBrand"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                />
                <label htmlFor="floatingBrand">Nhãn Hàng (Brand)</label>
            </div>

            {/* Size and Quantity Section */}
            <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
                <h5 style={{ marginBottom: '15px' }}>Kích Thước & Số Lượng</h5>
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
                        <button
                            type="button"
                            className="btn btn-danger"
                            onClick={() => handleRemoveSize(index)}
                            disabled={sizes.length === 1}
                            style={{ height: 'fit-content', marginTop: '8px' }}
                        >
                            Xóa
                        </button>
                    </div>
                ))}
                <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleAddSize}
                    style={{ marginTop: '10px', width: '100%' }}
                >
                    + Thêm Size
                </button>
            </div>

            <Editor
                apiKey="n4hxnmi16uwk9dmdgfx6nscsf8oc30528dlcub1mzsk8deqy"
                onInit={(evt, editor) => (editorRef.current = editor)}
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
                        'undo redo | formatselect | ' +
                        'bold italic forecolor | alignleft aligncenter ' +
                        'alignright alignjustify | bullist numlist outdent indent | ' +
                        'removeformat | help',
                    content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }',
                }}
                onChange={handleEditorChange}
            />

            <div className={cx('form-upload-image')}>
                <div style={{ height: '25px' }}>
                    <FontAwesomeIcon id={cx('icon-animation')} icon={faAngleDown} />
                </div>
                <label htmlFor="file-upload">Ảnh Sản Phẩm</label>
                <input id="file-upload" type="file" name="fileImg" multiple onChange={handleFileChange} />
                <div className={cx('image-container')}>
                    {fileImg.map((file, index) => (
                        <div key={index} className={cx('image-upload')}>
                            <img src={URL.createObjectURL(file)} alt="" />
                        </div>
                    ))}
                </div>
            </div>

            <div className={cx('btn-submit')}>
                <button onClick={handleAddProduct}>Thêm Sản Phẩm</button>
            </div>
        </div>
    );
}

export default AddProducts;
