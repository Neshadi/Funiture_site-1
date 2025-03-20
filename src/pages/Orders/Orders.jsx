import React, { useEffect, useState } from 'react';
import './Orders.css';
import axios from 'axios';
import { toast } from 'react-toastify';
import { assets } from '../../assets/assets';

const Orders = ({ url }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchAllOrders = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const response = await axios.get("http://localhost:5000/api/order",{
        withCredentials: true
    });
      console.log(response.data);
      if (response.data.success) {
        setOrders(response.data.data);
        console.log(response.data.data);
      } else {
        toast.error("Error fetching orders");
      }
    } catch (error) {
      toast.error("Error occurred while fetching orders");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllOrders();
  }, [url]);

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.put(`http://localhost:5000/api/order/status/${orderId}`,{
        withCredentials: true
    }
      );
      
      if (response.data.success) {      
        // Update the local state
        setOrders(orders.map(order => 
          order._id === orderId ? { ...order, status: newStatus } : order
        ));
        toast.success(`Order status updated to ${newStatus}`);
      } else {
        toast.error("Failed to update order status");
      }
    } catch (error) {
      toast.error("Error occurred while updating order status");
      console.error(error);
    }
  };

  return (
    <div className='order add'>
      <h3>Order Page</h3>
      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading orders...</p>
        </div>
      ) : (
        <div className="order-list">
          {orders.length === 0 ? (
            <p className="no-orders-message">No orders available</p>
          ) : (
            orders.map((order, index) => (
              <div className="order-item" key={order._id || index}>
                <img src={assets.box2} alt="order" />
                <div>
                  <p className='order-item-item'>
                    {order.orderItems && order.orderItems.map((item, idx) => (
                      <span key={idx}>
                        {item.name} x{item.quantity}
                        {idx < order.orderItems.length - 1 ? ', ' : ''}
                      </span>
                    ))}
                  </p>
                  <p className="order-item-name">
                    {order.shippingAddress.firstName + " " + order.shippingAddress.lastName}
                  </p>
                  <div className="order-item-address">
                    <p>{order.shippingAddress.address + ","}</p>
                    <p>
                      {order.shippingAddress.city + ", " + 
                       order.shippingAddress.province + ", " + 
                       order.shippingAddress.country + ", " + 
                       order.shippingAddress.zipCode}
                    </p>
                  </div>
                  <p className='order-item-phone'>{order.shippingAddress.phone}</p>
                  <p className='order-item-email'>{order.shippingAddress.email}</p>
                </div>
                <p>Payment Method: {order.paymentMethod || "Cash on Delivery"}</p>
                <p>Items: {order.orderItems ? order.orderItems.length : 0}</p>
                <p>Rs. {order.totalPrice ? order.totalPrice.toLocaleString() : '0'}</p>
                <p>Current Status: <span className={`status-${order.status?.toLowerCase().replace(' ', '-')}`}>{order.status || 'Item Preparing'}</span></p>
                <select 
                  value={order.status || 'Item Preparing'}
                  onChange={(e) => handleStatusChange(order._id, e.target.value)}
                >
                  <option value="Item Preparing">Item Preparing</option>
                  <option value="Packing">Item Packing</option>
                  <option value="Out for Delivery">Out for Delivery</option>
                  <option value="Delivered">Delivered</option>
                </select>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default Orders;