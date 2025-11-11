import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";
import { useSearchParams } from "react-router-dom";
import LoadingBar from "../../components/ARView/LoadingBar.jsx";

const ARViewer = () => {
  const containerRef = useRef();
  const [searchParams] = useSearchParams();
  const [isSupported, setIsSupported] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const app = useRef({});

  const modelUrl = searchParams.get("model");

  // ---------------------- MAIN SETUP ----------------------
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

    const ambient = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
    ambient.position.set(0.5, 1, 0.25);
    a.scene.add(ambient);

    a.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    a.renderer.setPixelRatio(window.devicePixelRatio);
    a.renderer.setSize(window.innerWidth, window.innerHeight);
    a.renderer.outputEncoding = THREE.sRGBEncoding;
    container.appendChild(a.renderer.domElement);

    setEnvironment(a);

    // Reticle
    a.reticle = new THREE.Mesh(
      new THREE.RingGeometry(0.15, 0.2, 32).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({ color: 0x00ffff })
    );
    a.reticle.matrixAutoUpdate = false;
    a.reticle.visible = false;
    a.scene.add(a.reticle);

    setupXR(a);

    const resizeListener = () => resize(a);
    window.addEventListener("resize", resizeListener);

    return () => {
      window.removeEventListener("resize", resizeListener);
      a.renderer.dispose();
      container.removeChild(a.renderer.domElement);
    };
  }, []);

  // ---------------------- ENVIRONMENT ----------------------
  const setEnvironment = (a) => {
    const loader = new RGBELoader().setPath("/assets/");
    loader.load(
      "hdr/venice_sunset_1k.hdr",
      (texture) => {
        texture.mapping = THREE.EquirectangularReflectionMapping;
        a.scene.environment = texture;
        console.log("HDR Environment loaded");
      },
      undefined,
      (error) => console.error("HDR Load Error:", error)
    );
  };

  // ---------------------- RESIZE HANDLER ----------------------
  const resize = (a) => {
    a.camera.aspect = window.innerWidth / window.innerHeight;
    a.camera.updateProjectionMatrix();
    a.renderer.setSize(window.innerWidth, window.innerHeight);
  };

  // ---------------------- XR SETUP ----------------------
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

    const onSelect = () => {
      if (a.chair === undefined) {
        console.warn("No model loaded for placement");
        return;
      }
      if (a.reticle.visible) {
        a.chair.position.setFromMatrixPosition(a.reticle.matrix);
        a.chair.visible = true;
        console.log("Model placed at:", a.chair.position);
      }
    };

    a.controller = a.renderer.xr.getController(0);
    a.controller.addEventListener("select", onSelect);
    a.scene.add(a.controller);
  };

  // ---------------------- START AR ----------------------
  const showChair = async () => {
    const a = app.current;
    if (!modelUrl) {
      console.error("No model URL provided");
      alert("No 3D model available for this product.");
      return;
    }

    try {
      await initAR(a);
    } catch (error) {
      console.error("Error in AR initialization:", error);
    }
  };

  // ---------------------- INIT AR SESSION ----------------------
  const initAR = async (a) => {
    let currentSession = a.currentSession;

    const sessionInit = {
      requiredFeatures: ["hit-test", "plane-detection"], // ✅ Add plane detection
      optionalFeatures: ["dom-overlay"],
    };

    const onSessionStarted = (session) => {
      session.addEventListener("end", onSessionEnded);
      a.renderer.xr.setReferenceSpaceType("local");
      a.renderer.xr.setSession(session);
      currentSession = session;
      a.currentSession = currentSession;
      console.log("XR Session started");
      setIsLoading(true);
      loadModel(a);
    };

    const onSessionEnded = () => {
      console.log("XR Session ended");
      currentSession.removeEventListener("end", onSessionEnded);
      currentSession = null;
      a.currentSession = null;
      if (a.chair !== null) {
        a.scene.remove(a.chair);
        a.chair = null;
      }
      a.renderer.setAnimationLoop(null);
      setIsLoading(false);
      setLoadingProgress(0);
    };

    if (currentSession === null) {
      try {
        const session = await navigator.xr.requestSession("immersive-ar", sessionInit);
        onSessionStarted(session);
      } catch (error) {
        console.error("XR Session Request Failed:", error);
        alert("Failed to start AR session. Check device compatibility.");
        setIsSupported(false);
        throw error;
      }
    } else {
      currentSession.end();
    }
  };

  // ---------------------- LOAD MODEL ----------------------
  const loadModel = (a) => {
    const loader = new GLTFLoader();
    setLoadingProgress(0);
    loader.load(
      modelUrl,
      (gltf) => {
        a.scene.add(gltf.scene);
        a.chair = gltf.scene;
        a.chair.visible = false;
        a.chair.scale.set(1, 1, 1);
        console.log("✅ 3D Model loaded:", modelUrl);
        a.renderer.setAnimationLoop((timestamp, frame) =>
          render(a, timestamp, frame)
        );
        setLoadingProgress(100);
      },
      (xhr) => {
        if (xhr.total) {
          const percent = (xhr.loaded / xhr.total) * 100;
          setLoadingProgress(Math.round(percent));
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

  // ---------------------- HIT TEST SETUP ----------------------
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

  // ---------------------- GET HIT TEST RESULTS ----------------------
  const getHitTestResults = (a, frame) => {
    const hitTestResults = frame.getHitTestResults(a.hitTestSource);
    if (hitTestResults.length) {
      const referenceSpace = a.renderer.xr.getReferenceSpace();
      const hit = hitTestResults[0];
      const pose = hit.getPose(referenceSpace);

      // Detect surface normal
      const normalMatrix = new THREE.Matrix3().getNormalMatrix(
        new THREE.Matrix4().fromArray(pose.transform.matrix)
      );
      const normal = new THREE.Vector3(0, 1, 0).applyMatrix3(normalMatrix).normalize();

      // Adjust reticle orientation based on surface
      const isVertical = Math.abs(normal.y) < 0.5;
      a.reticle.rotation.set(isVertical ? 0 : -Math.PI / 2, 0, 0);

      a.reticle.visible = true;
      a.reticle.matrix.fromArray(pose.transform.matrix);

      if (a.chair && loadingProgress === 100) {
        setIsLoading(false);
      }
    } else {
      a.reticle.visible = false;
    }
  };

  // ---------------------- RENDER LOOP ----------------------
  const render = (a, timestamp, frame) => {
    if (frame) {
      if (!a.hitTestSourceRequested) requestHitTestSource(a);
      if (a.hitTestSource) getHitTestResults(a, frame);
    }
    a.renderer.render(a.scene, a.camera);
  };

  // ---------------------- UI ----------------------
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
          onClick={showChair}
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
