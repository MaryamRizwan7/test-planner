import React from "react";
import "../styles/About.css";
import { Link } from "react-router-dom";
import Logo from "../components/Logos/MainLogo.jsx"; 

const About = () => {
  return (
    <div className="about-page">
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

      {/* ABOUT CONTENT */}
      <div className="about-container">
        <h1 className="about-title">About Test Planner</h1>
        <p className="about-text">
          Test Planner is a smart web-based tool that automates exam scheduling for universities and institutions. 
          It manages student distribution, invigilator assignments, and room capacities across days and shifts—ensuring smooth, conflict-free schedules while reducing administrative effort and human error.
        </p>

        <h2 className="about-subtitle">Bachelors Mode</h2>
        <p className="about-text">
          Students are treated as a <strong>single pool</strong>. Enter the total number of students, and the system will automatically distribute them across available rooms and days. This mode is ideal for large-scale entry tests or admission exams, simplifying the process and ensuring efficiency.
        </p>

        <h2 className="about-subtitle">Masters Mode</h2>
        <p className="about-text">
          Students belong to specific <strong>departments</strong> and may apply for <strong>Evening</strong> or <strong>Weekend</strong> shifts. The planner divides them according to block capacities, assigns invigilators fairly per shift, and generates department-wise roll numbers for precise scheduling.
        </p>

        <p className="about-text">
          All schedules can be exported as <strong>Excel files</strong>, while detailed venue plans are available in <strong>Word or PDF format</strong> for quick sharing and printing.
        </p>

        <p className="about-text">
          With its <strong>flexible configuration, automation, and reliability</strong>, Test Planner saves time, prevents conflicts, and ensures a fair and transparent exam process for both students and institutions.
        </p>
      </div>
    </div>
  );
};

export default About;
