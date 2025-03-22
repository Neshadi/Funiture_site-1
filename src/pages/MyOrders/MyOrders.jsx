import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { ChevronRight, Package, Truck, Box, CheckCircle, Clock } from 'lucide-react';
import { assets } from '../../assets/assets';
import { useLocation, useNavigate } from 'react-router-dom';
import './MyOrders.css';

const MyOrders = () => {
  const [orders, setOrders] = useState({
    ongoing: [],
    previous: []
  });
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  const fetchMyOrders = async () => {
    try {
      setLoading(true);
      
      // Get orders from API
      const response = await axios.get("https://new-sever.vercel.app/api/order", {
        withCredentials: true
      });
      
      let fetchedOrders = response.data.success ? response.data.data : [];
      
      // Handle order from navigation state (if present)
      if (location.state?.orderData) {
        const navigationOrder = location.state.orderData;
        const userId = location.state.userId;
        const orderId = location.state.orderId;
        
        // Structure the order with the required format
        const formattedNavigationOrder = {
          _id: orderId,
          userId: userId,
          items: navigationOrder.orderItems.map(item => ({
            name: item.name,
            quantity: item.quantity,
            price: item.price
          })),
          amount: navigationOrder.totalPrice,
          status: "Item Preparing",
          shippingAddress: navigationOrder.shippingAddress,
          paymentMethod: navigationOrder.paymentMethod,
          createdAt: new Date().toISOString()
        };
        
        // Add to orders if not already present
        const orderExists = fetchedOrders.some(order => 
          order._id === orderId || 
          (order.amount === formattedNavigationOrder.amount && 
           order.createdAt === formattedNavigationOrder.createdAt)
        );
        
        if (!orderExists) {
          fetchedOrders.push(formattedNavigationOrder);
        }
      }
      
      // Get latest order from localStorage
      const latestOrderString = localStorage.getItem("latestOrder");
      if (latestOrderString) {
        const latestOrder = JSON.parse(latestOrderString);
        
        // Structure the latest order with the required format
        const formattedLatestOrder = {
          _id: `local_${Date.now()}`, // Generate a temporary ID
          userId: localStorage.getItem("userId") || "user",
          items: latestOrder.orderItems.map(item => ({
            name: item.name,
            quantity: item.quantity,
            price: item.price
          })),
          amount: latestOrder.totalPrice,
          status: "Item Preparing",
          shippingAddress: latestOrder.shippingAddress,
          paymentMethod: latestOrder.paymentMethod,
          createdAt: new Date().toISOString()
        };
        
        // Add to orders if not already present
        const orderExists = fetchedOrders.some(order => 
          (order.amount === formattedLatestOrder.amount && 
           order.shippingAddress.email === formattedLatestOrder.shippingAddress.email &&
           Math.abs(new Date(order.createdAt) - new Date(formattedLatestOrder.createdAt)) < 300000) // Within 5 minutes
        );
        
        if (!orderExists) {
          fetchedOrders.push(formattedLatestOrder);
        }
      }
      
      // Sort orders by date (newest first)
      fetchedOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      // Separate orders into ongoing and previous
      const ongoing = fetchedOrders.filter(order =>
        ['Item Preparing', 'Item Packing', 'Out for Delivery'].includes(order.status)
      );
      
      const previous = fetchedOrders.filter(order =>
        order.status === 'Delivered'
      );
      
      setOrders({ ongoing, previous });
    } catch (error) {
      toast.error("Error occurred while fetching orders");
      console.error("Order fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyOrders();
  }, [location.state]);

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }).replace(/\//g, '/');
    } catch (error) {
      return "Invalid date";
    }
  };
  
  const formatTime = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch (error) {
      return "";
    }
  };

  const handleAddReview = (orderId) => {
    navigate(`/add-review/${orderId}`);
  };
  
  const handleTrackOrder = (orderId) => {
    // Implement order tracking logic
    console.log("Tracking order:", orderId);
    // Could navigate to a tracking page or show a modal
  };
  
  const handleViewDetails = (orderId) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'Item Preparing':
        return <Clock size={18} />;
      case 'Item Packing':
        return <Box size={18} />;
      case 'Out for Delivery':
        return <Truck size={18} />;
      case 'Delivered':
        return <CheckCircle size={18} />;
      default:
        return <Package size={18} />;
    }
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
            <div className="order-container" key={order._id || index}>
              <div className="order-row">
                <div className="order-icon">
                  <img src={assets.box} alt="Package" />
                </div>

                <div className="order-items">
                  {order.items.slice(0, 2).map((item, idx) => (
                    <span key={idx}>
                      {item.name} x{item.quantity}
                      {idx < Math.min(order.items.length, 2) - 1 ? ', ' : ''}
                    </span>
                  ))}
                  {order.items.length > 2 && <span> +{order.items.length - 2} more</span>}
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

                <div className={`order-status ${order.status.toLowerCase().replace(/\s+/g, '-')}`}>
                  <span className={`status-icon ${order.status.toLowerCase().replace(/\s+/g, '-')}`}>
                    {getStatusIcon(order.status)}
                  </span>
                  {order.status}
                </div>

                <div className="order-actions">
                  <button 
                    className="track-order-btn"
                    onClick={() => handleTrackOrder(order._id || index)}
                  >
                    Track Order
                  </button>
                  <button 
                    className="view-details-btn"
                    onClick={() => handleViewDetails(order._id || index)}
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              </div>
              
              {expandedOrder === (order._id || index) && (
                <div className="order-details">
                  <div className="order-details-grid">
                    <div className="details-section">
                      <h4>Order Details</h4>
                      <p><strong>Order ID:</strong> {order._id || `#${index + 1}`}</p>
                      <p><strong>Date:</strong> {formatDate(order.createdAt)} at {formatTime(order.createdAt)}</p>
                      <p><strong>Payment Method:</strong> {order.paymentMethod}</p>
                      <p><strong>Status:</strong> <span className={`status-text ${order.status.toLowerCase().replace(/\s+/g, '-')}`}>{order.status}</span></p>
                    </div>
                    
                    <div className="details-section">
                      <h4>Shipping Address</h4>
                      <p>{order.shippingAddress.firstName} {order.shippingAddress.lastName}</p>
                      <p>{order.shippingAddress.address}</p>
                      <p>{order.shippingAddress.city}, {order.shippingAddress.province} {order.shippingAddress.zipCode}</p>
                      <p>{order.shippingAddress.country}</p>
                      <p>{order.shippingAddress.phone}</p>
                    </div>
                  </div>
                  
                  <div className="order-items-list">
                    <h4>Items</h4>
                    <table>
                      <thead>
                        <tr>
                          <th>Product</th>
                          <th>Quantity</th>
                          <th>Price</th>
                        </tr>
                      </thead>
                      <tbody>
                        {order.items.map((item, idx) => (
                          <tr key={idx}>
                            <td>{item.name}</td>
                            <td>{item.quantity}</td>
                            <td>Rs. {item.price ? (item.price * item.quantity).toLocaleString() : 'N/A'}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr>
                          <td colSpan="2"><strong>Total</strong></td>
                          <td><strong>Rs. {order.amount ? order.amount.toLocaleString() : '0'}</strong></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}
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
            <div className="order-container" key={order._id || `previous-${index}`}>
              <div className="order-row">
                <div className="order-icon">
                  <img src={assets.box || "/box-icon.png"} alt="Package" />
                </div>

                <div className="order-items">
                  {order.items.slice(0, 2).map((item, idx) => (
                    <span key={idx}>
                      {item.name} x{item.quantity}
                      {idx < Math.min(order.items.length, 2) - 1 ? ', ' : ''}
                    </span>
                  ))}
                  {order.items.length > 2 && <span> +{order.items.length - 2} more</span>}
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
                  <span className="status-icon delivered">
                    <CheckCircle size={18} />
                  </span>
                  Delivered
                </div>

                <div className="order-actions">
                  <button 
                    className="view-details-btn"
                    onClick={() => handleViewDetails(order._id || `previous-${index}`)}
                  >
                    <ChevronRight size={20} />
                  </button>
                  <button 
                    className="add-review-btn"
                    onClick={() => handleAddReview(order._id || `previous-${index}`)}
                  >
                    Add a Review
                  </button>
                </div>
              </div>
              
              {expandedOrder === (order._id || `previous-${index}`) && (
                <div className="order-details">
                  <div className="order-details-grid">
                    <div className="details-section">
                      <h4>Order Details</h4>
                      <p><strong>Order ID:</strong> {order._id || `#${index + 1}`}</p>
                      <p><strong>Date:</strong> {formatDate(order.createdAt)} at {formatTime(order.createdAt)}</p>
                      <p><strong>Payment Method:</strong> {order.paymentMethod}</p>
                      <p><strong>Status:</strong> <span className="status-text delivered">Delivered</span></p>
                    </div>
                    
                    <div className="details-section">
                      <h4>Shipping Address</h4>
                      <p>{order.shippingAddress.firstName} {order.shippingAddress.lastName}</p>
                      <p>{order.shippingAddress.address}</p>
                      <p>{order.shippingAddress.city}, {order.shippingAddress.province} {order.shippingAddress.zipCode}</p>
                      <p>{order.shippingAddress.country}</p>
                      <p>{order.shippingAddress.phone}</p>
                    </div>
                  </div>
                  
                  <div className="order-items-list">
                    <h4>Items</h4>
                    <table>
                      <thead>
                        <tr>
                          <th>Product</th>
                          <th>Quantity</th>
                          <th>Price</th>
                        </tr>
                      </thead>
                      <tbody>
                        {order.items.map((item, idx) => (
                          <tr key={idx}>
                            <td>{item.name}</td>
                            <td>{item.quantity}</td>
                            <td>Rs. {item.price ? (item.price * item.quantity).toLocaleString() : 'N/A'}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr>
                          <td colSpan="2"><strong>Total</strong></td>
                          <td><strong>Rs. {order.amount ? order.amount.toLocaleString() : '0'}</strong></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </section>
    </div>
  );
};

export default MyOrders;