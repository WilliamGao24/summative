import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useStoreContext } from '../context/context';
import Header from "../components/Header";
import "./LoginView.css";

function LoginView() {
    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');
    const navigate = useNavigate();
    const {
        setLoggedIn,
        registeredUsers,
        setFirst,
        setLast,
        setEmail,
        setPassword,
        setSelected
    } = useStoreContext();

    const handleLogin = (event) => {
        event.preventDefault();

        const user = registeredUsers.find(user => user.email === loginEmail);

        if (!user) {
            alert("User not found!");
            return;
        }

        if (user.password !== loginPassword) {
            alert("Incorrect password!");
            return;
        }

        setLoggedIn(true);
        setFirst(user.firstName);
        setLast(user.lastName);
        setEmail(user.email);
        setPassword(user.password);
        setSelected(user.genres);

        navigate(`/movies/genre/${user.genres[0]}`);
    };

    return (
        <div className="login-container">
            <Header />
            <div className="form-container">
                <h2>Login to Your Account</h2>
                <form onSubmit={handleLogin}>
                    <div className="input-group">
                        <label>Email:</label>
                        <input
                            type="email"
                            value={loginEmail}
                            onChange={(e) => setLoginEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="input-group">
                        <label>Password:</label>
                        <input
                            type="password"
                            value={loginPassword}
                            onChange={(e) => setLoginPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button type="submit" className="login-button">Login</button>
                </form>
                <p className="register-link">
                    New to Nxtflix? <Link to="/register">Register Now</Link>
                </p>
            </div>
        </div>
    );
}

export default LoginView;