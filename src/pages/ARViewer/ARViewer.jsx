import { useEffect, useRef, useState } from "react";
   import * as THREE from "three";
   import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
   import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";
   import { useSearchParams } from "react-router-dom";

   const ARViewer = () => {
     const containerRef = useRef();
     const [searchParams] = useSearchParams();
     const [isSupported, setIsSupported] = useState(false);
     const app = useRef({});

     // Use the model URL from query param, no default fallback
     const modelUrl = searchParams.get("model");

     useEffect(() => {
       const container = containerRef.current;
       if (!container) return;

       const a = app.current;
       a.assetsPath = "/assets/ar-shop/"; // For local assets if needed later
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

       a.reticle = new THREE.Mesh(
         new THREE.RingGeometry(0.15, 0.2, 32).rotateX(-Math.PI / 2),
         new THREE.MeshBasicMaterial()
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
         navigator.xr.isSessionSupported("immersive-ar").then((supported) => {
           setIsSupported(supported);
           console.log("Immersive AR supported:", supported);
         }).catch((error) => {
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
           console.log("Model placed at:", a.chair.position, "Visible:", a.chair.visible);
         } else {
           console.warn("Reticle not visible, cannot place model");
         }
       };

       a.controller = a.renderer.xr.getController(0);
       a.controller.addEventListener("select", onSelect);
       a.scene.add(a.controller);
     };

     const showChair = () => {
       const a = app.current;
       if (!modelUrl) {
         console.error("No model URL provided");
         alert("No 3D model available for this product.");
         return;
       }

       initAR(a);

       const loader = new GLTFLoader();
       loader.load(
         modelUrl,
         (gltf) => {
           a.scene.add(gltf.scene);
           a.chair = gltf.scene;
           a.chair.visible = false;
           a.chair.scale.set(1, 1, 1); // Adjust scale if needed
           console.log("GLTF Loaded Successfully:", gltf, "Model URL:", modelUrl);
           a.renderer.setAnimationLoop((timestamp, frame) => render(a, timestamp, frame));
         },
         undefined, // No progress handler
         (error) => {
           console.error("GLTF Load Error:", error);
           alert("Failed to load 3D model. Check console for details.");
         }
       );
     };

     const initAR = (a) => {
       let currentSession = a.currentSession;

       const sessionInit = { requiredFeatures: ["hit-test"] };

       const onSessionStarted = (session) => {
         session.addEventListener("end", onSessionEnded);
         a.renderer.xr.setReferenceSpaceType("local");
         a.renderer.xr.setSession(session);
         currentSession = session;
         a.currentSession = currentSession;
         console.log("XR Session started");
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
       };

       if (currentSession === null) {
         navigator.xr.requestSession("immersive-ar", sessionInit)
           .then(onSessionStarted)
           .catch((error) => {
             console.error("XR Session Request Failed:", error);
             alert("Failed to start AR session. Check device compatibility.");
             setIsSupported(false);
           });
       } else {
         currentSession.end();
       }
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
         a.reticle.visible = true;
         a.reticle.matrix.fromArray(pose.transform.matrix);
       } else {
         a.reticle.visible = false;
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
         style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", zIndex: 1000 }}
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
               cursor: "pointer",
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