import React, { Suspense, useState, useEffect, useRef } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { XR, useXR } from '@react-three/xr';
import { Environment, useGLTF, Text } from '@react-three/drei';
import { useSearchParams } from 'react-router-dom';
import { Matrix4, Vector3 } from 'three';
import './ARViewer.css';

function Model({ url, name }) {
  const { scene } = useGLTF(url);

  if (!scene) {
    return (
      <group>
        <mesh>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="orange" />
        </mesh>
        <Text position={[0, 1.5, 0]} fontSize={0.3} color="red">
          Model Loading...
        </Text>
      </group>
    );
  }

  return (
    <group>
      <primitive object={scene} scale={[1, 1, 1]} />
      <Text position={[0, 1, 0]} fontSize={0.5} color="black">
        {name}
      </Text>
    </group>
  );
}

function ARController({ onEnterAR, isARSupported }) {
  const { gl } = useThree();
  const { isPresenting } = useXR();

  useEffect(() => {
    if (!isARSupported || !gl.xr) return;

    // Check if we're already in AR mode
    if (isPresenting) {
      onEnterAR();
    }
  }, [gl.xr, isARSupported, onEnterAR, isPresenting]);

  return null; // This component only manages the AR session
}

function PlaceableModel({ url, name }) {
  const [placedPosition, setPlacedPosition] = useState(null);
  const [previewPosition, setPreviewPosition] = useState(null);
  const matrix = useRef(new Matrix4());
  const { gl } = useThree();
  const { isPresenting } = useXR();
  const [hitTestError, setHitTestError] = useState(null);

  useEffect(() => {
    if (!isPresenting || !gl.xr) return;

    const session = gl.xr.getSession();
    if (!session) return;

    const onSelect = (event) => {
      if (previewPosition) {
        setPlacedPosition(previewPosition.clone());
      }
    };

    session.addEventListener('select', onSelect);
    return () => session.removeEventListener('select', onSelect);
  }, [gl.xr, previewPosition, isPresenting]);

  useEffect(() => {
    if (!isPresenting || !gl.xr) return;

    const session = gl.xr.getSession();
    if (!session) return;

    let hitTestSource = null;
    let hitTestSourceRequested = false;

    const onFrame = (time, frame) => {
      if (!frame || hitTestError) {
        setPreviewPosition(null);
        return;
      }
      if (!hitTestSource) {
        setPreviewPosition(null);
        return;
      }

      try {
        const referenceSpace = gl.xr.getReferenceSpace();
        const hitTestResults = frame.getHitTestResults(hitTestSource);

        if (hitTestResults.length > 0) {
          const hit = hitTestResults[0];
          const pose = hit.getPose(referenceSpace);
          if (pose) {
            matrix.current.fromArray(pose.transform.matrix);
            setPreviewPosition(new Vector3().setFromMatrixPosition(matrix.current));
          }
        } else {
          setPreviewPosition(null);
        }
      } catch (error) {
        console.error('Error in hit test frame:', error);
        setPreviewPosition(null);
      }
    };

    const initializeHitTest = async () => {
      try {
        const referenceSpace = await session.requestReferenceSpace('viewer');
        hitTestSource = await session.requestHitTestSource({
          space: referenceSpace,
          entityTypes: ['plane'],
        });
        console.log('Hit-test source initialized:', hitTestSource);
        hitTestSourceRequested = true;
      } catch (err) {
        console.error('Hit-test initialization failed:', err);
        setHitTestError('Failed to initialize hit-test: ' + err.message);
      }
    };

    if (session && !hitTestSourceRequested) {
      initializeHitTest();
    }

    gl.xr.addEventListener('frame', onFrame);
    return () => {
      gl.xr.removeEventListener('frame', onFrame);
      if (hitTestSource) hitTestSource.cancel();
    };
  }, [gl.xr, hitTestError, isPresenting]);

  return (
    <group>
      {placedPosition && (
        <group position={placedPosition}>
          <Model url={url} name={name} />
        </group>
      )}
      {previewPosition && !placedPosition && (
        <mesh position={previewPosition} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.1, 32]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.8} />
        </mesh>
      )}
      {hitTestError && (
        <Text position={[0, 0, -2]} fontSize={0.3} color="red">
          {hitTestError}
        </Text>
      )}
    </group>
  );
}

