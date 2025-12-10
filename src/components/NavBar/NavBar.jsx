import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { assets } from "../../assets/assets.js";
import "./NavBar.css";

const NavBar = ({ setShowLogin, isLoggedIn, handleLogout, cartItemCount }) => {
  const [menu, setMenu] = useState("home");
  const [showDropdown, setShowDropdown] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const handleButtonClick = () => {
    if (isLoggedIn) {
      handleLogout();
    } else {
      setShowLogin(true);
    }
  };

  const handleCartClick = () => {
    navigate("/cart");
    setIsMenuOpen(false); // Close menu on navigation
  };

  const handleProfileClick = () => {
    setShowDropdown(!showDropdown);
    setIsMenuOpen(false); // Close menu on profile click
  };

  const handleSignOut = () => {
    localStorage.removeItem('jwt');
    handleLogout();
    setShowDropdown(false);
    setIsMenuOpen(false); // Close menu on sign out
  };

  const handleMenuItemClick = (menuName) => {
    setMenu(menuName);
    setIsMenuOpen(false); // Close menu when a menu item is clicked
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen); // Toggle hamburger menu
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="navbar">
      <img
        src={assets.logo_black}
        alt="logo"
        className="logo"
        onClick={() => {
          navigate("/");
          setIsMenuOpen(false); // Close menu on logo click
        }}
      />
      <ul className={`navbar-menu ${isMenuOpen ? "active" : ""}`}>
        <li
          onClick={() => handleMenuItemClick("home")}
          className={menu === "home" ? "active" : ""}
        >
          <Link to="/">Home</Link>
        </li>
        <li
          onClick={() => handleMenuItemClick("category")}
          className={menu === "category" ? "active" : ""}
        >
          <Link to="/category">Category</Link>
        </li>
        <li
          onClick={() => handleMenuItemClick("mobile-app")}
          className={menu === "mobile-app" ? "active" : ""}
        >
          <Link to="/mobile-app">Mobile App</Link>
        </li>
        <li
          onClick={() => handleMenuItemClick("about-us")}
          className={menu === "about-us" ? "active" : ""}
        >
          <Link to="/about-us">About Us</Link>
        </li>
      </ul>
      <div className="navbar-toggle" onClick={toggleMenu}>
        <span className="bar"></span>
        <span className="bar"></span>
        <span className="bar"></span>
      </div>
      <div className="navbar-right">
        {isLoggedIn && (
          <>
            <div
              className="profile-image-container"
              onClick={handleProfileClick}
            >
              <img
                src={assets.profile}
                alt="profile"
                className="profile-image"
              />
            </div>
            <div
              className="navbar-search-icon"
              onClick={handleCartClick}
              style={{ cursor: "pointer" }}
            >
              <img src={assets.cart} alt="cart" className="cart" />
              {/* Show red dot only if cartItemCount > 0 */}
              {cartItemCount > 0 && <div className="dot"></div>}
            </div>
          </>
        )}
        <button onClick={handleButtonClick}>
          {isLoggedIn ? "Sign Out" : "Sign In"}
        </button>
      </div>
      {showDropdown && (
        <div className="profile-dropdown" ref={dropdownRef}>
          <ul>
            <li>
              <Link to="/profile" onClick={() => setShowDropdown(false)}>
                Edit Profile
              </Link>
            </li>
            <li>
              <Link to="/my-orders" onClick={() => setShowDropdown(false)}>
                My Orders
              </Link>
            </li>
            <li>
              <Link to="/report-issue" onClick={() => setShowDropdown(false)}>
                Report an Issue
              </Link>
            </li>
            <li onClick={handleSignOut}>Sign Out</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default NavBar;
