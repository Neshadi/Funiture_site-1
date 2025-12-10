import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { USDZExporter } from "three/examples/jsm/exporters/USDZExporter.js";

const IPhoneARViewer = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const modelUrl = searchParams.get("model");

  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("");

  useEffect(() => {
    if (!modelUrl) {
      alert("No model URL provided");
      navigate(-1);
    }
  }, [modelUrl, navigate]);

  const launchNativeAR = async () => {
    if (isLoading) return;

    try {
      setIsLoading(true);
      setStatus("Downloading Model...");
      setProgress(10);

      // 1. Load the GLB file
      const loader = new GLTFLoader();
      const gltf = await new Promise((resolve, reject) => {
        loader.load(
          modelUrl,
          (data) => {
            setProgress(50);
            resolve(data);
          },
          (xhr) => {
            if (xhr.total > 0) {
              const percent = (xhr.loaded / xhr.total) * 40; // Scale to 40%
              setProgress(10 + percent);
            }
          },
          (err) => reject(err)
        );
      });

      // 2. Convert to USDZ (Apple Format)
      setStatus("Processing for iPhone...");
      setProgress(60);
      
      const exporter = new USDZExporter();
      const usdzArrayBuffer = await exporter.parse(gltf.scene);
      setProgress(90);

      // 3. Create a Blob and URL
      const blob = new Blob([usdzArrayBuffer], { type: "model/vnd.usdz+zip" });
      const url = URL.createObjectURL(blob);

      // 4. Create hidden link to trigger AR Quick Look
      const link = document.createElement("a");
      link.rel = "ar";
      link.href = url;
      
      // Apple requires an image inside the anchor for some contexts, using a pixel
      const img = document.createElement("img");
      img.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
      link.appendChild(img);

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Reset UI after a moment
      setProgress(100);
      setStatus("Opening AR...");
      setTimeout(() => {
        setIsLoading(false);
        setProgress(0);
      }, 2000);

    } catch (error) {
      console.error("AR Launch Error:", error);
      alert("Could not load AR model.");
      setIsLoading(false);
    }
  };

  return (
    <div style={containerStyle}>
      <div style={contentCardStyle}>
        {/* Icon */}
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
          To view this object in your space, we need to open Apple's AR Quick Look.
        </p>

        {isLoading ? (
          <div style={loadingContainerStyle}>
            <div style={{ marginBottom: "10px", fontSize: "14px", color: "#007AFF" }}>
              {status} {Math.round(progress)}%
            </div>
            <div style={progressBarBg}>
              <div style={{ ...progressBarFill, width: `${progress}%` }} />
            </div>
          </div>
        ) : (
          <button onClick={launchNativeAR} style={buttonStyle}>
            View in My Space
          </button>
        )}

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
};

const loadingContainerStyle = {
  width: "100%",
};

const progressBarBg = {
  width: "100%",
  height: "6px",
  background: "#333",
  borderRadius: "3px",
  overflow: "hidden",
};

const progressBarFill = {
  height: "100%",
  background: "#007AFF",
  transition: "width 0.3s ease",
};

export default IPhoneARViewer;