function ARScene({ modelUrl, productName }) {
  const [isARSupported, setIsARSupported] = useState(false);
  const [error, setError] = useState(null);
  const [enterAR, setEnterAR] = useState(false);
  const [isWebXRReady, setIsWebXRReady] = useState(false);

  useEffect(() => {
    const checkARSupport = async () => {
      try {
        if (navigator.xr) {
          const supported = await navigator.xr.isSessionSupported('immersive-ar');
          console.log('AR Supported:', supported);
          setIsARSupported(supported);
          if (!supported) {
            setError('AR is not supported on this device.');
          } else {
            setIsWebXRReady(true);
          }
        } else {
          setError('WebXR is not supported on this browser.');
        }
      } catch (err) {
        console.error('Error checking AR support:', err);
        setError('Error checking AR support: ' + err.message);
      }
    };

    checkARSupport();
  }, []);

  const handleEnterAR = async () => {
    try {
      if (!navigator.xr || !isARSupported) {
        setError('AR is not available on this device.');
        return;
      }

      // Request AR session
      const session = await navigator.xr.requestSession('immersive-ar', {
        requiredFeatures: ['local'],
        optionalFeatures: ['hit-test', 'dom-overlay'],
        domOverlay: { root: document.body }
      });

      console.log('AR session started:', session);
      setEnterAR(true);
    } catch (err) {
      console.error('Failed to start AR session:', err);
      setError('Failed to start AR session: ' + err.message);
    }
  };

  if (error) {
    return (
      <div className="ar-error">
        <h2>AR Not Available</h2>
        <p>{error}</p>
        <div className="fallback-viewer">
          <h3>3D Model Viewer</h3>
          <Canvas camera={{ position: [0, 0, 5] }}>
            <Suspense fallback={null}>
              <Model url={modelUrl} name={productName} />
              <Environment preset="sunset" />
            </Suspense>
          </Canvas>
        </div>
      </div>
    );
  }

  return (
    <div className="ar-viewer">
      <div className="ar-header">
        <h1>AR Viewer</h1>
        <p>Product: {productName}</p>
        <p className="ar-instructions">
          {isARSupported
            ? "Tap 'Enter AR', then tap on a surface to place the model."
            : 'Checking AR support...'}
        </p>
      </div>

      <div className="ar-canvas-container">
        <Canvas camera={{ position: [0, 0, 5] }}>
          <XR
            foveation={0}
            frameRate={60}
            referenceSpace="local"
            onSessionStart={() => console.log('XR session started')}
            onSessionEnd={() => console.log('XR session ended')}
          >
            {enterAR && isWebXRReady && (
              <>
                <ARController onEnterAR={() => {}} isARSupported={isARSupported} />
                <PlaceableModel url={modelUrl} name={productName} />
                <Environment preset="sunset" />
              </>
            )}
          </XR>
        </Canvas>
      </div>

      <div className="ar-controls">
        <button
          onClick={handleEnterAR}
          className="ar-button"
          disabled={!isARSupported || !isWebXRReady}
        >
          {!isWebXRReady ? 'Initializing...' : 'Enter AR'}
        </button>
      </div>
    </div>
  );
}

class ARViewerErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ARViewer Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="ar-error">
          <h2>AR Viewer Error</h2>
          <p>There was an error loading the AR viewer. This might be due to:</p>
          <ul>
            <li>Unsupported browser or device</li>
            <li>Missing WebXR support</li>
            <li>Network connectivity issues</li>
          </ul>
          <button onClick={() => this.setState({ hasError: false, error: null })}>
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

const ARViewer = () => {
  const [searchParams] = useSearchParams();
  const modelUrl = searchParams.get('model');
  const productName = searchParams.get('name');
  console.log('Model URL:', modelUrl, 'Product Name:', productName);

  if (!modelUrl) {
    return (
      <div className="ar-error">
        <h2>No Model URL Provided</h2>
        <p>Please scan a valid QR code to view a 3D model in AR.</p>
      </div>
    );
  }

  return (
    <ARViewerErrorBoundary>
      <div className="ar-viewer-container">
        <ARScene modelUrl={modelUrl} productName={productName || 'Unknown Product'} />
      </div>
    </ARViewerErrorBoundary>
  );
};

export default ARViewer;