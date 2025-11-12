import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";
import { useSearchParams } from "react-router-dom";
import LoadingBar from "../../components/ARView/LoadingBar.jsx";

// Detect low-end device
const isLowEndDevice = () => {
  const ua = navigator.userAgent;
  const ram = (navigator.deviceMemory || 4) <= 4;
  const isAndroidLow = /Android/i.test(ua) && (/SM-|M[0-9][0-9]/.test(ua) || ram);
  return ram || isAndroidLow;
};

const ARViewer = () => {
  const containerRef = useRef();
  const [searchParams] = useSearchParams();
  const [isSupported, setIsSupported] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [isPlaced, setIsPlaced] = useState(false);
  const app = useRef({});
  const isLowEnd = useRef(isLowEndDevice());

  const modelUrl = searchParams.get("model");

  // Drag state
  const dragState = useRef({
    isDragging: false,
    prevX: 0,
    prevY: 0,
    lastTime: 0,
  });

  // === TOUCH HANDLERS: Drag to Move + Rotate Y ===
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let lastTouchTime = 0;
    const THROTTLE_MS = 16;

    const handleTouchStart = (e) => {
      if (!app.current.chair || !isPlaced) return;
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
      const camera = app.current.camera;

      // Rotate Y (left/right)
      chair.rotation.y += deltaX * 0.01;

      // Move on ground plane (X/Z)
      const forward = new THREE.Vector3();
      camera.getWorldDirection(forward);
      forward.y = 0;
      forward.normalize();

      const right = new THREE.Vector3();
      right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

      chair.position.addScaledVector(forward, -deltaY * 0.002);
      chair.position.addScaledVector(right, deltaX * 0.002);

      dragState.current.prevX = touch.clientX;
      dragState.current.prevY = touch.clientY;
    };

    const handleTouchEnd = () => {
      dragState.current.isDragging = false;
    };

    container.addEventListener("touchstart", handleTouchStart, { passive: false });
    container.addEventListener("touchmove", handleTouchMove, { passive: false });
    container.addEventListener("touchend", handleTouchEnd);

    return () => {
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
      container.removeEventListener("touchend", handleTouchEnd);
    };
  }, [isPlaced]);

  // === THREE.JS SETUP ===
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const a = app.current;
    a.assetsPath = "/assets/ar-shop/";
    a.camera = new THREE.PerspectiveCamera(
      70,
      window.innerWidth / window.innerHeight,
      0.01,
      20
    );
    a.camera.position.set(0, 1.6, 0);
    a.scene = new THREE.Scene();

    // Light
    const ambient = new THREE.HemisphereLight(0xffffff, 0xbbbbff, isLowEnd.current ? 0.8 : 1);
    ambient.position.set(0.5, 1, 0.25);
    a.scene.add(ambient);

    // Renderer
    a.renderer = new THREE.WebGLRenderer({
      antialias: !isLowEnd.current,
      alpha: true,
      powerPreference: isLowEnd.current ? "low-power" : "high-performance",
    });
    a.renderer.setPixelRatio(isLowEnd.current ? 1.0 : Math.min(window.devicePixelRatio, 2));
    a.renderer.setSize(window.innerWidth, window.innerHeight);
    a.renderer.outputEncoding = THREE.sRGBEncoding;
    container.appendChild(a.renderer.domElement);

    // Reticle
    a.reticle = new THREE.Mesh(
      new THREE.RingGeometry(0.15, 0.2, 32).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({ color: 0xffffff, opacity: 0.7, transparent: true })
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
  }, []);

  const setEnvironment = (a) => {
    a.loadHDR = () => {
      if (a.hdrLoaded || isLowEnd.current) return;
      const loader = new RGBELoader().setPath("/assets/");
      loader.setDataType(THREE.UnsignedByteType);
      loader.load(
        "hdr/venice_sunset_1k.hdr",
        (texture) => {
          texture.mapping = THREE.EquirectangularReflectionMapping;
          a.scene.environment = texture;
          a.hdrLoaded = true;
        },
        undefined,
        (error) => console.error("HDR Load Error:", error)
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

    const onSelect = () => {
      if (a.chair === undefined || isPlaced) return;
      if (a.reticle.visible) {
        a.chair.position.setFromMatrixPosition(a.reticle.matrix);
        a.chair.visible = true;
        setIsPlaced(true);
        a.reticle.visible = false;
        setIsLoading(false);
      }
    };

    a.controller = a.renderer.xr.getController(0);
    a.controller.addEventListener("select", onSelect);
    a.scene.add(a.controller);
  };

  const showChair = async () => {
    const a = app.current;
    if (!modelUrl) {
      alert("No 3D model available for this product.");
      return;
    }
    try {
      await initAR(a);
    } catch (error) {
      console.error("AR init failed:", error);
    }
  };

  const initAR = async (a) => {
    let currentSession = a.currentSession;
    const sessionInit = { requiredFeatures: ["hit-test"] };

    const onSessionStarted = (session) => {
      session.addEventListener("end", onSessionEnded);
      a.renderer.xr.setReferenceSpaceType("local");
      a.renderer.xr.setSession(session);
      a.currentSession = session;
      setIsLoading(true);
      setIsPlaced(false);

      a.loadHDR?.();
      loadModel(a);
    };

    const onSessionEnded = () => {
      a.currentSession = null;
      if (a.chair) {
        a.scene.remove(a.chair);
        a.chair = null;
      }
      a.renderer.setAnimationLoop(null);
      setIsLoading(false);
      setLoadingProgress(0);
      setIsPlaced(false);
    };

    if (!currentSession) {
      try {
        const session = await navigator.xr.requestSession("immersive-ar", sessionInit);
        onSessionStarted(session);
      } catch (error) {
        alert("Failed to start AR. Check device compatibility.");
        setIsSupported(false);
      }
    } else {
      currentSession.end();
    }
  };

  const loadModel = (a) => {
    const loader = new GLTFLoader();
    setLoadingProgress(0);

    loader.load(
      modelUrl,
      (gltf) => {
        const model = gltf.scene;
        a.scene.add(model);
        a.chair = model;
        a.chair.visible = false;

        if (!isLowEnd.current) {
          model.traverse((child) => {
            if (child.isMesh && child.material) {
              child.material.envMapIntensity = 1.0;
              if (child.material.map) child.material.map.anisotropy = 1;
            }
          });

          const box = new THREE.Box3().setFromObject(model);
          const size = box.getSize(new THREE.Vector3());
          const maxDim = Math.max(size.x, size.y, size.z);
          const scale = maxDim > 2 ? 1 / maxDim : 1;
          model.scale.setScalar(scale);
        } else {
          model.scale.set(0.5, 0.5, 0.5);
        }

        a.renderer.setAnimationLoop((timestamp, frame) => render(a, timestamp, frame));
        setLoadingProgress(100);
      },
      (xhr) => {
        if (xhr.total) setLoadingProgress(Math.round((xhr.loaded / xhr.total) * 100));
      },
      (error) => {
        console.error("GLTF Load Error:", error);
        alert("Failed to load 3D model.");
        setLoadingProgress(0);
        setIsLoading(false);
      }
    );
  };

  const requestHitTestSource = (a) => {
    const session = a.renderer.xr.getSession();
    if (!session || a.hitTestSourceRequested || isPlaced) return;
    session.requestReferenceSpace("viewer").then((refSpace) => {
      session.requestHitTestSource({ space: refSpace }).then((source) => {
        a.hitTestSource = source;
      });
    });
    a.hitTestSourceRequested = true;
  };

  const getHitTestResults = (a, frame) => {
    if (!a.hitTestSource || isPlaced) return;
    const results = frame.getHitTestResults(a.hitTestSource);
    if (results.length > 0) {
      const hit = results[0];
      const pose = hit.getPose(a.renderer.xr.getReferenceSpace());
      a.reticle.visible = true;
      a.reticle.matrix.fromArray(pose.transform.matrix);
      if (loadingProgress === 100) setIsLoading(false);
    } else {
      a.reticle.visible = false;
    }
  };

  const render = (a, timestamp, frame) => {
    if (frame) {
      if (!a.hitTestSourceRequested && !isPlaced) requestHitTestSource(a);
      if (a.hitTestSource) getHitTestResults(a, frame);
    }
    a.renderer.render(a.scene, a.camera);
  };

  // === CONTROL FUNCTIONS ===
  const rotateLeft = () => {
    if (app.current.chair && isPlaced) {
      app.current.chair.rotation.y += Math.PI / 6; // 30° per tap
    }
  };

  const rotateRight = () => {
    if (app.current.chair && isPlaced) {
      app.current.chair.rotation.y -= Math.PI / 6; // 30° per tap
    }
  };

  const placeAgain = () => {
    setIsPlaced(false);
    if (app.current.chair) {
      app.current.chair.visible = false;
    }
    setIsLoading(true);
    const a = app.current;
    a.hitTestSourceRequested = false;
    a.hitTestSource = null;
  };

  return (
    <div
      ref={containerRef}
      style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", zIndex: 1000, touchAction: "none" }}
    >
      {isLoading && <LoadingBar progress={loadingProgress} />}

      {isSupported && !app.current.currentSession && (
        <button
          style={{
            position: "absolute",
            bottom: "20px",
            left: "50%",
            transform: "translateX(-50%)",
            padding: "12px 24px",
            background: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontSize: "16px",
            zIndex: 1001,
            display: isLoading ? "none" : "block",
          }}
          onClick={showChair}
        >
          Start AR View
        </button>
      )}

      {/* CONTROL BUTTONS - ALWAYS VISIBLE AFTER PLACEMENT */}
      {isPlaced && (
        <>
          <div
            style={{
              position: "absolute",
              bottom: "20px",
              left: "50%",
              transform: "translateX(-50%)",
              display: "flex",
              gap: "12px",
              zIndex: 1001,
            }}
          >
            <button onClick={rotateLeft} style={btnStyle}>Rotate Left</button>
            <button onClick={placeAgain} style={{ ...btnStyle, background: "#28a745" }}>
              Place Again
            </button>
            <button onClick={rotateRight} style={btnStyle}>Rotate Right</button>
          </div>

          <div
            style={{
              position: "absolute",
              top: "20px",
              left: "50%",
              transform: "translateX(-50%)",
              background: "rgba(0,0,0,0.7)",
              color: "#fff",
              padding: "10px 18px",
              borderRadius: "30px",
              fontSize: "14px",
              zIndex: 1001,
            }}
          >
            Drag to move & rotate • Tap buttons for control
          </div>
        </>
      )}

      {!isSupported && (
        <p style={{ color: "white", textAlign: "center", marginTop: "50%" }}>
          AR is not supported on this device.
        </p>
      )}
    </div>
  );
};

const btnStyle = {
  padding: "10px 16px",
  background: "#007bff",
  color: "white",
  border: "none",
  borderRadius: "8px",
  cursor: "pointer",
  fontSize: "14px",
  fontWeight: "600",
};

export default ARViewer;