import Header from "../components/Header.jsx";
import Hero from "../components/Hero.jsx";
import Featured from "../components/Featured.jsx";
import Footer from "../components/Footer.jsx";
import "./HomeView.css";

function HomeView() {
  return (
    <div className="home-view">
      <Header />
      <Hero />
      <Featured />
      <Footer />
    </div>
  );
}

export default HomeView;