import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";
import { useSearchParams } from "react-router-dom";
import LoadingBar from "../../components/ARView/LoadingBar.jsx";

const ARWallTextureViewer = () => {
  const containerRef = useRef();
  const [searchParams] = useSearchParams();
  const [isSupported, setIsSupported] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [debugInfo, setDebugInfo] = useState([]);
  const [planeDetected, setPlaneDetected] = useState(false);
  const app = useRef({});

  // --------------------------------------------------------------
  // 1. Model URL (same as original ARViewer)
  // --------------------------------------------------------------
  const modelUrl = searchParams.get("model");

  const addDebugLog = (msg) => {
    console.log(msg);
    setDebugInfo((p) => [...p.slice(-10), `${new Date().toLocaleTimeString()}: ${msg}`]);
  };

  // --------------------------------------------------------------
  // 2. Three.js + WebXR init (unchanged)
  // --------------------------------------------------------------
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const a = app.current;
    a.camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 20);
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

    // reticle (green ring)
    a.reticle = new THREE.Mesh(
      new THREE.RingGeometry(0.1, 0.15, 32),
      new THREE.MeshBasicMaterial({ color: 0x00ff00, side: THREE.DoubleSide })
    );
    a.reticle.matrixAutoUpdate = false;
    a.reticle.visible = false;
    a.scene.add(a.reticle);

    a.markers = []; // placed objects
    setupXR(a);

    const onResize = () => resize(a);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      a.renderer.dispose();
      container.removeChild(a.renderer.domElement);
    };
  }, []);

  const setEnvironment = (a) => {
    const loader = new RGBELoader().setPath("/assets/");
    loader.load(
      "hdr/venice_sunset_1k.hdr",
      (tex) => {
        tex.mapping = THREE.EquirectangularReflectionMapping;
        a.scene.environment = tex;
        console.log("HDR Environment loaded");
      },
      undefined,
      (err) => console.error("HDR Load Error:", err)
    );
  };

  const resize = (a) => {
    a.camera.aspect = window.innerWidth / window.innerHeight;
    a.camera.updateProjectionMatrix();
    a.renderer.setSize(window.innerWidth, window.innerHeight);
  };

  // --------------------------------------------------------------
  // 3. WebXR setup – tap → placeModel
  // --------------------------------------------------------------
  const setupXR = (a) => {
    a.renderer.xr.enabled = true;
    a.currentSession = null;

    if ("xr" in navigator) {
      navigator.xr
        .isSessionSupported("immersive-ar")
        .then((sup) => {
          setIsSupported(sup);
          addDebugLog(`AR Support: ${sup}`);
        })
        .catch((e) => {
          addDebugLog(`AR Check Error: ${e.message}`);
          setIsSupported(false);
        });
    } else {
      addDebugLog("WebXR API not available");
      setIsSupported(false);
    }

    a.hitTestSourceRequested = false;
    a.hitTestSource = null;

    const onSelect = () => {
      if (a.reticle.visible && a.lastHitResult) {
        placeModel(a, a.lastHitResult);
      } else {
        addDebugLog("No plane – reticle not visible");
      }
    };

    a.controller = a.renderer.xr.getController(0);
    a.controller.addEventListener("select", onSelect);
    a.scene.add(a.controller);
  };

  // --------------------------------------------------------------
  // 4. Model loading (same as original)
  // --------------------------------------------------------------
  const loadModel = (a) => {
    if (!modelUrl) {
      addDebugLog("No model URL → will use fallback marker");
      return;
    }

    const loader = new GLTFLoader();
    setLoadingProgress(0);
    addDebugLog(`Starting GLTF load: ${modelUrl}`);

    loader.load(
      modelUrl,
      (gltf) => {
        // Store the **original** model for cloning later
        a.loadedModel = gltf.scene;
        a.loadedModel.visible = false; // hidden until first placement
        a.scene.add(a.loadedModel);
        setLoadingProgress(100);
        addDebugLog("GLTF loaded & stored for cloning");
      },
      (xhr) => {
        if (xhr.total) {
          const pct = (xhr.loaded / xhr.total) * 100;
          setLoadingProgress(Math.round(pct));
        }
      },
      (err) => {
        console.error("GLTF Load Error:", err);
        addDebugLog(`GLTF load failed: ${err.message}`);
        setLoadingProgress(0);
        setIsLoading(false);
      }
    );
  };

  // --------------------------------------------------------------
  // 5. Placement – clone model or fallback box
  // --------------------------------------------------------------
  const placeModel = (a, hitResult) => {
    const refSpace = a.renderer.xr.getReferenceSpace();
    const pose = hitResult.getPose(refSpace);
    if (!pose) {
      addDebugLog("No pose from hit result");
      return;
    }

    const matrix = new THREE.Matrix4().fromArray(pose.transform.matrix);
    const pos = new THREE.Vector3();
    const quat = new THREE.Quaternion();
    const scale = new THREE.Vector3();
    matrix.decompose(pos, quat, scale);

    // ---------- plane orientation ----------
    const normal = hitResult.hitMatrix
      ? new THREE.Vector3(...hitResult.hitMatrix.slice(8, 11)).normalize()
      : new THREE.Vector3(0, 1, 0);
    const up = new THREE.Vector3(0, 1, 0);
    const dot = Math.abs(normal.dot(up));
    const isVertical = dot < 0.5; // < 45° → wall
    addDebugLog(isVertical ? "Vertical plane" : "Horizontal plane");

    // ---------- create object ----------
    let mesh;

    if (a.loadedModel && loadingProgress === 100) {
      // **Clone** the original model
      mesh = a.loadedModel.clone();
      mesh.visible = true;
      addDebugLog("Cloned GLTF model for placement");

      // ---- orientation / scale per plane type ----
      if (isVertical) {
        // Wall objects (paintings, shelves, etc.)
        mesh.scale.set(0.5, 0.5, 0.5);
        const lookAt = pos.clone().add(normal.clone().multiplyScalar(-1));
        mesh.lookAt(lookAt);
        mesh.rotateX(-Math.PI / 2); // stick flat to wall
      } else {
        // Floor objects
        mesh.scale.set(1, 1, 1);
        mesh.quaternion.copy(quat);
      }
    } else {
      // Fallback coloured box (only when no model)
      const geo = new THREE.BoxGeometry(0.2, 0.2, 0.05);
      const mat = new THREE.MeshStandardMaterial({
        color: Math.random() * 0xffffff,
        metalness: 0.3,
        roughness: 0.7,
      });
      mesh = new THREE.Mesh(geo, mat);
      addDebugLog("Placed fallback marker (no model)");
    }

    mesh.position.copy(pos);
    if (!a.loadedModel) mesh.quaternion.copy(quat);

    a.scene.add(mesh);
    a.markers.push(mesh);

    addDebugLog(
      `Placed at x=${pos.x.toFixed(2)}, y=${pos.y.toFixed(2)}, z=${pos.z.toFixed(2)} (${
        isVertical ? "wall" : "floor"
      })`
    );
    setPlaneDetected(true);
  };

  // --------------------------------------------------------------
  // 6. AR session start – load model after session
  // --------------------------------------------------------------
  const startARView = async () => {
    const a = app.current;
    addDebugLog("Starting AR session…");
    try {
      await initAR(a);
    } catch (e) {
      addDebugLog(`AR Init Error: ${e.message}`);
    }
  };

  const initAR = async (a) => {
    let sess = a.currentSession;

    const configs = [
      {
        name: "Plane+Hit",
        cfg: { requiredFeatures: ["hit-test"], optionalFeatures: ["plane-detection"] },
      },
      { name: "Hit-Only", cfg: { requiredFeatures: ["hit-test"] } },
      { name: "Basic", cfg: {} },
    ];

    const onStart = (session, name) => {
      session.addEventListener("end", onEnd);
      a.renderer.xr.setReferenceSpaceType("local");
      a.renderer.xr.setSession(session);
      a.currentSession = session;
      addDebugLog(`XR Session: ${name}`);
      setIsLoading(true);

      // Load model **after** session is ready
      loadModel(a);

      a.renderer.setAnimationLoop((t, f) => render(a, t, f));
    };

    const onEnd = () => {
      addDebugLog("XR Session ended");
      a.currentSession?.removeEventListener("end", onEnd);
      a.currentSession = null;
      a.markers.forEach((m) => a.scene.remove(m));
      a.markers = [];
      a.renderer.setAnimationLoop(null);
      setIsLoading(false);
      setPlaneDetected(false);
      setLoadingProgress(0);
    };

    if (!sess) {
      for (const { name, cfg } of configs) {
        try {
          addDebugLog(`Trying ${name}`);
          const s = await navigator.xr.requestSession("immersive-ar", cfg);
          onStart(s, name);
          return;
        } catch (e) {
          addDebugLog(`Failed ${name}: ${e.message}`);
          if (name === configs[configs.length - 1].name) {
            alert("AR not supported on this device.");
            setIsSupported(false);
            throw e;
          }
        }
      }
    } else {
      sess.end();
    }
  };

  // --------------------------------------------------------------
  // 7. Hit-test (vertical → any → basic)
  // --------------------------------------------------------------
  const requestHitTestSource = (a) => {
    const sess = a.renderer.xr.getSession();
    sess.requestReferenceSpace("viewer").then((ref) => {
      // 1. vertical
      sess
        .requestHitTestSource({ space: ref, entityTypes: ["plane"], planeTypes: ["vertical"] })
        .then((src) => {
          a.hitTestSource = src;
          addDebugLog("Vertical hit-test source");
        })
        .catch(() => {
          addDebugLog("Vertical unsupported → any plane");
          sess
            .requestHitTestSource({ space: ref, entityTypes: ["plane"] })
            .then((src) => {
              a.hitTestSource = src;
              addDebugLog("Any-plane hit-test source");
            })
            .catch(() => {
              addDebugLog("Plane detection off → basic hit-test");
              sess.requestHitTestSource({ space: ref }).then((src) => {
                a.hitTestSource = src;
                addDebugLog("Basic hit-test source");
              });
            });
        });
    });

    sess.addEventListener("end", () => {
      a.hitTestSourceRequested = false;
      a.hitTestSource = null;
    });
    a.hitTestSourceRequested = true;
  };

  const getHitTestResults = (a, frame) => {
    const results = frame.getHitTestResults(a.hitTestSource);
    if (results.length) {
      const ref = a.renderer.xr.getReferenceSpace();
      const hit = results[0];
      a.lastHitResult = hit;
      const pose = hit.getPose(ref);
      if (pose) {
        if (!a.reticle.visible) {
          addDebugLog("Reticle visible – plane detected");
          setPlaneDetected(true);
        }
        a.reticle.visible = true;
        a.reticle.matrix.fromArray(pose.transform.matrix);

        // hide loading bar when model ready (or no model)
        if (isLoading && (!modelUrl || loadingProgress === 100)) {
          setIsLoading(false);
        }
      }
    } else {
      a.reticle.visible = false;
      a.lastHitResult = null;
    }
  };

  const render = (a, _t, frame) => {
    if (frame) {
      if (!a.hitTestSourceRequested) requestHitTestSource(a);
      if (a.hitTestSource) getHitTestResults(a, frame);
    }
    a.renderer.render(a.scene, a.camera);
  };

  const clearDebugLog = () => setDebugInfo([]);

  // --------------------------------------------------------------
  // 8. UI
  // --------------------------------------------------------------
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
        backgroundColor: "black",
      }}
    >
      {/* Debug console */}
      <div
        style={{
          position: "absolute",
          top: 10,
          left: 10,
          right: 10,
          maxHeight: 200,
          background: "rgba(0,0,0,0.85)",
          color: "#0f0",
          fontFamily: "monospace",
          fontSize: 11,
          padding: 10,
          borderRadius: 5,
          overflowY: "auto",
          zIndex: 1001,
          border: "1px solid #0f0",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5, borderBottom: "1px solid #0f0", paddingBottom: 5 }}>
          <strong>DEBUG LOG</strong>
          <button onClick={clearDebugLog} style={{ background: "transparent", color: "#0f0", border: "1px solid #0f0", padding: "2px 8px", borderRadius: 3, cursor: "pointer", fontSize: 10 }}>
            Clear
          </button>
        </div>
        {debugInfo.length === 0 ? (
          <div style={{ opacity: 0.5 }}>Waiting…</div>
        ) : (
          debugInfo.map((l, i) => (
            <div key={i} style={{ marginBottom: 2 }}>
              {l}
            </div>
          ))
        )}
      </div>

      {/* Model loading bar */}
      {isLoading && modelUrl && <LoadingBar progress={loadingProgress} />}

      {/* Scanning overlay (no model) */}
      {isLoading && !modelUrl && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%,-50%)",
            textAlign: "center",
            color: "white",
            background: "rgba(0,0,0,0.8)",
            padding: 30,
            borderRadius: 10,
            border: "2px solid #00ff00",
          }}
        >
          <div style={{ fontSize: 18, marginBottom: 15 }}>Scanning for planes…</div>
          <div style={{ fontSize: 14, opacity: 0.8 }}>Point camera at a surface</div>
        </div>
      )}

      {/* Plane detected banner */}
      {planeDetected && !isLoading && (
        <div
          style={{
            position: "absolute",
            top: 220,
            left: 10,
            right: 10,
            background: "rgba(0,255,0,0.9)",
            color: "white",
            padding: 15,
            borderRadius: 5,
            fontSize: 14,
            textAlign: "center",
            fontWeight: "bold",
          }}
        >
          PLANE DETECTED! Tap to place model
        </div>
      )}

      {/* Start button */}
      {isSupported ? (
        <button
          style={{
            position: "absolute",
            bottom: 20,
            left: "50%",
            transform: "translateX(-50%)",
            padding: "15px 30px",
            background: "#00ff00",
            color: "black",
            border: "none",
            borderRadius: 8,
            cursor: "pointer",
            fontSize: 16,
            fontWeight: "bold",
            display: isLoading ? "none" : "block",
            boxShadow: "0 4px 6px rgba(0,0,0,0.3)",
          }}
          onClick={startARView}
        >
          Start AR View
        </button>
      ) : (
        <p style={{ color: "white", textAlign: "center", marginTop: "50%", padding: 20 }}>
          AR not supported on this device.
        </p>
      )}

      {/* Instructions */}
      <div
        style={{
          position: "absolute",
          bottom: 80,
          left: 10,
          right: 10,
          background: "rgba(0,0,0,0.7)",
          color: "white",
          padding: 12,
          borderRadius: 5,
          fontSize: 12,
          display: isLoading || planeDetected ? "none" : "block",
        }}
      >
        <strong>Instructions:</strong>
        <ol style={{ margin: "5px 0", paddingLeft: 20 }}>
          <li>Click “Start AR View”</li>
          <li>Point camera at a wall or floor</li>
          <li>Wait for green reticle</li>
          <li>Tap to place the 3D model</li>
        </ol>
      </div>
    </div>
  );
};

export default ARWallTextureViewer;