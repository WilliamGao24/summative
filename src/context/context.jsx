import { createContext, useState, useContext, useEffect } from "react";
import { Map } from 'immutable';
import { auth, firestore } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export const StoreContext = createContext();

export const StoreProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [selectedGenres, setSelectedGenres] = useState([]);
    const [cart, setCart] = useState(() => Map());
    const [purchases, setPurchases] = useState([]);
    const [loading, setLoading] = useState(true);

    // Load user data and handle auth state
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            try {
                if (currentUser) {
                    // User is signed in
                    const userDoc = await getDoc(doc(firestore, 'users', currentUser.uid));
                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        setSelectedGenres(userData.genres || []);
                        setPurchases(userData.purchases || []);
                        
                        // Load cart from Firestore and filter out purchased items
                        if (userData.cart) {
                            const purchases = userData.purchases || [];
                            const cartData = {};
                            Object.entries(userData.cart).forEach(([key, value]) => {
                                // Only include items that exist and haven't been purchased
                                if (value && value.id && !purchases.some(p => p.id === value.id)) {
                                    cartData[key] = value;
                                }
                            });
                            setCart(Map(cartData));
                        } else {
                            setCart(Map());
                        }
                    }
                    setUser(currentUser);
                } else {
                    // User is signed out
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
            }
        });

        return () => unsubscribe();
    }, []);

    // Update Firestore whenever cart changes
    useEffect(() => {
        const persistCart = async () => {
            if (user?.uid) {
                try {
                    const userRef = doc(firestore, 'users', user.uid);
                    const cartObject = {};
                    cart.forEach((value, key) => {
                        if (value && value.id && !purchases.some(p => p.id === value.id)) {
                            cartObject[key] = value;
                        }
                    });
                    
                    await setDoc(userRef, { cart: cartObject }, { merge: true });
                } catch (error) {
                    console.error('Error persisting cart:', error);
                }
            }
        };
        
        persistCart();
    }, [cart, user, purchases]);

    // Update Firestore whenever genres change
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

    // Update Firestore whenever purchases change
    useEffect(() => {
        if (user?.uid && purchases.length > 0) {
            const userRef = doc(firestore, 'users', user.uid);
            setDoc(userRef, { purchases }, { merge: true });
        }
    }, [purchases, user]);

    const contextValue = {
        user,
        setUser,
        selectedGenres,
        setSelectedGenres,
        cart,
        setCart,
        purchases,
        setPurchases,
        loading
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