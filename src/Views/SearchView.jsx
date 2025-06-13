import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { useStoreContext } from '../context/context';
import './SearchView.css';

function SearchView() {
    const { query } = useParams();
    const [movies, setMovies] = useState([]);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [totalPages, setTotalPages] = useState(0);
    const { cart, setCart, purchases } = useStoreContext();

    const isMoviePurchased = (movieId) => {
        return purchases.some(purchase => purchase.id === movieId);
    };

    const handleAddToCart = (movie) => {
        if (isMoviePurchased(movie.id)) {
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

    const searchMovies = useCallback(async (searchQuery, pageNum) => {
        if (!searchQuery) return;

        setLoading(true);
        setError(null);
        try {
            console.log(`Searching for "${searchQuery}" on page ${pageNum}`);
            const response = await axios.get(
                `https://api.themoviedb.org/3/search/movie?api_key=${import.meta.env.VITE_TMDB_KEY}&query=${searchQuery}&page=${pageNum}`
            );
            console.log('Search results:', response.data);
            setMovies(response.data.results);
            setTotalPages(response.data.total_pages);
        } catch (error) {
            console.error('Error searching movies:', error);
            setError('Failed to search movies. Please try again later.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        searchMovies(query, page);
    }, [query, page, searchMovies]);

    if (error) {
        return <div className="error-message">{error}</div>;
    }

    return (
        <div className="search-view">
            <h2>Search Results for: {query}</h2>
            {loading ? (
                <div className="loading">Loading...</div>
            ) : (
                <>
                    <div className="search-results">
                        {movies.length > 0 ? (
                            movies.map(movie => (
                                <div key={movie.id} className="movie-card">
                                    {movie.poster_path ? (
                                        <img
                                            src={`https://image.tmdb.org/t/p/w200${movie.poster_path}`}
                                            alt={movie.title}
                                            className="movie-poster"
                                        />
                                    ) : (
                                        <div className="no-poster">No Image Available</div>
                                    )}
                                    <div className="movie-info">
                                        <h3>{movie.title}</h3>
                                        <p>{movie.release_date?.split('-')[0]}</p>
                                        {!isMoviePurchased(movie.id) && (
                                            <button
                                                className={`cart-button ${cart.has(movie.id) ? 'added' : ''}`}
                                                onClick={() => handleAddToCart(movie)}
                                            >
                                                {cart.has(movie.id) ? 'Added' : 'Add to Cart'}
                                            </button>
                                        )}
                                        {isMoviePurchased(movie.id) && (
                                            <div className="purchased-badge">Purchased</div>
                                        )}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="no-results">No movies found</p>
                        )}
                    </div>
                    {movies.length > 0 && (
                        <div className="pagination">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1 || loading}
                            >
                                Previous
                            </button>
                            <span>Page {page} of {totalPages}</span>
                            <button
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages || loading}
                            >
                                Next
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

export default SearchView;