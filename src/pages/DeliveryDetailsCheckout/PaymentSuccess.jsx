import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle, Package, MapPin, CreditCard } from 'lucide-react';
import './PaymentSuccess.css';

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [orderData, setOrderData] = useState(null);

  useEffect(() => {
    // Get order data from navigation state or localStorage
    const orderFromState = location.state?.orderData;
    const orderFromStorage = JSON.parse(localStorage.getItem("latestOrder"));
    
    // Use state data if available, otherwise use localStorage
    const order = orderFromState || orderFromStorage;
    
    if (!order) {
      console.error("No order data found");
      // Optionally redirect to home or show error
      // navigate('/');
      return;
    }
    
    setOrderData(order);
    
    // Create confetti effect
    const createConfetti = () => {
      const colors = ['#4f46e5', '#34d399', '#fbbf24', '#ec4899'];
      
      for (let i = 0; i < 50; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.left = Math.random() * 100 + 'vw';
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.transform = `rotate(${Math.random() * 360}deg)`;

        confetti.animate([
          {
            top: '-10px',
            opacity: 1
          },
          {
            top: '100vh',
            opacity: 0
          }
        ], {
          duration: 2000 + Math.random() * 3000,
          easing: 'cubic-bezier(.55,.06,.68,.19)'
        });

        document.body.appendChild(confetti);

        // Remove confetti after animation
        setTimeout(() => {
          confetti.remove();
        }, 5000);
      }
    };

    createConfetti();

    // Cleanup confetti on component unmount
    return () => {
      const confetti = document.getElementsByClassName('confetti');
      while (confetti.length > 0) {
        confetti[0].parentNode.removeChild(confetti[0]);
      }
    };
  }, [location.state, navigate]);

  const handleViewOrders = () => {
    const button = document.querySelector('.orders-button');
    button.style.transform = 'scale(0.95)';
    setTimeout(() => {
      button.style.transform = 'scale(1)';

      if (orderData) {
        // Enhance with userId if available in your context/state
        // This assumes you have userId in localStorage or context
        const userId = localStorage.getItem("userId") || "user"; // Fallback if no user ID
        const orderId = orderData._id || Date.now().toString(); // Fallback if no order ID from backend
        
        navigate('/my-orders', { 
          state: { 
            orderData,
            userId,
            orderId
          }
        });
      } else {
        navigate('/my-orders');  // Fallback if no order data
      }
    }, 150);
  };

  // Format delivery address
  const formatAddress = (address) => {
    if (!address) return 'Address not available';
    
    return `${address.address}, ${address.city}, ${address.province} ${address.zipCode}, ${address.country}`;
  };

  return (
    <div className="success-container">
      <div className="success-card">
        <div className="success-icon">
          <CheckCircle size={40} color="#34d399" />
        </div>

        <h1 className="success-title">Payment Successful!</h1>

        <p className="success-message">
          Great news! Your payment has been processed successfully.
          You can track your order status in the My Orders section.
        </p>

        {orderData && (
          <div className="order-summary">
            <h2 className="summary-title">Order Summary</h2>
            
            <div className="summary-section">
              <div className="section-header">
                <Package size={18} />
                <span>Order Items ({orderData.orderItems?.length || 0})</span>
              </div>
              <div className="items-list">
                {orderData.orderItems?.map((item, index) => (
                  <div key={index} className="order-item">
                    <span className="item-name">{item.name}</span>
                    <span className="item-qty">x{item.quantity}</span>
                    <span className="item-price">Rs. {(item.price * item.quantity).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="summary-section">
              <div className="section-header">
                <MapPin size={18} />
                <span>Delivery Address</span>
              </div>
              <p className="delivery-address">{formatAddress(orderData.shippingAddress)}</p>
            </div>
            
            <div className="summary-section">
              <div className="section-header">
                <CreditCard size={18} />
                <span>Payment Details</span>
              </div>
              <div className="payment-details">
                <div className="payment-row">
                  <span>Method:</span>
                  <span>{orderData.paymentMethod}</span>
                </div>
                <div className="payment-row">
                  <span>Total Amount:</span>
                  <span className="total-amount">Rs. {orderData.totalPrice?.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <button
          className="orders-button"
          onClick={handleViewOrders}
        >
          View My Orders
        </button>
      </div>
    </div>
  );
};

export default PaymentSuccess;