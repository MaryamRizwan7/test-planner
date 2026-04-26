// src/pages/Bachelors.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import FileUploader from "../components/FileUploader";
import "bootstrap/dist/css/bootstrap.min.css";
import "../index.css";
import BlocksLogo from "../components/Logos/BlocksLogo";
import InvigilatorsLogo from "../components/Logos/InvigilatorsLogo";
import StudentsLogo from "../components/Logos/StudentsLogo";

function Bachelors() {
  const navigate = useNavigate();
  const [uploadedFiles, setUploadedFiles] = useState({ blocks: null, invigilators: null });
  const [numStudents, setNumStudents] = useState("");
  const [filters, setFilters] = useState({ days: 0, shifts: 0 });
  const [dayDates, setDayDates] = useState([]);
  const [shiftTimes, setShiftTimes] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [resetKey, setResetKey] = useState(0);
  const [csrfToken, setCsrfToken] = useState("");

  // Get CSRF token on component mount
  useEffect(() => {
    const fetchCsrfToken = async () => {
      try {
        const response = await fetch("http://127.0.0.1:8000/planner/get_csrf_token/", {
          method: "GET",
          credentials: 'include',
        });
        const data = await response.json();
        setCsrfToken(data.csrfToken);
      } catch (error) {
        console.error("Error fetching CSRF token:", error);
      }
    };

    fetchCsrfToken();
  }, []);

  const handleReset = () => {
    setUploadedFiles({ blocks: null, invigilators: null });
    setNumStudents("");
    setFilters({ days: 0, shifts: 0 });
    setDayDates([]);
    setShiftTimes([]);
    setErrorMessage("");
    setResetKey(k => k + 1);
  };

  const handleDayCountChange = (count) => {
    const newCount = Math.max(0, parseInt(count) || 0);
    setFilters({ ...filters, days: newCount });
    const newDates = Array.from(
      { length: newCount },
      (_, i) => dayDates[i] || ""
    );
    setDayDates(newDates);
  };

  const handleShiftCountChange = (count) => {
    const newCount = Math.max(0, parseInt(count) || 0);
    setFilters({ ...filters, shifts: newCount });
    const newTimes = Array.from({ length: newCount }, (_, i) => ({
      start: shiftTimes[i]?.start || "",
      end: shiftTimes[i]?.end || "",
    }));
    setShiftTimes(newTimes);
  };

  const handleShiftChange = (index, type, value) => {
    const updated = [...shiftTimes];
    updated[index][type] = value;
    setShiftTimes(updated);
  };

  const handleGenerate = async () => {
    setErrorMessage("");
    const errors = [];

    if (!uploadedFiles.blocks)
      errors.push("Please upload the Blocks file.");
    if (!uploadedFiles.invigilators)
      errors.push("Please upload the Invigilators file.");
    if (!numStudents)
      errors.push("Please enter the number of students.");

    if (filters.days === 0) {
      errors.push("Please select number of days.");
    } else {
      if (dayDates.some((d) => !d)) {
        errors.push("Please enter all day dates.");
      } else {
        const uniqueDates = new Set(dayDates);
        if (uniqueDates.size !== dayDates.length) {
          errors.push("Duplicate dates are not allowed.");
        }
      }
    }

    // Shifts
    if (filters.shifts === 0) {
      errors.push("Please select number of shifts.");
    } else {
      if (shiftTimes.some((s) => !s.start || !s.end)) {
        errors.push("Please fill all shift start and end times.");
      } else {
        for (let i = 0; i < shiftTimes.length; i++) {
          const s1 = shiftTimes[i];
          // ✅ Check start < end
          if (s1.start >= s1.end) {
            errors.push(`Shift ${i + 1} start time must be before end time.`);
          }
          for (let j = i + 1; j < shiftTimes.length; j++) {
            const s2 = shiftTimes[j];
            if (s1.start && s1.end && s2.start && s2.end) {
              // ❌ Identical
              if (s1.start === s2.start && s1.end === s2.end) {
                errors.push(`Shift ${i + 1} and Shift ${j + 1} have identical timings.`);
              }
              // ❌ Overlap
              else if (s1.start < s2.end && s1.end > s2.start) {
                errors.push(`Shift ${i + 1} overlaps with Shift ${j + 1}.`);
              }
            }
          }
        }
      }
    }

    if (errors.length > 0) {
      setErrorMessage(errors.join(" "));
      return;
    }

    // Convert YYYY-MM-DD to MM-DD-YYYY format to match master's program
    const formattedDates = dayDates.map((d) => {
      const [year, month, day] = d.split("-");
      return `${month}-${day}-${year}`;
    });

    const formattedShifts = shiftTimes.map((s) => {
      const formatTime = (timeStr) => {
        if (!timeStr) return "";
        const [hour, minute] = timeStr.split(":");
        let h = parseInt(hour, 10);
        const suffix = h >= 12 ? "PM" : "AM";
        h = h % 12 || 12; // convert 0 → 12
        return `${h.toString().padStart(2, "0")}:${minute} ${suffix}`;
      };
      return { start: formatTime(s.start), end: formatTime(s.end) };
    });

    try {
      const formData = new FormData();
      formData.append("Program", "bachelor");
      formData.append("Blocks", uploadedFiles.blocks);
      formData.append("Invigilators", uploadedFiles.invigilators);
      formData.append("Number_Of_Students", numStudents); // Updated key
      formData.append("Days", filters.days);
      formData.append("Day_Dates", JSON.stringify(formattedDates)); // Updated key
      formData.append("Number_Of_Shifts", filters.shifts); // Updated key
      formData.append("Shift_Times", JSON.stringify(formattedShifts)); // Updated key
      // Add CSRF token
      formData.append("csrfmiddlewaretoken", csrfToken);

      // Use full backend URL instead of relative path
      const response = await fetch("http://127.0.0.1:8000/planner/run/", {
        method: "POST",
        body: formData,
        credentials: 'include', // Include cookies for CSRF
        headers: {
          'X-CSRFToken': csrfToken,
        },
      });

      const data = await response.json();
      if (data.status === "success") {
        setErrorMessage("");
        // Pass both schedule and venue plan to the preview page
        navigate("/preview", { 
          state: { 
            schedule: data.schedule,
            venuePlan: data.venuePlan
          } 
        });
      } else {
        setErrorMessage(
          data.message || "An error occurred while generating the schedule."
        );
      }
    } catch (error) {
      console.error("Request failed", error);
      setErrorMessage("An error occurred while generating the schedule.");
    }
  };

  return (
    <div className="container my-5 p-4 rounded custom-bg">
      <h1 className="text-center mb main-heading"> BACHELOR'S TEST PLANNER </h1>
      
      {/* Error Bar */}
      {errorMessage && (
        <div className="alert alert-danger text-center mb-4 custom-error-bar">
          {errorMessage.split(". ").map((err, i) => (
            <div key={i}>{err.trim()}</div>
          ))}
        </div>
      )}
      
      {/* Top Card */}
      <div className="card frosted-neon-card mb-4 p-4">
        <div className="row text-center">
          {/* Blocks */}
          <div className="col-md-4 mb-3">
            <div className="d-flex align-items-center justify-content-center mb-3">
              <BlocksLogo />
              <h5 className="ms-2 fw-bold">Blocks File</h5>
            </div>
            <FileUploader
              key={`blocks-${resetKey}`}
              setUploadedFiles={setUploadedFiles}
              requiredFiles={["blocks"]}
              hideLabel
            />
          </div>
          
          {/* Invigilators */}
          <div className="col-md-4 mb-3">
            <div className="d-flex align-items-center justify-content-center mb-3">
              <InvigilatorsLogo />
              <h5 className="ms-2 fw-bold">Invigilators File</h5>
            </div>
            <FileUploader
              key={`invigilators-${resetKey}`}
              setUploadedFiles={setUploadedFiles}
              requiredFiles={["invigilators"]}
              hideLabel
            />
          </div>
          
          {/* Students */}
          <div className="col-md-4 mb-3">
            <div className="d-flex align-items-center justify-content-center mb-3">
              <StudentsLogo />
              <h5 className="ms-2 fw-bold">Number of Students</h5>
            </div>
            <input
              type="number"
              className="form-control"
              value={numStudents}
              onChange={(e) => setNumStudents(e.target.value)}
              min="1"
            />
          </div>
        </div>
      </div>
      
      <div className="row mb-4">
        {/* Days + Dates Card */}
        <div className="col-md-6">
          <div className="card frosted-neon-card p-4 h-100">
            <h5 className="form-label fw-bold">Number of Days</h5>
            <div className="btn-group d-flex flex-wrap mb-3" role="group">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((day) => (
                <button
                  key={day}
                  type="button"
                  className={`day-square-btn ${filters.days === day ? "active" : ""}`}
                  onClick={() => handleDayCountChange(day)}
                >
                  {day}
                </button>
              ))}
            </div>
            
            {dayDates.length > 0 && (
              <>
                <h6 className="fw-bold">Enter Dates</h6>
                {dayDates.map((date, i) => (
                  <div className="mb-2" key={i}>
                    <label className="form-label">Day {i + 1} Date</label>
                    <input
                      type="date"
                      className="form-control"
                      value={dayDates[i]}
                      onChange={(e) => {
                        const isoDate = e.target.value; // This is already YYYY-MM-DD
                        const updated = [...dayDates];
                        updated[i] = isoDate;
                        setDayDates(updated);
                      }}
                    />
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
        
        {/* Shifts + Timings Card */}
        <div className="col-md-6">
          <div className="card frosted-neon-card p-4 h-100">
            <h5 className="form-label fw-bold">Number of Shifts</h5>
            <input
              type="number"
              className="form-control mb-3"
              value={filters.shifts}
              onChange={(e) => handleShiftCountChange(e.target.value)}
              min="1"
              max="5"
            />
            
            {shiftTimes.length > 0 && (
              <>
                <h6 className="fw-bold">Enter Shift Timings</h6>
                {shiftTimes.map((shift, i) => (
                  <div className="row mb-2" key={i}>
                    <div className="col-md-6">
                      <label className="form-label">Shift {i + 1} Start</label>
                      <input
                        type="time"
                        className="form-control"
                        value={shift.start}
                        onChange={(e) =>
                          handleShiftChange(i, "start", e.target.value)
                        }
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Shift {i + 1} End</label>
                      <input
                        type="time"
                        className="form-control"
                        value={shift.end}
                        onChange={(e) =>
                          handleShiftChange(i, "end", e.target.value)
                        }
                      />
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </div>
      
      {/* Generate + Reset Buttons */}
      <div className="d-grid gap-2 mb-4">
        <button className="btn neon-btn btn-lg" onClick={handleGenerate}>
          Generate Schedule & Venue Plan
        </button>
        <button className="btn neon-outline-btn btn-lg" onClick={handleReset}>
          Reset Form
        </button>
      </div>
    </div>
  );
}

export default Bachelors;
