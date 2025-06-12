import './App.css';
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { StoreProvider } from './context/context';
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



function App() {
    return (
        <StoreProvider>
            <BrowserRouter>
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
            </BrowserRouter>
        </StoreProvider>
    );
}

export default App;