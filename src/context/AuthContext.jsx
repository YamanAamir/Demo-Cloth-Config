import React, { createContext, useState, useContext, useEffect } from 'react';
import { loginUser } from '../api/api';

const AuthContext = createContext(null);

const DEMO_EMAIL = 'elipsedev@gmail.com';
const DEMO_PASSWORD = '123123';

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const savedUser = localStorage.getItem('user');
        const savedToken = localStorage.getItem('token');
        if (savedUser && savedToken) {
            setUser(JSON.parse(savedUser));
            setLoading(false);
        } else {
            loginUser({ email: DEMO_EMAIL, password: DEMO_PASSWORD })
                .then((res) => {
                    const { token, data } = res.data;
                    const userData = data?.user || data;
                    localStorage.setItem('user', JSON.stringify(userData));
                    localStorage.setItem('token', token);
                    setUser(userData);
                })
                .catch(() => {})
                .finally(() => setLoading(false));
        }
    }, []);

    const login = (userData, token) => {
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('token', token);
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
