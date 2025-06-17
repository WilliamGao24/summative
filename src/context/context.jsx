import { createContext, useState, useContext, useEffect, useCallback } from "react";
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
    updateDoc
} from 'firebase/firestore';

export const StoreContext = createContext();

export const StoreProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [cartLoading, setCartLoading] = useState(true);
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [selectedGenres, setSelectedGenres] = useState([]);
    const [purchases, setPurchases] = useState([]);

    const [cart, setCart] = useState(() => {
        try {
            const savedCart = localStorage.getItem('cart');
            return savedCart ? Map(JSON.parse(savedCart)) : Map();
        } catch (e) {
            console.error('Error loading cart from localStorage:', e);
            return Map();
        }
    });

    useEffect(() => {
        try {
            localStorage.setItem('cart', JSON.stringify(cart.toJS()));
        } catch (e) {
            console.error('Error saving cart to localStorage:', e);
        }
    }, [cart]);

    const updateUserProfile = async (updates) => {
        if (!user) return false;

        try {
            if (updates.newPassword && updates.currentPassword) {
                const credential = EmailAuthProvider.credential(
                    user.email,
                    updates.currentPassword
                );
                await reauthenticateWithCredential(user, credential);
                await updatePassword(user, updates.newPassword);
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

                        // Merge cart: keep localStorage only
                        const localStorageCart = localStorage.getItem('cart');
                        const localCart = localStorageCart ? JSON.parse(localStorageCart) : {};
                        setCart(Map(localCart));
                    } else {
                        const userRef = doc(firestore, 'users', currentUser.uid);
                        await setDoc(userRef, {
                            firstName: '',
                            lastName: '',
                            genres: [],
                            purchases: [],
                            cart: {}
                        });
                        setCart(Map());
                        localStorage.setItem('cart', JSON.stringify({}));
                    }
                    setUser(currentUser);
                } else {
                    const localStorageCart = localStorage.getItem('cart');
                    const localCart = localStorageCart ? JSON.parse(localStorageCart) : {};
                    setCart(Map(localCart));

                    setUser(null);
                    setFirstName('');
                    setLastName('');
                    setSelectedGenres([]);
                    setPurchases([]);
                }
            } catch (error) {
                console.error('Error loading user data:', error);
                setCart(Map());
            } finally {
                setLoading(false);
                setCartLoading(false);
            }
        });

        return () => unsubscribe();
    }, []);

    const addToCart = (movie) => {
        if (!movie || !movie.id) return;
        const movieId = movie.id.toString();

        setCart(prevCart => {
            if (prevCart.has(movieId)) return prevCart;

            const newCart = prevCart.set(movieId, movie);
            localStorage.setItem('cart', JSON.stringify(newCart.toJS()));
            return newCart;
        });
    };

    const removeFromCart = (movieId) => {
        if (!movieId) return;

        setCart(prevCart => {
            const newCart = prevCart.delete(movieId.toString());
            localStorage.setItem('cart', JSON.stringify(newCart.toJS()));
            return newCart;
        });
    };

    const isInCart = useCallback((movieId) => {
        return cart.has(movieId.toString());
    }, [cart]);

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
                    const purchasedMovieIds = purchases.map(p => p.id);
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

    if (loading) return null;

    return (
        <StoreContext.Provider value={{
            user,
            loading,
            cartLoading,
            firstName,
            lastName,
            selectedGenres,
            setSelectedGenres,
            cart,
            setCart,
            purchases,
            setPurchases,
            updateUserProfile,
            addToCart,
            removeFromCart,
            isInCart
        }}>
            {children}
        </StoreContext.Provider>
    );
};

export const useStoreContext = () => useContext(StoreContext);
