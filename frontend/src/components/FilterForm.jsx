// src/components/FilterForm.jsx
import React, { useState } from "react";

function FilterForm({ onFilter }) {
  const [days, setDays] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onFilter({ days, startTime, endTime });
  };

  return (
    <form onSubmit={handleSubmit}>
      <h4 className="mb-3">🕒 Schedule Filters</h4>

      <div className="row mb-3">
        <div className="col-md-4">
          <label className="form-label">Days (1–5)</label>
          <input type="number" className="form-control" value={days} onChange={(e) => setDays(e.target.value)} />
        </div>

        <div className="col-md-4">
          <label className="form-label">Start Time</label>
          <input type="time" className="form-control" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
        </div>

        <div className="col-md-4">
          <label className="form-label">End Time</label>
          <input type="time" className="form-control" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
        </div>
      </div>

      <button type="submit" className="btn btn-primary">Generate Schedule</button>
    </form>
  );
}

export default FilterForm;
