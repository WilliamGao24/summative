import { createContext, useState, useContext, useEffect } from "react";
import { Map } from 'immutable';
import { auth, firestore } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

export const StoreContext = createContext();

export const StoreProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [selectedGenres, setSelectedGenres] = useState([]);
    const [cart, setCart] = useState(() => Map());
    const [purchases, setPurchases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [cartLoading, setCartLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            try {
                if (currentUser) {
                    const userDoc = await getDoc(doc(firestore, 'users', currentUser.uid));
                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        setSelectedGenres(userData.genres || []);
                        setPurchases(userData.purchases || []);

                        const firestoreCart = userData.cart || {};
                        const purchasedMovies = userData.purchases || [];
                        
                        const filteredCart = Object.fromEntries(
                            Object.entries(firestoreCart).filter(([_, movie]) =>
                                movie && movie.id && !purchasedMovies.some(p => p.id === movie.id)
                            )
                        );

                        setCart(Map(filteredCart));
                    }
                    setUser(currentUser);
                } else {
                    setUser(null);
                    setSelectedGenres([]);
                    setCart(Map());
                    setPurchases([]);
                }
            } catch (error) {
                console.error('Error loading user data:', error);
                setCart(Map());
                setPurchases([]);
                setSelectedGenres([]);
            } finally {
                setLoading(false);
                setCartLoading(false);
            }
        });

        return () => unsubscribe();
    }, []);

    const updateCart = (updater) => {
        try {
            const newCart = typeof updater === 'function' ? updater(cart) : updater;
            const validCart = Map.isMap(newCart) ? newCart : Map(newCart);
            
            const cartWithoutPurchased = validCart.filter((movie) => 
                !purchases.some(purchase => purchase.id === movie.id)
            );
            
            setCart(cartWithoutPurchased);

            if (user?.uid) {
                const userRef = doc(firestore, 'users', user.uid);
                const cartObject = cartWithoutPurchased.toJS();
                updateDoc(userRef, { cart: cartObject }).catch(error => {
                    if (error.code === 'not-found') {
                        setDoc(userRef, { cart: cartObject }, { merge: true });
                    }
                });
            }
        } catch (error) {
            console.error('Error updating cart:', error);
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

    const contextValue = {
        user,
        setUser,
        selectedGenres,
        setSelectedGenres,
        cart,
        setCart: updateCart,
        purchases,
        setPurchases,
        loading,
        cartLoading
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