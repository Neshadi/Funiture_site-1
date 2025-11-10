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
    a.scene.add(ambient);

    a.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    a.renderer.setPixelRatio(window.devicePixelRatio);
    a.renderer.setSize(window.innerWidth, window.innerHeight);
    a.renderer.outputEncoding = THREE.sRGBEncoding;
    container.appendChild(a.renderer.domElement);

    setEnvironment(a);

    // ✅ Create green circle for vertical plane detection
    a.verticalIndicator = new THREE.Mesh(
      new THREE.CircleGeometry(0.2, 32),
      new THREE.MeshBasicMaterial({ color: 0x00ff00, opacity: 0.6, transparent: true })
    );
    a.verticalIndicator.rotation.x = -Math.PI / 2;
    a.verticalIndicator.visible = false;
    a.scene.add(a.verticalIndicator);

    setupXR(a);

    const resizeListener = () => resize(a);
    window.addEventListener("resize", resizeListener);

    return () => {
      window.removeEventListener("resize", resizeListener);
      a.renderer.dispose();
      container.removeChild(a.renderer.domElement);
    };
  }, []);

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
        .then((supported) => setIsSupported(supported))
        .catch(() => setIsSupported(false));
    }

    a.hitTestSourceRequested = false;
    a.hitTestSource = null;
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
      console.error("Error in AR initialization:", error);
    }
  };

  const initAR = async (a) => {
    let currentSession = a.currentSession;
    const sessionInit = {
      requiredFeatures: ["hit-test", "plane-detection"], // ✅ enable plane detection
    };

    const onSessionStarted = (session) => {
      session.addEventListener("end", onSessionEnded);
      a.renderer.xr.setReferenceSpaceType("local");
      a.renderer.xr.setSession(session);
      currentSession = session;
      a.currentSession = currentSession;

      console.log("XR Session started with plane detection");
      setIsLoading(true);
      loadModel(a);
    };

    const onSessionEnded = () => {
      console.log("XR Session ended");
      currentSession.removeEventListener("end", onSessionEnded);
      currentSession = null;
      a.currentSession = null;
      a.renderer.setAnimationLoop(null);
      setIsLoading(false);
      setLoadingProgress(0);
    };

    if (currentSession === null) {
      const session = await navigator.xr.requestSession("immersive-ar", sessionInit);
      onSessionStarted(session);
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
        a.chair = gltf.scene;
        a.chair.visible = false;
        a.scene.add(a.chair);
        a.renderer.setAnimationLoop((timestamp, frame) => render(a, timestamp, frame));
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

  const getHitTestResults = (a, frame) => {
    const hitTestResults = frame.getHitTestResults(a.hitTestSource);
    if (hitTestResults.length) {
      const referenceSpace = a.renderer.xr.getReferenceSpace();
      const hit = hitTestResults[0];
      const pose = hit.getPose(referenceSpace);

      // ✅ Check if vertical plane
      const plane = hit.createAnchor ? hit : null;
      if (plane && hit.plane) {
        const orientation = hit.plane.orientation;
        if (orientation === "vertical") {
          a.verticalIndicator.visible = true;
          a.verticalIndicator.position.set(
            pose.transform.position.x,
            pose.transform.position.y,
            pose.transform.position.z
          );
          a.verticalIndicator.lookAt(0, pose.transform.position.y, 0);
        } else {
          a.verticalIndicator.visible = false;
        }
      } else {
        a.verticalIndicator.visible = false;
      }
    } else {
      a.verticalIndicator.visible = false;
    }
  };

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
