import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

const ARWallTextureViewer = () => {
  const containerRef = useRef();
  const [isSupported, setIsSupported] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [detectedPlane, setDetectedPlane] = useState(false);
  const app = useRef({});

  // Get texture URL from query params or use default
  const getTextureUrl = () => {
    const params = new URLSearchParams(window.location.search);
    return params.get("texture") || "/assets/wall-texture.png";
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

    // Directional light for better texture visibility
    const directional = new THREE.DirectionalLight(0xffffff, 0.5);
    directional.position.set(0, 1, 1);
    a.scene.add(directional);

    a.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    a.renderer.setPixelRatio(window.devicePixelRatio);
    a.renderer.setSize(window.innerWidth, window.innerHeight);
    a.renderer.outputEncoding = THREE.sRGBEncoding;
    container.appendChild(a.renderer.domElement);

    // Create reticle for vertical plane detection
    a.reticle = new THREE.Mesh(
      new THREE.RingGeometry(0.1, 0.15, 32),
      new THREE.MeshBasicMaterial({ color: 0x00ff00, side: THREE.DoubleSide })
    );
    a.reticle.matrixAutoUpdate = false;
    a.reticle.visible = false;
    a.scene.add(a.reticle);

    // Array to store placed wall textures
    a.wallTextures = [];

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

    // On select, place texture on detected vertical plane
    const onSelect = () => {
      if (!a.wallTextureMaterial) {
        console.warn("No texture loaded for placement");
        return;
      }
      if (a.reticle.visible && a.lastHitResult) {
        placeWallTexture(a, a.lastHitResult);
      } else {
        console.warn("No vertical plane detected");
      }
    };

    a.controller = a.renderer.xr.getController(0);
    a.controller.addEventListener("select", onSelect);
    a.scene.add(a.controller);
  };

  const placeWallTexture = (a, hitResult) => {
    // Get the pose from the hit result
    const referenceSpace = a.renderer.xr.getReferenceSpace();
    const pose = hitResult.getPose(referenceSpace);
    
    if (!pose) return;

    // Create a matrix from the pose
    const matrix = new THREE.Matrix4();
    matrix.fromArray(pose.transform.matrix);

    // Extract position and orientation
    const position = new THREE.Vector3();
    const rotation = new THREE.Quaternion();
    const scale = new THREE.Vector3();
    matrix.decompose(position, rotation, scale);

    // Create plane geometry for the wall texture (2m x 2m)
    const geometry = new THREE.PlaneGeometry(2, 2);
    const mesh = new THREE.Mesh(geometry, a.wallTextureMaterial.clone());
    
    mesh.position.copy(position);
    mesh.quaternion.copy(rotation);
    
    // Ensure the texture faces the camera
    mesh.visible = true;
    
    a.scene.add(mesh);
    a.wallTextures.push(mesh);
    
    console.log("Wall texture placed at:", position);
    setDetectedPlane(true);
  };

  const startARView = async () => {
    const a = app.current;
    const textureUrl = getTextureUrl();

    if (!textureUrl) {
      console.error("No texture URL provided");
      alert("No texture available.");
      return;
    }

    try {
      await initAR(a, textureUrl);
    } catch (error) {
      console.error("Error in AR initialization:", error);
    }
  };

  const initAR = async (a, textureUrl) => {
    let currentSession = a.currentSession;
    
    // Request plane detection feature for vertical planes
    const sessionInit = { 
      requiredFeatures: ["hit-test"],
      optionalFeatures: ["plane-detection"]
    };

    const onSessionStarted = (session) => {
      session.addEventListener("end", onSessionEnded);
      a.renderer.xr.setReferenceSpaceType("local");
      a.renderer.xr.setSession(session);
      currentSession = session;
      a.currentSession = currentSession;
      console.log("XR Session started with plane detection");
      setIsLoading(true);
      loadTexture(a, textureUrl);
    };

    const onSessionEnded = () => {
      console.log("XR Session ended");
      currentSession.removeEventListener("end", onSessionEnded);
      currentSession = null;
      a.currentSession = null;
      
      // Remove all placed textures
      a.wallTextures.forEach(mesh => a.scene.remove(mesh));
      a.wallTextures = [];
      
      a.renderer.setAnimationLoop(null);
      setIsLoading(false);
      setLoadingProgress(0);
      setDetectedPlane(false);
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

  const loadTexture = (a, textureUrl) => {
    const textureLoader = new THREE.TextureLoader();
    setLoadingProgress(0);
    
    textureLoader.load(
      textureUrl,
      (texture) => {
        // Configure texture
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(1, 1);
        
        // Create material with the loaded texture
        a.wallTextureMaterial = new THREE.MeshStandardMaterial({
          map: texture,
          side: THREE.DoubleSide,
          transparent: false
        });
        
        console.log("Texture loaded successfully:", textureUrl);
        setLoadingProgress(100);
        
        // Start rendering loop
        a.renderer.setAnimationLoop((timestamp, frame) =>
          render(a, timestamp, frame)
        );
      },
      (xhr) => {
        if (xhr.total) {
          const percent = (xhr.loaded / xhr.total) * 100;
          setLoadingProgress(Math.round(percent));
        }
      },
      (error) => {
        console.error("Texture Load Error:", error);
        alert("Failed to load texture. Check console for details.");
        setLoadingProgress(0);
        setIsLoading(false);
      }
    );
  };

  const requestHitTestSource = (a) => {
    const session = a.renderer.xr.getSession();
    
    // Request hit test source for vertical planes
    session.requestReferenceSpace("viewer").then((referenceSpace) => {
      session.requestHitTestSource({ 
        space: referenceSpace,
        entityTypes: ["plane"],
        planeTypes: ["vertical"] // Only detect vertical planes
      }).then((source) => {
        a.hitTestSource = source;
        console.log("Hit test source created for vertical planes");
      }).catch((error) => {
        console.warn("Vertical plane detection not supported, using default hit test:", error);
        // Fallback to regular hit test if plane detection not supported
        session.requestHitTestSource({ space: referenceSpace }).then((source) => {
          a.hitTestSource = source;
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
      
      // Store the hit result for placement
      a.lastHitResult = hit;
      
      const pose = hit.getPose(referenceSpace);
      
      if (pose) {
        a.reticle.visible = true;
        a.reticle.matrix.fromArray(pose.transform.matrix);
        
        if (a.wallTextureMaterial && loadingProgress === 100) {
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
      {isLoading && (
        <div style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          textAlign: "center",
          color: "white",
          background: "rgba(0,0,0,0.7)",
          padding: "20px",
          borderRadius: "10px"
        }}>
          <div style={{ marginBottom: "10px" }}>Loading Texture...</div>
          <div style={{
            width: "200px",
            height: "10px",
            background: "#333",
            borderRadius: "5px",
            overflow: "hidden"
          }}>
            <div style={{
              width: `${loadingProgress}%`,
              height: "100%",
              background: "#007bff",
              transition: "width 0.3s"
            }}></div>
          </div>
          <div style={{ marginTop: "10px" }}>{loadingProgress}%</div>
        </div>
      )}

      {isSupported ? (
        <div>
          <button
            style={{
              position: "absolute",
              bottom: "20px",
              left: "50%",
              transform: "translateX(-50%)",
              padding: "15px 30px",
              background: "#007bff",
              color: "white",
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
            Start AR Wall Texture
          </button>
          
          {!isLoading && detectedPlane && (
            <div style={{
              position: "absolute",
              top: "20px",
              left: "50%",
              transform: "translateX(-50%)",
              background: "rgba(0,255,0,0.8)",
              color: "white",
              padding: "10px 20px",
              borderRadius: "5px",
              fontSize: "14px"
            }}>
              Tap on a wall to place texture
            </div>
          )}
        </div>
      ) : (
        <p style={{ 
          color: "white", 
          textAlign: "center", 
          marginTop: "50%",
          padding: "20px"
        }}>
          AR is not supported on this device.
        </p>
      )}
    </div>
  );
};

export default ARWallTextureViewer;