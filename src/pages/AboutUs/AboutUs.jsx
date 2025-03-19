import React from 'react';
import './AboutUs.css';

const keyFeatures = [
  { title: "AR Integration", description: "View products in real-time AR mode." },
  { title: "Extensive Catalog", description: "Browse a vast range of products effortlessly." },
  { title: "Detailed Specs", description: "Check dimensions and product details." },
];

const mobileAppFeatures = [
  { title: "Scan & Place", description: "Use your phone to scan and place furniture." },
  { title: "Customization", description: "Adjust product colors and sizes in AR." },
  { title: "Instant Purchase", description: "Buy directly from the app with one tap." },
];

const benefits = [
  { icon: "🏠", title: "Easy Shopping", description: "Shop from anywhere with confidence." },
  { icon: "🛒", title: "Wide Selection", description: "Access thousands of products in one place." },
  { icon: "🚀", title: "Fast Delivery", description: "Get your items delivered quickly and safely." },
];

const AboutUs = () => {
  return (
    <div className="about-container">
      {/* Web App Section */}
      <section className="section web-app">
        <h2>Our Web App</h2>
        <p>
          Our <span className="highlight">AR-based web application</span> allows users to browse
          a vast collection of <span className="highlight">furniture, electronics, wall art,
          bathware, and kitchen essentials</span> with ease. With just a few clicks, customers
          can explore product details, check dimensions, and make informed purchasing decisions—all
          from the comfort of their homes.
        </p>

        <div className="about-features-container">
          <h3>Key Features:</h3>
          <div className="about-features-grid">
            {keyFeatures.map((feature, index) => (
              <div key={index} className="about-feature-card">
                <div className="about-feature-check">✔</div>
                <div className="about-feature-content">
                  <h4>{feature.title}</h4>
                  <p>{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mobile App Section */}
      <section className="section mobile-app">
        <h2>Our Mobile App</h2>
        <p>
          The <span className="company-name">decorIT</span> mobile app takes convenience
          a step further by providing a <span className="highlight">real-time AR shopping
          experience</span> on the go. Using your smartphone camera, you can
          <span className="highlight"> scan your space, place furniture, and customize items in
          real time.</span>
        </p>

        <div className="about-features-container">
          <h3>How It Works:</h3>
          <div className="about-features-grid">
            {mobileAppFeatures.map((feature, index) => (
              <div key={index} className="about-feature-card">
                <div className="about-feature-number">🔹</div>
                <div className="about-feature-content">
                  <h4>{feature.title}</h4>
                  <p>{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="section-footer">
          Whether you're moving into a new home or redecorating your space, our app ensures a
          hassle-free shopping experience that helps you make the right choices.
        </p>
      </section>

      {/* Why Choose Us Section */}
      <section className="section why-choose-us">
        <h2>Why Choose Us?</h2>
        <div className="benefits-grid">
          {benefits.map((benefit, index) => (
            <div key={index} className="benefit-card">
              <span className="benefit-icon">{benefit.icon}</span>
              <h4>{benefit.title}</h4>
              <p>{benefit.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Call to Action */}
      <section className="section cta">
        <p>
          Join us in revolutionizing the way homes are designed! Experience the future of
          furniture shopping with <span className="company-name">decorIT</span> today.
        </p>
        <button className="cta-button">Get Started Now 🚀</button>
      </section>
    </div>
  );
};

export default AboutUs;
