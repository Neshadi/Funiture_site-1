import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { ChevronRight } from 'lucide-react';
import { assets } from '../../assets/assets';
import { useNavigate } from 'react-router-dom';
import './MyOrders.css';

const MyOrders = ({ }) => {
  const [orders, setOrders] = useState({
    ongoing: [],
    previous: []
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchMyOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      setLoading(true);
  
      const response = await axios.get("https://new-sever.vercel.app/api/order", {
        withCredentials: true
      });
  
      let fetchedOrders = response.data.success ? response.data.data : [];
  
      // Get latest order from localStorage with your data structure
      const latestOrderString = localStorage.getItem("latestOrder");
      if (latestOrderString) {
        const latestOrder = JSON.parse(latestOrderString);
        
        // Structure the latest order to match the format needed for display
        const formattedLatestOrder = {
          items: latestOrder.orderItems.map(item => ({
            name: item.name,
            quantity: item.quantity
          })),
          amount: latestOrder.totalPrice,
          status: "Item Preparing",
          shippingAddress: latestOrder.shippingAddress,
          paymentMethod: latestOrder.paymentMethod,
          createdAt: new Date().toISOString()
        };
  
        // Add to fetched orders if not already present
        const orderExists = fetchedOrders.some(order => 
          order.amount === formattedLatestOrder.amount && 
          order.shippingAddress.email === formattedLatestOrder.shippingAddress.email
        );
  
        if (!orderExists) {
          fetchedOrders.push(formattedLatestOrder);
        }
      }
  
      // Separate orders into ongoing and previous
      const ongoing = fetchedOrders.filter(order =>
        ['Item Preparing', 'Packing', 'Out for Delivery'].includes(order.status)
      );
      
      const previous = fetchedOrders.filter(order =>
        order.status === 'Delivered'
      );
  
      setOrders({ ongoing, previous });
    } catch (error) {
      toast.error("Error occurred while fetching orders");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyOrders(); 
  }, []);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).replace(/\//g, '/');
  };

  const handleAddReview = (orderId) => {
    navigate(`/add-review/${orderId}`);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading your orders...</p>
      </div>
    );
  }

  return (
    <div className="my-orders-container">
      {/* Ongoing Orders Section */}
      <section className="orders-section">
        <h2>ONGOING ORDERS</h2>
        {orders.ongoing.length === 0 ? (
          <p className="no-orders-message">No ongoing orders</p>
        ) : (
          orders.ongoing.map((order, index) => (
            <div className="order-row" key={index}>
              <div className="order-icon">
                <img src={assets.box} alt="Package" />
              </div>

              <div className="order-items">
                {order.items.map((item, idx) => (
                  <span key={idx}>
                    {item.name} x{item.quantity}
                    {idx < order.items.length - 1 ? ', ' : ''}
                  </span>
                ))}
              </div>

              <div className="order-price">
                Rs. {order.amount ? order.amount.toLocaleString() : '0'}
              </div>

              <div className="order-count">
                Items : {order.items.length}
              </div>

              <div className="order-status">
                <span className={`status-dot ${order.status.toLowerCase().replace(' ', '-')}`}></span>
                {order.status}
              </div>

              <div className="order-actions">
                <button className="track-order-btn">
                  Track Order
                </button>
              </div>
            </div>
          ))
        )}
      </section>

      {/* Previous Orders Section */}
      <section className="orders-section">
        <h2>PREVIOUS ORDERS</h2>
        {orders.previous.length === 0 ? (
          <p className="no-orders-message">No previous orders</p>
        ) : (
          orders.previous.map((order, index) => (
            <div className="order-row" key={index}>
              <div className="order-icon">
                <img src={assets.box || "/box-icon.png"} alt="Package" />
              </div>

              <div className="order-items">
                {order.items.map((item, idx) => (
                  <span key={idx}>
                    {item.name} x{item.quantity}
                    {idx < order.items.length - 1 ? ', ' : ''}
                  </span>
                ))}
              </div>

              <div className="order-price">
                Rs. {order.amount ? order.amount.toLocaleString() : '0'}
              </div>

              <div className="order-count">
                Items: {order.items.length}
              </div>

              <div className="order-date">
                {formatDate(order.createdAt)}
              </div>

              <div className="order-status delivered">
                <span className="status-dot delivered"></span>
                Delivered
              </div>

              <div className="order-actions">
                <button className="view-details-btn">
                  <ChevronRight size={20} />
                </button>
                <button 
                  className="add-review-btn"
                  onClick={() => handleAddReview(order._id || index)}
                >
                  Add a Review
                </button>
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  );
};

export default MyOrders;
