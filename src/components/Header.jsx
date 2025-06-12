import './Header.css';
import { Link, useNavigate } from 'react-router-dom';
import { useStoreContext } from '../context/context';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { useState, useEffect, useCallback } from 'react';

function Header() {
    const navigate = useNavigate();
    const { user, setUser, cart } = useStoreContext();
    const [searchQuery, setSearchQuery] = useState('');

    const debounce = (func, wait) => {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func(...args), wait);
        };
    };

    const debouncedSearch = useCallback(
        debounce((query) => {
            if (query.trim()) {
                navigate(`/movies/search/${query}`);
            }
        }, 500),
        [navigate]
    );

    useEffect(() => {
        if (searchQuery.trim()) {
            debouncedSearch(searchQuery);
        }
    }, [searchQuery, debouncedSearch]);

    const handleLogout = async () => {
        try {
            await signOut(auth);
            setUser(null);
            navigate('/');
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    // Extract and format user name if available
    const formatUserName = () => {
        if (user?.displayName) {
            // If there's a display name, use it
            return user.displayName;
        } else if (user?.email) {
            // If no display name but email exists, format the email
            const name = user.email.split('@')[0];
            // Capitalize first letter and replace dots/underscores with spaces
            return name.charAt(0).toUpperCase() + 
                   name.slice(1).replace(/[._]/g, ' ');
        }
        return 'User'; // Fallback
    };

    return (
        <div className="header-container">
            <Link to="/" className="title">NXTFLIX</Link>

            {user ? (
                <div className="user-section">
                    <div className="search-form">
                        <input
                            type="text"
                            placeholder="Search movies..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="search-input"
                        />
                    </div>

                    <div className="user-controls">
                        <span className="welcome-message">
                            Welcome, {formatUserName()}
                        </span>
                        <Link to="/cart" className="nav-button">
                            Cart {cart.size > 0 && `(${cart.size})`}
                        </Link>
                        <Link to="/settings" className="nav-button">Settings</Link>
                        <button onClick={handleLogout} className="nav-button logout-button">
                            Logout
                        </button>
                    </div>
                </div>
            ) : (
                <div className="auth-buttons">
                    <Link to="/login" className="login-button">Login</Link>
                    <Link to="/register" className="register-button">Register</Link>
                </div>
            )}
        </div>
    );
}

export default Header;