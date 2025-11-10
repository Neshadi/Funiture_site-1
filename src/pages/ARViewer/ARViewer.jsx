import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

const ARViewer = () => {
  const containerRef = useRef();
  const [isSupported, setIsSupported] = useState(false);
  const app = useRef({});

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const a = app.current;
    a.camera = new THREE.PerspectiveCamera(
      70,
      window.innerWidth / window.innerHeight,
      0.01,
      20
    );
    a.scene = new THREE.Scene();

    const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
    a.scene.add(light);

    a.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    a.renderer.setSize(window.innerWidth, window.innerHeight);
    a.renderer.xr.enabled = true;
    container.appendChild(a.renderer.domElement);

    setupReticle(a);
    setupXR(a);

    window.addEventListener("resize", () => resize(a));
    return () => {
      window.removeEventListener("resize", () => resize(a));
      a.renderer.dispose();
      container.removeChild(a.renderer.domElement);
    };
  }, []);

  // ✅ Create the reticle (green circle)
  const setupReticle = (a) => {
    a.reticle = new THREE.Mesh(
      new THREE.RingGeometry(0.08, 0.1, 32).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial({ color: 0x00ff00 })
    );
    a.reticle.matrixAutoUpdate = false;
    a.reticle.visible = false;
    a.scene.add(a.reticle);
  };

  const setupXR = (a) => {
    if ("xr" in navigator) {
      navigator.xr.isSessionSupported("immersive-ar").then(setIsSupported);
    }

    a.controller = a.renderer.xr.getController(0);
    a.controller.addEventListener("select", () => onSelect(a));
    a.scene.add(a.controller);
  };

  // ✅ When user taps on detected plane
  const onSelect = (a) => {
    if (a.reticle.visible) {
      const text = createHelloText();
      text.position.setFromMatrixPosition(a.reticle.matrix);
      text.lookAt(a.camera.position);
      a.scene.add(text);
      console.log("👋 'Hello' placed at:", text.position);
    }
  };

  // ✅ Create 3D Text
  const createHelloText = () => {
    const loader = new THREE.FontLoader();
    const textGroup = new THREE.Group();

    // Using built-in font (via CDN)
    loader.load(
      "https://threejs.org/examples/fonts/helvetiker_regular.typeface.json",
      (font) => {
        const textGeo = new THREE.TextGeometry("Hello", {
          font,
          size: 0.1,
          height: 0.02,
        });
        const textMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const textMesh = new THREE.Mesh(textGeo, textMat);
        textMesh.position.set(-0.2, 0, 0);
        textGroup.add(textMesh);
      }
    );
    return textGroup;
  };

  // ✅ Start AR Session
  const startAR = async () => {
    if (!isSupported) {
      alert("AR not supported on this device.");
      return;
    }

    const a = app.current;

    try {
      const sessionInit = {
        requiredFeatures: ["hit-test", "dom-overlay"],
        optionalFeatures: ["planes"],
        domOverlay: { root: document.body },
      };

      const session = await navigator.xr.requestSession("immersive-ar", sessionInit);
      onSessionStarted(a, session);
    } catch (err) {
      console.error("Failed to start AR session:", err);
    }
  };

  // ✅ Handle AR session start
  const onSessionStarted = (a, session) => {
    session.addEventListener("end", () => onSessionEnded(a));

    a.renderer.xr.setReferenceSpaceType("local");
    a.renderer.xr.setSession(session);

    a.hitTestSourceRequested = false;
    a.hitTestSource = null;

    a.renderer.setAnimationLoop((timestamp, frame) => render(a, timestamp, frame));
  };

  const onSessionEnded = (a) => {
    a.currentSession = null;
    a.hitTestSourceRequested = false;
    a.hitTestSource = null;
    a.renderer.setAnimationLoop(null);
  };

  const requestHitTestSource = (a) => {
    const session = a.renderer.xr.getSession();
    session.requestReferenceSpace("viewer").then((refSpace) => {
      session.requestHitTestSource({ space: refSpace }).then((source) => {
        a.hitTestSource = source;
      });
    });
    a.hitTestSourceRequested = true;
  };

  // ✅ Detect vertical plane and show circle
  const getHitTestResults = (a, frame) => {
    const hitTestResults = frame.getHitTestResults(a.hitTestSource);
    if (hitTestResults.length > 0) {
      const refSpace = a.renderer.xr.getReferenceSpace();
      const hit = hitTestResults[0];
      const pose = hit.getPose(refSpace);

      // Detect vertical plane (normal.y near 0)
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

  // ✅ Render loop
  const render = (a, timestamp, frame) => {
    if (frame) {
      if (!a.hitTestSourceRequested) requestHitTestSource(a);
      if (a.hitTestSource) getHitTestResults(a, frame);
    }
    a.renderer.render(a.scene, a.camera);
  };

  const resize = (a) => {
    a.camera.aspect = window.innerWidth / window.innerHeight;
    a.camera.updateProjectionMatrix();
    a.renderer.setSize(window.innerWidth, window.innerHeight);
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
          }}
          onClick={startAR}
        >
          Start AR View
        </button>
      ) : (
        <p style={{ color: "white", textAlign: "center", marginTop: "50%" }}>
          AR not supported on this device.
        </p>
      )}
    </div>
  );
};

export default ARViewer;
