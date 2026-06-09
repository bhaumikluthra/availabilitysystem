import { useState, useCallback } from "react";
import AvailabilityPage from "./pages/AvailabilityPage.jsx";
import ViewBookingsPage from "./pages/ViewBookingsPage.jsx";
import AttendancePage from "./pages/AttendancePage.jsx";
import AddDataModal from "./components/overlays/AddDataModal.jsx";
import "./App.css";

export default function App() {
  // Now supports: "availability" | "bookings" | "attendance"
  const [activeTab, setActiveTab] = useState("availability");
  const [showModal, setShowModal] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // When new data is uploaded, update this trigger to force the Availability page to fetch fresh filters
  const handleDataAdded = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);

  return (
    <div className="app">
      <header className="header">
        <div className="hinner">
          <div className="logo">T</div>
          <span className="header-title">Dashboard</span>

          <nav className="header-nav">
            <button
              className={`nav-tab ${activeTab === "availability" ? "nav-tab-active" : ""}`}
              onClick={() => setActiveTab("availability")}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
              </svg>
              Availability
            </button>

            <button
              className={`nav-tab ${activeTab === "bookings" ? "nav-tab-active" : ""}`}
              onClick={() => setActiveTab("bookings")}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/>
              </svg>
              View Bookings
            </button>

            <button
              className={`nav-tab ${activeTab === "attendance" ? "nav-tab-active" : ""}`}
              onClick={() => setActiveTab("attendance")}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect><path d="M9 14h6"></path><path d="M9 10h6"></path><path d="M9 18h6"></path>
              </svg>
              Attendance
            </button>
          </nav>
        </div>

        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ marginRight: '6px' }}>
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Add Data
        </button>
      </header>

      <main className="main">
        {activeTab === "availability" && <AvailabilityPage refreshTrigger={refreshTrigger} />}
        {activeTab === "bookings" && <ViewBookingsPage />}
        {activeTab === "attendance" && <AttendancePage />}
      </main>

      {showModal && (
        <AddDataModal
          onClose={() => setShowModal(false)}
          onDone={handleDataAdded}
        />
      )}
    </div>
  );
}