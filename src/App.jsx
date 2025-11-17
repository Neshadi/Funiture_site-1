import React, { useEffect, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import AdminNavbar from './components/AdminNavbar/AdminNavbar';
import AdminSidebar from './components/AdminSidebar/AdminSidebar';
import Footer from './components/Footer/Footer';
import ItemDisplay from './components/TopItemDisplay/ItemDisplay';
import UserLoginPopUp from './components/LoginPopUp/UserLoginPopUp';
import NavBar from './components/NavBar/NavBar';
import AboutUs from './pages/AboutUs/AboutUs';
import Add from './pages/Add/Add';
import Cart from './pages/Cart/Cart';
import Category from './pages/Category/Category';
import DeliveryDetailsCheckout from './pages/DeliveryDetailsCheckout/DeliveryDetailsCheckout';
import Home from './pages/Home/Home';
import List from './pages/List/List';
import Mobileapp from './pages/Mobileapp/Mobileapp';
import Orders from './pages/Orders/Orders';
import Profile from './User/Profile/Profile';
import PaymentSuccess from './pages/DeliveryDetailsCheckout/PaymentSuccess';
import MyOrders from './pages/MyOrders/MyOrders';
import AddReview from './pages/AddReview/AddReview';
import ItemDetailsPage from './pages/ItemDetailsPage/ItemDetailsPage';
import Fogotpassword from './pages/FogotPassWord/ForgotPassword';
import ResetPassword from './pages/resetPassword/ResetPassword';
import VerifyEmail from './pages/verifyEmail/verifyEmail';
import NotFound from './pages/404/NotFound';
import ReportIssue from './pages/ReportIssue/ReportIssue';
import ARViewer from "./pages/ARViewer/ARViewer";
import '@fortawesome/fontawesome-free/css/all.min.css';

// Reusable Layout Components
const UserLayout = ({ children, isLoggedIn, handleLogout, setShowLogin }) => (
  <>
    <NavBar isLoggedIn={isLoggedIn} handleLogout={handleLogout} setShowLogin={setShowLogin} />
    <main className="page-content">{children}</main>
    <Footer />
  </>
);

const AuthRequired = ({ children, isLoggedIn, setShowLogin, setIsLoggedIn, setUserType }) => {
  if (!isLoggedIn) {
    setShowLogin(true);
    return (
      <UserLayout isLoggedIn={false} setShowLogin={setShowLogin}>
        <div className="auth-message">
          <h2>Please log in to continue</h2>
        </div>
      </UserLayout>
    );
  }
  return children;
};

const App = () => {
  const [userType, setUserType] = useState(null);
  const [showLogin, setShowLogin] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Load auth state
  useEffect(() => {
    try {
      const savedIsLoggedIn = localStorage.getItem('auth.isLoggedIn');
      const savedUserType = localStorage.getItem('auth.userType');
      if (savedIsLoggedIn === 'true') setIsLoggedIn(true);
      if (savedUserType) setUserType(savedUserType);
    } catch (_) {}
  }, []);

  // Persist auth state
  useEffect(() => {
    try {
      localStorage.setItem('auth.isLoggedIn', String(isLoggedIn));
      if (userType) {
        localStorage.setItem('auth.userType', userType);
      } else {
        localStorage.removeItem('auth.userType');
      }
    } catch (_) {}
  }, [isLoggedIn, userType]);

  const handleLogout = () => {
    setUserType(null);
    setIsLoggedIn(false);
    setShowLogin(false);
    try {
      localStorage.removeItem('auth.isLoggedIn');
      localStorage.removeItem('auth.userType');
    } catch (_) {}
  };

  return (
    <div className="app-container">
      <ToastContainer position="top-right" autoClose={3000} />

      {showLogin && (
        <UserLoginPopUp
          setShowLogin={setShowLogin}
          setIsLoggedIn={setIsLoggedIn}
          setUserType={setUserType}
        />
      )}

      <Routes>
        {/* Public Routes */}
        <Route
          path="/"
          element={
            <UserLayout isLoggedIn={isLoggedIn} handleLogout={handleLogout} setShowLogin={setShowLogin}>
              <Home />
              <ItemDisplay category="All" />
            </UserLayout>
          }
        />

        <Route
          path="/category"
          element={
            <UserLayout isLoggedIn={isLoggedIn} handleLogout={handleLogout} setShowLogin={setShowLogin}>
              <Category />
            </UserLayout>
          }
        />

        <Route
          path="/report-issue"
          element={
            <UserLayout isLoggedIn={isLoggedIn} handleLogout={handleLogout} setShowLogin={setShowLogin}>
              <ReportIssue />
            </UserLayout>
          }
        />

        <Route
          path="/mobile-app"
          element={
            <UserLayout isLoggedIn={isLoggedIn} handleLogout={handleLogout} setShowLogin={setShowLogin}>
              <Mobileapp />
            </UserLayout>
          }
        />

        <Route
          path="/Item-Page/:id"
          element={
            <UserLayout isLoggedIn={isLoggedIn} handleLogout={handleLogout} setShowLogin={setShowLogin}>
              <ItemDetailsPage />
            </UserLayout>
          }
        />

        <Route
          path="/forgot-password"
          element={
            <UserLayout isLoggedIn={isLoggedIn} handleLogout={handleLogout} setShowLogin={setShowLogin}>
              <Fogotpassword />
            </UserLayout>
          }
        />

        <Route
          path="/reset-password"
          element={
            <UserLayout isLoggedIn={isLoggedIn} handleLogout={handleLogout} setShowLogin={setShowLogin}>
              <ResetPassword />
            </UserLayout>
          }
        />

        <Route
          path="/verify-Email"
          element={
            <UserLayout isLoggedIn={isLoggedIn} handleLogout={handleLogout} setShowLogin={setShowLogin}>
              <VerifyEmail />
            </UserLayout>
          }
        />

        <Route
          path="/about-us"
          element={
            <UserLayout isLoggedIn={isLoggedIn} handleLogout={handleLogout} setShowLogin={setShowLogin}>
              <AboutUs />
            </UserLayout>
          }
        />

        {/* Fullscreen AR Viewer - No Layout */}
        <Route path="/ar-viewer" element={<ARViewer />} />

        {/* Auth Required Routes */}
        <Route
          path="/cart"
          element={
            <AuthRequired
              isLoggedIn={isLoggedIn}
              setShowLogin={setShowLogin}
              setIsLoggedIn={setIsLoggedIn}
              setUserType={setUserType}
            >
              <UserLayout isLoggedIn={isLoggedIn} handleLogout={handleLogout} setShowLogin={setShowLogin}>
                <Cart />
              </UserLayout>
            </AuthRequired>
          }
        />

        <Route
          path="/deliverydetailscheckout"
          element={
            <AuthRequired isLoggedIn={isLoggedIn} setShowLogin={setShowLogin}>
              <UserLayout isLoggedIn={isLoggedIn} handleLogout={handleLogout} setShowLogin={setShowLogin}>
                <DeliveryDetailsCheckout />
              </UserLayout>
            </AuthRequired>
          }
        />

        <Route
          path="/paymentSuccess"
          element={
            <AuthRequired isLoggedIn={isLoggedIn} setShowLogin={setShowLogin}>
              <UserLayout isLoggedIn={isLoggedIn} handleLogout={handleLogout} setShowLogin={setShowLogin}>
                <PaymentSuccess />
              </UserLayout>
            </AuthRequired>
          }
        />

        <Route
          path="/my-orders"
          element={
            <AuthRequired isLoggedIn={isLoggedIn} setShowLogin={setShowLogin}>
              <UserLayout isLoggedIn={isLoggedIn} handleLogout={handleLogout} setShowLogin={setShowLogin}>
                <MyOrders />
              </UserLayout>
            </AuthRequired>
          }
        />

        <Route
          path="/add-review/:orderId"
          element={
            <AuthRequired isLoggedIn={isLoggedIn} setShowLogin={setShowLogin}>
              <UserLayout isLoggedIn={isLoggedIn} handleLogout={handleLogout} setShowLogin={setShowLogin}>
                <AddReview />
              </UserLayout>
            </AuthRequired>
          }
        />

        <Route
          path="/profile"
          element={
            <AuthRequired isLoggedIn={isLoggedIn} setShowLogin={setShowLogin}>
              <UserLayout isLoggedIn={isLoggedIn} handleLogout={handleLogout} setShowLogin={setShowLogin}>
                <Profile />
              </UserLayout>
            </AuthRequired>
          }
        />

        {/* Admin Dashboard */}
        <Route
          path="/admin/*"
          element={
            userType === 'admin' ? (
              <div className="admin-dashboard">
                <AdminNavbar />
                <div className="admin-body">
                  <AdminSidebar />
                  <div className="admin-main">
                    <Routes>
                      <Route path="/" element={<Navigate to="add" replace />} />
                      <Route path="add" element={<Add />} />
                      <Route path="list" element={<List />} />
                      <Route path="orders" element={<Orders />} />
                    </Routes>
                  </div>
                </div>
              </div>
            ) : (
              <Navigate to="/" replace />
            )
          }
        />

        {/* 404 */}
        <Route
          path="*"
          element={
            <UserLayout isLoggedIn={isLoggedIn} handleLogout={handleLogout} setShowLogin={setShowLogin}>
              <NotFound />
            </UserLayout>
          }
        />
      </Routes>
    </div>
  );
};

export default App;