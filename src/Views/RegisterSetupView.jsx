import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStoreContext } from '../context/context';
import { firestore } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';
import Header from '../components/Header';
import Footer from '../components/Footer';
import "./RegisterView.css";

function RegisterSetupView() {
    const navigate = useNavigate();
    const { setUser, setSelectedGenres } = useStoreContext();
    const [registrationData, setRegistrationData] = useState(null);
    const [formData, setFormData] = useState({
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

    const handleGenreChange = (id) => {
        setFormData(prev => ({
            ...prev,
            genres: prev.genres.includes(id)
                ? prev.genres.filter(genreId => genreId !== id)
                : [...prev.genres, id]
        }));
    };

    const createUserDocument = async () => {
        if (!registrationData) return;

        const userRef = doc(firestore, 'users', registrationData.uid);
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

        if (formData.genres.length < genres.length) {
            setError("Please select all genres to complete registration!");
            return;
        }

        setLoading(true);
        try {
            await createUserDocument();

            // Set user genres
            setSelectedGenres(formData.genres);
            
            // Clean up
            sessionStorage.removeItem('registrationData');

            // Navigate to first selected genre
            navigate(`/movies/genre/${formData.genres[0]}`);
        } catch (error) {
            console.error("Registration completion error:", error);
            setError('An error occurred while completing registration. Please try again.');
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
                <p className="step-indicator">Final Step: Select Your Genres</p>
                {error && <p className="error-message">{error}</p>}

                <form onSubmit={handleSubmit}>
                    <div className="genres-section">
                        <label>Select all genres to continue ({formData.genres.length}/{genres.length}):</label>
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
                        disabled={loading || formData.genres.length < genres.length}
                    >
                        {loading ? 'Completing Registration...' : 'Complete Registration'}
                    </button>
                </form>
            </div>
            <Footer />
        </div>
    );
}

export default RegisterSetupView;