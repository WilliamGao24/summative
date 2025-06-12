import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useStoreContext } from '../context/context';

export default function ProtectedRoutes() {
    const { user, loading } = useStoreContext();
    const location = useLocation();

    if (loading) {
        return null; // or a loading spinner component
    }

    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return <Outlet />;
}