import React from 'react';
import './Mobileapp.css';
import { assets } from '../../assets/assets';

const Mobileapp = () => {
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
          <button className="download-button">
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
                {/* Add your icon here */}
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