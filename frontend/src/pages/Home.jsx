// src/pages/Home.jsx
import React from "react";
import "../styles/Home.css";
import { useNavigate, Link } from "react-router-dom";
import Logo from "../components/Logos/MainLogo.jsx"; 

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="home-page">
      {/* NAVBAR */}
      <header className="custom-navbar">
        <Link to="/" className="logo-link">
          <div className="logo">
            <Logo className="logo-icon" />
            <span className="logo-text">Test Planner</span>
          </div>
        </Link>

        <nav className="nav-links">
          <Link to="/" className="nav-item">Home</Link>
          <Link to="/about" className="nav-item">About</Link>
        </nav>
      </header>

      {/* MAIN CONTENT */}
      <div className="overlay">
        <h1 className="title">NED TEST  PLANNER</h1>
        <p className="subtitle">
          Your personal assistant for stress-free test planning. <br/> 
          Effortlessly organize schedules, venues, and invigilators.
        </p>
        <div className="button-group">
          <button
            className="action-button"
            onClick={() => navigate("/guidelines/bachelors")}
          >
            Bachelor
          </button>
          <button
            className="action-button"
            onClick={() => navigate("/guidelines/masters")}
          >
            Master
          </button>
        </div>
      </div>
    </div>
  );
};

export default Home;
