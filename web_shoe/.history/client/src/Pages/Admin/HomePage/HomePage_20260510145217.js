import classNames from 'classnames/bind';
import styles from './HomePage.module.scss';

import ManagerProduct from '../../../Components/ManageProducts';

import AddProducts from '../ComponentsAdmin/AddProducts/AddProducts';
import ManageOrder from '../../../Components/ManageOrder';
import ManageRevenue from '../../../Components/ManageRevenue';
import ManageProductStatistics from '../../../Components/ManageProductStatistics';
import { useState } from 'react';
import ManagerUser from '../../../Components/ManagerUser';
import ChartLine from '../../../Components/ChartLine';

const cx = classNames.bind(styles);

function HomePage({ checkTypeSlideBar }) {
    const [checkOpenAddProduct, setCheckOpenAddProduct] = useState(false);

    const handleProductAdded = () => {
        setCheckOpenAddProduct(false);
    };

    return (
        <div className={cx('wrapper')}>
            {checkTypeSlideBar === 1 ? (
                <>
                    {checkOpenAddProduct ? (
                        <AddProducts setCheckOpenAddProduct={setCheckOpenAddProduct} onProductAdded={handleProductAdded} />
                    ) : (
                        <ManagerProduct setCheckOpenAddProduct={setCheckOpenAddProduct} />
                    )}
                </>
            ) : (
                <></>
            )}
            {checkTypeSlideBar === 2 ? <ManageOrder /> : <></>}
            {checkTypeSlideBar === 3 ? <ManagerUser /> : <></>}
            {checkTypeSlideBar === 4 ? <ManageRevenue /> : <></>}
        </div>
    );
}

export default HomePage;
