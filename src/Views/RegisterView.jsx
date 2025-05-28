import "./RegisterView.css";
import Header from "../components/Header";
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useStoreContext } from '../context/context';

function RegisterView() {
    const navigate = useNavigate();
    const {
        setFirst,
        setLast,
        setEmail,
        setPassword,
        setSelected,
        setLoggedIn,
        registeredUsers,
        setRegisteredUsers
    } = useStoreContext();

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirmPassword: '',
        genres: []
    });

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

    const handleSubmit = (event) => {
        event.preventDefault();

        if (!formData.firstName || !formData.lastName || !formData.email ||
            !formData.password || !formData.confirmPassword) {
            alert("Please fill in all fields!");
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            alert("Passwords don't match!");
            return;
        }

        if (formData.genres.length < 5) {
            alert("Please select at least 5 genres!");
            return;
        }

        if (registeredUsers.some(user => user.email === formData.email)) {
            alert("Email already registered!");
            return;
        }

        setFirst(formData.firstName);
        setLast(formData.lastName);
        setEmail(formData.email);
        setPassword(formData.password);
        setSelected(formData.genres);
        setLoggedIn(true);

        setRegisteredUsers([
            ...registeredUsers,
            {
                email: formData.email,
                password: formData.password,
                firstName: formData.firstName,
                lastName: formData.lastName,
                genres: formData.genres
            }
        ]);

        navigate(`/movies/genre/${formData.genres[0]}`);
    };

    return (
        <div className="register-container">
            <Header />
            <div className="form-container">
                <h2>Create an Account</h2>
                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label>First Name:</label>
                        <input
                            type="text"
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleChange}
                            required
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
                                    />
                                    <label htmlFor={`genre-${genre.id}`}>{genre.name}</label>
                                </div>
                            ))}
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="register-button"
                        disabled={!formData.firstName ||
                            !formData.lastName ||
                            !formData.email ||
                            !formData.password ||
                            !formData.confirmPassword ||
                            formData.genres.length < 5}
                    >
                        Register
                    </button>
                </form>
                <p className="login-link">
                    Already have an account? <Link to="/login">Login</Link>
                </p>
            </div>
        </div>
    );
}

export default RegisterView;