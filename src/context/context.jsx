import { createContext, useState, useContext } from "react";
import { Map } from 'immutable';

export const StoreContext = createContext();

export const StoreProvider = ({ children }) => {
    const [loggedIn, setLoggedIn] = useState(false);
    const [firstName, setFirst] = useState("");
    const [lastName, setLast] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [cart, setCart] = useState(Map());
    const [selectedGenres, setSelected] = useState([]);
    const [registeredUsers, setRegisteredUsers] = useState([]);

    return (
        <StoreContext.Provider value={{
            cart, setCart,
            password, setPassword,
            email, setEmail,
            firstName, setFirst,
            lastName, setLast,
            selectedGenres, setSelected,
            loggedIn, setLoggedIn,
            registeredUsers, setRegisteredUsers
        }}>
            {children}
        </StoreContext.Provider>
    );
}

export const useStoreContext = () => useContext(StoreContext);