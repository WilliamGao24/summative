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
    const [totalPages, setTotalPages] = useState(0);
    const { cart, setCart } = useStoreContext();

    const debouncedSearch = useCallback(
        debounce(async (searchQuery, pageNum) => {
            if (!searchQuery) return;

            setLoading(true);
            try {
                const response = await axios.get(
                    `https://api.themoviedb.org/3/search/movie?api_key=${import.meta.env.VITE_TMDB_KEY}&query=${searchQuery}&page=${pageNum}`
                );
                setMovies(response.data.results);
                setTotalPages(response.data.total_pages);
            } catch (error) {
                console.error('Error searching movies:', error);
            } finally {
                setLoading(false);
            }
        }, 500),
        []
    );

    useEffect(() => {
        debouncedSearch(query, page);
    }, [query, page, debouncedSearch]);

    const handleAddToCart = (movie) => {
        setCart(prevCart => {
            if (prevCart.has(movie.id)) {
                return prevCart.delete(movie.id);
            } else {
                return prevCart.set(movie.id, movie);
            }
        });
    };

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
                                        <button
                                            className={`cart-button ${cart.has(movie.id) ? 'added' : ''}`}
                                            onClick={() => handleAddToCart(movie)}
                                        >
                                            {cart.has(movie.id) ? 'Added' : 'Buy'}
                                        </button>
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
                                disabled={page === 1}
                            >
                                Previous
                            </button>
                            <span>Page {page} of {totalPages}</span>
                            <button
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
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

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

export default SearchView;