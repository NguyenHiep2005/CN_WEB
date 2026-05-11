import classNames from 'classnames/bind';
import styles from '../Styles/DetailProducts.module.scss';
import '../Styles/Slider.global.css';
import Header from '../Components/Header';
import Footer from '../Components/Footer';
import request from '../Config/api';

import { useEffect, useState } from 'react';
import addToCartProduct from '../utils/HandleCart/AddToCart';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Navbar from '../Components/Navbar';

import CardBody from '../Components/CardBody';
import Slider from 'react-slick';
import SelectSize from '../utils/SelectSize/SelectSize';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faAngleLeft, faAngleRight, faRulerHorizontal } from '@fortawesome/free-solid-svg-icons';
import { useLocation, useNavigate } from 'react-router-dom';
import { useStore } from '../hooks/useStore';

const cx = classNames.bind(styles);

function DetailProducts() {
    const location = useLocation();
    const navigate = useNavigate();

    const id = location.pathname.split('/')[2];
    const nameProduct = window.location.pathname.split('/')[3];

    const [dataProduct, setDataProduct] = useState([]);
    const [quantity, setQuantity] = useState(1);
    const [selectImg, setSelectImg] = useState(0);
    const [selectSize, setSelectSize] = useState('');
    const [checkType, setCheckType] = useState(0);
    const [lengthCart, setLengthCart] = useState(0);
    const [maxQuantity, setMaxQuantity] = useState(0);

    const [show, setShow] = useState(false);

    const [similarProduct, setSimilarProduct] = useState([]);

    const { getCart, dataUser } = useStore();

    useEffect(() => {
        const fetchData = async () => {
            if (!dataUser._id) {
                return;
            }

            const res = await request.get('/api/cart');
            res.data.map((item) => setLengthCart(item.products.length));
        };
        fetchData();
    }, [dataUser]);

    useEffect(() => {
        if (dataProduct.length > 0) {
            const searchKeyword = dataProduct[0]?.name?.split(' ')[0]; 

            if (searchKeyword) {
                request
                    .get('/api/similarproduct', { params: { name: searchKeyword, id } })
                    .then((res) => {
                        // BƯỚC MỚI: Lọc bỏ các sản phẩm bị trùng tên
                        const uniqueProducts = res.data.filter((item, index, self) =>
                            index === self.findIndex((t) => t.name === item.name)
                        );
                        
                        // Lưu mảng đã lọc sạch trùng lặp vào State
                        setSimilarProduct(uniqueProducts);
                    })
                    .catch((err) => console.log("Lỗi tìm sản phẩm tương tự:", err));
            }
        }
    }, [dataProduct, id]);

    useEffect(() => {
        dataProduct.map((item) =>
            item.type === 1 ? setCheckType(1) : item.type === 2 ? setCheckType(2) : setCheckType(3),
        );
    }, [dataProduct]);

    useEffect(() => {
        request
            .get('/api/product', {
                params: { id },
            })
            .then((res) => setDataProduct(res.data));
    }, [id]);

    useEffect(() => {
        if (quantity < 1) {
            setQuantity(1);
        }
        if (maxQuantity > 0 && quantity > maxQuantity) {
            setQuantity(maxQuantity);
        }
    }, [quantity, maxQuantity]);

    const handleImgClick = (index) => {
        setSelectImg(index);
    };

    const handleSelectSize = (sizeItem) => {
        setSelectSize(sizeItem.size);
        setMaxQuantity(sizeItem.quantity);
        setQuantity(1);
    };

    const handleAddProduct = async (props) => {
        if (!selectSize) {
            toast.error('Vui lòng chọn size');
            return;
        }

        if (maxQuantity <= 0) {
            toast.error('Size này hiện đang hết hàng');
            return;
        }

        if (quantity > maxQuantity) {
            toast.error(`Chỉ còn ${maxQuantity} chiếc cho size này`);
            setQuantity(maxQuantity);
            return;
        }

        const data = await addToCartProduct(props, quantity, selectSize);
        if (data && data.data && data.data.message) {
            toast.success(data.data.message);
            await getCart();
        }
    };

    const handleBuyNow = (props) => {
        if (!selectSize) {
            toast.error('Vui lòng chọn size');
            return;
        }

        const token = document.cookie;
        if (!token) {
            toast.error('Bạn Cần Đăng Nhập Trước !!!');
            return;
        }

        // Lưu sản phẩm hiện tại vào localStorage để thanh toán riêng
        const buyNowProduct = {
            _id: props._id,
            name: props.name,
            price: props.price,
            img: props.img[0],
            quantity: quantity,
            size: selectSize,
            type: props.type,
            slug: props.slug,
        };

        localStorage.setItem('buyNowProduct', JSON.stringify(buyNowProduct));
        navigate('/payments');
    };

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [id]);

    var settings = {
        dots: true,
        
        // Sửa dòng infinite: true thành dòng này:
        infinite: similarProduct.length > 4, 
        
        speed: 500,
        slidesToShow: 4,
        slidesToScroll: 4,
        initialSlide: 0,
        responsive: [
            {
                breakpoint: 1024,
                settings: {
                    slidesToShow: 3,
                    slidesToScroll: 3,
                    // Áp dụng tương tự cho các màn hình nhỏ
                    infinite: similarProduct.length > 3, 
                    dots: true,
                },
            },
            {
                breakpoint: 600,
                settings: {
                    slidesToShow: 2,
                    slidesToScroll: 2,
                    initialSlide: 0,
                    infinite: similarProduct.length > 2, // Thêm dòng này
                },
            },
            {
                breakpoint: 500,
                settings: {
                    slidesToShow: 1,
                    slidesToScroll: 1,
                    initialSlide: 0,
                    centerMode: true,
                    centerPadding: '20px',
                    infinite: similarProduct.length > 1, // Thêm dòng này
                },
            },
        ],
    };

    const handleShowSelectSzie = () => {
        setShow(!show);
    };

    const onNextImg = () => {
        if (selectImg < dataProduct[0].img.length - 1) {
            setSelectImg(selectImg + 1);
        } else {
            setSelectImg(0);
        }
    };

    return (
        <div className={cx('wrapper')}>
            <ToastContainer />
            <header>
                <Header lengthCart={lengthCart} />
            </header>

            <main className={cx('main')}>
                <Navbar props={dataProduct} />
                {dataProduct.map((item) => (
                    <div key={item.id} className={cx('form-product')}>
                        <div className={cx('img-product')}>
                            <div className={cx('img-small')}>
                                {item.img.map((item2, index) => (
                                    <img
                                        className={cx({ active: index === selectImg })}
                                        key={index}
                                        onClick={() => handleImgClick(index)}
                                        src={`${process.env.REACT_APP_IMG}/${item2}`}
                                        alt=""
                                    />
                                ))}
                            </div>

                            <img
                                className={cx('img')}
                                src={`${process.env.REACT_APP_IMG}/${item.img[selectImg]}`}
                                alt=""
                            />
                            <button onClick={onNextImg} id={cx('btn-1')}>
                                <FontAwesomeIcon icon={faAngleLeft} />
                            </button>
                            <button onClick={onNextImg} id={cx('btn-2')}>
                                <FontAwesomeIcon icon={faAngleRight} />
                            </button>
                        </div>
                        <div className={cx('info-product')}>
                            <div className={cx('title-product')}>
                                <h2>{item.name}</h2>
                                <span>{item.price.toLocaleString()} đ</span>
                            </div>
                            <div className={cx('select-size')}>
                                <div onClick={handleShowSelectSzie} className={cx('btn-select')}>
                                    <button>
                                        <FontAwesomeIcon icon={faRulerHorizontal} /> HƯỚNG DẪN CHỌN SIZE
                                    </button>
                                    <div>
                                        <SelectSize dataProduct={dataProduct} show={show} setShow={setShow} />
                                    </div>
                                </div>
                                <div className={cx('select-size')}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span>Kích Cỡ : {selectSize}</span>
                                        {selectSize && maxQuantity > 0 && (
                                            <span style={{ color: '#27ae60', fontWeight: 'bold', fontSize: '14px' }}>Còn {maxQuantity} chiếc</span>
                                        )}
                                        {selectSize && maxQuantity === 0 && (
                                            <span style={{ color: '#dc3545', fontWeight: 'bold', fontSize: '14px' }}>Hết hàng</span>
                                        )}
                                    </div>
                                    <div className={cx('form-size')}>
                                        {item.sizes && item.sizes.length > 0 ? (
                                            item.sizes.map((sizeItem, idx) => {
                                                const isOutOfStock = sizeItem.quantity === 0;
                                                return (
                                                    <div
                                                        key={idx}
                                                        onClick={() => {
                                                            if (!isOutOfStock) {
                                                                handleSelectSize(sizeItem);
                                                            }
                                                        }}
                                                        className={cx(
                                                            {
                                                                active: selectSize === sizeItem.size,
                                                                disabled: isOutOfStock,
                                                            }
                                                        )}
                                                        style={{
                                                            opacity: isOutOfStock ? 0.5 : 1,
                                                            cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                                                        }}
                                                        title={isOutOfStock ? 'Hết hàng' : `Còn ${sizeItem.quantity} chiếc`}
                                                    >
                                                        <button disabled={isOutOfStock}>
                                                            {sizeItem.size}
                                                            {isOutOfStock && <span style={{ fontSize: '10px', display: 'block' }}>Hết</span>}
                                                        </button>
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '10px' }}>
                                                <span style={{ color: '#dc3545' }}>Sản phẩm hiện hết hàng</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div>
                                <div className={cx('form-quantity')}>
                                    <button onClick={() => setQuantity(quantity - 1)}>-</button>
                                    <input 
                                        id={cx('quantity')} 
                                        value={quantity} 
                                        onChange={(e) => {
                                            const val = parseInt(e.target.value) || 1;
                                            if (maxQuantity > 0) {
                                                setQuantity(Math.min(val, maxQuantity));
                                            } else {
                                                setQuantity(val);
                                            }
                                        }}
                                        max={maxQuantity}
                                    />
                                    <button onClick={() => {
                                        if (maxQuantity > 0) {
                                            setQuantity(Math.min(quantity + 1, maxQuantity));
                                        } else {
                                            setQuantity(quantity + 1);
                                        }
                                    }}>+</button>
                                </div>
                                {selectSize && maxQuantity > 0 && quantity > maxQuantity && (
                                    <div style={{ color: '#dc3545', fontSize: '12px', marginTop: '5px' }}>
                                        ⚠️ Chỉ còn {maxQuantity} chiếc. Số lượng đã giảm xuống.
                                    </div>
                                )}
                            </div>

                            <div className={cx('btn-add-cart')}>
                                <button onClick={() => handleAddProduct(item)}>Thêm Vào Giỏ Hàng</button>
                                <button onClick={() => handleBuyNow(item)} className={cx('btn-buy-now')}>Mua Ngay</button>
                            </div>
                            <div className={cx('container')}>
                                <div className={cx('box')}>
                                    <img
                                        src="https://i0.wp.com/peaksport.vn/wp-content/uploads/2023/11/icon-3.png?resize=40%2C41&ssl=1"
                                        alt=""
                                    />
                                    <div id={cx('info')}>
                                        <span style={{ fontWeight: '800' }}>Miễn phí vận chuyển</span>
                                        <span>Cho đơn hàng từ 800k</span>
                                    </div>
                                </div>

                                <div className={cx('box')}>
                                    <img
                                        src="https://i0.wp.com/peaksport.vn/wp-content/uploads/2023/11/icon.png?resize=40%2C41&ssl=1"
                                        alt=""
                                    />
                                    <div id={cx('info')}>
                                        <span style={{ fontWeight: '800' }}>Bảo hành 6 tháng</span>
                                        <span>15 ngày đổi trả</span>
                                    </div>
                                </div>

                                <div className={cx('box')}>
                                    <img
                                        src="https://i0.wp.com/peaksport.vn/wp-content/uploads/2023/11/icon-1-1.png?resize=40%2C41&ssl=1"
                                        alt=""
                                    />
                                    <div id={cx('info')}>
                                        <span style={{ fontWeight: '800' }}>Thanh toán COD</span>
                                        <span>Yên tâm mua sắm</span>
                                    </div>
                                </div>

                                <div className={cx('box')}>
                                    <img
                                        src="https://i0.wp.com/peaksport.vn/wp-content/uploads/2023/11/icon-2-1.png?resize=40%2C41&ssl=1"
                                        alt=""
                                    />
                                    <div id={cx('info')}>
                                        <span style={{ fontWeight: '800' }}>Hotline: 0866550286</span>
                                        <span>Hỗ trợ bạn 24/7</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
                {dataProduct.map((item) => (
                    <div className={cx('description')}>
                        <div>
                            <h2>THÔNG TIN SẢN PHẨM</h2>
                        </div>
                        <div key={item._id} dangerouslySetInnerHTML={{ __html: item?.description }} />
                    </div>
                ))}

                <div className={cx('similarProductsContainer')}>
                    <div>
                        <h4>SẢN PHẨM TƯƠNG TỰ</h4>
                    </div>
                    <div className={cx('sliderWrapper')}>
                        <Slider {...settings}>
                            {similarProduct.slice(0, 8).map((item) => (
                                <div key={item?._id}>
                                    <div>
                                        <CardBody item={item} />
                                    </div>
                                </div>
                            ))}
                        </Slider>
                    </div>
                </div>
            </main>

            <footer>
                <Footer />
            </footer>
        </div>
    );
    
}

export default DetailProducts;
