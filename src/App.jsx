import { useState, useEffect } from "react";
import io from "socket.io-client";
import axios from "axios";
import "./App.css";

const backendURL = "https://andon-backend2.onrender.com";
const socket = io(backendURL, { transports: ["websocket"] });

const productionAreas = {
  "Loop 1": ["A&T", "TMA", "SUBA/CONA"],
  "Loop 2": [
    "D15042",
    "D15049",
    "D15051",
    "D15055",
    "D15134",
    "D15139",
    "D15140",
    "D15149",
    "D15150",
    "D15151",
    "D228081",
    "D28082",
    "D28108",
    "D28109",
  ],

  "Loop 3": [
    "D18055",
    "D18154",
    "D18155",
    "D18157",
    "D18160",
    "D18161",
    "D18162",
    "D18169",
  ],

  "Loop 4": [
    "D61139",
    "D61148",
    "D61150",
    "D61152",
    "D61153",
    "D61154",
    "D61201",
    "D61202",
    "D61203",
    "D61204",
    "D61205",
    "D61391",
  ],
  Quality: ["RI", "ZEISS"],
  Planning: ["STOCKROOM", "SHIPPING"],
};

const timeAgo = (timestamp) => {
  if (!timestamp) return "";
  const now = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Manila" }),
  );
  const reportTime = new Date(
    new Date(timestamp).toLocaleString("en-US", { timeZone: "Asia/Manila" }),
  );
  const diffInSeconds = Math.floor((now - reportTime) / 1000);

  if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}hr ago`;
  return `${Math.floor(diffInSeconds / 86400)}d ago`;
};

export default function App() {
  const [userType, setUserType] = useState(null);
  const [selectedLoop, setSelectedLoop] = useState(null);
  const [selectedSection, setSelectedSection] = useState("");
  const [reports, setReports] = useState([]);
  const [remark, setRemark] = useState("");
  const [currentTime, setCurrentTime] = useState(new Date());

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const [showResolveModal, setShowResolveModal] = useState(false);
  const [resolveReportId, setResolveReportId] = useState(null);

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    axios.get(`${backendURL}/reports`).then(({ data }) => setReports(data));

    socket.on("newReport", (newReport) => {
      setReports((prev) => [
        ...prev.filter((r) => r._id !== newReport._id),
        newReport,
      ]);
    });

    socket.on("resolveReport", ({ id }) => {
      setReports((prev) =>
        prev.map((r) =>
          r._id === id
            ? { ...r, status: "green", remark: "", timestamp: null }
            : r,
        ),
      );
    });

    return () => {
      socket.off("newReport");
      socket.off("resolveReport");
    };
  }, []);

  const sendReport = (status) => {
    if (!selectedSection) {
      alert("Please select a section before submitting a report.");
      return;
    }

    axios
      .post(`${backendURL}/report`, {
        loop: selectedLoop,
        section: selectedSection,
        status,
        assigned: "John Doe",
        remark: remark,
      })
      .then(({ data }) => {
        setReports((prev) => [...prev.filter((r) => r._id !== data._id), data]);
        setRemark("");
      })
      .catch((error) => console.error("❌ Error sending report:", error));
  };

  const handleResolve = (id) => {
    setResolveReportId(id);
    setShowResolveModal(true);
  };

  const confirmResolve = () => {
    axios
      .post(`${backendURL}/resolve/${resolveReportId}`)
      .then(() => {
        setShowResolveModal(false);
        setResolveReportId(null);
      })
      .catch((error) => console.error("❌ Error resolving report:", error));
  };

  const handleOfficeSelection = () => {
    setShowPasswordModal(true);
  };

  const verifyPassword = () => {
    if (password === "moogojt") {
      setUserType("Office");
      setShowPasswordModal(false);
      setPassword("");
      setPasswordError("");
    } else {
      setPasswordError("Incorrect password. Try again.");
    }
  };

  if (!userType) {
    return (
      <div className="selection-screen">
        <h1>Select User Type</h1>
        <button
          onClick={() => setUserType("Production")}
          className="confirm-btn"
        >
          Production
        </button>
        <button onClick={handleOfficeSelection} className="confirm-btn">
          Office
        </button>

        {showPasswordModal && (
          <div className="modal">
            <div className="modal-content">
              <h3>Enter Office Password</h3>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="password-input"
              />
              {passwordError && <p className="error-text">{passwordError}</p>}
              {/* Flex container for buttons */}
              <div className="button-container">
                <button onClick={verifyPassword} className="confirm-btn">
                  Confirm
                </button>
                <button
                  onClick={() => setShowPasswordModal(false)}
                  className="cancel-btn"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (userType === "Production" && !selectedLoop) {
    return (
      <div className="selection-screen">
        <h1>Select Your Area</h1>
        {Object.keys(productionAreas).map((loop) => (
          <button
            key={loop}
            onClick={() => {
              setSelectedLoop(loop);
              setSelectedSection(productionAreas[loop][0]);
            }}
            className="confirm-btn"
          >
            {loop}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="container">
      {/* <div className="clock-container">
        <h2>{currentTime.toLocaleTimeString("en-US", { timeZone: "Asia/Manila", hour12: true })}</h2>
      </div> */}

      <div className="header-container">
        <img src="/logo.png" alt="Moog Logo" className="moog-logo" />
        {/* <h1>ANDON SYSTEM • </h1> */}

        <div className="clock-container">
          <h2>
            {" "}
            •{" "}
            {new Date().toLocaleString("en-US", {
              timeZone: "Asia/Manila",
              hour12: true,
              // weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
            &nbsp;•&nbsp;
            {currentTime.toLocaleTimeString("en-US", {
              timeZone: "Asia/Manila",
              hour12: true,
            })}
          </h2>
        </div>
      </div>

      {userType === "Production" && (
        <div className="reporting-section">
          <h2>Production Reporting</h2>
          <select
            value={selectedSection}
            onChange={(e) => setSelectedSection(e.target.value)}
          >
            {productionAreas[selectedLoop].map((section) => (
              <option key={section} value={section}>
                {section}
              </option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Enter remark..."
            className="remark-input"
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
            maxLength={20}
          />
          <button className="red-btn" onClick={() => sendReport("red")}>
            Red
          </button>
          <button className="yellow-btn" onClick={() => sendReport("yellow")}>
            Yellow
          </button>
          <button className="green-btn" onClick={() => sendReport("green")}>
            Green
          </button>
        </div>
      )}

      <div className="dashboard">
        {Object.entries(productionAreas)
          .filter(([loop]) => userType === "Office" || loop === selectedLoop)
          .map(([loop, sections]) => (
            <div key={loop} className="loop-section">
              <h3>{loop}</h3>
              <div className="grid-container">
                {sections.map((section) => {
                  const report = reports.find(
                    (r) => r.loop === loop && r.section === section,
                  );
                  return (
                    <div
                      key={section}
                      className={`grid-item ${report ? report.status : "green"}`}
                    >
                      {section}
                      {report && report.status !== "green" && (
                        <>
                          <p className="remark-text">{report.remark}</p>
                          <p className="timestamp-text">
                            {timeAgo(report.timestamp)}
                          </p>
                          {userType === "Office" && (
                            <button
                              className="resolve-btn"
                              onClick={() => handleResolve(report._id)}
                            >
                              Resolve
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
      </div>

      {showResolveModal && (
        <div className="modal">
          <div className="modal-content">
            <h3>Confirm Resolve</h3>
            <div className="button-container">
              <button onClick={confirmResolve} className="confirm-btn">
                Confirm
              </button>
              <button
                onClick={() => setShowResolveModal(false)}
                className="cancel-btn"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
