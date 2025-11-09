import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";
import { useSearchParams } from "react-router-dom";
import LoadingBar from "../../components/ARView/LoadingBar.jsx";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

const ARViewer = () => {
  const containerRef = useRef();
  const [searchParams] = useSearchParams();
  const [isSupported, setIsSupported] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const app = useRef({});

  // ✅ Texture for the wall surface
  const textureUrl = searchParams.get("texture") || "/assets/walls/wall_texture.jpg";

  // ✅ Small GLB model (safe + fast)
  const MODEL_URL =
    "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/Cube/glTF-Binary/Cube.glb";

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const a = app.current;
    a.camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 20);
    a.scene = new THREE.Scene();

    const ambient = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
    a.scene.add(ambient);

    a.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    a.renderer.setPixelRatio(window.devicePixelRatio);
    a.renderer.setSize(window.innerWidth, window.innerHeight);
    a.renderer.outputEncoding = THREE.sRGBEncoding;
    container.appendChild(a.renderer.domElement);

    // Setup environment, reticle, XR
    loadModel(a);
    setupReticle(a);
    setupXR(a);

    const resizeListener = () => resize(a);
    window.addEventListener("resize", resizeListener);

    return () => {
      window.removeEventListener("resize", resizeListener);
      a.renderer.dispose();
      container.removeChild(a.renderer.domElement);
    };
  }, []);

  // ✅ Load 3D model safely
  const loadModel = (a) => {
    const loader = new GLTFLoader();
    setIsLoading(true);
    loader.load(
      MODEL_URL,
      (gltf) => {
        a.model = gltf.scene;
        a.model.scale.set(0.5, 0.5, 0.05); // flat like wall
        a.model.position.set(0, 0, -1);
        a.scene.add(a.model);
        console.log("✅ Model loaded successfully");
        setLoadingProgress(50);
        loadTexture(a); // load texture next
      },
      (xhr) => {
        if (xhr.total) {
          setLoadingProgress(Math.round((xhr.loaded / xhr.total) * 50));
        }
      },
      (error) => {
        console.error("❌ Model load failed:", error);
        alert("Failed to load model. Please refresh.");
        setIsLoading(false);
      }
    );
  };

  // ✅ Load wall texture and apply to model
  const loadTexture = (a) => {
    const loader = new THREE.TextureLoader();
    loader.load(
      textureUrl,
      (texture) => {
        a.wallTexture = texture;

        // Apply texture if model is ready
        if (a.model) {
          a.model.traverse((child) => {
            if (child.isMesh) {
              child.material = new THREE.MeshBasicMaterial({ map: texture });
            }
          });
        }

        setLoadingProgress(100);
        setTimeout(() => setIsLoading(false), 500);
        console.log("✅ Wall texture applied");
      },
      (xhr) => {
        if (xhr.total) {
          const percent = 50 + (xhr.loaded / xhr.total) * 50;
          setLoadingProgress(Math.round(percent));
        }
      },
      (error) => {
        console.error("❌ Texture Load Error:", error);
        alert("Failed to load wall texture.");
        setIsLoading(false);
      }
    );
  };

  // ✅ Create reticle for surface detection
  const setupReticle = (a) => {
    a.reticle = new THREE.Mesh(
      new THREE.RingGeometry(0.15, 0.2, 32).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({ color: 0x00ff00 })
    );
    a.reticle.matrixAutoUpdate = false;
    a.reticle.visible = false;
    a.scene.add(a.reticle);
  };

  // ✅ Adjust renderer on window resize
  const resize = (a) => {
    a.camera.aspect = window.innerWidth / window.innerHeight;
    a.camera.updateProjectionMatrix();
    a.renderer.setSize(window.innerWidth, window.innerHeight);
  };

  // ✅ Setup XR
  const setupXR = (a) => {
    a.renderer.xr.enabled = true;
    a.currentSession = null;

    if ("xr" in navigator) {
      navigator.xr.isSessionSupported("immersive-ar").then(setIsSupported);
    } else setIsSupported(false);

    a.hitTestSourceRequested = false;
    a.hitTestSource = null;

    const onSelect = () => {
      if (!a.wallTexture || !a.model) {
        console.warn("Model or texture not ready yet.");
        return;
      }
      if (a.reticle.visible) {
        placeWallTexture(a);
      } else {
        console.warn("No surface detected.");
      }
    };

    a.controller = a.renderer.xr.getController(0);
    a.controller.addEventListener("select", onSelect);
    a.scene.add(a.controller);
  };

  // ✅ Start AR
  const startAR = async () => {
    const a = app.current;
    if (!isSupported) {
      alert("AR not supported on this device.");
      return;
    }

    try {
      const sessionInit = {
        requiredFeatures: ["hit-test", "dom-overlay"],
        optionalFeatures: ["planes"],
        domOverlay: { root: document.body },
      };

      const session = await navigator.xr.requestSession("immersive-ar", sessionInit);
      onSessionStarted(a, session);
    } catch (error) {
      console.error("XR Session Request Failed:", error);
      alert("Failed to start AR session.");
    }
  };

  // ✅ On AR session start
  const onSessionStarted = (a, session) => {
    session.addEventListener("end", () => onSessionEnded(a));

    a.renderer.xr.setReferenceSpaceType("local");
    a.renderer.xr.setSession(session);
    a.currentSession = session;

    a.renderer.setAnimationLoop((timestamp, frame) => render(a, timestamp, frame));
  };

  // ✅ On AR session end
  const onSessionEnded = (a) => {
    a.currentSession = null;
    a.hitTestSourceRequested = false;
    a.hitTestSource = null;
    a.renderer.setAnimationLoop(null);
  };

  // ✅ Request hit test source
  const requestHitTestSource = (a) => {
    const session = a.renderer.xr.getSession();
    session.requestReferenceSpace("viewer").then((referenceSpace) => {
      session.requestHitTestSource({ space: referenceSpace }).then((source) => {
        a.hitTestSource = source;
      });
    });
    session.addEventListener("end", () => {
      a.hitTestSourceRequested = false;
      a.hitTestSource = null;
    });
    a.hitTestSourceRequested = true;
  };

  // ✅ Detect vertical plane & show reticle
  const getHitTestResults = (a, frame) => {
    const hitTestResults = frame.getHitTestResults(a.hitTestSource);
    if (hitTestResults.length) {
      const referenceSpace = a.renderer.xr.getReferenceSpace();
      const hit = hitTestResults[0];
      const pose = hit.getPose(referenceSpace);

      const normal = new THREE.Vector3(0, 0, 1).applyQuaternion(
        new THREE.Quaternion().fromArray(pose.transform.orientation)
      );

      if (Math.abs(normal.y) < 0.5) {
        a.reticle.visible = true;
        a.reticle.matrix.fromArray(pose.transform.matrix);
      } else {
        a.reticle.visible = false;
      }
    } else {
      a.reticle.visible = false;
    }
  };

  // ✅ Place model (textured wall) at reticle
  const placeWallTexture = (a) => {
    const clone = a.model.clone();
    clone.position.setFromMatrixPosition(a.reticle.matrix);
    clone.lookAt(a.camera.position);
    a.scene.add(clone);
    console.log("🧱 Wall texture placed:", clone.position);
  };

  // ✅ Render loop
  const render = (a, timestamp, frame) => {
    if (frame) {
      if (!a.hitTestSourceRequested) requestHitTestSource(a);
      if (a.hitTestSource) getHitTestResults(a, frame);
    }
    a.renderer.render(a.scene, a.camera);
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
      }}
    >
      {isLoading && <LoadingBar progress={loadingProgress} />}

      {isSupported ? (
        <button
          style={{
            position: "absolute",
            bottom: "20px",
            left: "50%",
            transform: "translateX(-50%)",
            padding: "10px 20px",
            background: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
            display: isLoading ? "none" : "block",
          }}
          onClick={startAR}
        >
          Start AR View
        </button>
      ) : (
        <p style={{ color: "white", textAlign: "center", marginTop: "50%" }}>
          AR is not supported on this device.
        </p>
      )}
    </div>
  );
};

export default ARViewer;
