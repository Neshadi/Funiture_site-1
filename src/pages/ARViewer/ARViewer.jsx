import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";
import { useParams, useNavigate } from "react-router-dom";

// Detect iOS more reliably, including iPadOS in desktop mode
const isIOS = (() => {
  const ua = navigator.userAgent;
  if (/iPad|iPhone|iPod/.test(ua)) return true;
  return navigator.maxTouchPoints && navigator.maxTouchPoints > 2 && /MacIntel/.test(navigator.platform);
})();

// Loading Bar
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
      textAlign: "center",
      color: "white",
      zIndex: 1002,
    }}
  >
    <div style={{ marginBottom: "10px" }}>Loading Model... {progress}%</div>
    <div style={{ width: "100%", height: "8px", background: "#333", borderRadius: "4px", overflow: "hidden" }}>
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

const isLowEndDevice = () => (navigator.deviceMemory || 4) <= 4;

const ARViewer = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const containerRef = useRef(null);
  const overlayRef = useRef(null);
  const [isSupported, setIsSupported] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [isPlaced, setIsPlaced] = useState(false);
  const [reticleReady, setReticleReady] = useState(false);

  const app = useRef({
    scene: null,
    renderer: null,
    camera: null,
    chair: null,
    reticle: null,
    currentSession: null,
    hitTestSource: null,
    isModelPlaced: false,
    reticleAppeared: false,
    progressInterval: null,
    hdrLoaded: false,
  });

  const isLowEnd = useRef(isLowEndDevice());

  if (!id) {
    alert("No item ID provided.");
    navigate(-1);
    return null;
  }

  const glbUrl = `/models/${id}.glb`;
  const usdzUrl = `/models/${id}.usdz`;
  const previewUrl = `/models/${id}-preview.jpg`;

  // ==================== iOS Quick Look ====================
  if (isIOS) {
    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "#000",
          color: "#fff",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px",
          textAlign: "center",
        }}
      >
        <p style={{ fontSize: "18px", marginBottom: "30px" }}>Tap below to view in AR</p>
        <a rel="ar" href={usdzUrl}>
          <img
            src={previewUrl}
            alt="AR Preview"
            onError={(e) => (e.target.style.display = "none")}
            style={{
              width: "300px",
              height: "300px",
              objectFit: "contain",
              borderRadius: "16px",
              boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
            }}
          />
        </a>
        <button
          onClick={() => navigate(-1)}
          style={{
            marginTop: "40px",
            padding: "12px 28px",
            background: "#333",
            color: "white",
            border: "none",
            borderRadius: "12px",
            fontSize: "16px",
          }}
        >
          Go Back
        </button>
      </div>
    );
  }

  // ==================== Cleanup on ID change ====================
  useEffect(() => {
    return () => {
      const a = app.current;
      if (a.chair) a.scene?.remove(a.chair);
      if (a.progressInterval) clearInterval(a.progressInterval);
      setIsLoading(true);
      setLoadingProgress(0);
      setIsPlaced(false);
      setReticleReady(false);
      a.isModelPlaced = false;
      a.reticleAppeared = false;
      a.reticle && (a.reticle.visible = false);
    };
  }, [id]);

  // ==================== Three.js Setup (once) ====================
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const a = app.current;

    a.camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 20);
    a.camera.position.set(0, 1.6, 0);

    a.scene = new THREE.Scene();
    a.scene.add(new THREE.HemisphereLight(0xffffff, 0xbbbbff, isLowEnd.current ? 0.8 : 1));

    a.renderer = new THREE.WebGLRenderer({
      antialias: !isLowEnd.current,
      alpha: true,
      powerPreference: isLowEnd.current ? "low-power" : "high-performance",
    });
    a.renderer.setPixelRatio(isLowEnd.current ? 1 : Math.min(window.devicePixelRatio, 2));
    a.renderer.setSize(window.innerWidth, window.innerHeight);
    a.renderer.outputEncoding = THREE.sRGBEncoding;
    a.renderer.xr.enabled = true;
    container.appendChild(a.renderer.domElement);

    a.reticle = new THREE.Mesh(
      new THREE.RingGeometry(0.15, 0.2, 32).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({ color: 0xffffff, opacity: 0.7, transparent: true })
    );
    a.reticle.matrixAutoUpdate = false;
    a.reticle.visible = false;
    a.scene.add(a.reticle);

    if ("xr" in navigator) {
      navigator.xr.isSessionSupported("immersive-ar").then(setIsSupported);
    } else {
      setIsSupported(false);
    }

    // HDR Environment
    new RGBELoader()
      .setDataType(THREE.UnsignedByteType)
      .load(
        "https://cdn.jsdelivr.net/gh/mrdoob/three.js@r128/examples/textures/equirectangular/venice_sunset_1k.hdr",
        (tex) => {
          tex.mapping = THREE.EquirectangularReflectionMapping;
          a.scene.environment = tex;
          a.hdrLoaded = true;
        }
      );

    const onResize = () => {
      a.camera.aspect = window.innerWidth / window.innerHeight;
      a.camera.updateProjectionMatrix();
      a.renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      a.renderer?.dispose();
      container.contains(a.renderer.domElement) && container.removeChild(a.renderer.domElement);
    };
  }, []);

  // ==================== Start AR Session & Load Model ====================
  useEffect(() => {
    if (!isSupported) return;

    const start = async () => {
      const a = app.current;
      try {
        // Critical fix: Add "local-floor" as optional feature
        const session = await navigator.xr.requestSession("immersive-ar", {
          requiredFeatures: ["hit-test"],
          optionalFeatures: ["dom-overlay", "local-floor"], // ← This fixes the error
          domOverlay: { root: overlayRef.current },
        });

        // Use local-floor for better floor alignment
        a.renderer.xr.setReferenceSpaceType("local-floor");
        a.renderer.xr.setSession(session);
        a.currentSession = session;

        setIsLoading(true);
        setLoadingProgress(0);
        setIsPlaced(false);
        setReticleReady(false);
        a.isModelPlaced = false;
        a.reticle.visible = false;
        a.reticleAppeared = false;

        // Request hit-test source
        session.requestReferenceSpace("viewer").then((refSpace) => {
          session.requestHitTestSource({ space: refSpace }).then((source) => {
            a.hitTestSource = source;
          });
        });

        // Load GLB model from local public/models/
        const loader = new GLTFLoader();
        let prog = 0;
        const interval = setInterval(() => {
          if (a.reticleAppeared) {
            clearInterval(interval);
          } else if (prog < 95) {
            setLoadingProgress(Math.round(++prog));
          }
        }, 100);
        a.progressInterval = interval;

        loader.load(
          glbUrl,
          (gltf) => {
            if (a.chair) a.scene.remove(a.chair);
            a.chair = gltf.scene;
            a.scene.add(a.chair);
            a.chair.visible = false;
            setLoadingProgress(70);
            console.log("Model loaded:", glbUrl);
          },
          (xhr) => {
            if (xhr.total) setLoadingProgress(Math.round((xhr.loaded / xhr.total) * 70));
          },
          (err) => {
            console.error("Model load failed:", err);
            alert(`Failed to load model.\nFile should be at: ${glbUrl}`);
            setIsLoading(false);
          }
        );

        session.addEventListener("end", () => {
          a.currentSession = null;
          a.renderer.setAnimationLoop(null);
          setIsLoading(false);
          setIsPlaced(false);
        });
      } catch (err) {
        console.error("AR session failed:", err);
        alert("AR not supported or failed to start.");
        setIsSupported(false);
      }
    };

    start();
  }, [id, isSupported]);

  // ==================== Animation Loop ====================
  useEffect(() => {
    const a = app.current;
    if (!a.renderer) return;

    a.renderer.setAnimationLoop((_, frame) => {
      if (!frame || !a.hitTestSource || a.isModelPlaced) {
        a.renderer.render(a.scene, a.camera);
        return;
      }

      const hits = frame.getHitTestResults(a.hitTestSource);
      if (hits.length > 0) {
        const pose = hits[0].getPose(a.renderer.xr.getReferenceSpace());
        a.reticle.visible = true;
        a.reticle.matrix.fromArray(pose.transform.matrix);

        if (!a.reticleAppeared) {
          a.reticleAppeared = true;
          clearInterval(a.progressInterval);
          setReticleReady(true);
          setLoadingProgress(100);
          setTimeout(() => setIsLoading(false), 500);
        }
      } else {
        a.reticle.visible = false;
      }

      a.renderer.render(a.scene, a.camera);
    });
  }, []);

  // ==================== Place Model on Tap ====================
  useEffect(() => {
    const a = app.current;
    const controller = a.renderer.xr.getController(0);
    const handler = () => {
      if (!a.reticle.visible || a.isModelPlaced || !a.chair) return;

      const pos = new THREE.Vector3().setFromMatrixPosition(a.reticle.matrix);
      a.chair.position.copy(pos);
      a.chair.updateMatrixWorld(true);

      const box = new THREE.Box3().setFromObject(a.chair);
      a.chair.position.y += pos.y - box.min.y; // Align bottom to floor

      a.chair.visible = true;
      a.reticle.visible = false;
      a.isModelPlaced = true;
      setIsPlaced(true);
    };
    controller.addEventListener("select", handler);
    a.scene.add(controller);

    return () => controller.removeEventListener("select", handler);
  }, []);

  // Controls
  const rotateLeft = () => app.current.chair && (app.current.chair.rotation.y -= 0.3);
  const rotateRight = () => app.current.chair && (app.current.chair.rotation.y += 0.3);

  const placeAgain = () => {
    const a = app.current;
    a.chair.visible = false;
    a.isModelPlaced = false;
    a.reticle.visible = false;
    a.reticleAppeared = false;
    setIsPlaced(false);
    setReticleReady(false);
    setIsLoading(true);
    setLoadingProgress(70);

    a.currentSession?.requestReferenceSpace("viewer").then((refSpace) => {
      a.currentSession.requestHitTestSource({ space: refSpace }).then((source) => {
        a.hitTestSource = source;
      });
    });
  };

  return (
    <div ref={containerRef} style={{ position: "fixed", inset: 0, background: "#000" }}>
      <div ref={overlayRef} style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 1001 }}>
        {isLoading && <LoadingBar progress={loadingProgress} />}

        {!isPlaced && reticleReady && (
          <div
            style={{
              position: "absolute",
              top: "20px",
              left: "50%",
              transform: "translateX(-50%)",
              background: "rgba(0,0,0,0.8)",
              color: "#fff",
              padding: "12px 20px",
              borderRadius: "25px",
              fontSize: "14px",
            }}
          >
            Tap floor to place object
          </div>
        )}

        {isPlaced && (
          <>
            <div
              style={{
                position: "absolute",
                bottom: "20px",
                left: "50%",
                transform: "translateX(-50%)",
                display: "flex",
                gap: "15px",
                pointerEvents: "auto",
              }}
            >
              <button onClick={rotateLeft} style={btnStyle}>◄ Left</button>
              <button onClick={placeAgain} style={{ ...btnStyle, background: "#00796B" }}>Place Again</button>
              <button onClick={rotateRight} style={btnStyle}>Right ►</button>
            </div>
            <div
              style={{
                position: "absolute",
                top: "20px",
                left: "50%",
                transform: "translateX(-50%)",
                background: "rgba(0,0,0,0.8)",
                color: "#fff",
                padding: "12px 20px",
                borderRadius: "25px",
                fontSize: "13px",
              }}
            >
              Drag to rotate • Swipe to move
            </div>
          </>
        )}

        {!isSupported && (
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              background: "rgba(0,0,0,0.8)",
              color: "white",
              padding: "20px",
              borderRadius: "12px",
              textAlign: "center",
            }}
          >
            <h2>AR Not Supported</h2>
            <p>Use Chrome on an Android device with AR support</p>
          </div>
        )}
      </div>
    </div>
  );
};

const btnStyle = {
  padding: "12px 24px",
  background: "rgba(255,255,255,0.08)",
  color: "#fff",
  border: "none",
  borderRadius: "14px",
  backdropFilter: "blur(14px)",
  WebkitBackdropFilter: "blur(14px)",
  fontSize: "15px",
  fontWeight: "600",
  cursor: "pointer",
  boxShadow: "0 8px 24px rgba(0,0,0,0.25)",
};

export default ARViewer;