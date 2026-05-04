import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import ScheduleViewer from "../components/ScheduleViewer";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import "../index.css";

function PreviewPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { schedule, venuePlan } = location.state || {};
  const [venuePlanPreview, setVenuePlanPreview] = useState(venuePlan || "");
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(!venuePlan);
  const [csrfToken, setCsrfToken] = useState("");
  const [summary, setSummary] = useState("");
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);

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

  // Load venue plan preview from backend if not already provided
  useEffect(() => {
    // If we already have the venue plan from the initial navigation, don't fetch it again
    if (venuePlan) {
      setLoading(false);
      return;
    }
    
    const fetchVenuePreview = async () => {
      if (!csrfToken) return;
      
      try {
        setLoading(true);
        const response = await fetch("http://127.0.0.1:8000/planner/preview_venue_plan/", {
          method: "POST",
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrfToken,
          },
          credentials: 'include', // Important for session cookies
          body: JSON.stringify({ schedule_data: schedule }), // Pass schedule data directly
        });
        
        if (!response.ok) {
          throw new Error(`Server responded with ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (data.status === "success") {
          setVenuePlanPreview(data.venuePlan || "");
        } else {
          setError(data.error || "Failed to fetch venue plan preview");
        }
      } catch (err) {
        console.error("Error fetching venue preview:", err);
        setError(`Error fetching venue preview: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };
    
    if (schedule && csrfToken) {
      fetchVenuePreview();
    }
  }, [schedule, csrfToken, venuePlan]);

  if (!schedule || schedule.length === 0) {
    return (
      <div className="container my-5 text-center">
        <h3>No schedule data found.</h3>
        <p>Please go back and generate the schedule first.</p>
        <button className="btn btn-secondary mt-3" onClick={() => navigate(-1)}>
          Go Back
        </button>
      </div>
    );
  }

  const generateSummary = async () => {
    setIsSummaryLoading(true);
    setSummary("");
    try {
      const prog = location.state?.program || "bachelor";
      const response = await fetch("http://127.0.0.1:8000/planner/generate_summary/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ schedule, program: prog }),
      });
      const data = await response.json();
      if (data.status === "success") {
        setSummary(data.summary);
      } else {
        setError(data.message || "Failed to generate summary");
      }
    } catch (err) {
      setError(`Error generating summary: ${err.message}`);
    } finally {
      setIsSummaryLoading(false);
    }
  };

  // --- Download Schedule as Excel ---
  const downloadScheduleExcel = () => {
    try {
      const worksheet = XLSX.utils.json_to_sheet(schedule);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Schedule");
      const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
      const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
      saveAs(blob, "schedule.xlsx");
    } catch (err) {
      setError("Failed to generate the Excel file.");
      console.error(err);
    }
  };

  // --- Download Venue Plan as Word ---
  const downloadVenuePlanDoc = async () => {
    if (!csrfToken) {
      setError("CSRF token not available. Please try again.");
      return;
    }
    
    setIsDownloading(true);
    setError(null);
    try {
      console.log("Attempting to download venue plan...");
      
      // Pass the schedule data directly instead of relying on session
      const response = await fetch("http://127.0.0.1:8000/planner/download_venue_plan/", {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': csrfToken,
        },
        credentials: 'include', // Important for session cookies
        body: JSON.stringify({ schedule_data: schedule }), // Pass schedule data directly
      });
      
      console.log("Response status:", response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error response:", errorData);
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }
      
      const blob = await response.blob();
      console.log("Blob received, size:", blob.size);
      saveAs(blob, "Venue_Plan.docx");
    } catch (err) {
      console.error("Download error:", err);
      setError(`Download failed: ${err.message}`);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="container my-5 p-4 rounded custom-bg shadow-lg">
      <h1 className="main-heading text-center mb-4">Preview & Download</h1>
      {error && <div className="alert alert-danger">{error}</div>}
      
      {/* Schedule Section */}
      <section className="mb-5">
        <h4 className="common-style">Schedule Preview</h4>
        <div className="card dark-card p-3 shadow-sm mb-3">
          <ScheduleViewer schedule={schedule} />
        </div>
        <div className="text-center">
          <button className="btn neon-btn btn-lg" onClick={downloadScheduleExcel}>
            Download Schedule (.xlsx)
          </button>
        </div>
        <div className="text-center mt-3">
          <button 
            className="btn neon-btn btn-lg" 
            onClick={generateSummary} 
            disabled={isSummaryLoading}
          >
            {isSummaryLoading ? "Generating Summary..." : "Generate Summary"}
          </button>
          {summary && (
            <div className="mt-4 p-3 card dark-card shadow-sm text-start">
              <h5>Schedule Summary</h5>
              <p style={{ whiteSpace: "pre-wrap" }}>{summary}</p>
            </div>
          )}
        </div>
      </section>
      
      {/* Venue Plan Section */}
      <section>
        <h4 className="common-style">Venue Plan Preview</h4>
        <div className="card dark-card p-3 shadow-sm mb-3">
          {loading ? (
            <div className="text-center py-4">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-2">Generating venue plan preview...</p>
            </div>
          ) : venuePlanPreview ? (
            venuePlanPreview.split("\n\n").map((block, idx) => (
              <div key={idx} className="mb-4 p-3 border rounded shadow-sm">
                <pre style={{ whiteSpace: "pre-wrap", fontFamily: "monospace" }}>
                  {block}
                </pre>
              </div>
            ))
          ) : (
            <p className="text-muted">No venue plan preview available.</p>
          )}
        </div>
        <div className="text-center">
          <button
            className="btn neon-btn btn-lg"
            onClick={downloadVenuePlanDoc}
            disabled={isDownloading}
          >
            {isDownloading ? "Generating..." : "Download Venue Plan (.docx)"}
          </button>
        </div>
      </section>
    </div>
  );
}

export default PreviewPage;