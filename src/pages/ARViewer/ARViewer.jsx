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

// Detect low-end device
const isLowEndDevice = () => {
  const ua = navigator.userAgent;
  const ram = (navigator.deviceMemory || 4) <= 4;
  const isAndroidLow =
    /Android/i.test(ua) && (/SM-|M[0-9][0-9]/.test(ua) || ram);
  return ram || isAndroidLow;
};

const isIOS = () => /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

const isAndroid = () => /Android/.test(navigator.userAgent);

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
  const [showARLink, setShowARLink] = useState(false);
  const [instructionText, setInstructionText] = useState('Tap on floor to place object');

  const modelUrl = searchParams.get("model");

  const dragState = useRef({
    isDragging: false,
    prevX: 0,
    prevY: 0,
    lastTime: 0,
  });

  // Check support
  useEffect(() => {
    const checkSupport = async () => {
      if (modelUrl && modelUrl.toLowerCase().includes('.usdz')) {
        setIsSupported(isIOS());
      } else if (modelUrl && modelUrl.toLowerCase().includes('.glb')) {
        if ("xr" in navigator) {
          const supported = await navigator.xr.isSessionSupported("immersive-ar");
          setIsSupported(supported);
        } else {
          setIsSupported(false);
        }
      } else {
        setIsSupported(false);
      }
    };
    checkSupport();
  }, [modelUrl]);

  // Auto-start AR when component mounts and model is available
  useEffect(() => {
    if (!modelUrl) {
      alert("No 3D model URL provided.");
      navigate(-1);
      return;
    }

    const extension = modelUrl.toLowerCase().includes('.usdz') ? 'usdz' : modelUrl.toLowerCase().includes('.glb') ? 'glb' : 'unknown';

    if (extension === 'unknown') {
      alert("Unsupported model format.");
      navigate(-1);
      return;
    }

    const device = isIOS() ? 'ios' : isAndroid() ? 'android' : 'other';

    if (extension === 'usdz' && device !== 'ios') {
      alert(".usdz models are only supported on iOS devices.");
      navigate(-1);
      return;
    }

    if (extension === 'glb' && device !== 'ios') {  // Wait, earlier said !== 'android', but to enforce, yes
      alert(".glb models are only supported on Android devices.");
      navigate(-1);
      return;
    }

    if (extension === 'glb') {
      const timer = setTimeout(() => {
        if (app.current.currentSession === null && isSupported) {
          showChair();
        }
      }, 300);

      return () => clearTimeout(timer);
    } else if (extension === 'usdz') {
      setIsLoading(true);
      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        setLoadingProgress(progress);
        if (progress >= 100) {
          clearInterval(interval);
          setIsLoading(false);
          setReticleReady(true);
          setShowARLink(true);
          setInstructionText('Tap anywhere to view in AR');
        }
      }, 200);
      return () => clearInterval(interval);
    }
  }, [modelUrl, isSupported, navigate]);

  // === TOUCH HANDLERS ===
  useEffect(() => {
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
  }, [isPlaced]);

  // === THREE.JS SETUP ===
  useEffect(() => {
    if (!modelUrl || modelUrl.toLowerCase().includes('.usdz')) return;

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
  }, [modelUrl]);

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
          console.log("HDR Environment loaded");
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
          console.log("Immersive AR supported:", supported);
        })
        .catch((error) => {
          console.error("Error checking AR support:", error);
          setIsSupported(false);
        });
    } else {
      console.error("WebXR API not available");
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
        // Get exact position from reticle matrix
        const reticlePos = new THREE.Vector3();
        reticlePos.setFromMatrixPosition(a.reticle.matrix);

        // Position model at exact plane location first
        a.chair.position.set(reticlePos.x, reticlePos.y, reticlePos.z);
        
        // Force update to calculate accurate bounding box
        a.chair.updateMatrixWorld(true);
        
        // Get bounding box in world coordinates
        const box = new THREE.Box3().setFromObject(a.chair);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        
        // Calculate how much the model's bottom is offset from its position
        const bottomOffset = a.chair.position.y - box.min.y;
        
        // Adjust Y position so bottom touches the plane exactly
        // The formula: plane_y + (position_y - bottom_y) = plane_y + bottomOffset
        a.chair.position.y = reticlePos.y + bottomOffset;

        a.chair.visible = true;
        a.reticle.visible = false;
        a.isModelPlaced = true;
        a.setIsPlacedCallback(true);

        console.log("=== PLACEMENT DEBUG ===");
        console.log("Reticle (Plane) Y:", reticlePos.y.toFixed(4));
        console.log("Model Height:", size.y.toFixed(4));
        console.log("Bounding Box Min Y:", box.min.y.toFixed(4));
        console.log("Bottom Offset:", bottomOffset.toFixed(4));
        console.log("Final Model Y:", a.chair.position.y.toFixed(4));
        console.log("Model Bottom Y:", (a.chair.position.y - bottomOffset).toFixed(4));
        console.log("=======================");
      }
    };

    a.controller = a.renderer.xr.getController(0);
    a.controller.addEventListener("select", onSelect);
    a.scene.add(a.controller);
  };

  const showChair = async () => {
    const a = app.current;
    if (!modelUrl) {
      alert("No 3D model available.");
      return;
    }
    try {
      await initAR(a);
    } catch (error) {
      console.error("Error in AR initialization:", error);
    }
  };

  const initAR = async (a) => {
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

      // REQUEST HIT-TEST IMMEDIATELY
      requestHitTestSource(a);

      loadModel(a);
    };

    const onSessionEnded = () => {
      currentSession?.removeEventListener("end", onSessionEnded);
      currentSession = null;
      a.currentSession = null;
      
      // Clear progress interval if exists
      if (a.progressInterval) {
        clearInterval(a.progressInterval);
        a.progressInterval = null;
      }
      
      if (a.chair) {
        a.scene.remove(a.chair);
        a.chair = null;
      }
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
        throw error;
      }
    } else {
      currentSession.end();
    }
  };

  // REQUEST HIT-TEST AS SOON AS SESSION STARTS
  const requestHitTestSource = (a) => {
    const session = a.renderer.xr.getSession();
    if (!session || a.hitTestSourceRequested) return;

    a.hitTestSourceRequested = true;

    session.requestReferenceSpace("viewer").then((refSpace) => {
      session.requestHitTestSource({ space: refSpace }).then((source) => {
        a.hitTestSource = source;
        console.log("Hit-test source ready");
      }).catch((err) => {
        console.error("Hit-test source error:", err);
        a.hitTestSourceRequested = false;
      });
    }).catch((err) => {
      console.error("Reference space error:", err);
      a.hitTestSourceRequested = false;
    });

    const onEnd = () => {
      a.hitTestSourceRequested = false;
      a.hitTestSource = null;
      session.removeEventListener("end", onEnd);
    };
    session.addEventListener("end", onEnd);
  };

  const getHitTestResults = (a, frame) => {
    if (!a.hitTestSource || a.isModelPlaced) return;
    const results = frame.getHitTestResults(a.hitTestSource);
    if (results.length > 0) {
      const hit = results[0];
      const pose = hit.getPose(a.renderer.xr.getReferenceSpace());
      a.reticle.visible = true;
      a.reticle.matrix.fromArray(pose.transform.matrix);
      
      // Signal that reticle is ready
      if (!a.reticleAppeared) {
        a.reticleAppeared = true;
        
        // Clear progress interval if it exists
        if (a.progressInterval) {
          clearInterval(a.progressInterval);
          a.progressInterval = null;
        }
        
        setReticleReady(true);
        setLoadingProgress(100);
        
        // Hide loading bar after showing 100%
        setTimeout(() => {
          setIsLoading(false);
        }, 500);
        
        console.log("Reticle detected - ready to place");
      }
    } else {
      a.reticle.visible = false;
    }
  };

  const render = (a, timestamp, frame) => {
    if (frame) {
      if (a.hitTestSource) {
        getHitTestResults(a, frame);
      }
    }
    a.renderer.render(a.scene, a.camera);
  };

  const loadModel = (a) => {
    const loader = new GLTFLoader();
    let modelLoadProgress = 0;

    // Start smooth progress animation for reticle detection phase
    const startReticleProgressAnimation = () => {
      let progress = 70;
      const interval = setInterval(() => {
        if (a.reticleAppeared) {
          clearInterval(interval);
          return;
        }
        // Slowly increment from 70 to 95 while waiting for reticle
        if (progress < 95) {
          progress += 0.5;
          setLoadingProgress(Math.round(progress));
        }
      }, 100);
      
      // Store interval reference for cleanup
      a.progressInterval = interval;
    };

    loader.load(
      modelUrl,
      (gltf) => {
        const model = gltf.scene;
        a.scene.add(model);
        a.chair = model;
        a.chair.visible = false;

        // NO SCALING — Keep model at original imported size
        // (Assumes your .glb files are already authored in real-world meters)

        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());

        console.log("MODEL LOADED AT ORIGINAL SIZE (NO SCALING APPLIED)");
        console.log("Model File:", modelUrl.split("/").pop());
        console.log("Item Name:", new URLSearchParams(window.location.search).get("name") || "Unknown");
        console.log("Original Dimensions → Height:", size.y.toFixed(3) + "m");
        console.log("                              Width :", size.x.toFixed(3) + "m");
        console.log("                              Depth :", size.z.toFixed(3) + "m");
        console.log("Model placed at exact imported scale (1 unit = 1 meter)");
        console.log("===========================================");

        modelLoadProgress = 100;
        setLoadingProgress(70);
        
        // Start smooth animation while waiting for reticle
        startReticleProgressAnimation();

        a.renderer.setAnimationLoop((timestamp, frame) => render(a, timestamp, frame));
      },
      (xhr) => {
        if (xhr.total) {
          modelLoadProgress = Math.round((xhr.loaded / xhr.total) * 100);
          const progress = Math.round(modelLoadProgress * 0.7);
          setLoadingProgress(progress);
        }
      },
      (error) => {
        console.error("GLTF Load Error:", error);
        alert("Failed to load 3D model.");
        setLoadingProgress(0);
        setIsLoading(false);
      }
    );
  };

  const updateLoadingProgress = (a, modelProgress) => {
    // Show progress based on: 70% model load + 30% waiting for reticle
    if (a.reticleAppeared) {
      setLoadingProgress(100);
      // Hide loading bar after a brief moment to show 100%
      setTimeout(() => {
        setIsLoading(false);
      }, 500);
    } else {
      const progress = Math.min(70, (modelProgress * 0.7));
      setLoadingProgress(Math.round(progress));
    }
  };

  // === CONTROLS ===
  const rotateLeft = () => {
    if (app.current.chair && isPlaced) {
      app.current.chair.rotation.y -= 0.3;
    }
  };

  const rotateRight = () => {
    if (app.current.chair && isPlaced) {
      app.current.chair.rotation.y += 0.3;
    }
  };

  const placeAgain = () => {
    if (!app.current.chair) return;
    const a = app.current;
    
    // Clear any existing progress interval
    if (a.progressInterval) {
      clearInterval(a.progressInterval);
      a.progressInterval = null;
    }
    
    a.chair.visible = false;
    a.isModelPlaced = false;
    a.reticle.visible = false;
    a.hitTestSource = null;
    a.hitTestSourceRequested = false;
    a.reticleAppeared = false;
    setIsPlaced(false);
    setReticleReady(false);
    setIsLoading(true);
    setLoadingProgress(70);
    
    // Start smooth progress animation again
    let progress = 70;
    const interval = setInterval(() => {
      if (a.reticleAppeared) {
        clearInterval(interval);
        return;
      }
      if (progress < 95) {
        progress += 0.5;
        setLoadingProgress(Math.round(progress));
      }
    }, 100);
    a.progressInterval = interval;
    
    // Re-request hit-test immediately
    requestHitTestSource(a);
    console.log("Ready to place again – waiting for reticle");
  };

  return (
    <div
      ref={containerRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: 1000,
        touchAction: "none",
        background: "#000",
      }}
    >
      <div
        ref={overlayRef}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
          zIndex: 1001,
        }}
      >
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
              zIndex: 1002,
              pointerEvents: "none",
              textAlign: "center",
            }}
          >
            {instructionText}
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
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: "15px",
                zIndex: 1002,
                pointerEvents: "auto",
              }}
            >
              <button onClick={rotateLeft} style={btnStyle}>
                ◄ Left
              </button>
              <button onClick={placeAgain} style={{ ...btnStyle, background: "#00796B" }}>
                Place Again
              </button>
              <button onClick={rotateRight} style={btnStyle}>
                Right ►
              </button>
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
                zIndex: 1002,
                textAlign: "center",
                maxWidth: "90%",
                pointerEvents: "none",
                whiteSpace: "nowrap",
              }}
            >
              Drag to rotate • Swipe to move
            </div>
          </>
        )}

        {!isSupported && (
          <div
            style={{
              color: "white",
              textAlign: "center",
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              padding: "20px",
              background: "rgba(0,0,0,0.8)",
              borderRadius: "12px",
            }}
          >
            <h2>AR Not Supported</h2>
            <p>WebXR is not available on this device/browser.</p>
          </div>
        )}

        {showARLink && (
          <a
            rel="ar"
            href={modelUrl}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              zIndex: 1003,
              opacity: 0,
            }}
          />
        )}
      </div>
    </div>
  );
};

const btnStyle = {
  padding: "12px 24px",
  background: "rgba(255, 255, 255, 0.08)",
  color: "#ffffff",
  border: "none",
  borderRadius: "14px",
  backdropFilter: "blur(14px) saturate(180%)",
  WebkitBackdropFilter: "blur(14px) saturate(180%)",
  cursor: "pointer",
  fontSize: "15px",
  fontWeight: "600",
  whiteSpace: "nowrap",
  boxShadow: "0 8px 24px rgba(0, 0, 0, 0.25), inset 0 1px 1px rgba(255, 255, 255, 0.2)",
  pointerEvents: "auto",
  transition: "transform 0.1s ease, background 0.3s ease",
};

export default ARViewer;