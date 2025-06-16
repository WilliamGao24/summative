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
            const savedCart = localStorage.getItem('cart');
            return savedCart ? Map(JSON.parse(savedCart)) : Map();
        } catch (e) {
            console.error('Error loading cart from localStorage:', e);
            return Map();
        }
    });
    const [purchases, setPurchases] = useState([]);

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
        try {
            localStorage.setItem('cart', JSON.stringify(cart.toJS()));
        } catch (e) {
            console.error('Error saving cart to localStorage:', e);
        }
    }, [cart]);

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
                        
                        // Filter out purchased items and merge with local cart
                        const filteredCart = Object.entries(firestoreCart)
                            .filter(([_, movie]) => 
                                movie && movie.id && !purchasedMovies.some(p => p.id === movie.id)
                            );
                        
                        setCart(prevCart => {
                            // Merge Firestore cart with existing local cart
                            const mergedCart = Map(Object.fromEntries(filteredCart));
                            return mergedCart.merge(prevCart);
                        });
                    }
                    setUser(currentUser);
                } else {
                    setUser(null);
                    setFirstName('');
                    setLastName('');
                    setSelectedGenres([]);
                    setPurchases([]);
                    // Don't clear cart here to maintain it across sessions
                }
            } catch (error) {
                console.error('Error loading user data:', error);
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
                purchases: newPurchases
            });
            
            setPurchases(newPurchases);
            setCart(Map());
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
        handleCheckout
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