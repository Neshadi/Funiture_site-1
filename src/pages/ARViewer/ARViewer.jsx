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

  // Get texture URL from query params (?texture=...)
  const textureUrl = searchParams.get("texture") || "/assets/walls/wall_texture.jpg";

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

    setEnvironment(a);
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

  const MODEL_URL = "https://modelviewer.dev/shared-assets/models/Astronaut.glb"; // or "/models/Cube.glb"

  // Load HDR environment
  const setEnvironment = (a) => {
    const loader = new GLTFLoader();
      loader.load(MODEL_URL, (gltf) => {
      const model = gltf.scene;
      model.scale.set(0.5, 0.5, 0.5); // adjust scale
      model.position.set(0, 0, -1); // place it in front
      scene.add(model);
    });
  };

  // Create reticle for plane detection
  const setupReticle = (a) => {
    a.reticle = new THREE.Mesh(
      new THREE.RingGeometry(0.15, 0.2, 32).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({ color: 0x00ff00 })
    );
    a.reticle.matrixAutoUpdate = false;
    a.reticle.visible = false;
    a.scene.add(a.reticle);
  };

  // Adjust renderer on resize
  const resize = (a) => {
    a.camera.aspect = window.innerWidth / window.innerHeight;
    a.camera.updateProjectionMatrix();
    a.renderer.setSize(window.innerWidth, window.innerHeight);
  };

  // Setup XR session support
  const setupXR = (a) => {
    a.renderer.xr.enabled = true;
    a.currentSession = null;

    if ("xr" in navigator) {
      navigator.xr.isSessionSupported("immersive-ar").then((supported) => {
        setIsSupported(supported);
      });
    } else {
      setIsSupported(false);
    }

    a.hitTestSourceRequested = false;
    a.hitTestSource = null;

    const onSelect = () => {
      if (!a.wallTexture) {
        console.warn("No texture loaded yet");
        return;
      }
      if (a.reticle.visible) {
        placeWallTexture(a);
      } else {
        console.warn("No surface detected");
      }
    };

    a.controller = a.renderer.xr.getController(0);
    a.controller.addEventListener("select", onSelect);
    a.scene.add(a.controller);
  };

  // Start AR session
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
        domOverlay: { root: document.body }
      };

      const session = await navigator.xr.requestSession("immersive-ar", sessionInit);
      onSessionStarted(a, session);
    } catch (error) {
      console.error("XR Session Request Failed:", error);
      alert("Failed to start AR session.");
    }
  };

  const onSessionStarted = (a, session) => {
    session.addEventListener("end", () => onSessionEnded(a));

    a.renderer.xr.setReferenceSpaceType("local");
    a.renderer.xr.setSession(session);
    a.currentSession = session;

    setIsLoading(true);
    loadTexture(a);

    a.renderer.setAnimationLoop((timestamp, frame) => render(a, timestamp, frame));
  };

  const onSessionEnded = (a) => {
    if (a.currentSession) {
      a.currentSession.removeEventListener("end", onSessionEnded);
      a.currentSession = null;
    }
    a.hitTestSourceRequested = false;
    a.hitTestSource = null;
    a.renderer.setAnimationLoop(null);
    setIsLoading(false);
    setLoadingProgress(0);
  };

  // Load wall texture
  const loadTexture = (a) => {
    const loader = new THREE.TextureLoader();
    loader.load(
      textureUrl,
      (texture) => {
        a.wallTexture = texture;
        setLoadingProgress(100);
        setIsLoading(false);
        console.log("✅ Wall texture loaded:", textureUrl);
      },
      (xhr) => {
        if (xhr.total) {
          const percent = (xhr.loaded / xhr.total) * 100;
          setLoadingProgress(Math.round(percent));
        }
      },
      (error) => {
        console.error("Texture Load Error:", error);
        alert("Failed to load wall texture.");
        setLoadingProgress(0);
        setIsLoading(false);
      }
    );
  };

  // Request hit test source
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

  // Handle AR frame rendering
  const getHitTestResults = (a, frame) => {
    const hitTestResults = frame.getHitTestResults(a.hitTestSource);
    if (hitTestResults.length) {
      const referenceSpace = a.renderer.xr.getReferenceSpace();
      const hit = hitTestResults[0];
      const pose = hit.getPose(referenceSpace);

      // Detect vertical plane by orientation
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

  // Place wall texture mesh
  const placeWallTexture = (a) => {
    const wall = new THREE.Mesh(
      new THREE.PlaneGeometry(1, 1.5),
      new THREE.MeshBasicMaterial({ map: a.wallTexture })
    );

    wall.position.setFromMatrixPosition(a.reticle.matrix);
    wall.lookAt(a.camera.position);
    a.scene.add(wall);

    console.log("🧱 Wall texture placed at:", wall.position);
  };

  // Main render loop
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
