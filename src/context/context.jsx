import { createContext, useState, useContext, useEffect } from "react";
import { Map } from 'immutable';
import { auth, firestore } from '../firebase';
import { 
    onAuthStateChanged,
    updateProfile,
    EmailAuthProvider,
    updatePassword,
    reauthenticateWithCredential
} from 'firebase/auth';
import { 
    doc, 
    getDoc, 
    setDoc, 
    updateDoc,
    arrayUnion 
} from 'firebase/firestore';

export const StoreContext = createContext();

export const StoreProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [cartLoading, setCartLoading] = useState(true);
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [selectedGenres, setSelectedGenres] = useState([]);
    const [cart, setCart] = useState(() => {
        try {
            // Initialize cart based on user ID to prevent shared carts
            const currentUser = auth.currentUser;
            if (currentUser) {
                const savedCart = localStorage.getItem(`cart_${currentUser.uid}`);
                return savedCart ? Map(JSON.parse(savedCart)) : Map();
            }
            return Map();
        } catch (e) {
            console.error('Error loading cart from localStorage:', e);
            return Map();
        }
    });
    const [purchases, setPurchases] = useState([]);

    // Clear cart data for a specific user
    const clearUserCart = (userId) => {
        if (userId) {
            localStorage.removeItem(`cart_${userId}`);
        }
    };

    // Save cart to localStorage with user-specific key
    useEffect(() => {
        if (user?.uid) {
            try {
                localStorage.setItem(`cart_${user.uid}`, JSON.stringify(cart.toJS()));
            } catch (e) {
                console.error('Error saving cart to localStorage:', e);
            }
        }
    }, [cart, user]);

    const updateUserProfile = async (updates) => {
        if (!user) return false;

        try {
            if (updates.newPassword && updates.currentPassword) {
                try {
                    const credential = EmailAuthProvider.credential(
                        user.email,
                        updates.currentPassword
                    );
                    await reauthenticateWithCredential(user, credential);
                    await updatePassword(user, updates.newPassword);
                } catch (error) {
                    throw error;
                }
            }

            if (updates.firstName || updates.lastName) {
                const displayName = `${updates.firstName} ${updates.lastName}`.trim();
                await updateProfile(user, { displayName });
            }

            const userRef = doc(firestore, 'users', user.uid);
            await updateDoc(userRef, {
                firstName: updates.firstName || firstName,
                lastName: updates.lastName || lastName,
                genres: updates.genres || selectedGenres
            });

            if (updates.firstName) setFirstName(updates.firstName);
            if (updates.lastName) setLastName(updates.lastName);
            if (updates.genres) setSelectedGenres(updates.genres);

            return true;
        } catch (error) {
            throw error;
        }
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            try {
                if (currentUser) {
                    const userDoc = await getDoc(doc(firestore, 'users', currentUser.uid));
                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        setFirstName(userData.firstName || '');
                        setLastName(userData.lastName || '');
                        setSelectedGenres(userData.genres || []);
                        setPurchases(userData.purchases || []);

                        const firestoreCart = userData.cart || {};
                        const purchasedMovies = userData.purchases || [];
                        
                        // Get user-specific localStorage cart
                        const localCartData = localStorage.getItem(`cart_${currentUser.uid}`);
                        const localCart = localCartData ? Map(JSON.parse(localCartData)) : Map();
                        
                        // Merge Firebase cart with localStorage cart
                        const mergedCart = Map({
                            ...firestoreCart,
                            ...localCart.toJS()
                        }).filter((movie) => 
                            movie && movie.id && !purchasedMovies.some(purchase => 
                                purchase.items && Object.keys(purchase.items).includes(movie.id.toString())
                            )
                        );

                        // Update both local state and storage
                        setCart(mergedCart);
                        localStorage.setItem(`cart_${currentUser.uid}`, JSON.stringify(mergedCart.toJS()));

                        // Sync back to Firebase
                        const userRef = doc(firestore, 'users', currentUser.uid);
                        await updateDoc(userRef, { cart: mergedCart.toJS() });
                    } else {
                        // If user doc doesn't exist, initialize with empty cart
                        const userRef = doc(firestore, 'users', currentUser.uid);
                        await setDoc(userRef, {
                            firstName: '',
                            lastName: '',
                            genres: [],
                            purchases: [],
                            cart: {}
                        });
                        setCart(Map());
                        localStorage.setItem(`cart_${currentUser.uid}`, JSON.stringify({}));
                    }
                    setUser(currentUser);
                } else {
                    if (user?.uid) {
                        // Clear previous user's cart data
                        clearUserCart(user.uid);
                    }
                    setUser(null);
                    setFirstName('');
                    setLastName('');
                    setSelectedGenres([]);
                    setPurchases([]);
                    setCart(Map());
                }
            } catch (error) {
                console.error('Error loading user data:', error);
                setPurchases([]);
                setSelectedGenres([]);
                setCart(Map());
            } finally {
                setLoading(false);
                setCartLoading(false);
            }
        });

        return () => unsubscribe();
    }, []);

    const updateCart = async (updater) => {
        try {
            const newCart = typeof updater === 'function' ? updater(cart) : updater;
            const validCart = Map.isMap(newCart) ? newCart : Map(newCart);
            
            const cartWithoutPurchased = validCart.filter((movie) => 
                !purchases.some(purchase => 
                    purchase.items && Object.keys(purchase.items).includes(movie.id.toString())
                )
            );
            
            // Update local state
            setCart(cartWithoutPurchased);

            // Save to user-specific localStorage
            if (user?.uid) {
                localStorage.setItem(`cart_${user.uid}`, JSON.stringify(cartWithoutPurchased.toJS()));
            }

            // Save to Firebase if user is logged in
            if (user?.uid) {
                const userRef = doc(firestore, 'users', user.uid);
                const cartObject = cartWithoutPurchased.toJS();
                try {
                    await updateDoc(userRef, { cart: cartObject });
                } catch (error) {
                    if (error.code === 'not-found') {
                        await setDoc(userRef, { cart: cartObject }, { merge: true });
                    } else {
                        console.error('Error updating Firebase cart:', error);
                    }
                }
            }
        } catch (error) {
            console.error('Error updating cart:', error);
        }
    };

    const handleCheckout = async () => {
        if (!user || cart.size === 0) return false;

        try {
            const purchaseItems = cart.toJS();
            const timestamp = new Date().toISOString();
            const purchase = {
                items: purchaseItems,
                timestamp,
                total: cart.size
            };

            const userRef = doc(firestore, 'users', user.uid);
            const newPurchases = [...purchases, purchase];
            
            await updateDoc(userRef, {
                purchases: newPurchases,
                cart: {} // Clear Firebase cart
            });
            
            setPurchases(newPurchases);
            setCart(Map());
            clearUserCart(user.uid); // Clear user-specific localStorage cart
            return true;
        } catch (error) {
            console.error("Error processing checkout:", error);
            return false;
        }
    };

    useEffect(() => {
        if (user?.uid && selectedGenres.length > 0) {
            const userRef = doc(firestore, 'users', user.uid);
            const updateGenres = async () => {
                try {
                    await setDoc(userRef, { genres: selectedGenres }, { merge: true });
                } catch (error) {
                    console.error('Error updating genres:', error);
                }
            };
            updateGenres();
        }
    }, [selectedGenres, user]);

    useEffect(() => {
        if (user?.uid && purchases.length > 0) {
            const userRef = doc(firestore, 'users', user.uid);
            const updatePurchases = async () => {
                try {
                    await setDoc(userRef, { purchases }, { merge: true });

                    // Keep purchased items marked as purchased in localStorage
                    const purchasedMovieIds = purchases.map(purchase => purchase.id);
                    localStorage.setItem('purchased_movies', JSON.stringify(purchasedMovieIds));
                } catch (error) {
                    console.error('Error updating purchases:', error);
                }
            };
            updatePurchases();
        }
    }, [purchases, user]);

    useEffect(() => {
        try {
            const savedPurchases = localStorage.getItem('purchased_movies');
            if (savedPurchases) {
                const purchasedIds = JSON.parse(savedPurchases);
                setCart(prevCart => {
                    let newCart = prevCart;
                    purchasedIds.forEach(id => {
                        newCart = newCart.delete(id);
                    });
                    return newCart;
                });
            }
        } catch (e) {
            console.error('Error loading purchased movies:', e);
        }
    }, []);

    // Check if a movie is already in cart
    const isInCart = (movieId) => {
        return cart.has(movieId.toString());
    };

    // Add to cart function
    const addToCart = (movie) => {
        if (!movie || !movie.id) return;
        
        const movieId = movie.id.toString();
        if (isInCart(movieId)) {
            console.log('Movie already in cart');
            return false;
        }

        if (purchases.some(purchase => purchase.items[movieId])) {
            console.log('Movie already purchased');
            return false;
        }

        updateCart(currentCart => currentCart.set(movieId, movie));
        return true;
    };

    // Remove from cart function
    const removeFromCart = (movieId) => {
        if (!movieId) return;
        updateCart(currentCart => currentCart.delete(movieId.toString()));
    };

    const contextValue = {
        user,
        setUser,
        firstName,
        setFirstName,
        lastName,
        setLastName,
        selectedGenres,
        setSelectedGenres,
        cart,
        setCart: updateCart,
        purchases,
        setPurchases,
        loading,
        cartLoading,
        updateUserProfile,
        handleCheckout,
        addToCart,
        removeFromCart,
        isInCart
    };

    if (loading) {
        return null;
    }

    return (
        <StoreContext.Provider value={contextValue}>
            {children}
        </StoreContext.Provider>
    );
}

export const useStoreContext = () => useContext(StoreContext);