import axios from "axios";
import { useEffect, useState } from "react";
import { Link } from 'react-router-dom';
import './Featured.css';

function Featured() {
    const [movies, setMovies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function getData() {
            setLoading(true);
            setError(null);
            try {
                // Debug log to check if API key is available
                console.log('TMDB Key available:', !!import.meta.env.VITE_TMDB_KEY);
                
                if (!import.meta.env.VITE_TMDB_KEY) {
                    throw new Error('TMDB API key is missing. Please check your .env file.');
                }

                const apiKey = import.meta.env.VITE_TMDB_KEY;
                const url = `https://api.themoviedb.org/3/movie/now_playing?api_key=${apiKey}&language=en-US&page=1`;
                
                console.log('Fetching movies from:', url);
                const response = await axios.get(url);

                if (!response.data || !response.data.results) {
                    throw new Error('Invalid response format from TMDB API');
                }

                const shuffledMovies = response.data.results
                    .filter(movie => movie.poster_path && movie.title)
                    .sort(() => 0.5 - Math.random());
                
                const selectedMovies = shuffledMovies.slice(0, 4);
                console.log('Selected movies:', selectedMovies.map(m => m.title));
                setMovies(selectedMovies);
            } catch (error) {
                console.error('Error details:', {
                    message: error.message,
                    response: error.response?.data
                });
                setError(error.response?.data?.status_message || error.message);
            } finally {
                setLoading(false);
            }
        }
        getData();
    }, []);

    if (error) {
        return <div className="movie-container error">{error}</div>;
    }

    if (loading) {
        return <div className="movie-container loading">Loading movies...</div>;
    }

    if (!movies || movies.length === 0) {
        return <div className="movie-container empty">No movies available</div>;
    }

    return (
        <div className="featured-section">
            <h2>Featured Movies</h2>
            <div className="movie-container">
                {movies.map(movie => (
                    <Link to={`/movies/details/${movie.id}`} key={movie.id} className="movie-card">
                        {movie.poster_path ? (
                            <img
                                className="movie-poster"
                                src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                                alt={movie.title}
                            />
                        ) : (
                            <div className="no-poster">No Image Available</div>
                        )}
                        <div className="movie-info">
                            <h3>{movie.title}</h3>
                            <p className="movie-year">{movie.release_date?.split('-')[0]}</p>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}

export default Featured;