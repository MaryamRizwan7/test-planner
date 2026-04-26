// src/pages/MastersGuidelines.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import "bootstrap-icons/font/bootstrap-icons.css";
import "../index.css";

function MastersGuidelines() {
  const navigate = useNavigate();

  const cardColors = [
    { bg: "rgba(0, 255, 200, 0.12)", glow: "rgba(0, 255, 200, 0.5)" }, // Neon Cyan
    { bg: "rgba(0, 255, 100, 0.12)", glow: "rgba(0, 255, 100, 0.5)" }, // Neon Green
    { bg: "rgba(255, 200, 0, 0.12)", glow: "rgba(255, 200, 0, 0.5)" }, // Neon Yellow
    { bg: "rgba(180, 0, 255, 0.12)", glow: "rgba(180, 0, 255, 0.5)" }, // Neon Purple
    { bg: "rgba(255, 0, 150, 0.12)", glow: "rgba(255, 0, 150, 0.5)" }, // Neon Pink
  ];

  // Shared card style generator
  const cardStyle = (bg, glow) => ({
    backgroundColor: bg,
    color: "#f1f1f1", 
    border: `1px solid ${glow}`, 
    boxShadow: `0 0 12px ${glow}`, 
    borderRadius: "16px"
  });

  const headerStyle = { 
    cursor: "pointer", 
    fontWeight: "700", 
    fontSize: "1.25rem",
    fontFamily: "Poppins, sans-serif",
    color: "#fff", // headings pure white
  };

  const bodyStyle = {
    fontFamily: "Inter, sans-serif",
    fontSize: "1rem",
    lineHeight: "1.6",
    color: "#ddd", // softer white
  };

  return (
    <div className="container my-5 p-4 rounded custom-bg shadow-lg" style={{ maxWidth: "900px" }}>
      {/* Main Heading */}
      <h1 className="text-center mb-4 fw-bold" style={{ fontFamily: '"Packy Great", sans-serif', color: "white" }}>
        MASTER'S SCHEDULING GUIDE
      </h1>
      <p style={bodyStyle}>
        Before entering data, review the guidelines carefully. Masters programs consist of smaller batches with more precise scheduling requirements. Enter student numbers separately for Evening and Weekend shifts, as tests will be held independently for each. Define shift timings clearly to ensure every student, venue, and invigilator is properly assigned.
      </p>

      {/* Blocks File */}
      <div className="card mb-3 p-3 shadow-sm" style={cardStyle(cardColors[0].bg, cardColors[0].glow)}>
        <div className="card-header d-flex align-items-center"
             data-bs-toggle="collapse" 
             data-bs-target="#blocksSection"
             style={headerStyle}>
          <i className="bi bi-building me-2"></i> Blocks File (Excel/CSV)
        </div>
        <div id="blocksSection" className="collapse show card-body" style={bodyStyle}>
          <ul>
            <li><strong>Department</strong> – Name of the program</li>
            <li><strong>Venue</strong> – Venue name/code</li>
            <li><strong>PCs</strong> – Number of seats available</li>
            <li><strong>Department Incharge</strong> – Person in charge</li>
          </ul>
          <blockquote className="blockquote" style={{ color: "#0ff" }}>
            Make sure the PC count matches the real capacity of the venue.
          </blockquote>
        </div>
      </div>

      {/* Invigilators File */}
      <div className="card mb-3 p-3 shadow-sm" style={cardStyle(cardColors[1].bg, cardColors[1].glow)}>
        <div className="card-header d-flex align-items-center"
             data-bs-toggle="collapse" 
             data-bs-target="#invigilatorsSection"
             style={headerStyle}>
          <i className="bi bi-person-lines-fill me-2"></i> Invigilators File (Excel/CSV)
        </div>
        <div id="invigilatorsSection" className="collapse show card-body" style={bodyStyle}>
          <ul>
            <li><strong>Name</strong> – Invigilator full name</li>
            <li><strong>Designation</strong> – Role/position</li>
            <li><strong>Extension</strong> – Contact or extension number</li>
          </ul>
          <blockquote className="blockquote" style={{ color: "#0ff" }}>
            Ensure there are no repeated invigilators (i.e., duplicate rows) to avoid conflicts.
          </blockquote>
        </div>
      </div>

      {/* Students File */}
      <div className="card mb-3 p-3 shadow-sm" style={cardStyle(cardColors[2].bg, cardColors[2].glow)}>
        <div className="card-header d-flex align-items-center"
             data-bs-toggle="collapse" 
             data-bs-target="#studentsSection"
             style={headerStyle}>
          <i className="bi bi-people-fill me-2"></i> Students File (Excel/CSV)
        </div>
        <div id="studentsSection" className="collapse show card-body" style={bodyStyle}>
          <ul>
            <li><strong>Discipline</strong> – Department/program name</li>
            <li><strong>Short Form</strong> – Short form of the department</li>
            <li><strong>Students for Evening</strong> – Number of students applying for evening shift</li>
            <li><strong>Students for Weekend</strong> – Number of students applying for weekend shift</li>
          </ul>
          <blockquote className="blockquote" style={{ color: "#0ff" }}>
            Double-check the count to avoid scheduling errors.
          </blockquote>
        </div>
      </div>

      {/* Days */}
      <div className="card mb-3 p-3 shadow-sm" style={cardStyle(cardColors[3].bg, cardColors[3].glow)}>
        <div className="card-header d-flex align-items-center"
             data-bs-toggle="collapse" 
             data-bs-target="#daysSection"
             style={headerStyle}>
          <i className="bi bi-calendar-event me-2"></i> Number of Days and Dates
        </div>
        <div id="daysSection" className="collapse show card-body" style={bodyStyle}>
          <p>
            Select the number of days over which the test will be conducted. <br />
            For each day, enter the date of the test.
          </p>
        </div>
      </div>

      {/* Shifts */}
      <div className="card mb-3 p-3 shadow-sm" style={cardStyle(cardColors[4].bg, cardColors[4].glow)}>
        <div className="card-header d-flex align-items-center"
             data-bs-toggle="collapse" 
             data-bs-target="#shiftsSection"
             style={headerStyle}>
          <i className="bi bi-clock-fill me-2"></i> Number of Shifts and Shift Timings
        </div>
        <div id="shiftsSection" className="collapse show card-body" style={bodyStyle}>
          <p>
            Select the number of shifts for each day. <br />
            For each shift, enter the start time and end time.
          </p>
        </div>
      </div>

      {/* Next Button */}
      <div className="d-grid mt-4">
        <button className="btn neon-btn btn-lg" onClick={() => navigate("/masters")}>
          Proceed to Master's Form
        </button>
      </div>
    </div>
  );
}

export default MastersGuidelines;
