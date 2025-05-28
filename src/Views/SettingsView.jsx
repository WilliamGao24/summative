import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStoreContext } from '../context/context';
import Header from '../components/Header';
import Footer from '../components/Footer';
import './SettingsView.css';

function SettingsView() {
    const navigate = useNavigate();
    const {
        firstName,
        lastName,
        email,
        selectedGenres,
        setFirst,
        setLast,
        setSelected,
        loggedIn
    } = useStoreContext();

    const [formData, setFormData] = useState({
        firstName: firstName,
        lastName: lastName,
        selectedGenres: selectedGenres
    });

    useEffect(() => {
        if (!loggedIn) {
            navigate('/login');
        }
    }, [loggedIn, navigate]);

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

    const handleSubmit = (e) => {
        e.preventDefault();

        if (formData.selectedGenres.length < 5) {
            alert("Please select at least 5 genres!");
            return;
        }

        setFirst(formData.firstName);
        setLast(formData.lastName);
        setSelected(formData.selectedGenres);

        alert("Settings updated successfully!");
    };

    return (
        <div className="settings-container">
            <Header />
            <div className="settings-content">
                <h2>Account Settings</h2>
                <form onSubmit={handleSubmit} className="settings-form">
                    <div className="form-group">
                        <label>Email:</label>
                        <input
                            type="email"
                            value={email}
                            disabled
                            className="disabled-input"
                        />
                    </div>

                    <div className="form-group">
                        <label>First Name:</label>
                        <input
                            type="text"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label>Last Name:</label>
                        <input
                            type="text"
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleChange}
                            required
                        />
                    </div>

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
                        disabled={formData.selectedGenres.length < 5}
                    >
                        Save Changes
                    </button>
                </form>
            </div>
            <Footer />
        </div>
    );
}

export default SettingsView;