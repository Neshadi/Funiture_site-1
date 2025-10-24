import { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";
import { ARButton } from "../libs/ARButton.js";
import { LoadingBar } from "../libs/LoadingBar.js";
//import "./ArViewer.css"; // Assume a CSS file for styling

const ArViewer = ({ modelId, modelPath, onClose }) => {
  const containerRef = useRef(null);
  const sceneRef = useRef(new THREE.Scene());
  const cameraRef = useRef(
    new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 20)
  );
  const rendererRef = useRef(null);
  const reticleRef = useRef(null);
  const controllerRef = useRef(null);
  const chairRef = useRef(null);
  const loadingBarRef = useRef(null);
  const hitTestSourceRequestedRef = useRef(false);
  const hitTestSourceRef = useRef(null);
  const assetsPath = "../assets/ar-shop/";

  useEffect(() => {
    // Initialize container
    const container = document.createElement("div");
    container.style.position = "fixed";
    container.style.top = "0";
    container.style.left = "0";
    container.style.width = "100%";
    container.style.height = "100%";
    container.style.zIndex = "1000";
    containerRef.current = container;
    document.body.appendChild(container);

    // Initialize loading bar
    loadingBarRef.current = new LoadingBar();
    loadingBarRef.current.visible = false;
    container.appendChild(loadingBarRef.current.element);

    // Initialize renderer
    rendererRef.current = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    rendererRef.current.setPixelRatio(window.devicePixelRatio);
    rendererRef.current.setSize(window.innerWidth, window.innerHeight);
    rendererRef.current.outputEncoding = THREE.sRGBEncoding;
    rendererRef.current.xr.enabled = true;
    container.appendChild(rendererRef.current.domElement);

    // Set camera position
    cameraRef.current.position.set(0, 1.6, 0);

    // Add ambient light
    const ambient = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1);
    ambient.position.set(0.5, 1, 0.25);
    sceneRef.current.add(ambient);

    // Initialize reticle
    reticleRef.current = new THREE.Mesh(
      new THREE.RingGeometry(0.15, 0.2, 32).rotateX(-Math.PI / 2),
      new THREE.MeshBasicMaterial()
    );
    reticleRef.current.matrixAutoUpdate = false;
    reticleRef.current.visible = false;
    sceneRef.current.add(reticleRef.current);

    // Set up XR controller
    controllerRef.current = rendererRef.current.xr.getController(0);
    controllerRef.current.addEventListener("select", () => {
      if (chairRef.current && reticleRef.current.visible) {
        chairRef.current.position.setFromMatrixPosition(reticleRef.current.matrix);
        chairRef.current.visible = true;
      }
    });
    sceneRef.current.add(controllerRef.current);

    // Set environment
    const loader = new RGBELoader().setPath("../assets/");
    loader.load("hdr/venice_sunset_1k.hdr", (texture) => {
      texture.mapping = THREE.EquirectangularReflectionMapping;
      sceneRef.current.environment = texture;
    });

    // Initialize AR
    initAR();

    // Load 3D model (hardcoded to chair2.glb for testing)
    showModel();

    // Handle resize
    const handleResize = () => {
      cameraRef.current.aspect = window.innerWidth / window.innerHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
      rendererRef.current.setAnimationLoop(null);
      document.body.removeChild(container);
    };
  }, []); // Empty dependency array since we're not using modelId or modelPath for testing

  const initAR = () => {
    // Check for WebXR support and show AR button
    if (navigator.xr && navigator.xr.isSessionSupported("immersive-ar")) {
      const arButton = ARButton.createButton(rendererRef.current, {
        requiredFeatures: ["hit-test"],
        optionalFeatures: ["dom-overlay"],
        domOverlay: { root: document.body },
      });
      arButton.classList.add("ar-button");
      containerRef.current.appendChild(arButton);
    }
  };

  const showModel = () => {
    const loader = new GLTFLoader().setPath(assetsPath);
    loadingBarRef.current.visible = true;

    loader.load(
      // Hardcoded to chair2.glb for testing
      "chair2.glb",
      (gltf) => {
        sceneRef.current.add(gltf.scene);
        chairRef.current = gltf.scene;
        chairRef.current.visible = false;
        loadingBarRef.current.visible = false;
        rendererRef.current.setAnimationLoop(render);
      },
      (xhr) => {
        loadingBarRef.current.progress = xhr.loaded / xhr.total;
      },
      (error) => {
        console.error("Error loading model:", error);
        loadingBarRef.current.visible = false;
      }
    );
  };

  const requestHitTestSource = () => {
    const session = rendererRef.current.xr.getSession();
    if (!session) return;

    session.requestReferenceSpace("viewer").then((referenceSpace) => {
      session.requestHitTestSource({ space: referenceSpace }).then((source) => {
        hitTestSourceRef.current = source;
      });
    });

    session.addEventListener("end", () => {
      hitTestSourceRequestedRef.current = false;
      hitTestSourceRef.current = null;
      onClose(); // Close AR viewer when session ends
    });

    hitTestSourceRequestedRef.current = true;
  };

  const getHitTestResults = (frame) => {
    if (!hitTestSourceRef.current) return;

    const hitTestResults = frame.getHitTestResults(hitTestSourceRef.current);
    if (hitTestResults.length) {
      const referenceSpace = rendererRef.current.xr.getReferenceSpace();
      const hit = hitTestResults[0];
      const pose = hit.getPose(referenceSpace);
      reticleRef.current.visible = true;
      reticleRef.current.matrix.fromArray(pose.transform.matrix);
    } else {
      reticleRef.current.visible = false;
    }
  };

  const render = (timestamp, frame) => {
    if (frame && !hitTestSourceRequestedRef.current) {
      requestHitTestSource();
    }
    if (frame && hitTestSourceRef.current) {
      getHitTestResults(frame);
    }
    rendererRef.current.render(sceneRef.current, cameraRef.current);
  };

  return null; // Component renders to a container outside React's DOM
};

export default ArViewer;