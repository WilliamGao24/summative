import "./RegisterView.css";
import Header from "../components/Header";
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useStoreContext } from '../context/context';
import { auth, firestore } from '../firebase';
import { createUserWithEmailAndPassword, updateProfile, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import Footer from '../components/Footer';

function RegisterView() {
    const navigate = useNavigate();
    const { setUser, setSelectedGenres } = useStoreContext();
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: '',
        genres: []
    });

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const genres = [
        { id: 878, name: "Sci-Fi" },
        { id: 53, name: "Thriller" },
        { id: 12, name: "Adventure" },
        { id: 10751, name: "Family" },
        { id: 16, name: "Animation" },
        { id: 28, name: "Action" },
        { id: 36, name: "History" },
        { id: 14, name: "Fantasy" },
        { id: 27, name: "Horror" },
        { id: 35, name: "Comedy" }
    ];

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleGenreChange = (id) => {
        setFormData(prev => ({
            ...prev,
            genres: prev.genres.includes(id)
                ? prev.genres.filter(genreId => genreId !== id)
                : [...prev.genres, id]
        }));
    };

    const createUserDocument = async (user, data) => {
        const userRef = doc(firestore, 'users', user.uid);
        await setDoc(userRef, {
            email: data.email,
            firstName: data.firstName,
            lastName: data.lastName,
            genres: data.genres,
            createdAt: new Date(),
            purchases: []
        });
    };

    const handleEmailRegister = async (event) => {
        event.preventDefault();
        setError('');
        
        if (!formData.firstName || !formData.lastName || !formData.email || !formData.password || !formData.confirmPassword) {
            setError('Please fill in all fields');
            return;
        }

        if (formData.genres.length < 5) {
            setError("Please select at least 5 genres!");
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setError("Passwords don't match!");
            return;
        }

        setLoading(true);
        try {
            const { user } = await createUserWithEmailAndPassword(
                auth,
                formData.email,
                formData.password
            );

            await updateProfile(user, {
                displayName: `${formData.firstName} ${formData.lastName}`
            });

            await createUserDocument(user, formData);

            // Update selected genres
            setSelectedGenres(formData.genres);

            // Navigate to movies view
            navigate('/movies');
        } catch (error) {
            console.error("Registration error:", error);
            switch (error.code) {
                case 'auth/email-already-in-use':
                    setError('Email already registered!');
                    break;
                case 'auth/weak-password':
                    setError('Password should be at least 6 characters!');
                    break;
                default:
                    setError(error.message);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleRegister = async () => {
        setError('');
        setLoading(true);

        // Check for genre selection first
        if (formData.genres.length < 5) {
            setError("Please select at least 5 genres before registering!");
            setLoading(false);
            return;
        }

        try {
            const provider = new GoogleAuthProvider();
            const result = await signInWithPopup(auth, provider);
            
            // Check if user already exists in Firestore
            const userRef = doc(firestore, 'users', result.user.uid);
            const userDoc = await getDoc(userRef);
            
            if (userDoc.exists()) {
                throw new Error('This Google account is already registered. Please use the login page instead.');
            }
            
            // Create user document with Google data
            const names = result.user.displayName?.split(' ') || ['', ''];
            const userData = {
                email: result.user.email,
                firstName: names[0],
                lastName: names[1] || '',
                genres: formData.genres,
                createdAt: new Date(),
                purchases: []
            };

            await createUserDocument(result.user, userData);
            setSelectedGenres(formData.genres);

            // Navigate to movies view
            navigate('/movies');
        } catch (error) {
            console.error('Google registration error:', error);
            if (error.code === 'auth/popup-closed-by-user') {
                setError('Registration cancelled.');
            } else if (error.message.includes('already registered')) {
                setError(error.message);
            } else {
                setError('An error occurred during registration. Please try again.');
            }
            // Sign out the user if there was an error during registration
            await signOut(auth);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="register-container">
            <Header />
            <div className="form-container">
                <h2>Create an Account</h2>
                {error && <p className="error-message">{error}</p>}

                <form onSubmit={handleEmailRegister}>
                    <div className="input-group">
                        <label>First Name:</label>
                        <input
                            type="text"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleChange}
                            required
                            disabled={loading}
                        />
                    </div>

                    <div className="input-group">
                        <label>Last Name:</label>
                        <input
                            type="text"
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleChange}
                            required
                            disabled={loading}
                        />
                    </div>

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
                            minLength={6}
                            disabled={loading}
                        />
                    </div>

                    <div className="input-group">
                        <label>Confirm Password:</label>
                        <input
                            type="password"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            required
                            minLength={6}
                            disabled={loading}
                        />
                    </div>

                    <div className="genres-section">
                        <label>Select at least 5 genres to continue ({formData.genres.length}/5):</label>
                        <div className="genres-grid">
                            {genres.map(genre => (
                                <div key={genre.id} className="genre-item">
                                    <input
                                        type="checkbox"
                                        id={`genre-${genre.id}`}
                                        checked={formData.genres.includes(genre.id)}
                                        onChange={() => handleGenreChange(genre.id)}
                                        disabled={loading}
                                    />
                                    <label htmlFor={`genre-${genre.id}`}>{genre.name}</label>
                                </div>
                            ))}
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="register-button"
                        disabled={loading || !formData.email || !formData.password || formData.genres.length < 5}
                    >
                        {loading ? 'Creating Account...' : 'Register'}
                    </button>
                </form>

                <button
                    onClick={handleGoogleRegister}
                    className="google-button"
                    disabled={loading || formData.genres.length < 5}
                >
                    {loading ? 'Creating Account...' : 'Register with Google'}
                </button>

                <p className="login-link">
                    Already have an account? <Link to="/login">Login</Link>
                </p>
            </div>
            <Footer />
        </div>
    );
}

export default RegisterView;