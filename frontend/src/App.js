// src/App.js
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";                 
import Masters from "./pages/Masters";           
import Bachelors from "./pages/Bachelors";       
import GuidelinesBachelors from "./pages/BachelorsGuidelines";
import GuidelinesMasters from "./pages/MastersGuidelines";
import About from "./pages/About";
import PreviewPage from "./pages/PreviewPage";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />                        {/* landing page */}
        <Route path="/guidelines/bachelors" element={<GuidelinesBachelors />} />  
        <Route path="/guidelines/masters" element={<GuidelinesMasters />} />  
        <Route path="/bachelors" element={<Bachelors />} />          {/* bachelors data entry */}
        <Route path="/masters" element={<Masters />} />              {/* masters data entry */}
        <Route path="/about" element={<About />} />
        <Route path="/preview" element={<PreviewPage />} />
      </Routes>
    </Router>
  );
}

export default App;
