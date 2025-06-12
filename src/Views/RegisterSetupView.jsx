import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStoreContext } from '../context/context';
import { auth, firestore } from '../firebase';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import Header from '../components/Header';
import Footer from '../components/Footer';
import "./RegisterView.css";

function RegisterSetupView() {
    const navigate = useNavigate();
    const { setUser, setSelectedGenres } = useStoreContext();
    const [registrationData, setRegistrationData] = useState(null);
    
    const [formData, setFormData] = useState({
        password: '',
        confirmPassword: '',
        genres: []
    });

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const savedData = sessionStorage.getItem('registrationData');
        if (!savedData) {
            navigate('/register');
            return;
        }
        setRegistrationData(JSON.parse(savedData));
    }, [navigate]);

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

    const createUserDocument = async (user) => {
        if (!user || !registrationData) return;

        const userRef = doc(firestore, 'users', user.uid);
        await setDoc(userRef, {
            email: registrationData.email,
            firstName: registrationData.firstName,
            lastName: registrationData.lastName,
            genres: formData.genres,
            createdAt: new Date(),
            purchases: []
        });
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');

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
                registrationData.email,
                formData.password
            );

            await updateProfile(user, {
                displayName: `${registrationData.firstName} ${registrationData.lastName}`
            });

            await createUserDocument(user);

            setUser(user);
            setSelectedGenres(formData.genres);
            sessionStorage.removeItem('registrationData');

            if (formData.genres.length > 0) {
                navigate(`/movies/genre/${formData.genres[0]}`);
            } else {
                navigate('/settings');
            }
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

    if (!registrationData) {
        return null;
    }

    return (
        <div className="register-container">
            <Header />
            <div className="form-container">
                <h2>Complete Your Registration</h2>
                <p className="step-indicator">Step 2 of 2: Account Setup</p>
                {error && <p className="error-message">{error}</p>}

                <form onSubmit={handleSubmit}>
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
                        <label>Select at least 5 genres:</label>
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
                        disabled={
                            loading ||
                            !formData.password ||
                            !formData.confirmPassword ||
                            formData.genres.length < 5
                        }
                    >
                        {loading ? 'Creating Account...' : 'Complete Registration'}
                    </button>
                </form>
            </div>
            <Footer />
        </div>
    );
}

export default RegisterSetupView;