import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useStoreContext } from '../context/context';
import { auth, firestore } from '../firebase';
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import Header from "../components/Header";
import Footer from "../components/Footer";
import "./LoginView.css";

function LoginView() {
    const navigate = useNavigate();
    const { setUser } = useStoreContext();
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleEmailLogin = async (event) => {
        event.preventDefault();
        setError('');
        setLoading(true);

        try {
            const userCredential = await signInWithEmailAndPassword(
                auth,
                formData.email,
                formData.password
            );

            // Check if user exists in Firestore
            const userDoc = await getDoc(doc(firestore, 'users', userCredential.user.uid));
            if (!userDoc.exists()) {
                throw new Error('User not registered. Please register first.');
            }

            // Navigate to movies after successful login
            navigate('/movies');
            
            // Load user data from Firestore
            const userData = userDoc.data();
            if (userData.genres) {
                localStorage.setItem('userGenres', JSON.stringify(userData.genres));
            }

            // Set the user in context
            setUser(userCredential.user);
        } catch (error) {
            console.error('Login error:', error);
            switch (error.code) {
                case 'auth/invalid-credential':
                    setError('Invalid email or password.');
                    break;
                case 'auth/too-many-requests':
                    setError('Too many failed attempts. Please try again later.');
                    break;
                default:
                    setError(error.message);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setError('');
        setLoading(true);

        try {
            const provider = new GoogleAuthProvider();
            const result = await signInWithPopup(auth, provider);

            // Check if user exists in Firestore
            const userDoc = await getDoc(doc(firestore, 'users', result.user.uid));
            if (!userDoc.exists()) {
                // Sign out the user if they're not registered
                await signOut(auth);
                throw new Error('Google account not registered. Please register first.');
            }

            // Navigate to movies after successful login
            navigate('/movies');
        } catch (error) {
            console.error('Google login error:', error);
            if (error.message) {
                setError(error.message);
            } else {
                switch (error.code) {
                    case 'auth/popup-closed-by-user':
                        setError('Login cancelled.');
                        break;
                    case 'auth/popup-blocked':
                        setError('Please allow popups for this website.');
                        break;
                    default:
                        setError('An error occurred during login. Please try again.');
                }
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <Header />
            <div className="form-container">
                <h2>Login to Your Account</h2>
                {error && <p className="error-message">{error}</p>}

                <form onSubmit={handleEmailLogin}>
                    <div className="input-group">
                        <label>Email:</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            disabled={loading}
                        />
                    </div>

                    <div className="input-group">
                        <label>Password:</label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            disabled={loading}
                        />
                    </div>

                    <button 
                        type="submit" 
                        className="login-button"
                        disabled={loading}
                    >
                        {loading ? 'Logging in...' : 'Login with Email'}
                    </button>
                </form>

                <button
                    onClick={handleGoogleLogin}
                    className="google-button"
                    disabled={loading}
                >
                    {loading ? 'Logging in...' : 'Login with Google'}
                </button>

                <p className="register-link">
                    New to Nxtflix? <Link to="/register">Register Now</Link>
                </p>
            </div>
            <Footer />
        </div>
    );
}

export default LoginView;