import React from 'react';
import './Mobileapp.css';
import { assets } from '../../assets/assets';

// SVG Icons for features
const FeatureIcons = {
  ScanIcon: () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="feature-svg-icon">
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
      <circle cx="12" cy="14" r="3" />
      <path d="M5 7V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v2" />
      <line x1="4" y1="14" x2="8" y2="14" />
      <line x1="16" y1="14" x2="20" y2="14" />
      <line x1="12" y1="6" x2="12" y2="10" />
      <line x1="12" y1="18" x2="12" y2="22" />
      <line x1="6" y1="10" x2="6" y2="18" opacity="0.5" />
      <line x1="18" y1="10" x2="18" y2="18" opacity="0.5" />
    </svg>
  ),
  
  MoveIcon: () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="feature-svg-icon">
      <rect x="4" y="10" width="16" height="10" rx="2" />
      <path d="M8 10V7a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v3" />
      <line x1="12" y1="15" x2="12" y2="15" />
      <path d="M7 7l-3 3 3 3" opacity="0.7" />
      <path d="M17 7l3 3-3 3" opacity="0.7" />
      <path d="M17 17l3-3-3-3" opacity="0.7" style={{ transform: 'translate(0px, 6px)' }} />
      <path d="M7 17l-3-3 3-3" opacity="0.7" style={{ transform: 'translate(0px, 6px)' }} />
    </svg>
  ),
  
  CustomizeIcon: () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="feature-svg-icon">
      <path d="M21 12c0 4.418-4.03 8-9 8s-9-3.582-9-8 4.03-8 9-8 9 3.582 9 8z"></path>
      <circle cx="7.5" cy="10" r="1.5" fill="currentColor" />
      <circle cx="12" cy="7.5" r="1.5" fill="currentColor" />
      <circle cx="16.5" cy="10" r="1.5" fill="currentColor" />
      <path d="M18 14h-5l-1 2h-2l-1-2H6" />
      <path d="M3 18l4-4" />
      <path d="M21 18l-4-4" />
    </svg>
  ),
  
  DetailsIcon: () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="feature-svg-icon">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
      <line x1="8" y1="11" x2="14" y2="11" />
      <line x1="11" y1="8" x2="11" y2="14" />
      <path d="M18 8l-4-4" opacity="0.7" />
      <path d="M4 14l4 4" opacity="0.7" />
    </svg>
  )
};

const Mobileapp = () => {
  const downloadApp = () => {
    const fileId = "1VONLNG3PeyAesmqgpsMt5puPomGvxZ8m";
    const directDownloadURL = `https://drive.google.com/uc?export=download&id=${fileId}`;
    window.open(directDownloadURL, "_blank");
  };
  
  const features = [
    {
      title: "Scan Your Space",
      description: "Use your camera to scan and measure your room instantly. Our AR technology creates a digital map of your space."
    },
    {
      title: "Place & Move",
      description: "Select furniture from our catalog and place it virtually in your room. Move and rotate items easily with touch gestures."
    },
    {
      title: "Customize",
      description: "Try different colors and materials to find the perfect match for your space."
    },
    {
      title: "View Details",
      description: "Get up close with detailed 3D models. Check dimensions, materials, and product information in AR."
    }
  ];

  const steps = [
    {
      number: "01",
      title: "Download the App",
      description: "Get our app from the App Store or Google Play Store"
    },
    {
      number: "02",
      title: "Scan Room",
      description: "Point your camera at your room and follow the on-screen guide to scan the space"
    },
    {
      number: "03",
      title: "Browse & Place",
      description: "Choose items from our catalog and place them in your room"
    },
    {
      number: "04",
      title: "Customize & Save",
      description: "Adjust colors, position, and save your favorite arrangements"
    }
  ];

  // Helper function to render the appropriate icon based on feature title
  const renderFeatureIcon = (title) => {
    switch (title) {
      case "Scan Your Space":
        return <FeatureIcons.ScanIcon />;
      case "Place & Move":
        return <FeatureIcons.MoveIcon />;
      case "Customize":
        return <FeatureIcons.CustomizeIcon />;
      case "View Details":
        return <FeatureIcons.DetailsIcon />;
      default:
        return null;
    }
  };

  return (
    <div>
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-video-container">
          <video
            className="hero-video"
            autoPlay
            muted
            loop
            playsInline
          >
            <source src={assets.herovideo} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <h1 className="hero-title">
            Design Your Space in Augmented Reality
          </h1>
          <p className="hero-description">
            Experience furniture and decor in your space before you buy.
            Our AR app makes home design simple and fun.
          </p>
          <button className="download-button" onClick={downloadApp}>
            Download Now
            <span>→</span>
          </button>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <h2 className="section-title">Powerful AR Features</h2>
        <div className="features-grid">
          {features.map((feature, index) => (
            <div key={index} className="feature-card">
              <div className="feature-icon">
                {renderFeatureIcon(feature.title)}
              </div>
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-description">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works Section */}
      <section className="steps-section">
        <h2 className="section-title">How It Works</h2>
        <div className="steps-grid">
          {steps.map((step, index) => (
            <div key={index} className="step-item">
              <div className="step-number">{step.number}</div>
              <h3 className="step-title">{step.title}</h3>
              <p className="step-description">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* App Preview Section */}
      <section className="preview-section">
        <div className="preview-container">
          <div className="preview-content">
            <h2 className="preview-title">Try Before You Buy</h2>
            <p className="preview-description">
              Our AR technology lets you visualize exactly how furniture and decor will look in your space.
              Experience true-to-size 3D models with accurate colors and textures.
            </p>
            <div className="store-buttons">
              <img src={assets.appstore} alt="App Store" className="store-button" />
              <img src={assets.playstore} alt="Google Play" className="store-button" />
            </div>
          </div>
          <img
            src={assets.mobile}
            alt="App preview"
            className="preview-image"
          />
        </div>
      </section>

      {/* Categories Section */}
      <section className="categories-section">
        <h2 className="section-title">Explore Categories</h2>
        <div className="categories-grid">
          {[
            {
              name: 'Furnitures',
              image: assets.furnitures
            },
            {
              name: 'Bathwares',
              image: assets.bathware2
            },
            {
              name: 'Kitchenwares',
              image: assets.kitchen2
            },
            {
              name: 'Wall Arts',
              image: assets.wallart2
            },
            {
              name: 'Electronics',
              image: assets.electronics
            }
          ].map((category, index) => (
            <div key={index} className="category-item">
              <img
                src={category.image}
                alt={category.name}
                className="category-image"
              />
              <div className="category-overlay">
                <span className="category-title">{category.name}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Mobileapp;