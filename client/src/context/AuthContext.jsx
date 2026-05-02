import { createContext, useState, useEffect, useContext } from 'react';
import api from '../utils/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        const loadUser = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                setLoading(false);
                return;
            }

            try {
                const res = await api.get('/users/me');
                setUser(res.data);
                setIsAuthenticated(true);
            } catch (err) {
                localStorage.removeItem('token');
                setUser(null);
                setIsAuthenticated(false);
                console.error("Error loading user", err);
            } finally {
                setLoading(false);
            }
        };

        loadUser();
    }, []);

    const login = async (formData) => {
        const res = await api.post('/auth/login', formData);
        localStorage.setItem('token', res.data.token);
        // Load full user profile after login
        const userRes = await api.get('/users/me');
        setUser(userRes.data);
        setIsAuthenticated(true);
        return res.data;
    };

    const register = async (userData) => {
        // Register now only sends OTP — no token is returned at this stage.
        // Token is returned after OTP verification in Register.jsx
        const res = await api.post('/auth/register', userData);
        return res.data;
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
        setIsAuthenticated(false);
    };

    const value = {
        user,
        setUser,
        loading,
        isAuthenticated,
        login,
        register,
        logout
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
