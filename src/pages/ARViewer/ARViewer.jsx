import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";

// Helper function to detect iOS devices
const isIOS = () => {
  const userAgent = navigator.userAgent || navigator.vendor || window.opera;
  return /iPad|iPhone|iPod/.test(userAgent) && !window.MSStream;
};

// Component to handle the native AR launch on iOS
const ARViewer  = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isIPhone, setIsIPhone] = useState(false);
  const modelUrl = searchParams.get("model");
  const modelName = searchParams.get("name") || "3D Model";

  useEffect(() => {
    setIsIPhone(isIOS());
    if (!modelUrl) {
      alert("No 3D model URL provided.");
      navigate(-1);
    }
  }, [modelUrl, navigate]);

  // --- STYLES ---
  const containerStyle = {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "#1c1c1e",
    color: "#fff",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    padding: "20px",
    zIndex: 1000,
  };

  const buttonStyle = {
    padding: "15px 30px",
    background: "#007AFF", // iOS blue
    color: "#ffffff",
    border: "none",
    borderRadius: "14px",
    cursor: "pointer",
    fontSize: "18px",
    fontWeight: "600",
    marginTop: "20px",
    textDecoration: "none",
    boxShadow: "0 4px 12px rgba(0, 122, 255, 0.3)",
    display: "inline-block",
  };
  
  // --- RENDERING ---

  if (!modelUrl) return null;

  if (isIPhone) {
    // 1. **Native iOS AR Implementation (Quick Look AR)**
    // The key is the <a> tag with rel="ar" and the .usdz file
    return (
      <div style={containerStyle}>
        <h1>View {modelName} in AR</h1>
        <p>This feature uses Apple's native AR viewer (Quick Look AR) for the best performance on your iPhone.</p>
        
        {/* The Magic: rel="ar" attribute and the .usdz file launch the native AR viewer */}
        <a 
          href={modelUrl} 
          rel="ar" 
          style={buttonStyle} 
          // Sets the model's appearance in the AR scene before placement
          // Fallback image for the item in the scene, before the AR view starts
          aria-label={`View ${modelName} in Augmented Reality`}
        >
          Launch AR
        </a>
        
        <p style={{ marginTop: '20px', fontSize: '14px', color: '#aaa' }}>
          File: **{modelUrl.split('/').pop()}**
        </p>
      </div>
    );
  } else {
    // 2. Fallback for non-iOS devices
    // You could redirect, or render your original WebXR component here.
    return (
      <div style={containerStyle}>
        <h1>Device Not Supported</h1>
        <p>This AR viewer is optimized for **iPhone/iPad** to use native AR viewing.</p>
        <p>Please switch to an iOS device to view the `.usdz` model in Augmented Reality.</p>
      </div>
    );
  }
};

export default ARViewer ;