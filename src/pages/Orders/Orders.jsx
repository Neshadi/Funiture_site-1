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
      // Since we're using withCredentials, we don't need to send token in headers
      const response = await axios.get("https://new-sever.vercel.app/api/order", {
        withCredentials: true
      });

      
      
      if (response.data.success) {
        setOrders(response.data.data);
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

  // const handleStatusChange = async (orderId, newStatus) => {
  //   try {
  //     // Fix: Add the new status in the request body
  //     const response = await axios.put(
  //       `https://new-sever.vercel.app/api/order/${orderId}`, 
  //       { status: newStatus },
  //       { withCredentials: true }
  //     );
      
  //     if (response.data.success) {
  //       // Update the local state
  //       setOrders(orders.map(order => 
  //         order._id === orderId ? { ...order, status: newStatus } : order
  //       ));
  //       toast.success(`Order status updated to ${newStatus}`);
  //     } else {
  //       toast.error("Failed to update order status");
  //     }
  //   } catch (error) {
  //     toast.error("Error occurred while updating order status");
  //     console.error(error);
  //   }
  // };

  
 
  const handleStatusChange = async (orderId, newStatus) => {
    try {
      const response = await axios.put(
        `https://new-sever.vercel.app/api/order/${orderId}`, 
        { status: newStatus },
        { withCredentials: true }
      );
  
      if (response.data.success) {
        setOrders(prevOrders =>
          prevOrders
            .map(order => 
              order._id === orderId ? { ...order, status: newStatus } : order
            )
            // .filter(order => order.status !== "Delivered") // Remove delivered orders
        );
        toast.success(`Order status updated to ${newStatus}`);
      } else {
        toast.error("Failed to update order status");
      }
    } catch (error) {
      toast.error("Error occurred while updating order status");
      console.error(error);
    }
  };
  
  // Filter out non-delivered and delivered orders
  const nonDeliveredOrders = orders.filter(order => order.status !== "Delivered");
  const deliveredOrders = orders.filter(order => order.status === "Delivered");

  // Combine the non-delivered orders and delivered orders, non-delivered comes first
  const sortedOrders = [...nonDeliveredOrders, ...deliveredOrders];
  

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
          {sortedOrders.length === 0 ? (
            <p className="no-orders-message">No orders available</p>
          ) : (
            sortedOrders.map((order, index) => (
              <div className={`order-item ${order.status === "Delivered" ? "crossed-order" : ""}`} key={order._id || index}>
                <img src={assets.box} alt="order" />
                <div>
                  <p className='order-item-item'>
                    {order.items ? order.items.map((item, idx) => (
                      <span key={idx}>
                        {item.name} x{item.quantity}
                        {idx < order.items.length - 1 ? ', ' : ''}
                      </span>
                    )) : order.orderItems && order.orderItems.map((item, idx) => (
                      <span key={idx}>
                        {item.name} x{item.quantity}
                        {idx < order.orderItems.length - 1 ? ', ' : ''}
                      </span>
                    ))}
                  </p>
                  <p className="order-item-name">
                    {order.shippingAddress?.firstName + " " + order.shippingAddress?.lastName}
                  </p>
                  <div className="order-item-address">
                    <p>{order.shippingAddress?.address + ","}</p>
                    <p>
                      {order.shippingAddress?.city + ", " + 
                       order.shippingAddress?.province + ", " + 
                       order.shippingAddress?.country + ", " + 
                       order.shippingAddress?.zipCode}
                    </p>
                  </div>
                  <p className='order-item-phone'>{order.shippingAddress?.phone}</p>
                  <p className='order-item-email'>{order.shippingAddress?.email}</p>
                </div>
                <p>Payment Method: {order.paymentMethod || "Cash on Delivery"}</p>
                <p>Items: {order.items ? order.items.length : (order.orderItems ? order.orderItems.length : 0)}</p>
                <p>Rs. {order.amount ? order.amount.toLocaleString() : (order.totalPrice ? order.totalPrice.toLocaleString() : '0')}</p>
                <p>Current Status: <span className={`status-${(order.status || 'Item Preparing').toLowerCase().replace(/\s+/g, '-')}`}>{order.status || 'Item Preparing'}</span></p>
                <select 
                  value={order.status || 'Item Preparing'}
                  onChange={(e) => handleStatusChange(order._id, e.target.value)}
                >
                  <option value="Item Preparing">Item Preparing</option>
                  <option value="Item Packing">Item Packing</option>
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