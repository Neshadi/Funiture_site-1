import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";
import { useSearchParams, useNavigate } from "react-router-dom";

// Mock LoadingBar
const LoadingBar = ({ progress }) => (
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
    <div style={{ color: "white", marginBottom: "10px", textAlign: "center" }}>
      Loading Model... {progress}%
    </div>
    <div
      style={{
        width: "100%",
        height: "8px",
        background: "#333",
        borderRadius: "4px",
      }}
    >
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

// Detect iOS
const isIOS = () => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
};

// Detect low-end device (only used on Android path)
const isLowEndDevice = () => {
  const ua = navigator.userAgent;
  const ram = (navigator.deviceMemory || 4) <= 4;
  const isAndroidLow =
    /Android/i.test(ua) && (/SM-|M[0-9][0-9]/.test(ua) || ram);
  return ram || isAndroidLow;
};

const ARViewer = () => {
  const navigate = useNavigate();
  const containerRef = useRef();
  const overlayRef = useRef();
  const [isSupported, setIsSupported] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [isPlaced, setIsPlaced] = useState(false);
  const [reticleReady, setReticleReady] = useState(false);
  const [searchParams] = useSearchParams();
  const app = useRef({});
  const isLowEnd = useRef(isLowEndDevice());

  const modelUrl = searchParams.get("model");        // .glb or .gltf (Android)
  const usdzUrl = searchParams.get("usdz");          // .usdz (iOS) – optional
  const deviceIsIOS = isIOS();

  const dragState = useRef({
    isDragging: false,
    prevX: 0,
    prevY: 0,
    lastTime: 0,
  });

  // Auto-start AR when component mounts
  useEffect(() => {
    if (!modelUrl) {
      alert("No 3D model URL provided.");
      navigate(-1);
      return;
    }

    if (deviceIsIOS) {
      // iOS: Use native Quick Look with USDZ
      const finalUsdz = usdzUrl || modelUrl.replace(/\.(glb|gltf)$/i, ".usdz");
      const link = document.createElement("a");
      link.setAttribute("rel", "ar");
      link.appendChild(document.createElement("img")); // dummy img required by iOS
      link.setAttribute("href", finalUsdz);
      link.click();
      setIsLoading(false);
      return;
    }

    // Android path continues as before
    const timer = setTimeout(() => {
      if (app.current.currentSession === null && isSupported) {
        showChair();
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [modelUrl, usdzUrl, deviceIsIOS, isSupported]);

  // === TOUCH HANDLERS (Android only) ===
  useEffect(() => {
    if (deviceIsIOS) return; // No touch controls on iOS

    const overlay = overlayRef.current;
    if (!overlay) return;

    const THROTTLE_MS = 16;

    const handleTouchStart = (e) => {
      if (!app.current.chair || !isPlaced || e.target.tagName === "BUTTON") return;
      const touch = e.touches[0];
      dragState.current = {
        isDragging: true,
        prevX: touch.clientX,
        prevY: touch.clientY,
        lastTime: Date.now(),
      };
    };

    const handleTouchMove = (e) => {
      if (!dragState.current.isDragging || !app.current.chair || !isPlaced) return;
      const now = Date.now();
      if (now - dragState.current.lastTime < THROTTLE_MS) return;
      dragState.current.lastTime = now;

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

    const handleTouchEnd = () => {
      dragState.current.isDragging = false;
    };

    overlay.addEventListener("touchstart", handleTouchStart, { passive: false });
    overlay.addEventListener("touchmove", handleTouchMove, { passive: false });
    overlay.addEventListener("touchend", handleTouchEnd);

    return () => {
      overlay.removeEventListener("touchstart", handleTouchStart);
      overlay.removeEventListener("touchmove", handleTouchMove);
      overlay.removeEventListener("touchend", handleTouchEnd);
    };
  }, [isPlaced, deviceIsIOS]);

  // === THREE.JS SETUP (Android only) ===
  useEffect(() => {
    if (deviceIsIOS) return; // Skip Three.js setup on iOS

    const container = containerRef.current;
    if (!container) return;

    const a = app.current;
    a.camera = new THREE.PerspectiveCamera(
      70,
      window.innerWidth / window.innerHeight,
      0.01,
      20
    );
    a.camera.position.set(0, 1.6, 0);
    a.scene = new THREE.Scene();

    const ambient = new THREE.HemisphereLight(
      0xffffff,
      0xbbbbff,
      isLowEnd.current ? 0.8 : 1
    );
    ambient.position.set(0.5, 1, 0.25);
    a.scene.add(ambient);

    a.renderer = new THREE.WebGLRenderer({
      antialias: !isLowEnd.current,
      alpha: true,
      powerPreference: isLowEnd.current ? "low-power" : "high-performance",
    });
    a.renderer.setPixelRatio(
      isLowEnd.current ? 1.0 : Math.min(window.devicePixelRatio, 2)
    );
    a.renderer.setSize(window.innerWidth, window.innerHeight);
    a.renderer.outputEncoding = THREE.sRGBEncoding;
    container.appendChild(a.renderer.domElement);

    a.reticle = new THREE.Mesh(
      new THREE.RingGeometry(0.15, 0.2, 32).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({
        color: 0xffffff,
        opacity: 0.7,
        transparent: true,
      })
    );
    a.reticle.matrixAutoUpdate = false;
    a.reticle.visible = false;
    a.scene.add(a.reticle);

    setupXR(a);
    setEnvironment(a);

    const resizeListener = () => resize(a);
    window.addEventListener("resize", resizeListener);

    return () => {
      window.removeEventListener("resize", resizeListener);
      if (a.renderer) {
        a.renderer.dispose();
        a.renderer.forceContextLoss();
      }
      if (container.contains(a.renderer?.domElement)) {
        container.removeChild(a.renderer.domElement);
      }
    };
  }, [deviceIsIOS]);

  const setEnvironment = (a) => {
    a.loadHDR = () => {
      if (a.hdrLoaded || isLowEnd.current) return;
      const loader = new RGBELoader();
      loader.setDataType(THREE.UnsignedByteType);
      loader.load(
        "https://cdn.jsdelivr.net/gh/mrdoob/three.js@r128/examples/textures/equirectangular/venice_sunset_1k.hdr",
        (texture) => {
          texture.mapping = THREE.EquirectangularReflectionMapping;
          a.scene.environment = texture;
          a.hdrLoaded = true;
        },
        undefined,
        (error) => console.warn("HDR Load Error:", error)
      );
    };
  };

  const resize = (a) => {
    a.camera.aspect = window.innerWidth / window.innerHeight;
    a.camera.updateProjectionMatrix();
    a.renderer.setSize(window.innerWidth, window.innerHeight);
  };

  const setupXR = (a) => {
    a.renderer.xr.enabled = true;
    a.currentSession = null;

    if ("xr" in navigator) {
      navigator.xr
        .isSessionSupported("immersive-ar")
        .then((supported) => {
          setIsSupported(supported);
        })
        .catch(() => setIsSupported(false));
    } else {
      setIsSupported(false);
    }

    a.hitTestSourceRequested = false;
    a.hitTestSource = null;
    a.isModelPlaced = false;
    a.reticleAppeared = false;
    a.setIsPlacedCallback = setIsPlaced;

    const onSelect = () => {
      if (!a.chair || a.isModelPlaced) return;
      if (a.reticle.visible) {
        const reticlePos = new THREE.Vector3();
        reticlePos.setFromMatrixPosition(a.reticle.matrix);

        a.chair.position.set(reticlePos.x, reticlePos.y, reticlePos.z);
        a.chair.updateMatrixWorld(true);

        const box = new THREE.Box3().setFromObject(a.chair);
        const bottomOffset = a.chair.position.y - box.min.y;
        a.chair.position.y = reticlePos.y + bottomOffset;

        a.chair.visible = true;
        a.reticle.visible = false;
        a.isModelPlaced = true;
        a.setIsPlacedCallback(true);
      }
    };

    a.controller = a.renderer.xr.getController(0);
    a.controller.addEventListener("select", onSelect);
    a.scene.add(a.controller);
  };

  const showChair = async () => {
    if (deviceIsIOS) return; // Already handled in useEffect
    const a = app.current;
    if (!modelUrl) return;
    try {
      await initAR(a);
    } catch (error) {
      console.error("Error in AR initialization:", error);
    }
  };

  const initAR = async (a) => {
    // ... (unchanged Android AR init code – omitted for brevity, same as original)
    // Keep everything from your original initAR, requestHitTestSource, getHitTestResults, render, loadModel, etc.
    // Only the iOS path is bypassed above.
    // Paste the rest of your original functions here unchanged:
    let currentSession = a.currentSession;
    const sessionInit = {
      requiredFeatures: ["hit-test"],
      optionalFeatures: ["dom-overlay"],
      domOverlay: { root: overlayRef.current },
    };

    const onSessionStarted = (session) => {
      session.addEventListener("end", onSessionEnded);
      a.renderer.xr.setReferenceSpaceType("local");
      a.renderer.xr.setSession(session);
      currentSession = session;
      a.currentSession = currentSession;

      setIsLoading(true);
      setLoadingProgress(0);
      setReticleReady(false);
      setIsPlaced(false);
      a.isModelPlaced = false;
      a.reticle.visible = false;
      a.hitTestSource = null;
      a.hitTestSourceRequested = false;
      a.reticleAppeared = false;

      a.loadHDR?.();
      requestHitTestSource(a);
      loadModel(a);
    };

    const onSessionEnded = () => {
      // ... same as original
      currentSession?.removeEventListener("end", onSessionEnded);
      currentSession = null;
      a.currentSession = null;
      if (a.progressInterval) clearInterval(a.progressInterval);
      if (a.chair) a.scene.remove(a.chair);
      a.renderer.setAnimationLoop(null);
      setIsLoading(false);
      setLoadingProgress(0);
      setReticleReady(false);
      setIsPlaced(false);
      a.isModelPlaced = false;
      a.reticle.visible = false;
      a.hitTestSource = null;
      a.hitTestSourceRequested = false;
      a.reticleAppeared = false;
    };

    if (currentSession === null) {
      try {
        const session = await navigator.xr.requestSession("immersive-ar", sessionInit);
        onSessionStarted(session);
      } catch (error) {
        console.error("XR Session Request Failed:", error);
        alert("Failed to start AR. Check device compatibility.");
        setIsSupported(false);
      }
    } else {
      currentSession.end();
    }
  };

  // Keep all your existing helper functions unchanged:
  const requestHitTestSource = (a) => { /* ... same as original */ };
  const getHitTestResults = (a, frame) => { /* ... same as original */ };
  const render = (a, timestamp, frame) => { /* ... same as original */ };
  const loadModel = (a) => { /* ... same as original GLTFLoader code */ };
  const rotateLeft = () => { if (app.current.chair && isPlaced) app.current.chair.rotation.y -= 0.3; };
  const rotateRight = () => { if (app.current.chair && isPlaced) app.current.chair.rotation.y += 0.3; };
  const placeAgain = () => { /* ... same as original */ };

  // Render
  return deviceIsIOS ? (
    // iOS: Show simple loading then auto-trigger Quick Look
    <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "#000", zIndex: 1000 }}>
      {isLoading && <LoadingBar progress={loadingProgress} />}
      <div style={{ color: "white", textAlign: "center", position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)" }}>
        Opening in AR...
      </div>
    </div>
  ) : (
    // Android: Original full WebXR experience
    <div ref={containerRef} style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", zIndex: 1000, touchAction: "none", background: "#000" }}>
      <div ref={overlayRef} style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 1001 }}>
        {isLoading && <LoadingBar progress={loadingProgress} />}
        {/* ... rest of your original overlay UI unchanged ... */}
        {!isPlaced && app.current.currentSession && reticleReady && (
          <div style={{ position: "absolute", top: "20px", left: "50%", transform: "translateX(-50%)", background: "rgba(0,0,0,0.8)", color: "#fff", padding: "12px 20px", borderRadius: "25px", fontSize: "14px", zIndex: 1002, pointerEvents: "none", textAlign: "center" }}>
            Tap on floor to place object
          </div>
        )}
        {isPlaced && (
          <>
            <div style={{ position: "absolute", bottom: "20px", left: "50%", transform: "translateX(-50%)", display: "flex", flexDirection: "row", gap: "15px", zIndex: 1002, pointerEvents: "auto" }}>
              <button onClick={rotateLeft} style={btnStyle}>Left</button>
              <button onClick={placeAgain} style={{ ...btnStyle, background: "#00796B" }}>Place Again</button>
              <button onClick={rotateRight} style={btnStyle}>Right</button>
            </div>
            <div style={{ position: "absolute", top: "20px", left: "50%", transform: "translateX(-50%)", background: "rgba(0,0,0,0.8)", color: "#fff", padding: "12px 20px", borderRadius: "25px", fontSize: "13px", zIndex: 1002, textAlign: "center", maxWidth: "90%", pointerEvents: "none" }}>
              Drag to rotate • Swipe to move
            </div>
          </>
        )}
        {!isSupported && (
          <div style={{ color: "white", textAlign: "center", position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", padding: "20px", background: "rgba(0,0,0,0.8)", borderRadius: "12px" }}>
            <h2>AR Not Supported</h2>
            <p>WebXR is not available on this device/browser.</p>
          </div>
        )}
      </div>
    </div>
  );
};

const btnStyle = {
  padding: "12px 24px",
  background: "rgba(255, 255 255, 255, 0.08)",
  color: "#ffffff",
  border: "none",
  borderRadius: "14px",
  backdropFilter: "blur(14px) saturate(180%)",
  WebkitBackdropFilter: "blur(14px) saturate(180%)",
  cursor: "pointer",
  fontSize: "15px",
  fontWeight: "600",
  boxShadow: "0 8px 24px rgba(0, 0, 0, 0.25), inset 0 1px 1px rgba(255, 255, 255, 0.2)",
  transition: "transform 0.1s ease, background 0.3s ease",
};

export default ARViewer;