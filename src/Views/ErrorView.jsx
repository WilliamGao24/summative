import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import './ErrorView.css';

function ErrorView() {
    const navigate = useNavigate();

    return (
        <div className="error-container">
            <Header />
            <div className="error-content">
                <h1>404</h1>
                <h2>Page Not Found</h2>
                <p>The page you are looking for doesn't exist or has been moved.</p>
                <button 
                    className="error-button"
                    onClick={() => navigate('/')}
                >
                    Return Home
                </button>
            </div>
            <Footer />
        </div>
    );
}

export default ErrorView;