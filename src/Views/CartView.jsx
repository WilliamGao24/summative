import { useState } from 'react';
import { useStoreContext } from '../context/context';
import { firestore } from '../firebase';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { Map } from 'immutable';
import Header from "../components/Header";
import Footer from "../components/Footer";
import "./CartView.css";
import { useNavigate } from 'react-router-dom';

function CartView() {
    const navigate = useNavigate();
    const { user, cart, setCart, purchases, setPurchases, cartLoading } = useStoreContext();
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);

    if (cartLoading) {
        return (
            <div className="cart-container">
                <Header />
                <div className="cart-content">
                    <div className="cart-loading">
                        <div className="loading-skeleton"></div>
                        <div className="loading-skeleton"></div>
                        <div className="loading-skeleton"></div>
                    </div>
                </div>
                <Footer />
            </div>
        );
    }

    const handleRemove = async (movieId) => {
        setCart(prevCart => {
            const newCart = prevCart.delete(movieId);
            return newCart;
        });
    };
    
    const handleCheckout = async () => {
        if (cart.size === 0) {
            setMessage('Your cart is empty!');
            return;
        }

        const alreadyPurchased = Array.from(cart.values()).filter(movie => 
            purchases.some(purchase => purchase.id === movie.id)
        );

        if (alreadyPurchased.length > 0) {
            setMessage(`You've already purchased: ${alreadyPurchased.map(m => m.title).join(', ')}`);
            return;
        }

        setLoading(true);
        try {
            const userRef = doc(firestore, 'users', user.uid);
            const cartMovies = Array.from(cart.values());
            
            // Add to purchases in Firestore
            await updateDoc(userRef, {
                purchases: arrayUnion(...cartMovies)
            });

            // Update local purchases state
            setPurchases(prev => [...prev, ...cartMovies]);
            
            // Instead of clearing the cart completely, mark items as purchased
            cartMovies.forEach(movie => {
                handleRemove(movie.id);
            });
            
            setMessage('Thank you for your purchase! Your movies are now available in your library.');
        } catch (error) {
            console.error('Checkout error:', error);
            setMessage('An error occurred during checkout. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const navigationButtons = (
        <div className="navigation-buttons">
            <button onClick={() => navigate(-1)} className="nav-btn">Back</button>
        </div>
    );

    return (
        <div className="cart-container">
            <Header />
            <div className="cart-content">
                {navigationButtons}
                <h2>Shopping Cart</h2>
                {message && (
                    <p className={message.includes('error') ? 'error-message' : 'success-message'}>
                        {message}
                    </p>
                )}
                
                {cart.size === 0 && !message.includes('thank you') ? (
                    <p className="empty-cart">Your cart is empty</p>
                ) : (
                    <>
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
                                            disabled={loading}
                                        >
                                            Remove
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        {cart.size > 0 && (
                            <div className="cart-summary">
                                <button 
                                    className="checkout-button"
                                    onClick={handleCheckout}
                                    disabled={loading}
                                >
                                    {loading ? 'Processing...' : 'Complete Purchase'}
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
            <Footer />
        </div>
    );
}

export default CartView;