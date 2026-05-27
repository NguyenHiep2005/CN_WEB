import Context from './Context';
import { useEffect, useState } from 'react';

import cookies from 'js-cookie';

import { requestAuth, requestGetCart } from '../Config/api';

export function Provider({ children }) {
    const [dataUser, setDataUser] = useState({});
    const [dataCart, setDataCart] = useState([]);

    const getAuthUser = async () => {
        const res = await requestAuth();
        setDataUser(res);
    };

    const getCart = async () => {
        const res = await requestGetCart();
        setDataCart(res);
    };

    useEffect(() => {
        const token = cookies.get('logged');

        const fetchData = async () => {
            try {
                await getAuthUser();
            } catch (error) {
                console.log(error);
            }
        };
        if (token === '1') {
            fetchData();
            getCart();
        }

        return;
    }, []);

    return <Context.Provider value={{ dataUser, dataCart, getCart }}>{children}</Context.Provider>;
}
