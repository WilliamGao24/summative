import axios from "axios";
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useStoreContext } from '../context/context';
import "./GenreView.css";

function GenreView() {
  const { genre_id } = useParams();
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const { cart, setCart, purchases, cartLoading } = useStoreContext();

  const genres = [
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
  
  const selectedGenre = genres.find(genre => genre.id === parseInt(genre_id));
  const genreName = selectedGenre ? selectedGenre.genre : "Movies in Genre";

  const isMoviePurchased = (movieId) => {
    return purchases.some(purchase => purchase.id === movieId);
  };

  const isMoviePurchasedOrInCart = (movieId) => {
    return isMoviePurchased(movieId) || cart.has(movieId);
  };

  const handleAddToCart = (movie, e) => {
    e.preventDefault();

    if (isMoviePurchasedOrInCart(movie.id)) {
      return;
    }

    setCart(prevCart => {
      const movieData = {
        ...movie,
        id: movie.id
      };
      return prevCart.set(movie.id, movieData);
    });
  };

  useEffect(() => {
    async function fetchMovies() {
      setLoading(true);
      setError(null);
      try {
        console.log(`Fetching movies for genre ${genre_id}, page ${page}`);
        const response = await axios.get(
          `https://api.themoviedb.org/3/discover/movie?api_key=${import.meta.env.VITE_TMDB_KEY}&with_genres=${genre_id}&page=${page}`
        );
        console.log('Genre movies data:', response.data);
        setMovies(response.data.results);
      } catch (error) {
        console.error("Error fetching movies:", error);
        setError("Failed to load movies. Please try again later.");
      } finally {
        setLoading(false);
      }
    }
    fetchMovies();
  }, [genre_id, page]);

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  // Wait for both movie data and cart data to load
  if (loading || cartLoading) {
    return <div className="loading">Loading movies...</div>;
  }

  return (
    <div className="hero">
      <h2>{genreName}</h2>
      <div className="genre-view-container">
        {movies.length > 0 ? (
          movies.map((movie) => (
            <div key={movie.id} className="genre-view-item">
              <Link to={`/movies/details/${movie.id}`}>
                {movie.poster_path ? (
                  <img
                    src={`https://image.tmdb.org/t/p/w200${movie.poster_path}`}
                    alt={movie.title}
                    className="genre-view-image"
                  />
                ) : (
                  <div className="no-image">No Image Available</div>
                )}                {!isMoviePurchased(movie.id) && (
                  <button 
                    className="buy-button"
                    onClick={(e) => {
                      e.preventDefault(); // Prevent navigation
                      handleAddToCart(movie, e);
                    }}
                  >
                    {cart.has(movie.id) ? 'Added' : 'Add to Cart'}
                  </button>
                )}
                {isMoviePurchased(movie.id) && (
                  <div className="purchased-badge">Purchased</div>
                )}
              </Link>
            </div>
          ))
        ) : (
          <p>No movies available for this genre.</p>
        )}
      </div>
      <div className="genre-view-pagination-container">
        <button
          className="genre-view-pagination-button"
          onClick={() => setPage((p) => Math.max(p - 1, 1))}
          disabled={page === 1 || loading}
        >
          Prev
        </button>
        <button
          className="genre-view-pagination-button"
          onClick={() => setPage((p) => p + 1)}
          disabled={loading}
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default GenreView;