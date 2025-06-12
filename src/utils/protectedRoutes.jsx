import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useStoreContext } from '../context/context';

export default function ProtectedRoutes() {
    const { user } = useStoreContext();
    const location = useLocation();

    if (!user) {
        // Save the attempted URL for redirecting after login
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return <Outlet />;
}