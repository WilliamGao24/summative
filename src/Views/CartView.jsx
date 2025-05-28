import { useStoreContext } from '../context/context';
import Header from "../components/Header";
import Footer from "../components/Footer";
import "./CartView.css";

function CartView() {
    const { cart, setCart } = useStoreContext();

    const handleRemove = (movieId) => {
        setCart(prevCart => prevCart.delete(movieId));
    };

    return (
        <div className="cart-container">
            <Header />
            <div className="cart-content">
                <h2>Shopping Cart</h2>
                {cart.size === 0 ? (
                    <p className="empty-cart">Your cart is empty</p>
                ) : (
                    <div className="cart-items">
                        {Array.from(cart.values()).map(movie => (
                            <div key={movie.id} className="cart-item">
                                <img
                                    src={`https://image.tmdb.org/t/p/w200${movie.poster_path}`}
                                    alt={movie.title}
                                    className="cart-item-poster"
                                />
                                <div className="cart-item-details">
                                    <h3>{movie.title}</h3>
                                    <button 
                                        className="remove-button"
                                        onClick={() => handleRemove(movie.id)}
                                    >
                                        Remove
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            <Footer />
        </div>
    );
}

export default CartView;