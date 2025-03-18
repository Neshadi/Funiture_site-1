import axios from 'axios';
import React, { useEffect, useState } from "react";
import { useNavigate } from 'react-router-dom';
import { assets } from '../../assets/assets.js';
import "./Cart.css";

function Cart() {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [totals, setTotals] = useState({ subTotal: 0, deliveryFee: 0, total: 0 });

  useEffect(() => {
    // Fetch cart items from the backend
    const fetchCartItems = async () => {
      try {
        const response = await axios.get("https://new-sever.vercel.app/api/cart", {
          withCredentials: true,
        });

        if (response.status !== 200) {
          throw new Error("Failed to fetch cart items");
        }

        const data = response.data;
        console.log(data);

       

        // Calculate totals
        const subTotal = data.reduce((sum, item) => sum + item.price * item.quantity, 0);
        const deliveryFee = 500; // Example static delivery fee
        const total = subTotal + deliveryFee;

        setCartItems(data);
        setTotals({ subTotal, deliveryFee, total });
      } catch (error) {
        console.error("Error fetching cart items:", error);
      }
    };

    fetchCartItems();
  }, []);

  const handleRemoveItem = async (productId) => {
    try {
      // Send DELETE request to remove the item from the cart
      const response = await axios.delete(`https://new-sever.vercel.app/api/cart/${productId}`, {
        withCredentials: true,
      });
  
      if (response.status === 200) {
        // Directly update the frontend state by removing the item from cartItems
        setCartItems((prevItems) => prevItems.filter(item => item.productId !== productId));
  
        // Recalculate totals based on the updated cart items
        const updatedSubTotal = cartItems
          .filter(item => item.productId !== productId)
          .reduce((sum, item) => sum + item.price * item.quantity, 0);
        const deliveryFee = 500; // Example static delivery fee
        const updatedTotal = updatedSubTotal + deliveryFee;
  
        // Update totals state
        setTotals({ subTotal: updatedSubTotal, deliveryFee, total: updatedTotal });
      }
    } catch (error) {
      console.error("Error removing item from cart:", error);
    }
  };

  const handleCheckout = () => {
    navigate('/deliverydetailscheckout'); 
};
  

  return (
    <div className="cart-container">
      <main className="cart-main">
      <br></br><br></br><br></br><br></br><br></br>
        <h2>CART</h2>
        <br />
        <table className="cart-table">
          <thead>
            <tr>
              <th className="th">Items</th>
              <th className="th">Item Name</th>
              <th className="th">Item Price</th>
              <th className="th-quantity">Quantity</th>
              <th className="th">Total</th>
              <th className="th">Remove Item</th>
            </tr>
          </thead>
         
          <tbody>
            {cartItems.length > 0 ? (
              cartItems.map((item) => (
                <tr key={item._id}>
                  <td>
                    <img
                      src={item.image}
                      alt={item.name}
                      className="item-img1"
                    />
                  </td>
                  <td>{item.name}</td>
                  <td className='td-price'>Rs. {item.price.toLocaleString()}</td>
                  <td className='td-quantity'>{item.quantity}</td>
                  <td>Rs. {(item.price * item.quantity).toLocaleString()}</td>
                  <td className='td-remove'>
                    <img
                      src={assets.delete1}
                      alt="Delete Item"
                      className="remove-btn"
                      title="Delete Item"
                      onClick={() => handleRemoveItem(item.productId)} 
                    />
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6">Your cart is empty.</td>
              </tr>
            )}
          </tbody>
        </table>

        <h3>CART TOTALS</h3>
        <div className="cart-totals-with-promo">
        <div className="cart-totals">
          <table>
            <tbody>
              <tr>
                <td>Sub Total</td>
                <td className='td1'>Rs. {totals.subTotal.toLocaleString()}</td>
              </tr>
              <tr>
                <td>Delivery fee</td>
                <td className='td1'>Rs. {totals.deliveryFee.toLocaleString()}</td>
              </tr>
              <tr>
                <td>Total</td>
                <td className='td1'>Rs. {totals.total.toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
          <button className="checkout-btn" onClick={handleCheckout}>Proceed to Checkout</button>
      </div>

        <div className="promo-code">
          <p>If you have a promo code <a href='/cart'>ENTER IT HERE</a></p>
          
          <div>
            <input type="text" placeholder="Promo Code" />
            <button className='btn-submit'>Submit</button>
          </div>
        </div>
        </div>
      </main>
    </div>
  );
}

export default Cart;
