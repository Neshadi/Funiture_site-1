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
        <Text
          position={[0, 1.5, 0]}
          fontSize={0.3}
          color="red"
          anchorX="center"
          anchorY="middle"
        >
          Model Loading...
        </Text>
      </group>
    );
  }

  return (
    <group>
      <primitive object={scene} scale={[1, 1, 1]} />
      <Text
        position={[0, 1, 0]}
        fontSize={0.5}
        color="black"
        anchorX="center"
        anchorY="middle"
      >
        {name}
      </Text>
    </group>
  );
}

function PlaceableModel({ url, name }) {
  const [placedPosition, setPlacedPosition] = useState(null);
  const [previewPosition, setPreviewPosition] = useState(null);
  const matrix = useRef(new Matrix4());
  const { gl } = useThree();

  useEffect(() => {
    const session = gl.xr.getSession();
    if (!session) return;

    const onSelect = (event) => {
      if (previewPosition) {
        setPlacedPosition(previewPosition.clone());
      }
    };

    session.addEventListener('select', onSelect);
    return () => {
      session.removeEventListener('select', onSelect);
    };
  }, [gl.xr, previewPosition]);

  // Hit-test logic for surface detection
  useEffect(() => {
    const session = gl.xr.getSession();
    if (!session) return;

    let hitTestSource = null;
    let hitTestSourceRequested = false;

    const onFrame = (time, frame) => {
      if (!frame || !hitTestSource) {
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
        } else {
          setPreviewPosition(null);
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
        hitTestSourceRequested = true;
      } catch (err) {
        console.error('Error initializing hit-test:', err);
      }
    };

    if (session && !hitTestSourceRequested) {
      initializeHitTest();
    }

    session.addEventListener('end', () => {
      if (hitTestSource) {
        hitTestSource.cancel();
        hitTestSource = null;
      }
      hitTestSourceRequested = false;
    });

    gl.xr.addEventListener('frame', onFrame);
    return () => {
      gl.xr.removeEventListener('frame', onFrame);
      if (hitTestSource) {
        hitTestSource.cancel();
      }
    };
  }, [gl.xr]);

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
    </group>
  );
}

function ARScene({ modelUrl, productName }) {
  const [isARSupported, setIsARSupported] = useState(false);
  const [error, setError] = useState(null);
  const { store } = useXR();

  useEffect(() => {
    if (navigator.xr) {
      navigator.xr
        .isSessionSupported('immersive-ar')
        .then((supported) => {
          setIsARSupported(supported);
          if (!supported) {
            setError(
              'AR is not supported on this device. Please try on a mobile device with AR capabilities.'
            );
          }
        })
        .catch((err) => {
          console.error('Error checking AR support:', err);
          setError('Error checking AR support');
        });
    } else {
      setError(
        'WebXR is not supported on this browser. Please use a modern mobile browser.'
      );
    }
  }, []);

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
            ? "Tap 'Enter AR', then tap on a surface to place the model in your environment."
            : 'Checking AR support...'}
        </p>
      </div>

      <div className="ar-canvas-container">
        <Canvas camera={{ position: [0, 0, 5] }}>
          <XR>
            <Suspense fallback={null}>
              <PlaceableModel url={modelUrl} name={productName} />
              <Environment preset="sunset" />
            </Suspense>
          </XR>
        </Canvas>
      </div>

      <div className="ar-controls">
        <button
          onClick={() => store.enterAR({
            requiredFeatures: ['hit-test'],
            optionalFeatures: ['dom-overlay'],
            domOverlay: { root: document.body },
          })}
          className="ar-button"
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
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
          >
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
        <ARScene
          modelUrl={modelUrl}
          productName={productName || 'Unknown Product'}
        />
      </div>
    </ARViewerErrorBoundary>
  );
};

export default ARViewer;