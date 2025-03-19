import React, { useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import AdminNavbar from './components/AdminNavbar/AdminNavbar';
import AdminSidebar from './components/AdminSidebar/AdminSidebar';
import Footer from './components/Footer/Footer';
import ItemDisplay from './components/ItemDisplay/ItemDisplay';
import UserLoginPopUp from './components/LoginPopUp/UserLoginPopUp';
import NavBar from './components/NavBar/NavBar';
import AboutUs from './pages/AboutUs/AboutUs';
import Add from './pages/Add/Add';
import Cart from './pages/Cart/Cart';
import Category from './pages/Category/Category';
import DeliveryDetailsCheckout from './pages/DeliveryDetailsCheckout/DeliveryDetailsCheckout';
import Home from './pages/Home/Home';
import ItemDetailsPage from './pages/ItemDetailsPage/ItemDetailsPage';
import List from './pages/List/List';
import Mobileapp from './pages/Mobileapp/Mobileapp';
import Orders from './pages/Orders/Orders';
import Profile from './User/Profile/Profile';

const App = () => {
  const [userType, setUserType] = useState(null); // Track if the user is an admin or regular user
  const [showLogin, setShowLogin] = useState(false); // Control login popup visibility
  const [isLoggedIn, setIsLoggedIn] = useState(false); // Track login state

  // Function to handle logout
  const handleLogout = () => {
    setUserType(null); // Reset user type
    setIsLoggedIn(false); // Set logged-in state to false
    setShowLogin(false); // Hide the login popup
  };

  return (
    <div>
      <ToastContainer />
      <Routes>
        {/* Login Page */}
        <Route
          path="/"
          element={
            <>
              <NavBar
                isLoggedIn={isLoggedIn}
                handleLogout={handleLogout}
                setShowLogin={setShowLogin}
              />
           
              <Home />
              <ItemDisplay category={"All"}/> 
              <ItemDetailsPage/> 
            </>
          }
        />

        {/* Category Page */}
        <Route
          path="/category"
          element={
            <>
              <NavBar isLoggedIn={isLoggedIn} handleLogout={handleLogout} setShowLogin={setShowLogin} />
              <Category />
            </>
          }
        />

        {/* Mobile App Page */}
        <Route
          path="/mobile-app"
          element={
            <>
              <NavBar isLoggedIn={isLoggedIn} handleLogout={handleLogout}  setShowLogin={setShowLogin} />
              <Mobileapp />
            </>
          }
        />
        <Route path='/Item-Page/:id'
        element={ <>
        <NavBar isLoggedIn={isLoggedIn} handleLogout={handleLogout} setShowLogin={setIsLoggedIn}/>
        <ItemDetailsPage/>
        </>

        }/>
        <Route
          path="/cart"
          element={
            <>
              <NavBar isLoggedIn={isLoggedIn} handleLogout={handleLogout}  setShowLogin={setShowLogin} />
              <Cart />
            </>
          }
        />
    <Route
  path="/cart"
  element={
    isLoggedIn ? (
      <>
        <NavBar isLoggedIn={isLoggedIn} handleLogout={handleLogout} setShowLogin={setShowLogin} />
        <Cart />
      </>
    ) : (
     
        <UserLoginPopUp
          setShowLogin={setShowLogin}
          setIsLoggedIn={setIsLoggedIn}
          setUserType={setUserType}
        />
      
    )
  }
/>




        <Route
          path="/deliverydetailscheckout"
          element={
            <>
              <NavBar isLoggedIn={isLoggedIn} handleLogout={handleLogout}  setShowLogin={setShowLogin}/>
              <DeliveryDetailsCheckout />
            </>
          }
        />

        {/* About Us Page */}
        <Route
          path="/about-us"
          element={
            <>
              <NavBar isLoggedIn={isLoggedIn} handleLogout={handleLogout}  setShowLogin={setShowLogin} />
              <AboutUs />
            </>
          }
        />

        {/* Profile Page (Accessible to both User and Admin) */}
        <Route
          path="/profile"
          element={
            <>
              <NavBar isLoggedIn={true} handleLogout={handleLogout}  setShowLogin={setShowLogin}/>
              <Profile />
            </>
          }
        />

        {/* Admin Dashboard */}
        <Route
          path="/admin/*"
          element={
            userType === 'admin' ? (
              <div className="admin-page">
                {/* Admin Navbar */}
                <AdminNavbar />

                <div className="admin-content">
                  {/* Admin Sidebar */}
                  <AdminSidebar />

                  <div className="main-content">
                    <Routes>
                      {/* Default to Add Page */}
                      <Route path="/" element={<Navigate to="add" replace />} />
                      {/* Add Route */}
                      <Route path="add" element={<Add />} />
                      {/* List Route */}
                      <Route path="list" element={<List />} />
                      {/* Orders Route */}
                      <Route path="orders" element={<Orders />} />
                    </Routes>
                  </div>
                </div>
              </div>
            ) : (
              <Navigate to="/" />
            )
          }
        />
      </Routes>
      {showLogin && (
        <UserLoginPopUp
          setShowLogin={setShowLogin}
          setIsLoggedIn={setIsLoggedIn}
          setUserType={setUserType}
        />
      )}
      <Footer />
    </div>
  );
};

export default App;
