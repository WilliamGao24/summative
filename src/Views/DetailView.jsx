import axios from "axios";
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useStoreContext } from '../context/context';
import "./DetailView.css";

function DetailMovieView() {
    const [trailers, setTrailers] = useState([]);
    const [movie, setMovie] = useState(null);
    const [loading, setLoading] = useState(true);
    const { id } = useParams();
    const { cart, setCart, purchases } = useStoreContext();

    const isMoviePurchased = (movieId) => {
        return purchases.some(purchase => purchase.id === Number(movieId));
    };

    const handleAddToCart = () => {
        if (!movie || isMoviePurchased(movie.id)) {
            return;
        }

        setCart(prevCart => {
            const newCart = prevCart.set(movie.id, {
                ...movie,
                id: movie.id // Ensure ID is consistently stored
            });
            return newCart;
        });
    };

    useEffect(() => {
        async function fetchMovieDetails() {
            setLoading(true);
            try {
                const movieResponse = await axios.get(
                    `https://api.themoviedb.org/3/movie/${id}?api_key=${import.meta.env.VITE_TMDB_KEY}`
                );
                setMovie(movieResponse.data);

                const videosResponse = await axios.get(
                    `https://api.themoviedb.org/3/movie/${id}/videos?api_key=${import.meta.env.VITE_TMDB_KEY}`
                );
                setTrailers(videosResponse.data.results.filter((video) => video.type === "Trailer"));
            } catch (error) {
                console.error("Error fetching movie details:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchMovieDetails();
    }, [id]);

    if (loading) {
        return <div className="loading">Loading...</div>;
    }

    if (!movie) {
        return <div className="error-message">Movie not found</div>;
    }

    return (
        <div className="movie-detail">
            <div className="movie-content">
                <div className="movie-info">
                    <h1 className="movie-title">{movie.original_title}</h1>
                    <p className="movie-overview">{movie.overview}</p>
                    <div className="movie-metadata">
                        <p><strong>Release Date:</strong> {movie.release_date}</p>
                        <p><strong>Runtime:</strong> {movie.runtime} minutes</p>
                        <p><strong>Language:</strong> {movie.original_language}</p>
                        <p><strong>Rating:</strong> {movie.vote_average}</p>
                        <p><strong>Popularity:</strong> {movie.popularity}</p>
                        {movie.revenue > 0 && (
                            <p><strong>Box Office:</strong> ${movie.revenue.toLocaleString()}</p>
                        )}
                    </div>

                    {!isMoviePurchased(movie.id) ? (
                        <button 
                            className={`purchase-button ${cart.has(movie.id) ? 'added' : ''}`}
                            onClick={handleAddToCart}
                        >
                            {cart.has(movie.id) ? 'Added to Cart' : 'Add to Cart'}
                        </button>
                    ) : (
                        <div className="purchase-status">You own this movie</div>
                    )}
                </div>
                {movie.poster_path && (
                    <img
                        className="movie-poster"
                        src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                        alt={movie.original_title}
                    />
                )}
            </div>

            {trailers.length > 0 && (
                <div className="trailers-section">
                    <h2>Trailers</h2>
                    <div className="trailers-grid">
                        {trailers.map((trailer) => (
                            <div key={trailer.id} className="trailer-tile">
                                <a
                                    href={`https://www.youtube.com/watch?v=${trailer.key}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <img
                                        className="trailer-thumbnail"
                                        src={`https://img.youtube.com/vi/${trailer.key}/0.jpg`}
                                        alt={trailer.name}
                                    />
                                    <h3>{trailer.name}</h3>
                                </a>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export default DetailMovieView;