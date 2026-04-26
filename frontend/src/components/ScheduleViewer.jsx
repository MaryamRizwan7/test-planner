import React from "react";
import { Table } from "react-bootstrap";
import "../index.css";

function ScheduleViewer({ schedule }) {
  return (
    <div className="text-center mt-4">
      {schedule ? (
        <>
          <p>✅ Schedule generated successfully!</p>

          <div className="table-responsive">
            <Table 
              bordered 
              hover 
              size="sm" 
              className="mt-3 text-start schedule-table"
            >
              <thead>
                <tr>
                  <th>Day</th>
                  <th>Time</th>
                  <th>Roll No</th>
                  <th>Venue</th>
                  <th>Department</th>
                  <th>Capacity</th>
                  <th>Invigilator</th>
                  <th>Extension</th>
                  <th>Department Incharge</th>
                </tr>
              </thead>
              <tbody>
                {schedule.map((row, index) => (
                  <tr key={index}>
                    <td>{row.Day}</td>
                    <td>{row.Time}</td>
                    <td>{row["Roll No"]}</td>
                    <td>{row.Venue}</td>
                    <td>{row.Department}</td>
                    <td>{row.Capacity}</td>
                    <td>{row.Invigilator}</td>
                    <td>{row.Extension}</td>
                    <td>{row["Department Incharge"]}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </>
      ) : (
        <p className="text-muted">No schedule generated yet.</p>
      )}
    </div>
  );
}

export default ScheduleViewer;
