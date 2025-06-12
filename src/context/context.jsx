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

    // Load cart from Firestore when user logs in
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            if (currentUser) {
                const userDoc = await getDoc(doc(firestore, 'users', currentUser.uid));
                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    if (userData.genres) {
                        setSelectedGenres(userData.genres);
                    }
                    if (userData.purchases) {
                        setPurchases(userData.purchases);
                    }
                    // Load cart data if it exists
                    if (userData.cart) {
                        setCart(Map(userData.cart));
                    }
                }
                setUser(currentUser);
            } else {
                setUser(null);
                setSelectedGenres([]);
                setCart(Map());
                setPurchases([]);
            }
        });

        return () => unsubscribe();
    }, []);

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

    // Persist cart to Firestore
    useEffect(() => {
        if (user?.uid) {
            const userRef = doc(firestore, 'users', user.uid);
            const updateCart = async () => {
                try {
                    await setDoc(userRef, { cart: cart.toJS() }, { merge: true });
                } catch (error) {
                    console.error('Error updating cart:', error);
                }
            };
            updateCart();
        }
    }, [cart, user]);

    // Persist purchases to Firestore
    useEffect(() => {
        if (user?.uid && purchases.length > 0) {
            const userRef = doc(firestore, 'users', user.uid);
            setDoc(userRef, { purchases }, { merge: true });
        }
    }, [purchases, user]);

    return (
        <StoreContext.Provider value={{
            user,
            setUser,
            selectedGenres,
            setSelectedGenres,
            cart,
            setCart,
            purchases,
            setPurchases
        }}>
            {children}
        </StoreContext.Provider>
    );
}

export const useStoreContext = () => useContext(StoreContext);