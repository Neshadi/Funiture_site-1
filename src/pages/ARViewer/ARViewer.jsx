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

  // -----------------------------------------------------------------
  // 1. Model URL from query string (same as previous ARViewer)
  // -----------------------------------------------------------------
  const modelUrl = searchParams.get("model");

  const addDebugLog = (message) => {
    console.log(message);
    setDebugInfo((prev) => [
      ...prev.slice(-10),
      `${new Date().toLocaleTimeString()}: ${message}`,
    ]);
  };

  // -----------------------------------------------------------------
  // 2. Three.js + WebXR boiler-plate (unchanged)
  // -----------------------------------------------------------------
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

    // Reticle (green ring – same as before)
    a.reticle = new THREE.Mesh(
      new THREE.RingGeometry(0.1, 0.15, 32),
      new THREE.MeshBasicMaterial({ color: 0x00ff00, side: THREE.DoubleSide })
    );
    a.reticle.matrixAutoUpdate = false;
    a.reticle.visible = false;
    a.scene.add(a.reticle);

    a.markers = []; // keeps placed objects
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

  // -----------------------------------------------------------------
  // 3. WebXR setup (unchanged except for onSelect → placeModel)
  // -----------------------------------------------------------------
  const setupXR = (a) => {
    a.renderer.xr.enabled = true;
    a.currentSession = null;

    if ("xr" in navigator) {
      navigator.xr
        .isSessionSupported("immersive-ar")
        .then((supported) => {
          setIsSupported(supported);
          addDebugLog(`AR Support: ${supported}`);
        })
        .catch((error) => {
          addDebugLog(`AR Check Error: ${error.message}`);
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
        addDebugLog("No plane detected - reticle not visible");
      }
    };

    a.controller = a.renderer.xr.getController(0);
    a.controller.addEventListener("select", onSelect);
    a.scene.add(a.controller);
  };

  // -----------------------------------------------------------------
  // 4. Model loading (same as original ARViewer)
  // -----------------------------------------------------------------
  const loadModel = (a) => {
    if (!modelUrl) {
      addDebugLog("No model URL – will use fallback marker");
      return;
    }

    const loader = new GLTFLoader();
    setLoadingProgress(0);

    loader.load(
      modelUrl,
      (gltf) => {
        a.model = gltf.scene;
        a.model.visible = false;
        a.scene.add(a.model);
        console.log("GLTF Loaded Successfully:", gltf, "Model URL:", modelUrl);
        setLoadingProgress(100);
        addDebugLog("3D Model loaded successfully");
      },
      (xhr) => {
        if (xhr.total) {
          const percent = (xhr.loaded / xhr.total) * 100;
          setLoadingProgress(Math.round(percent));
        }
      },
      (error) => {
        console.error("GLTF Load Error:", error);
        addDebugLog(`Failed to load model: ${error.message}`);
        setLoadingProgress(0);
        setIsLoading(false);
      }
    );
  };

  // -----------------------------------------------------------------
  // 5. Placement logic – decides orientation based on plane normal
  // -----------------------------------------------------------------
  const placeModel = (a, hitResult) => {
    const referenceSpace = a.renderer.xr.getReferenceSpace();
    const pose = hitResult.getPose(referenceSpace);
    if (!pose) {
      addDebugLog("No pose from hit result");
      return;
    }

    const matrix = new THREE.Matrix4().fromArray(pose.transform.matrix);
    const position = new THREE.Vector3();
    const quaternion = new THREE.Quaternion();
    const scale = new THREE.Vector3();
    matrix.decompose(position, quaternion, scale);

    // -------------------------------------------------------------
    // Determine plane orientation (vertical / horizontal)
    // -------------------------------------------------------------
    const normal = hitResult.hitMatrix
      ? new THREE.Vector3(...hitResult.hitMatrix.slice(8, 11)).normalize()
      : new THREE.Vector3(0, 1, 0); // fallback to up

    const up = new THREE.Vector3(0, 1, 0);
    const dot = Math.abs(normal.dot(up));

    const isVertical = dot < 0.5; // < 45° from vertical → wall
    addDebugLog(isVertical ? "Vertical plane detected" : "Horizontal plane detected");

    // -------------------------------------------------------------
    // Create the object (model if loaded, otherwise fallback marker)
    // -------------------------------------------------------------
    let mesh;
    if (a.model && loadingProgress === 100) {
      mesh = a.model.clone();
      mesh.visible = true;

      // ---- Scale / orientation adjustments ----
      // You can tweak per-model rules here if you have a naming convention
      if (isVertical) {
        // Wall-mounted objects (e.g. paintings, shelves)
        mesh.scale.set(0.5, 0.5, 0.5);
        // Align to wall – keep model upright but rotate to face camera
        const lookAt = new THREE.Vector3().copy(position).add(normal.clone().multiplyScalar(-1));
        mesh.lookAt(lookAt);
        // optional: rotate 90° around X so model "sticks" to wall
        mesh.rotateX(-Math.PI / 2);
      } else {
        // Floor objects (chairs, tables)
        mesh.scale.set(1, 1, 1);
        // Keep upright
        mesh.quaternion.copy(quaternion);
      }
    } else {
      // Fallback coloured box (same as original marker)
      const geometry = new THREE.BoxGeometry(0.2, 0.2, 0.05);
      const material = new THREE.MeshStandardMaterial({
        color: Math.random() * 0xffffff,
        metalness: 0.3,
        roughness: 0.7,
      });
      mesh = new THREE.Mesh(geometry, material);
    }

    mesh.position.copy(position);
    if (!a.model) mesh.quaternion.copy(quaternion);

    a.scene.add(mesh);
    a.markers.push(mesh);

    addDebugLog(
      `Object placed at: x=${position.x.toFixed(
        2
      )}, y=${position.y.toFixed(2)}, z=${position.z.toFixed(2)} (${
        isVertical ? "wall" : "floor"
      })`
    );
    setPlaneDetected(true);
  };

  // -----------------------------------------------------------------
  // 6. AR session start (now also loads the model)
  // -----------------------------------------------------------------
  const startARView = async () => {
    const a = app.current;
    addDebugLog("Starting AR session...");

    try {
      await initAR(a);
    } catch (error) {
      addDebugLog(`AR Init Error: ${error.message}`);
    }
  };

  const initAR = async (a) => {
    let currentSession = a.currentSession;

    const sessionConfigs = [
      {
        name: "Plane + Hit-Test",
        config: {
          requiredFeatures: ["hit-test"],
          optionalFeatures: ["plane-detection"],
        },
      },
      { name: "Hit-Test Only", config: { requiredFeatures: ["hit-test"] } },
      { name: "Basic AR", config: {} },
    ];

    const onSessionStarted = (session, configName) => {
      session.addEventListener("end", onSessionEnded);
      a.renderer.xr.setReferenceSpaceType("local");
      a.renderer.xr.setSession(session);
      currentSession = session;
      a.currentSession = currentSession;
      addDebugLog(`XR Session started with: ${configName}`);
      setIsLoading(true);

      // ---- Load model *after* session starts ----
      loadModel(a);

      a.renderer.setAnimationLoop((timestamp, frame) =>
        render(a, timestamp, frame)
      );
    };

    const onSessionEnded = () => {
      addDebugLog("XR Session ended");
      currentSession?.removeEventListener("end", onSessionEnded);
      a.currentSession = null;

      a.markers.forEach((m) => a.scene.remove(m));
      a.markers = [];

      a.renderer.setAnimationLoop(null);
      setIsLoading(false);
      setPlaneDetected(false);
      setLoadingProgress(0);
    };

    if (!currentSession) {
      for (const { name, config } of sessionConfigs) {
        try {
          addDebugLog(`Trying: ${name}`);
          const session = await navigator.xr.requestSession(
            "immersive-ar",
            config
          );
          onSessionStarted(session, name);
          return;
        } catch (e) {
          addDebugLog(`Failed ${name}: ${e.message}`);
          if (name === sessionConfigs[sessionConfigs.length - 1].name) {
            alert("Failed to start AR session. Your device may not support AR.");
            setIsSupported(false);
            throw e;
          }
        }
      }
    } else {
      currentSession.end();
    }
  };

  // -----------------------------------------------------------------
  // 7. Hit-test (prioritise vertical → any → basic)
  // -----------------------------------------------------------------
  const requestHitTestSource = (a) => {
    const session = a.renderer.xr.getSession();

    session
      .requestReferenceSpace("viewer")
      .then((refSpace) => {
        // 1. Vertical
        session
          .requestHitTestSource({
            space: refSpace,
            entityTypes: ["plane"],
            planeTypes: ["vertical"],
          })
          .then((src) => {
            a.hitTestSource = src;
            addDebugLog("Vertical plane hit-test source created");
          })
          .catch(() => {
            addDebugLog("Vertical plane not supported → trying any plane");
            // 2. Any plane
            session
              .requestHitTestSource({
                space: refSpace,
                entityTypes: ["plane"],
              })
              .then((src) => {
                a.hitTestSource = src;
                addDebugLog("Any-plane hit-test source created");
              })
              .catch(() => {
                addDebugLog("Plane detection not supported → basic hit-test");
                // 3. Basic
                session
                  .requestHitTestSource({ space: refSpace })
                  .then((src) => {
                    a.hitTestSource = src;
                    addDebugLog("Basic hit-test source created");
                  });
              });
          });
      });

    session.addEventListener("end", () => {
      a.hitTestSourceRequested = false;
      a.hitTestSource = null;
    });
    a.hitTestSourceRequested = true;
  };

  const getHitTestResults = (a, frame) => {
    const results = frame.getHitTestResults(a.hitTestSource);
    if (results.length) {
      const refSpace = a.renderer.xr.getReferenceSpace();
      const hit = results[0];
      a.lastHitResult = hit;

      const pose = hit.getPose(refSpace);
      if (pose) {
        if (!a.reticle.visible) {
          addDebugLog("Reticle now visible - plane detected!");
          setPlaneDetected(true);
        }
        a.reticle.visible = true;
        a.reticle.matrix.fromArray(pose.transform.matrix);

        // Hide loading bar once reticle + model are ready
        if (isLoading && (!modelUrl || loadingProgress === 100)) {
          setIsLoading(false);
        }
      }
    } else {
      a.reticle.visible = false;
      a.lastHitResult = null;
    }
  };

  const render = (a, timestamp, frame) => {
    if (frame) {
      if (!a.hitTestSourceRequested) requestHitTestSource(a);
      if (a.hitTestSource) getHitTestResults(a, frame);
    }
    a.renderer.render(a.scene, a.camera);
  };

  const clearDebugLog = () => setDebugInfo([]);

  // -----------------------------------------------------------------
  // 8. UI (unchanged except for LoadingBar)
  // -----------------------------------------------------------------
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
      {/* Debug Console */}
      <div
        style={{
          position: "absolute",
          top: "10px",
          left: "10px",
          right: "10px",
          maxHeight: "200px",
          background: "rgba(0,0,0,0.85)",
          color: "#0f0",
          fontFamily: "monospace",
          fontSize: "11px",
          padding: "10px",
          borderRadius: "5px",
          overflowY: "auto",
          zIndex: 1001,
          border: "1px solid #0f0",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "5px",
            borderBottom: "1px solid #0f0",
            paddingBottom: "5px",
          }}
        >
          <strong>DEBUG LOG</strong>
          <button
            onClick={clearDebugLog}
            style={{
              background: "transparent",
              color: "#0f0",
              border: "1px solid #0f0",
              padding: "2px 8px",
              borderRadius: "3px",
              cursor: "pointer",
              fontSize: "10px",
            }}
          >
            Clear
          </button>
        </div>
        {debugInfo.length === 0 ? (
          <div style={{ opacity: 0.5 }}>Waiting for events...</div>
        ) : (
          debugInfo.map((log, i) => (
            <div key={i} style={{ marginBottom: "2px" }}>
              {log}
            </div>
          ))
        )}
      </div>

      {/* Loading Bar (model) */}
      {isLoading && modelUrl && (
        <LoadingBar progress={loadingProgress} />
      )}

      {/* Scanning overlay */}
      {isLoading && !modelUrl && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            textAlign: "center",
            color: "white",
            background: "rgba(0,0,0,0.8)",
            padding: "30px",
            borderRadius: "10px",
            border: "2px solid #00ff00",
          }}
        >
          <div style={{ fontSize: "18px", marginBottom: "15px" }}>
            Scanning for planes...
          </div>
          <div style={{ fontSize: "14px", opacity: 0.8 }}>
            Point your camera at a surface
          </div>
        </div>
      )}

      {/* Plane-detected banner */}
      {planeDetected && !isLoading && (
        <div
          style={{
            position: "absolute",
            top: "220px",
            left: "10px",
            right: "10px",
            background: "rgba(0,255,0,0.9)",
            color: "white",
            padding: "15px",
            borderRadius: "5px",
            fontSize: "14px",
            textAlign: "center",
            fontWeight: "bold",
          }}
        >
          PLANE DETECTED! Tap screen to place object
        </div>
      )}

      {/* Start button */}
      {isSupported ? (
        <button
          style={{
            position: "absolute",
            bottom: "20px",
            left: "50%",
            transform: "translateX(-50%)",
            padding: "15px 30px",
            background: "#00ff00",
            color: "black",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontSize: "16px",
            fontWeight: "bold",
            display: isLoading ? "none" : "block",
            boxShadow: "0 4px 6px rgba(0,0,0,0.3)",
          }}
          onClick={startARView}
        >
          Start AR View
        </button>
      ) : (
        <p
          style={{
            color: "white",
            textAlign: "center",
            marginTop: "50%",
            padding: "20px",
          }}
        >
          AR is not supported on this device.
        </p>
      )}

      {/* Instructions */}
      <div
        style={{
          position: "absolute",
          bottom: "80px",
          left: "10px",
          right: "10px",
          background: "rgba(0,0,0,0.7)",
          color: "white",
          padding: "12px",
          borderRadius: "5px",
          fontSize: "12px",
          display: isLoading || planeDetected ? "none" : "block",
        }}
      >
        <strong>Instructions:</strong>
        <ol style={{ margin: "5px 0", paddingLeft: "20px" }}>
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