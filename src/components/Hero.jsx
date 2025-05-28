import './Hero.css';
import starWarsPoster from "../assets/starWarsPoster.jpg";

function Hero() {
    return (
        <div className="hero-section">
            <img className="poster" src={starWarsPoster} alt="Star Wars Poster" />
        </div>
    );
}

export default Hero;