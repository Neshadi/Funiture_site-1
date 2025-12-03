// src/pages/ARHelpPage.jsx
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import "./ARHelpPage.css"; // We'll create this CSS next

const ARHelpPage = () => {
  const navigate = useNavigate();

  return (
    <div className="ar-help-page">
      {/* Back Button */}
      <button onClick={() => navigate(-1)} className="back-btn">
        <ArrowLeft size={24} />
        <span>Back</span>
      </button>

      {/* Title */}
      <h2 className="help-title">Step to use :</h2>

      {/* Steps List */}
      <ol className="steps-list">
        <li>Tap Start AR View</li>
        <li>Allow camera access if request access.</li>
        <li>Point your camera at a flat surface.</li>
        <li>Click the screen to place the item</li>
        <li>See the item in your space!</li>
      </ol>

      {/* Important Note */}
      <div className="important-box">
        <div className="important-header">
          <span className="exclamation">!</span>
          <strong>Important</strong>
        </div>
        <p>
          AR View only works on compatible devices
          <br />
          (most modern Android and iOS devices).
        </p>
        <p>
          AR Compatible devices list here:{" "}
          <a
            href="https://developers.google.com/ar/devices#google_play_devices"
            target="_blank"
            rel="noopener noreferrer"
            className="compatible-link"
          >
            Click Here
            {/* <span className="glow-circle">⬅</span> */}
          </a>
        </p>
      </div>

      {/* Tutorial Section */}
      <div className="tutorial-section">
        <div className="tutorial-label">
          <span>Tutorial</span>
        </div>
        <div className="video-placeholder">
          <p>Video About How to Use</p>
        </div>
      </div>
    </div>
  );
};

export default ARHelpPage;