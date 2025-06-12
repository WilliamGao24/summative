import './App.css';
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { StoreProvider } from './context/context';
import { useEffect } from 'react';
import ProtectedRoutes from './utils/protectedRoutes';
import HomeView from "./Views/HomeView.jsx";
import RegisterView from "./Views/RegisterView.jsx";
import LoginView from "./Views/LoginView.jsx";
import MoviesView from './Views/MoviesView.jsx';
import DetailMovieView from "./Views/DetailView.jsx";
import GenreView from "./Views/GenreView.jsx";
import CartView from "./Views/CartView.jsx";
import ErrorView from "./Views/ErrorView.jsx";
import SearchView from "./Views/SearchView.jsx";
import SettingsView from "./Views/SettingsView.jsx";

// RouteHandler component to manage route persistence
function RouteHandler({ children }) {
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        // Store the current path in session storage
        sessionStorage.setItem('lastPath', location.pathname + location.search);
    }, [location]);

    useEffect(() => {
        // On mount, check if there's a stored path and navigate to it
        const lastPath = sessionStorage.getItem('lastPath');
        if (lastPath && lastPath !== '/') {
            navigate(lastPath);
        }
    }, [navigate]);

    return children;
}

function App() {
    return (
        <StoreProvider>
            <BrowserRouter>
                <RouteHandler>
                    <Routes>
                        {/* Public Routes */}
                        <Route path="/" element={<HomeView />} />
                        <Route path="/register" element={<RegisterView />} />
                        <Route path="/login" element={<LoginView />} />
                        
                        {/* Protected Routes */}
                        <Route element={<ProtectedRoutes />}>
                            <Route path="/cart" element={<CartView />} />
                            <Route path="/settings" element={<SettingsView />} />
                            <Route path="/movies" element={<MoviesView />}>
                                <Route path="genre/:genre_id" element={<GenreView />} />
                                <Route path="details/:id" element={<DetailMovieView />} />
                                <Route path="search/:query" element={<SearchView />} />
                            </Route>
                        </Route>

                        <Route path="*" element={<ErrorView />} />
                    </Routes>
                </RouteHandler>
            </BrowserRouter>
        </StoreProvider>
    );
}

export default App;