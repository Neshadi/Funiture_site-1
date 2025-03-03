import React from 'react';
import './AboutUs.css';

const AboutUs = () => {
  const keyFeatures = [
    {
      title: "Augmented Reality (AR) Preview",
      description: "See how furniture and décor fit into your space before buying."
    },
    {
      title: "Easy Navigation",
      description: "Browse categories effortlessly and find products that suit your style."
    },
    {
      title: "Secure Shopping",
      description: "Enjoy a seamless checkout experience with multiple payment options."
    },
    {
      title: "Personalized Recommendations",
      description: "Get product suggestions based on your preferences and past interactions."
    }
  ];

  const mobileAppFeatures = [
    {
      title: "Scan Your Space",
      description: "Use your phone to scan and measure your room accurately."
    },
    {
      title: "Try Before You Buy",
      description: "Virtually place furniture and décor to see how it fits in your home."
    },
    {
      title: "Customize & Adjust",
      description: "Change colors, materials, and styles instantly."
    },
    {
      title: "Seamless Integration",
      description: "Save your favorite items and complete purchases through the app."
    }
  ];

  const benefits = [
    {
      icon: "🏆",
      title: "Innovative Technology",
      description: "We utilize AR to bridge the gap between imagination and reality."
    },
    {
      icon: "🛋️",
      title: "Extensive Product Range",
      description: "From furniture to home décor, we offer everything you need to elevate your space."
    },
    {
      icon: "🚚",
      title: "Fast & Reliable Delivery",
      description: "Get your selected products delivered safely to your doorstep."
    },
    {
      icon: "💬",
      title: "Customer Support",
      description: "Our team is always ready to assist you with any inquiries or concerns."
    }
  ];

  return (
    <div className="about-page">
      <div className="about-container">
        
        {/* Who We Are Section */}
        <section className="section who-we-are">
          <h2>Who We Are</h2>
          <p>
            At <span className="company-name">decorIT</span>, we are committed to 
            transforming the way people shop for furniture, electronics, home décor, and lifestyle 
            essentials. Our mission is to make home design effortless and enjoyable by integrating 
            cutting-edge <span className="highlight">Augmented Reality (AR) technology</span> into 
            your shopping experience. Whether you're furnishing a new home or upgrading your space, 
            we bring innovation, convenience, and style right to your fingertips.
          </p>
        </section>

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
            <span className="highlight">scan your space, place furniture, and customize items in 
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
    </div>
  );
};

export default AboutUs;