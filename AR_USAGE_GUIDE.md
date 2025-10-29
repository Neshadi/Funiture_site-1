# AR Furniture Viewer - Usage Guide

## Overview
This furniture e-commerce website now includes Augmented Reality (AR) functionality that allows users to view 3D furniture models in their real-world environment using their mobile phone's camera.

## How It Works

### 1. For Customers (Viewing AR Models)
1. **Browse Products**: Navigate to any product detail page that has a 3D model
2. **Find QR Code**: Look for the QR code on the product page
3. **Scan QR Code**: 
   - Use the "📱 Scan QR" button in the navigation menu, OR
   - Use your phone's camera app to scan the QR code directly
4. **Enter AR Mode**: The AR viewer will open automatically
5. **Place Model**: Tap "Enter AR" and point your camera at a flat surface to place the furniture

### 2. For Administrators (Adding 3D Models)
1. **Access Admin Panel**: Log in as an admin and go to the Add Product page
2. **Upload 3D Model**: Use the "Upload 3D Model" section to upload GLTF/GLB files
3. **Save Product**: The 3D model URL will be automatically included in the product data
4. **QR Code Generation**: QR codes are automatically generated for products with 3D models

## Technical Requirements

### For Users
- **Mobile Device**: iOS 11+ or Android 7+ with AR capabilities
- **Browser**: Chrome (Android) or Safari (iOS) with WebXR support
- **Camera**: Back-facing camera with AR support
- **Internet**: Stable connection for loading 3D models

### For Developers
- **3D Models**: GLTF/GLB format recommended
- **File Size**: Keep models under 10MB for optimal loading
- **Textures**: Include texture files with models
- **Optimization**: Use compressed textures and optimized geometry

## Supported Features

### AR Capabilities
- ✅ Real-world placement of 3D models
- ✅ Hit-testing for surface detection
- ✅ Model scaling and rotation
- ✅ Fallback 3D viewer for unsupported devices
- ✅ QR code scanning integration

### 3D Model Support
- ✅ GLTF/GLB format
- ✅ Textures and materials
- ✅ Animations (if present)
- ✅ Multiple model formats via Three.js

## Troubleshooting

### Common Issues

**"AR is not supported on this device"**
- Ensure you're using a supported mobile browser
- Check if your device has AR capabilities
- Try updating your browser to the latest version

**"Unable to access camera"**
- Grant camera permissions to your browser
- Ensure no other apps are using the camera
- Try refreshing the page

**"Model not loading"**
- Check your internet connection
- Verify the 3D model URL is accessible
- Ensure the model file is in GLTF/GLB format

**QR Code not scanning**
- Ensure good lighting conditions
- Hold the phone steady and at appropriate distance
- Clean the camera lens
- Try the built-in QR scanner in the navigation menu

### Browser Compatibility
- **Chrome (Android)**: Full AR support
- **Safari (iOS)**: Full AR support (iOS 11+)
- **Firefox**: Limited support, fallback to 3D viewer
- **Edge**: Limited support, fallback to 3D viewer

## Development Notes

### File Structure
```
src/
├── pages/
│   ├── ARViewer/
│   │   ├── ARViewer.jsx      # Main AR viewer component
│   │   └── ARViewer.css      # AR viewer styles
│   └── ItemDetailsPage/
│       ├── ItemDetailsPage.jsx # Updated with QR code
│       └── ItemDetailsPage.css # QR code styles
├── components/
│   ├── QRScanner/
│   │   ├── QRScanner.jsx     # QR code scanner
│   │   └── QRScanner.css     # Scanner styles
│   └── NavBar/
│       ├── NavBar.jsx        # Updated with QR scanner
│       └── NavBar.css        # QR scanner button styles
└── FireBase/
    └── Upload3DModel.jsx     # 3D model upload component
```

### Key Dependencies
- `@react-three/fiber`: React renderer for Three.js
- `@react-three/drei`: Useful helpers for Three.js
- `@react-three/xr`: WebXR support for React Three Fiber
- `jsqr`: QR code detection library
- `react-qr-code`: QR code generation

### API Integration
The AR viewer expects URL parameters:
- `model`: URL to the 3D model file
- `name`: Product name for display

Example: `/ar-viewer?model=https://example.com/model.glb&name=Modern%20Chair`

## Future Enhancements
- [ ] Support for multiple model formats
- [ ] Model customization (colors, materials)
- [ ] Social sharing of AR experiences
- [ ] Offline model caching
- [ ] Advanced lighting and shadows
- [ ] Multi-user AR sessions
