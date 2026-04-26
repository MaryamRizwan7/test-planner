import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import FileUploader from "../components/FileUploader";
import "bootstrap/dist/css/bootstrap.min.css";
import "../index.css";
import BlocksLogo from "../components/Logos/BlocksLogo";
import InvigilatorsLogo from "../components/Logos/InvigilatorsLogo";
import StudentsLogo from "../components/Logos/StudentsLogo";

function Masters() {
  const navigate = useNavigate();
  const [uploadedFiles, setUploadedFiles] = useState({ blocks: null, invigilators: null, students: null });
  const [filters, setFilters] = useState({ days: 0, shifts: 0 });
  const [dayDates, setDayDates] = useState([]);
  const [shiftTimes, setShiftTimes] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [resetKey, setResetKey] = useState(0);

  const handleReset = () => {
    setUploadedFiles({ blocks: null, invigilators: null, students: null });
    setFilters({ days: 0, shifts: 0 });
    setDayDates([]);
    setShiftTimes([]);
    setErrorMessage("");
    setResetKey(k => k + 1);
  };

  const handleDayCountChange = (count) => {
    setFilters({ ...filters, days: count });
    const newDates = Array.from({ length: count }, (_, i) => dayDates[i] || "");
    setDayDates(newDates);
  };

  const handleShiftCountChange = (count) => {
    const newCount = parseInt(count) || 0;
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

    if (!uploadedFiles.blocks) errors.push("Upload Blocks file.");
    if (!uploadedFiles.invigilators) errors.push("Upload Invigilators file.");
    if (!uploadedFiles.students) errors.push("Upload Students file.");
    if (filters.days === 0) errors.push("Select number of days.");
    if (dayDates.some((d) => !d)) errors.push("Fill all dates.");
    if (filters.shifts === 0) errors.push("Select number of shifts.");

    if (errors.length > 0) {
      setErrorMessage(errors.join(" "));
      return;
    }

    const formattedDates = dayDates.map((d) => {
      const [year, month, day] = d.split("-");
      return `${month}-${day}-${year}`;
    });

    const formatTime = (timeStr) => {
      if (!timeStr) return "";
      const [hour, minute] = timeStr.split(":");
      let h = parseInt(hour, 10);
      const suffix = h >= 12 ? "PM" : "AM";
      h = h % 12 || 12;
      return `${h.toString().padStart(2, "0")}:${minute} ${suffix}`;
    };

    const formattedShifts = shiftTimes.map((s) => ({
      start: formatTime(s.start),
      end: formatTime(s.end)
    }));

    try {
      const formData = new FormData();
      formData.append("Program", "master");
      formData.append("Blocks", uploadedFiles.blocks);
      formData.append("Invigilators", uploadedFiles.invigilators);
      formData.append("Students", uploadedFiles.students);
      formData.append("Days", filters.days);
      formData.append("Day Dates", JSON.stringify(formattedDates));
      formData.append("Number Of Shifts", filters.shifts);
      formData.append("Shift Times", JSON.stringify(formattedShifts));

      const response = await fetch("/planner/run/", { method: "POST", body: formData });
      const data = await response.json();

      if (data.status === "success") {
        navigate("/preview", { state: { schedule: data.schedule, venuePlan: data.venuePlan } });
      } else {
        setErrorMessage(data.errors || data.message || "An error occurred.");
      }
    } catch (error) {
      setErrorMessage("Connection to server failed.");
    }
  };

  return (
    <div className="container my-5 p-4 rounded custom-bg shadow-lg">
      <h1 className="text-center mb-4 main-heading"> MASTER'S TEST PLANNER </h1>
      {errorMessage && (
        <div className="alert alert-danger text-center mb-4 custom-error-bar">
          {Array.isArray(errorMessage) ? (
            errorMessage.map((err, i) => <div key={i}>{err}</div>)
          ) : (
            <div>{errorMessage}</div>
          )}
        </div>
      )}

      <div className="card frosted-neon-card p-4 mb-4">
        <div className="row text-center">
          <div className="col-md-4 mb-3">
            <div className="d-flex justify-content-center align-items-center mb-2">
              <BlocksLogo /> <h5 className="ms-2 fw-bold">Blocks File</h5>
            </div>
            <FileUploader key={`blocks-${resetKey}`} setUploadedFiles={setUploadedFiles} requiredFiles={["blocks"]} hideLabel />
          </div>
          <div className="col-md-4 mb-3">
            <div className="d-flex justify-content-center align-items-center mb-2">
              <InvigilatorsLogo /> <h5 className="ms-2 fw-bold">Invigilators File</h5>
            </div>
            <FileUploader key={`invigilators-${resetKey}`} setUploadedFiles={setUploadedFiles} requiredFiles={["invigilators"]} hideLabel />
          </div>
          <div className="col-md-4 mb-3">
            <div className="d-flex justify-content-center align-items-center mb-2">
              <StudentsLogo /> <h5 className="ms-2 fw-bold">Students File</h5>
            </div>
            <FileUploader key={`students-${resetKey}`} setUploadedFiles={setUploadedFiles} requiredFiles={["students"]} hideLabel />
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-md-6">
          <div className="card frosted-neon-card p-4 h-100">
            <h5 className="form-label fw-bold">Number of Days</h5>
            <div className="btn-group d-flex flex-wrap mb-3">
              {[1, 2, 3, 4, 5].map((day) => (
                <button key={day} type="button" className={`day-square-btn ${filters.days === day ? "active" : ""}`} onClick={() => handleDayCountChange(day)}>{day}</button>
              ))}
            </div>
            {dayDates.map((date, i) => (
              <div className="mb-2" key={i}>
                <label className="form-label">Day {i + 1} Date</label>
                <input type="date" className="form-control" value={date} onChange={(e) => {
                  const updated = [...dayDates];
                  updated[i] = e.target.value;
                  setDayDates(updated);
                }} />
              </div>
            ))}
          </div>
        </div>

        <div className="col-md-6">
          <div className="card frosted-neon-card p-4 h-100">
            <h5 className="form-label fw-bold">Number of Shifts</h5>
            <input type="number" className="form-control mb-3" value={filters.shifts} onChange={(e) => handleShiftCountChange(e.target.value)} min="1" max="5" />
            {shiftTimes.map((shift, i) => (
              <div className="row mb-2" key={i}>
                <div className="col-6">
                  <label className="form-label">Shift {i + 1} Start</label>
                  <input type="time" className="form-control" value={shift.start} onChange={(e) => handleShiftChange(i, "start", e.target.value)} />
                </div>
                <div className="col-6">
                  <label className="form-label">Shift {i + 1} End</label>
                  <input type="time" className="form-control" value={shift.end} onChange={(e) => handleShiftChange(i, "end", e.target.value)} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="d-grid mb-4 mt-4">
        <button className="btn neon-btn btn-lg" onClick={handleGenerate}>Generate Schedule</button>
        <button className="btn neon-outline-btn btn-lg mt-2" onClick={handleReset}>Reset Form</button>
      </div>
    </div>
  );
}

export default Masters;