import { useState, useRef, useCallback } from "react";
import api from "../../services/api";
import Toast from "../common/Toast";

export default function AddDataModal({ onClose, onDone }) {
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [breakTime, setBreakTime] = useState({ breakStart: "12:00", breakEnd: "13:00" });

  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [toast, setToast] = useState({ msg: "", type: "info" });

  const fileRef = useRef(null);

  const notify = (msg, type = "info") => setToast({ msg, type });
  const closeToast = useCallback(() => setToast({ msg: "", type: "info" }), []);

  const handleFileSelect = (f) => {
    if (f) { setFile(f); setFileName(f.name); setUploaded(false); }
  };

  const doUpload = async () => {
    if (!file) { notify("Please select a CSV file first.", "error"); return; }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await api.post("/api/files/upload", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      if (res.status === 201 || res.status === 200) {
        notify(res.data?.message || res.data || "File uploaded successfully.", "success");
        setUploaded(true);
      }
    } catch (err) {
      notify(err?.response?.data || "Upload failed. Please check the CSV format.", "error");
    } finally {
      setUploading(false);
    }
  };

  const doSaveBreak = async () => {
    setSaving(true);
    try {
      const res = await api.put("/api/break-times", {
        breakStart: breakTime.breakStart,
        breakEnd: breakTime.breakEnd,
      });
      notify(res.data?.message || res.data || "Break time saved.", "success");
      setTimeout(() => { onDone(); onClose(); }, 800);
    } catch (err) {
      notify(err?.response?.data || "Failed to set break time.", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-head">
          <span className="modal-title">System Data Configuration</span>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <Toast msg={toast.msg} type={toast.type} onClose={closeToast} />

        <div className="modal-section">
          <p className="section-label">1. Upload Roster CSV</p>
          <div className="upload-row">
            <div
              className={`drop-zone ${fileName ? "drop-filled" : ""} ${isDragging ? "drag-active" : ""}`}
              onClick={() => fileRef.current.click()}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => { e.preventDefault(); setIsDragging(false); handleFileSelect(e.dataTransfer.files[0]); }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
              <span>{fileName || "Click or drag a .csv file here"}</span>
              <input ref={fileRef} type="file" accept=".csv" style={{ display: "none" }}
                onChange={(e) => handleFileSelect(e.target.files[0])} />
            </div>
            <button className="btn btn-primary" onClick={doUpload} disabled={uploading || uploaded || !file}>
              {uploading ? <span className="spin" /> : uploaded ? "✓ Upload Complete" : "Upload File"}
            </button>
          </div>
        </div>

        <div className={`modal-section ${!uploaded ? "section-dim" : ""}`}>
          <p className="section-label">2. Global Break Time Settings</p>
          <div className="break-row">
            <div className="field">
              <label className="flabel">Start Time</label>
              <input className="ctrl" type="time" name="breakStart"
                value={breakTime.breakStart} disabled={!uploaded}
                onChange={(e) => setBreakTime(p => ({ ...p, breakStart: e.target.value }))} />
            </div>
            <span className="arrow">→</span>
            <div className="field">
              <label className="flabel">End Time</label>
              <input className="ctrl" type="time" name="breakEnd"
                value={breakTime.breakEnd} disabled={!uploaded}
                onChange={(e) => setBreakTime(p => ({ ...p, breakEnd: e.target.value }))} />
            </div>
            <button className="btn btn-primary" onClick={doSaveBreak} disabled={!uploaded || saving}>
              {saving ? <span className="spin" /> : "Save & Close"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}