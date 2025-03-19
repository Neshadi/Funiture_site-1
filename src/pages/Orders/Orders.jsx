import React, { useEffect, useState } from 'react'; // Combined import
import './Orders.css';
import axios from 'axios';
import { toast } from 'react-toastify';
import { assets } from '../../assets/assets';

const Orders = ({ url }) => {
  const [orders, setOrders] = useState([]);

  const fetchAllOrders = async () => {
    try {
      const response = await axios.get(url + "/api/endpoint"); // replace with your API endpoint
      if (response.data.success) {
        setOrders(response.data.data);
        console.log(response.data.data);
      } else {
        //toast.error("Error fetching orders");
      }
    } catch (error) {
      //toast.error("Error occurred while fetching orders");
      console.error(error);
    }
  };

  useEffect(() => {
    fetchAllOrders();
  }, [url]); // Added url to dependency array for safe fetch on prop changes

  return (
    <div className='order add'>
      <h3>Order Page</h3>
      <div className="order-list">
        {orders.map((order, index) => (
          <div className="order-item" key={index}>
            <img src={assets.box2} alt="order" />
            <div>
              <p className='order-item-item'>
                {order.items.map((item, index) =>{
                  if(item === order.items.length - 1){
                    return item.name + " x "+ item.quantity}
                  else{
                    return item.name + " x "+ item.quantity + ", "
                  }
                })}
              </p>
              <p className="order-item-name">{order.address.firstName+" "+order.adress.lastName}</p>
            <div className="order-item-address">
              <p>{order.address.street+","}</p>
              <p>{order.address.city+", "+order.address.state+", "+order.address.country+", "+order.address.zipCode}</p>
            </div>
            <p className='order-item-phone'>{order.address.phone}</p>
            </div>
            <p>Items : {order.items.length}</p>
            <p>${order.amount}</p>
            <select>
              <option value="Item Preparing"></option>
              <option value="Out for Delivery"></option>
              <option value="Delivered"></option>
            </select>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Orders;
