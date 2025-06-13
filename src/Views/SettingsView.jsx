import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStoreContext } from '../context/context';
import { auth, firestore } from '../firebase';
import { updateProfile, updateEmail, updatePassword } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import Header from '../components/Header';
import Footer from '../components/Footer';
import './SettingsView.css';

function SettingsView() {
    const navigate = useNavigate();
    const { user, selectedGenres, setSelectedGenres, purchases } = useStoreContext();
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const isEmailUser = user?.providerData[0]?.providerId === 'password';

    const [formData, setFormData] = useState({
        firstName: user?.displayName?.split(' ')[0] || '',
        lastName: user?.displayName?.split(' ')[1] || '',
        email: user?.email || '',
        newPassword: '',
        confirmPassword: '',
        selectedGenres: selectedGenres
    });

    useEffect(() => {
        if (!user) {
            navigate('/login');
        }
    }, [user, navigate]);

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
            selectedGenres: prev.selectedGenres.includes(id)
                ? prev.selectedGenres.filter(genreId => genreId !== id)
                : [...prev.selectedGenres, id]
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setLoading(true);
        // Clear password fields at the start of submission
        const clearedPasswords = {
            newPassword: '',
            confirmPassword: ''
        };

        try {
            if (formData.selectedGenres.length < 5) {
                throw new Error("Please select at least 5 genres!");
            }

            if (isEmailUser) {
                if (formData.newPassword) {
                    if (formData.newPassword !== formData.confirmPassword) {
                        throw new Error("New passwords don't match!");
                    }
                    await updatePassword(user, formData.newPassword);
                }

                if (formData.email !== user.email) {
                    await updateEmail(user, formData.email);
                }

                // Update display name
                const fullName = `${formData.firstName} ${formData.lastName}`.trim();
                if (fullName !== user.displayName) {
                    await updateProfile(user, { displayName: fullName });
                }
            }

            // Update Firestore data
            const userRef = doc(firestore, 'users', user.uid);
            await updateDoc(userRef, {
                genres: formData.selectedGenres,
                firstName: formData.firstName,
                lastName: formData.lastName
            });

            setSelectedGenres(formData.selectedGenres);
            setMessage('Settings updated successfully!');
        } catch (error) {
            console.error('Settings update error:', error);
            setMessage(error.message);
        } finally {
            setLoading(false);
            // Clear password fields and update form data
            setFormData(prev => ({
                ...prev,
                ...clearedPasswords
            }));
        }
    };

    // Add navigation buttons layout
    const navigationButtons = (
        <div className="navigation-buttons">
            <button onClick={() => navigate(-1)} className="nav-btn">Back</button>
        </div>
    );

    return (
        <div className="settings-container">
            <Header />
            <div className="settings-content">
                {navigationButtons}
                <h2>Account Settings</h2>
                {message && (
                    <p className={message.includes('success') ? 'success-message' : 'error-message'}>
                        {message}
                    </p>
                )}

                <form onSubmit={handleSubmit} className="settings-form">
                    <div className="form-group">
                        <label>Email:</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            disabled={!isEmailUser}
                            className={!isEmailUser ? 'disabled-input' : ''}
                        />
                    </div>

                    <div className="form-group">
                        <label>First Name:</label>
                        <input
                            type="text"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleChange}
                            disabled={!isEmailUser}
                            className={!isEmailUser ? 'disabled-input' : ''}
                        />
                    </div>

                    <div className="form-group">
                        <label>Last Name:</label>
                        <input
                            type="text"
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleChange}
                            disabled={!isEmailUser}
                            className={!isEmailUser ? 'disabled-input' : ''}
                        />
                    </div>

                    {isEmailUser && (
                        <>
                            <div className="form-group">
                                <label>New Password:</label>
                                <input
                                    type="password"
                                    name="newPassword"
                                    value={formData.newPassword}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="form-group">
                                <label>Confirm New Password:</label>
                                <input
                                    type="password"
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                />
                            </div>
                        </>
                    )}

                    <div className="form-group">
                        <label>Preferred Genres (select at least 5):</label>
                        <div className="genres-grid">
                            {genres.map(genre => (
                                <div key={genre.id} className="genre-item">
                                    <input
                                        type="checkbox"
                                        id={`genre-${genre.id}`}
                                        checked={formData.selectedGenres.includes(genre.id)}
                                        onChange={() => handleGenreChange(genre.id)}
                                    />
                                    <label htmlFor={`genre-${genre.id}`}>{genre.name}</label>
                                </div>
                            ))}
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="save-button"
                        disabled={loading || formData.selectedGenres.length < 5}
                    >
                        {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                </form>

                <div className="purchases-section">
                    <h3>Purchase History</h3>
                    {purchases.length === 0 ? (
                        <p>No purchases yet.</p>
                    ) : (
                        <div className="purchases-grid">
                            {purchases.map(movie => (
                                <div key={movie.id} className="purchase-item">
                                    <img
                                        src={`https://image.tmdb.org/t/p/w200${movie.poster_path}`}
                                        alt={movie.title}
                                        className="purchase-poster"
                                    />
                                    <h4>{movie.title}</h4>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            <Footer />
        </div>
    );
}

export default SettingsView;