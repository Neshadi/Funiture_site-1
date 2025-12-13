import React from 'react';
import { Link } from 'react-router-dom';
import { assets } from '../../assets/assets.js';
import './Footer.css';

const Footer = ({ className }) => {
  return (
    <footer className={`footer ${className}`}>      
      <div className="footer-container">
        <div className="logo">
          <Link to="/">
            <img src={assets.logo_black} alt="logo" className="logo" />
          </Link>
        </div>

        <div className="footer-section content">
          <h3>Content</h3>
          <ul>
            <li><Link to="/">Home</Link></li>
            <li><Link to="/category">Categories</Link></li>
            <li><Link to="/mobile-app">Mobile App</Link></li>
            <li><Link to="/about-us">About Us</Link></li>
            <li><Link to="/contact">Contact Us</Link></li>
          </ul>
        </div>

        <div className="footer-section contact">
          <h3>Contact Us</h3>
          <p>+94 71 1157 220</p>
          <p><a href="mailto:decorit@gmail.com">decorit@gmail.com</a></p>
          <p><Link to="/report-issue">Report an Issue</Link></p>
        </div>

        <div className="footer-section social">
          <h3>Find Us Here</h3>
          <p>You can contact us via,</p>
          <div className="social-icons">
            <a href="https://facebook.com/decorit" target="_blank" rel="noopener noreferrer">
              <i className="fa fa-facebook"></i>
            </a>
            <a href="https://twitter.com/decorit" target="_blank" rel="noopener noreferrer">
              <i className="fa fa-twitter"></i>
            </a>
            <a href="https://instagram.com/decorit" target="_blank" rel="noopener noreferrer">
              <i className="fa fa-instagram"></i>
            </a>
            <a href="https://linkedin.com/company/decorit" target="_blank" rel="noopener noreferrer">
              <i className="fa fa-linkedin"></i>
            </a>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <p>Created By DecorIT | All Rights Reserved!</p>
      </div>
    </footer>
  );
};

export default Footer;