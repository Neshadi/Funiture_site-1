import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

const ARWallTextureViewer = () => {
  const containerRef = useRef();
  const [isSupported, setIsSupported] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState([]);
  const [planeDetected, setPlaneDetected] = useState(false);
  const app = useRef({});

  const addDebugLog = (message) => {
    console.log(message);
    setDebugInfo(prev => [...prev.slice(-10), `${new Date().toLocaleTimeString()}: ${message}`]);
  };

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

    // Ambient lighting
    const ambient = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
    ambient.position.set(0.5, 1, 0.25);
    a.scene.add(ambient);

    a.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    a.renderer.setPixelRatio(window.devicePixelRatio);
    a.renderer.setSize(window.innerWidth, window.innerHeight);
    a.renderer.outputEncoding = THREE.sRGBEncoding;
    container.appendChild(a.renderer.domElement);

    // Create reticle for vertical plane detection (green circle)
    a.reticle = new THREE.Mesh(
      new THREE.RingGeometry(0.1, 0.15, 32),
      new THREE.MeshBasicMaterial({ color: 0x00ff00, side: THREE.DoubleSide })
    );
    a.reticle.matrixAutoUpdate = false;
    a.reticle.visible = false;
    a.scene.add(a.reticle);

    // Array to store placed markers
    a.markers = [];

    setupXR(a);

    const resizeListener = () => resize(a);
    window.addEventListener("resize", resizeListener);

    return () => {
      window.removeEventListener("resize", resizeListener);
      a.renderer.dispose();
      container.removeChild(a.renderer.domElement);
    };
  }, []);

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

    // On select, place a colored cube as marker
    const onSelect = () => {
      if (a.reticle.visible && a.lastHitResult) {
        placeMarker(a, a.lastHitResult);
      } else {
        addDebugLog("⚠️ No plane detected - reticle not visible");
      }
    };

    a.controller = a.renderer.xr.getController(0);
    a.controller.addEventListener("select", onSelect);
    a.scene.add(a.controller);
  };

  const placeMarker = (a, hitResult) => {
    const referenceSpace = a.renderer.xr.getReferenceSpace();
    const pose = hitResult.getPose(referenceSpace);
    
    if (!pose) {
      addDebugLog("⚠️ No pose from hit result");
      return;
    }

    const matrix = new THREE.Matrix4();
    matrix.fromArray(pose.transform.matrix);

    const position = new THREE.Vector3();
    const rotation = new THREE.Quaternion();
    const scale = new THREE.Vector3();
    matrix.decompose(position, rotation, scale);

    // Create a colored cube as marker (easier to see than texture)
    const geometry = new THREE.BoxGeometry(0.2, 0.2, 0.05);
    const material = new THREE.MeshStandardMaterial({ 
      color: Math.random() * 0xffffff,
      metalness: 0.3,
      roughness: 0.7
    });
    const mesh = new THREE.Mesh(geometry, material);
    
    mesh.position.copy(position);
    mesh.quaternion.copy(rotation);
    mesh.visible = true;
    
    a.scene.add(mesh);
    a.markers.push(mesh);
    
    addDebugLog(`✅ Marker placed at: x=${position.x.toFixed(2)}, y=${position.y.toFixed(2)}, z=${position.z.toFixed(2)}`);
    setPlaneDetected(true);
  };

  const startARView = async () => {
    const a = app.current;
    addDebugLog("Starting AR session...");

    try {
      await initAR(a);
    } catch (error) {
      addDebugLog(`❌ AR Init Error: ${error.message}`);
    }
  };

  const initAR = async (a) => {
    let currentSession = a.currentSession;
    
    // Try different session configurations
    const sessionConfigs = [
      { 
        name: "Plane Detection with Hit Test",
        config: { 
          requiredFeatures: ["hit-test"],
          optionalFeatures: ["plane-detection"]
        }
      },
      {
        name: "Hit Test Only",
        config: { 
          requiredFeatures: ["hit-test"]
        }
      },
      {
        name: "Basic AR",
        config: {}
      }
    ];

    const onSessionStarted = (session, configName) => {
      session.addEventListener("end", onSessionEnded);
      a.renderer.xr.setReferenceSpaceType("local");
      a.renderer.xr.setSession(session);
      currentSession = session;
      a.currentSession = currentSession;
      addDebugLog(`✅ XR Session started with: ${configName}`);
      setIsLoading(true);
      
      // Start rendering immediately
      a.renderer.setAnimationLoop((timestamp, frame) =>
        render(a, timestamp, frame)
      );
    };

    const onSessionEnded = () => {
      addDebugLog("XR Session ended");
      currentSession.removeEventListener("end", onSessionEnded);
      currentSession = null;
      a.currentSession = null;
      
      // Remove all markers
      a.markers.forEach(mesh => a.scene.remove(mesh));
      a.markers = [];
      
      a.renderer.setAnimationLoop(null);
      setIsLoading(false);
      setPlaneDetected(false);
    };

    if (currentSession === null) {
      // Try session configs in order until one works
      for (let i = 0; i < sessionConfigs.length; i++) {
        try {
          addDebugLog(`Trying: ${sessionConfigs[i].name}`);
          const session = await navigator.xr.requestSession("immersive-ar", sessionConfigs[i].config);
          onSessionStarted(session, sessionConfigs[i].name);
          return; // Success, exit
        } catch (error) {
          addDebugLog(`Failed ${sessionConfigs[i].name}: ${error.message}`);
          if (i === sessionConfigs.length - 1) {
            // Last attempt failed
            alert("Failed to start AR session. Your device may not support AR.");
            setIsSupported(false);
            throw error;
          }
        }
      }
    } else {
      currentSession.end();
    }
  };

  const requestHitTestSource = (a) => {
    const session = a.renderer.xr.getSession();
    
    session.requestReferenceSpace("viewer").then((referenceSpace) => {
      // Try to request hit test for vertical planes first
      session.requestHitTestSource({ 
        space: referenceSpace,
        entityTypes: ["plane"],
        planeTypes: ["vertical"]
      }).then((source) => {
        a.hitTestSource = source;
        addDebugLog("✅ Vertical plane hit test source created");
      }).catch((error) => {
        addDebugLog(`⚠️ Vertical plane not supported: ${error.message}`);
        // Fallback to any plane
        session.requestHitTestSource({ 
          space: referenceSpace,
          entityTypes: ["plane"]
        }).then((source) => {
          a.hitTestSource = source;
          addDebugLog("✅ Any plane hit test source created");
        }).catch((err2) => {
          addDebugLog(`⚠️ Plane detection not supported: ${err2.message}`);
          // Final fallback to basic hit test
          session.requestHitTestSource({ space: referenceSpace }).then((source) => {
            a.hitTestSource = source;
            addDebugLog("✅ Basic hit test source created");
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
    const hitTestResults = frame.getHitTestResults(a.hitTestSource);
    
    if (hitTestResults.length) {
      const referenceSpace = a.renderer.xr.getReferenceSpace();
      const hit = hitTestResults[0];
      
      a.lastHitResult = hit;
      
      const pose = hit.getPose(referenceSpace);
      
      if (pose) {
        if (!a.reticle.visible) {
          addDebugLog("✅ Reticle now visible - plane detected!");
          setPlaneDetected(true);
        }
        
        a.reticle.visible = true;
        a.reticle.matrix.fromArray(pose.transform.matrix);
        
        if (isLoading) {
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
      if (a.hitTestSourceRequested === false) requestHitTestSource(a);
      if (a.hitTestSource) getHitTestResults(a, frame);
    }
    a.renderer.render(a.scene, a.camera);
  };

  const clearDebugLog = () => {
    setDebugInfo([]);
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
        backgroundColor: "black"
      }}
    >
      {/* Debug Console */}
      <div style={{
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
        border: "1px solid #0f0"
      }}>
        <div style={{ 
          display: "flex", 
          justifyContent: "space-between", 
          marginBottom: "5px",
          borderBottom: "1px solid #0f0",
          paddingBottom: "5px"
        }}>
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
              fontSize: "10px"
            }}
          >
            Clear
          </button>
        </div>
        {debugInfo.length === 0 ? (
          <div style={{ opacity: 0.5 }}>Waiting for events...</div>
        ) : (
          debugInfo.map((log, i) => (
            <div key={i} style={{ marginBottom: "2px" }}>{log}</div>
          ))
        )}
      </div>

      {/* Loading Indicator */}
      {isLoading && (
        <div style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          textAlign: "center",
          color: "white",
          background: "rgba(0,0,0,0.8)",
          padding: "30px",
          borderRadius: "10px",
          border: "2px solid #00ff00"
        }}>
          <div style={{ fontSize: "18px", marginBottom: "15px" }}>
            🔍 Scanning for planes...
          </div>
          <div style={{ fontSize: "14px", opacity: 0.8 }}>
            Point your camera at a wall
          </div>
        </div>
      )}

      {/* Status Indicator */}
      {planeDetected && !isLoading && (
        <div style={{
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
          fontWeight: "bold"
        }}>
          ✅ PLANE DETECTED! Tap screen to place marker
        </div>
      )}

      {/* Start Button */}
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
            boxShadow: "0 4px 6px rgba(0,0,0,0.3)"
          }}
          onClick={startARView}
        >
          🚀 Start Plane Detection Test
        </button>
      ) : (
        <p style={{ 
          color: "white", 
          textAlign: "center", 
          marginTop: "50%",
          padding: "20px"
        }}>
          ❌ AR is not supported on this device.
        </p>
      )}

      {/* Instructions */}
      <div style={{
        position: "absolute",
        bottom: "80px",
        left: "10px",
        right: "10px",
        background: "rgba(0,0,0,0.7)",
        color: "white",
        padding: "12px",
        borderRadius: "5px",
        fontSize: "12px",
        display: isLoading || planeDetected ? "none" : "block"
      }}>
        <strong>Instructions:</strong>
        <ol style={{ margin: "5px 0", paddingLeft: "20px" }}>
          <li>Click "Start Plane Detection Test"</li>
          <li>Point camera at a wall</li>
          <li>Wait for green reticle to appear</li>
          <li>Tap screen to place colored marker</li>
        </ol>
      </div>
    </div>
  );
};

export default ARWallTextureViewer;