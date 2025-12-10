import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";

const IPhoneARViewer = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // Get the model URL from parameters
  const modelUrl = searchParams.get("model");

  // Determine the final AR URL:
  // 1. If 'model' is already .usdz, use it.
  // 2. If 'model' is .glb, swap the extension to .usdz automatically.
  const arUrl = modelUrl ? modelUrl.replace(/\.glb$/i, ".usdz").replace(/\.usd$/i, ".usdz") : null;

  useEffect(() => {
    if (!modelUrl) {
      alert("No model URL provided");
      navigate(-1);
    }
  }, [modelUrl, navigate]);

  const launchNativeAR = () => {
    if (!arUrl) return;

    // Create the special Apple AR link
    const link = document.createElement("a");
    link.rel = "ar";
    link.href = arUrl;

    // Add a dummy image (required for the anchor to work securely in some contexts)
    const img = document.createElement("img");
    img.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
    link.appendChild(img);

    // Click it programmatically
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={containerStyle}>
      <div style={contentCardStyle}>
        {/* Cube Icon */}
        <div style={iconContainerStyle}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5">
            <path d="M12 3l10 6v6l-10 6L2 15V9l10-6z" />
            <path d="M12 3v12" />
            <path d="M2 9l10 6 10-6" />
          </svg>
        </div>

        <h2 style={{ fontSize: "22px", fontWeight: "600", marginBottom: "8px" }}>
          AR Viewer
        </h2>
        <p style={{ color: "#aaa", fontSize: "14px", marginBottom: "30px", lineHeight: "1.5" }}>
          Tap the button below to view this object in your space on iPhone.
        </p>

        <button onClick={launchNativeAR} style={buttonStyle}>
          View in My Space
        </button>

        <div style={{ marginTop: "25px", fontSize: "12px", color: "#555" }}>
          Powered by iOS AR Quick Look
        </div>
      </div>
    </div>
  );
};

// === STYLES ===
const containerStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  background: "#000000",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
  color: "white",
};

const contentCardStyle = {
  width: "85%",
  maxWidth: "350px",
  textAlign: "center",
  padding: "30px",
  background: "#1c1c1e",
  borderRadius: "24px",
  boxShadow: "0 10px 40px rgba(0,0,0,0.5)",
};

const iconContainerStyle = {
  width: "60px",
  height: "60px",
  background: "#2c2c2e",
  borderRadius: "50%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  margin: "0 auto 20px auto",
};

const buttonStyle = {
  width: "100%",
  padding: "16px",
  backgroundColor: "#007AFF",
  color: "white",
  border: "none",
  borderRadius: "14px",
  fontSize: "16px",
  fontWeight: "600",
  cursor: "pointer",
  transition: "opacity 0.2s",
  WebkitTapHighlightColor: "transparent",
  boxShadow: "0 4px 12px rgba(0, 122, 255, 0.3)",
};

export default IPhoneARViewer;