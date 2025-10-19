import React, { Suspense, useState, useEffect, useRef } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { XR } from '@react-three/xr';
import { Environment, useGLTF, Text } from '@react-three/drei';
import { useSearchParams } from 'react-router-dom';
import { Matrix4, Vector3 } from 'three';
import './ARViewer.css';

function Model({ url, name }) {
  const { scene } = useGLTF(url);
  console.log('Loading model from:', url, 'Scene:', scene);
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
  useEffect(() => {
    if (!isARSupported || !gl.xr) {
      console.error('WebXR not supported or gl.xr undefined');
      return;
    }
    const session = gl.xr.getSession();
    if (session) {
      onEnterAR();
    }
  }, [gl.xr, isARSupported, onEnterAR]);
  return null;
}

function PlaceableModel({ url, name }) {
  const [placedPosition, setPlacedPosition] = useState(null);
  const [previewPosition, setPreviewPosition] = useState(null);
  const matrix = useRef(new Matrix4());
  const { gl } = useThree();
  const [hitTestError, setHitTestError] = useState(null);

  useEffect(() => {
    const session = gl.xr?.getSession();
    if (!session) {
      console.error('No XR session available');
      return;
    }

    const onSelect = (event) => {
      if (previewPosition) {
        setPlacedPosition(previewPosition.clone());
      }
    };

    session.addEventListener('select', onSelect);
    return () => session.removeEventListener('select', onSelect);
  }, [gl.xr, previewPosition]);

  useEffect(() => {
    const session = gl.xr?.getSession();
    if (!session) {
      console.error('No XR session available');
      return;
    }

    let hitTestSource = null;
    let hitTestSourceRequested = false;

    const onFrame = (time, frame) => {
      if (!frame || hitTestError || !gl.xr) {
        setPreviewPosition(null);
        return;
      }
      if (!hitTestSource) {
        setPreviewPosition(null);
        return;
      }

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
    };

    const initializeHitTest = async () => {
      try {
        hitTestSource = await session.requestHitTestSource({
          space: await session.requestReferenceSpace('viewer'),
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
  }, [gl.xr, hitTestError]);

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

  useEffect(() => {
    if (navigator.xr) {
      navigator.xr
        .isSessionSupported('immersive-ar')
        .then((supported) => {
          console.log('AR Supported:', supported);
          setIsARSupported(supported);
          if (!supported) {
            setError('AR is not supported on this device.');
          }
        })
        .catch((err) => {
          console.error('Error checking AR support:', err);
          setError('Error checking AR support: ' + err.message);
        });
    } else {
      setError('WebXR is not supported on this browser.');
    }
  }, []);

  const handleEnterAR = () => {
    setEnterAR(true);
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
        <Canvas
          gl={{ antialias: true, alpha: true }} // Ensure WebGL context is properly initialized
          camera={{ position: [0, 0, 5] }}
        >
          <XR>
            {enterAR && (
              <>
                <ARController onEnterAR={handleEnterAR} isARSupported={isARSupported} />
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
          disabled={!isARSupported}
        >
          Enter AR
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