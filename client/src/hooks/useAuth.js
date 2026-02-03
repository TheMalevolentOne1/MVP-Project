import { useState, useEffect, createContext, useContext } from 'react';
import { authAPI } from '../apiHandler';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            const { data } = await authAPI.whoami();
            if (data.loggedIn) {
                setUser({ userId: data.userId, email: data.email });
            }
        } catch (error) {
            console.error('Auth check failed:', error);
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        const { data } = await authAPI.login(email, password);
        if (data.success) {
            setUser({ userId: data.userId, email: data.email });
            return true;
        }
        throw new Error(data.error || 'Login failed');
    };

    const logout = async () => {
        await authAPI.logout();
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, checkAuth }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);