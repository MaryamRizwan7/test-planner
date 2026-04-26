// src/components/FileUploader.jsx
import React from "react";

function FileUploader({ setUploadedFiles, requiredFiles = [], hideLabel = false }) {
  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    // Merge with existing uploaded files
    setUploadedFiles((prev) => ({
      ...prev,
      [type]: file,
    }));
  };

  return (
    <div>
      {/* Blocks File */}
      {requiredFiles.includes("blocks") && (
        <div className="mb-3">
          {!hideLabel && <label className="form-label">Blocks File</label>}
          <input
            type="file"
            className="form-control"
            accept=".csv,.xlsx"
            onChange={(e) => handleFileChange(e, "blocks")}
          />
        </div>
      )}

      {/* Students File */}
      {requiredFiles.includes("students") && (
        <div className="mb-3">
          {!hideLabel && <label className="form-label">Students File</label>}
          <input
            type="file"
            className="form-control"
            accept=".csv,.xlsx"
            onChange={(e) => handleFileChange(e, "students")}
          />
        </div>
      )}

      {/* Invigilators File */}
      {requiredFiles.includes("invigilators") && (
        <div className="mb-3">
          {!hideLabel && <label className="form-label">Invigilators File</label>}
          <input
            type="file"
            className="form-control"
            accept=".csv,.xlsx"
            onChange={(e) => handleFileChange(e, "invigilators")}
          />
        </div>
      )}
    </div>
  );
}

export default FileUploader;
