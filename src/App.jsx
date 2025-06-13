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
        // Only store path if it's not from a back/forward navigation
        if (!location.key) {
            sessionStorage.setItem('lastPath', location.pathname + location.search);
        }
    }, [location]);

    useEffect(() => {
        // Only navigate on initial mount if there's no location key
        if (!location.key) {
            const lastPath = sessionStorage.getItem('lastPath');
            if (lastPath && lastPath !== '/' && lastPath !== location.pathname) {
                navigate(lastPath, { replace: true });
            }
        }
    }, [navigate, location.key, location.pathname]);

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