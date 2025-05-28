import './Header.css';
import { Link, useNavigate } from 'react-router-dom';
import { useStoreContext } from '../context/context';
import { useState, useEffect, useCallback } from 'react';

function Header() {
    const navigate = useNavigate();
    const { loggedIn, firstName, setLoggedIn } = useStoreContext();
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

    const handleLogout = () => {
        setLoggedIn(false);
        navigate('/');
    };

    return (
        <div className="header-container">
            <Link to="/" className="title">NXTFLIX</Link>

            {loggedIn ? (
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
                        <span className="welcome-message">Hello {firstName}!</span>
                        <Link to="/cart" className="nav-button">Cart</Link>
                        <Link to="/settings" className="nav-button">Settings</Link>
                        <button onClick={handleLogout} className="nav-button logout-button">Logout</button>
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