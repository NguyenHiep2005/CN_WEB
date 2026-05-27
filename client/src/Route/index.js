import App from '../App';
import Admin from '../Pages/Admin';
import Cart from '../Pages/Cart';
import Category from '../Pages/Category';
import DetailProducts from '../Pages/DetailProducts';
import InfoUser from '../Pages/InfoUser';
import LoginUser from '../Pages/Login';
import RegisterUser from '../Pages/RegisterUser';
import ForgotPassword from '../Pages/ForgotPassword';

export const publicRoute = [
    { path: '/', element: <App /> },
    { path: '/product/:id/:slug', element: <DetailProducts /> },
    { path: '/category', element: <Category /> },
    { path: '/cart', element: <Cart /> },
    { path: '/login', element: <LoginUser /> },
    { path: '/register', element: <RegisterUser /> },
    { path: '/info', element: <InfoUser /> },
    { path: '/admin', element: <Admin /> },
    { path: '/category/:slug', element: <Category /> },
    { path: '/forgotpassword', element: <ForgotPassword /> },

    { path: '*', element: <App /> },
];

export const privateRoute = [{ path: '/admin', element: <Admin /> }];
