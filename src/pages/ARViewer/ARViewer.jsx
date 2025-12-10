import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { USDZExporter } from "three/examples/jsm/exporters/USDZExporter.js"; // <--- NEW IMPORT
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";
import { useSearchParams, useNavigate } from "react-router-dom";

// === HELPER: Detect iOS ===
const checkIsIOS = () => {
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
};

const LoadingBar = ({ progress, statusText }) => (
  <div
    style={{
      position: "absolute",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      width: "80%",
      maxWidth: "300px",
      background: "rgba(0,0,0,0.8)",
      borderRadius: "12px",
      padding: "20px",
      zIndex: 1002,
    }}
  >
    <div style={{ color: "white", marginBottom: "10px", textAlign: "center", fontSize: "14px" }}>
      {statusText || "Loading Model..."} {progress > 0 ? `${progress}%` : ""}
    </div>
    <div style={{ width: "100%", height: "8px", background: "#333", borderRadius: "4px" }}>
      <div
        style={{
          width: `${progress}%`,
          height: "100%",
          background: "#007bff",
          borderRadius: "4px",
          transition: "width 0.3s",
        }}
      />
    </div>
  </div>
);

const ARViewer = () => {
  const navigate = useNavigate();
  const containerRef = useRef();
  const overlayRef = useRef();
  
  // States
  const [isSupported, setIsSupported] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState("Loading...");
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [isPlaced, setIsPlaced] = useState(false);
  const [reticleReady, setReticleReady] = useState(false);
  
  const [searchParams] = useSearchParams();
  const app = useRef({});
  const modelUrl = searchParams.get("model");

  const dragState = useRef({
    isDragging: false,
    prevX: 0,
    prevY: 0,
    lastTime: 0,
  });

  // === 1. INITIALIZATION ===
  useEffect(() => {
    const iosCheck = checkIsIOS();
    setIsIOS(iosCheck);

    if (!modelUrl) {
      alert("No 3D model URL provided.");
      navigate(-1);
      return;
    }

    // Only auto-start WebXR on Android
    if (!iosCheck) {
      const timer = setTimeout(() => {
        if (app.current.currentSession === null && isSupported) {
          showChair();
        }
      }, 300);
      return () => clearTimeout(timer);
    } 
  }, [modelUrl, isSupported]);

  // === 2. IOS CONVERSION & LAUNCHER ===
  const handleIOSLaunch = async () => {
    if (isLoading) return; // Prevent double clicks
    
    setIsLoading(true);
    setLoadingProgress(10);
    setLoadingStatus("Downloading Model...");

    try {
      // Step A: Load GLB
      const loader = new GLTFLoader();
      const gltf = await new Promise((resolve, reject) => {
        loader.load(
          modelUrl,
          (gltf) => {
             setLoadingProgress(60);
             resolve(gltf);
          }, 
          (xhr) => {
            if(xhr.total) setLoadingProgress(Math.round((xhr.loaded / xhr.total) * 50));
          },
          (err) => reject(err)
        );
      });

      // Step B: Convert to USDZ
      setLoadingStatus("Converting for iPhone...");
      const exporter = new USDZExporter();
      const usdzArrayBuffer = await exporter.parse(gltf.scene);
      setLoadingProgress(90);

      // Step C: Create Blob and Launch
      const blob = new Blob([usdzArrayBuffer], { type: "model/vnd.usdz+zip" });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement("a");
      link.rel = "ar";
      link.href = url;
      
      // Dummy image required for anchor to work effectively in some contexts
      const img = document.createElement("img");
      img.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
      link.appendChild(img);
      
      link.click(); // Launch AR Quick Look
      
      setLoadingProgress(100);
      setTimeout(() => {
        setIsLoading(false);
        setLoadingProgress(0);
      }, 1000);

    } catch (error) {
      console.error("Conversion failed:", error);
      alert("Failed to convert model for iPhone.");
      setIsLoading(false);
    }
  };

  // === 3. TOUCH HANDLERS (Android) ===
  useEffect(() => {
    if (isIOS) return;
    const overlay = overlayRef.current;
    if (!overlay) return;

    const handleTouchStart = (e) => {
      if (!app.current.chair || !isPlaced || e.target.tagName === "BUTTON") return;
      const touch = e.touches[0];
      dragState.current = { isDragging: true, prevX: touch.clientX, prevY: touch.clientY };
    };

    const handleTouchMove = (e) => {
      if (!dragState.current.isDragging || !isPlaced) return;
      e.preventDefault();
      const touch = e.touches[0];
      const deltaX = touch.clientX - dragState.current.prevX;
      const deltaY = touch.clientY - dragState.current.prevY;
      
      const chair = app.current.chair;
      chair.rotation.y += deltaX * 0.01;
      
      const forward = new THREE.Vector3();
      app.current.camera.getWorldDirection(forward);
      forward.y = 0;
      forward.normalize();
      chair.position.addScaledVector(forward, -deltaY * 0.002);

      dragState.current.prevX = touch.clientX;
      dragState.current.prevY = touch.clientY;
    };

    const handleTouchEnd = () => { dragState.current.isDragging = false; };

    overlay.addEventListener("touchstart", handleTouchStart, { passive: false });
    overlay.addEventListener("touchmove", handleTouchMove, { passive: false });
    overlay.addEventListener("touchend", handleTouchEnd);

    return () => {
      overlay.removeEventListener("touchstart", handleTouchStart);
      overlay.removeEventListener("touchmove", handleTouchMove);
      overlay.removeEventListener("touchend", handleTouchEnd);
    };
  }, [isPlaced, isIOS]);

  // === 4. THREE.JS SETUP (Android) ===
  useEffect(() => {
    if (isIOS) return; 

    const container = containerRef.current;
    if (!container) return;

    const a = app.current;
    a.scene = new THREE.Scene();
    a.camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 20);
    a.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    a.renderer.setSize(window.innerWidth, window.innerHeight);
    a.renderer.xr.enabled = true;
    container.appendChild(a.renderer.domElement);

    // Light
    const ambient = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
    ambient.position.set(0.5, 1, 0.25);
    a.scene.add(ambient);

    // Reticle
    a.reticle = new THREE.Mesh(
      new THREE.RingGeometry(0.15, 0.2, 32).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({ color: 0xffffff, opacity: 0.7, transparent: true })
    );
    a.reticle.visible = false;
    a.scene.add(a.reticle);

    // Check Android Support
    if ("xr" in navigator) {
      navigator.xr.isSessionSupported("immersive-ar").then(setIsSupported);
    }

    return () => {
      if (a.renderer) {
        a.renderer.dispose(); 
        a.renderer.forceContextLoss();
      }
      if (container && container.contains(a.renderer?.domElement)) {
        container.removeChild(a.renderer.domElement);
      }
    };
  }, [isIOS]);

  // === ANDROID LOGIC ===
  const showChair = async () => {
    const a = app.current;
    const session = await navigator.xr.requestSession("immersive-ar", {
      requiredFeatures: ["hit-test"],
      optionalFeatures: ["dom-overlay"],
      domOverlay: { root: overlayRef.current },
    });
    
    a.renderer.xr.setReferenceSpaceType("local");
    a.renderer.xr.setSession(session);
    a.currentSession = session;
    
    session.addEventListener("end", () => {
      a.currentSession = null;
      setIsPlaced(false);
      setReticleReady(false);
      a.scene.remove(a.chair);
    });

    // Load Model
    setIsLoading(true);
    setLoadingStatus("Loading 3D Model...");
    new GLTFLoader().load(modelUrl, (gltf) => {
       a.chair = gltf.scene;
       a.chair.visible = false;
       a.scene.add(a.chair);
       setIsLoading(false);
       setReticleReady(true);
    });

    // Hit Test Setup
    session.requestReferenceSpace("viewer").then((refSpace) => {
      session.requestHitTestSource({ space: refSpace }).then((source) => {
        a.hitTestSource = source;
      });
    });

    // Render Loop
    a.renderer.setAnimationLoop((time, frame) => {
      if (frame && a.hitTestSource && !isPlaced) {
         const results = frame.getHitTestResults(a.hitTestSource);
         if (results.length) {
           const pose = results[0].getPose(a.renderer.xr.getReferenceSpace());
           a.reticle.visible = true;
           a.reticle.matrix.fromArray(pose.transform.matrix);
         } else {
           a.reticle.visible = false;
         }
      }
      a.renderer.render(a.scene, a.camera);
    });

    // Tap Listener
    const onSelect = () => {
      if (a.reticle.visible && !isPlaced) {
        a.chair.position.setFromMatrixPosition(a.reticle.matrix);
        a.chair.visible = true;
        a.reticle.visible = false;
        setIsPlaced(true);
      }
    };
    const controller = a.renderer.xr.getController(0);
    controller.addEventListener("select", onSelect);
    a.scene.add(controller);
  };

  // === RENDER ===
  
  // 1. IOS VIEW
  if (isIOS) {
    return (
      <div style={{
        height: "100vh", width: "100vw", background: "#111",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        color: "white", fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif"
      }}>
        {isLoading ? (
          <LoadingBar progress={loadingProgress} statusText={loadingStatus} />
        ) : (
          <>
            <h1 style={{fontSize: "24px", marginBottom: "10px"}}>AR Viewer</h1>
            <p style={{color: "#888", marginBottom: "40px"}}>Visualize this object in your space</p>
            
            <button 
              onClick={handleIOSLaunch}
              style={{
                background: "#007AFF", color: "white", border: "none",
                padding: "16px 32px", fontSize: "17px", fontWeight: "600",
                borderRadius: "28px", display: "flex", alignItems: "center", gap: "10px",
                cursor: "pointer", boxShadow: "0 4px 12px rgba(0,122,255,0.3)"
              }}
            >
              <span>View in AR</span>
              {/* Simple AR Cube Icon */}
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 3l10 6v6l-10 6L2 15V9l10-6z"/>
                <path d="M12 3v12"/>
                <path d="M2 9l10 6 10-6"/>
              </svg>
            </button>
            
            <p style={{marginTop: "20px", fontSize: "12px", color: "#555"}}>
              Optimized for iPhone & iPad
            </p>
          </>
        )}
      </div>
    );
  }

  // 2. ANDROID / WEBXR VIEW
  return (
    <div ref={containerRef} style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "#000" }}>
      <div ref={overlayRef} style={{ position: "fixed", inset: 0, pointerEvents: "none" }}>
        {isLoading && <LoadingBar progress={loadingProgress} statusText={loadingStatus} />}
        
        {!isPlaced && reticleReady && !isLoading && (
          <div style={{ position: "absolute", top: "10%", left: "50%", transform: "translateX(-50%)", background: "rgba(0,0,0,0.6)", color: "white", padding: "10px 20px", borderRadius: "20px" }}>
            Tap floor to place
          </div>
        )}
        
        {isPlaced && (
           <div style={{ position: "absolute", bottom: "30px", width: "100%", display: "flex", justifyContent: "center", gap: "20px", pointerEvents: "auto" }}>
             <button onClick={() => app.current.chair.rotation.y -= 0.5} style={btnStyle}>Rotate Left</button>
             <button onClick={() => app.current.chair.rotation.y += 0.5} style={btnStyle}>Rotate Right</button>
           </div>
        )}
      </div>
    </div>
  );
};

const btnStyle = {
  padding: "12px 24px", background: "rgba(255, 255, 255, 0.2)", color: "white",
  border: "none", borderRadius: "30px", backdropFilter: "blur(10px)", fontWeight: "600"
};

export default ARViewer;