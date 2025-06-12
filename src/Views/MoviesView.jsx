import { Outlet, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Header from "../components/Header";
import Genres from "../components/Genres";
import Footer from "../components/Footer";
import { useStoreContext } from '../context/context';
import "./MoviesView.css";

function MoviesView() {
    const { user, selectedGenres } = useStoreContext();
    const location = useLocation();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);

    // Redirect to login if not authenticated
    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    const allGenres = [
        { genre: "Sci-Fi", id: 878 },
        { genre: "Thriller", id: 53 },
        { genre: "Adventure", id: 12 },
        { genre: "Family", id: 10751 },
        { genre: "Animation", id: 16 },
        { genre: "Action", id: 28 },
        { genre: "History", id: 36 },
        { genre: "Fantasy", id: 14 },
        { genre: "Horror", id: 27 },
        { genre: "Comedy", id: 35 }
    ];

    // Filter genres based on user preferences
    const filteredGenres = allGenres.filter(genre => 
        selectedGenres.includes(genre.id)
    );

    // Handle loading state and navigation
    useEffect(() => {
        if (selectedGenres.length === 0) {
            setLoading(true);
            return;
        }

        setLoading(false);
        // If no genre is selected in the URL, redirect to the first available genre
        if (location.pathname === '/movies' && filteredGenres.length > 0) {
            navigate(`/movies/genre/${filteredGenres[0].id}`);
        }
    }, [selectedGenres, location.pathname, navigate, filteredGenres]);

    // Show loading state
    if (loading) {
        return (
            <div className="app-container">
                <Header />
                <div className="loading-message">Loading...</div>
                <Footer />
            </div>
        );
    }

    // If no genres are selected, show a message
    if (filteredGenres.length === 0) {
        return (
            <div className="app-container">
                <Header />
                <div className="no-genres-message">
                    Please update your genre preferences in Settings
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <div className="app-container">
            <Header />
            <h1 className="movieview-title">Your Preferred Genres</h1>
            <div className="genre-container">
                <div className="genre-list">
                    <Genres genresList={filteredGenres} />
                </div>
                <div className="genre-movies">
                    <Outlet />
                </div>
            </div>
            <Footer />
        </div>
    );
}

export default MoviesView;