import { useState, useEffect, createContext, useContext } from 'react';
import { authAPI } from '../apiHandler';

// Create a context for authentication state and functions
const AuthContext = createContext();

/*
Brief: Provides authentication state and functions to the app. 
Verifies against Express API Backend and manages user session.

@Param1: children - The components that will have access to the auth context.

@Return: JSX Element
@ReturnT: The AuthProvider component that wraps the app and provides auth context.
*/
export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => 
    {
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

    /*
    Brief: Handle user login by calling the login API and updating the user state on success.
    @Param1: email - The user's email for login.
    @Param2: password - The user's password for login.

    @Return: Boolean
    @ReturnT: True if login is successful, otherwise throws an error.
    @ReturnF: Returns false if login fails.
    */
    const login = async (email, password) => {
        const { data } = await authAPI.login(email, password);
        if (data.success) {
            setUser({ userId: data.userId, email: data.email });
            return true;
        }
    
        return false;
    };

    /*
    Brief: Handle user logout by calling the logout API and clearing the user state.
    */
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

// Custom hook to use auth context
export const useAuth = () => useContext(AuthContext);