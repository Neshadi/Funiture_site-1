import axios from "axios";
import React, { useContext, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./DeliveryDetailsCheckout.css";
import { StoreContext } from "../../context/StoreContext";

function DeliveryDetailsCheckout() {
  const { token } = useContext(StoreContext);
  const location = useLocation();
  const navigate = useNavigate();  // ✅ Initialize navigate

  const cartTotals = location.state?.cartTotals || { subTotal: 0, deliveryFee: 500, total: 0 };
  const receivedCartItems = location.state?.cartItems || [];

  const [deliveryDetails, setDeliveryDetails] = useState({
    firstName: "",
    lastName: "",
    email: "",
    address: "",
    city: "",
    province: "",
    zipCode: "",
    country: "",
    phone: "",
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setDeliveryDetails((prevDetails) => ({ ...prevDetails, [name]: value }));
  };

  const handleCheckout = async (e) => {
    e.preventDefault();

    let deliveryDetailsCheckout = receivedCartItems.map((item) => ({
      ...item,
      quantity: item.quantity,
    }));

    let orderData = {
      orderItems: deliveryDetailsCheckout, 
      shippingAddress: deliveryDetails,
      paymentMethod: "Cash on Delivery",
      totalPrice: cartTotals.total,
    };

    // ✅ Save the order data to localStorage
    localStorage.setItem("latestOrder", JSON.stringify(orderData));

    // ✅ Navigate to PaymentSuccess page
    navigate('/paymentSuccess', { state: { orderData } });
    console.log('Delivery Details:', deliveryDetailsCheckout);
    console.log('Order Details:', orderData);
    
    try {
      let response = await axios.post("http://localhost:5000/api/order", orderData, { withCredentials: true } );
      
      if (response.status === 200 && response.data.success) {
        alert("Order successfully placed!");
      } else {
        alert("Error processing your order");
      }
    } catch (error) {
      console.error("Checkout Error:", error);
      alert("Something went wrong. Please try again.");
    }
    

    {/*After creating Stripe Process uncomment this*/ }
    {/*  e.preventDefault();
    let deliveryDetailsCheckout = [];

    receivedCartItems.forEach((item) => {  // ✅ Use forEach instead of map
      let itemInfo = { ...item };
      itemInfo["quantity"] = item.quantity;
      deliveryDetailsCheckout.push(itemInfo);
    });

    let orderData = {
      address: deliveryDetails,  
      items: deliveryDetailsCheckout,
      total: cartTotals.total
    };

    try {
      let response = await axios.post("http://localhost:5000/api/checkout", orderData, { headers: { token } });
      if (response.data.success) {
        const { session_url } = response.data;
        window.location.replace(session_url);
      } else {
        alert("Error processing your order");
      }
    } catch (error) {
      console.error("Checkout Error:", error);
      alert("Something went wrong. Please try again.");
    }

    console.log(deliveryDetailsCheckout); */}
  };

  return (
    <div className="delivery-checkout-container">
      <div className="delivery-form">
        <h3>DELIVERY INFORMATION</h3>
        <form onSubmit={handleCheckout}>
          <div className="form-row">
            <input required type="text" name="firstName" placeholder="First Name" value={deliveryDetails.firstName} onChange={handleInputChange} />
            <input required type="text" name="lastName" placeholder="Last Name" value={deliveryDetails.lastName} onChange={handleInputChange} />
          </div>
          <input required type="email" name="email" placeholder="Email Address" value={deliveryDetails.email} onChange={handleInputChange} />
          <input required type="text" name="address" placeholder="address" value={deliveryDetails.address} onChange={handleInputChange} />
          <div className="form-row">
            <input required type="text" name="city" placeholder="City" value={deliveryDetails.city} onChange={handleInputChange} />
            <input required type="text" name="province" placeholder="Province" value={deliveryDetails.province} onChange={handleInputChange} />
          </div>
          <div className="form-row">
            <input required type="text" name="zipCode" placeholder="Zip Code" value={deliveryDetails.zipCode} onChange={handleInputChange} />
            <input required type="text" name="country" placeholder="Country" value={deliveryDetails.country} onChange={handleInputChange} />
          </div>
          <input required type="text" name="phone" placeholder="Phone" value={deliveryDetails.phone} onChange={handleInputChange} />
        </form>
      </div>

      <div className="place-order-right">
        <div className="cart-total-delivery">
          <h3>CART TOTALS</h3>
          <div className="cart-totals-with-promo-delivery">
            <div className="cart-totals-delivery">
              <table>
                <tbody>
                  <tr>
                    <td>Sub Total</td>
                    <td className="td1">Rs. {cartTotals.subTotal.toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td>Delivery fee</td>
                    <td className="td1">Rs. {cartTotals.deliveryFee.toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td>Total</td>
                    <td className="td1">Rs. {cartTotals.total.toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>
              <button type="submit" className="checkout-btn-delivery" onClick={handleCheckout}>
                Proceed to Payment
              </button>
            </div>

            <div className="promo-code">
              <p>
                If you have a promo code <a href="/cart">ENTER IT HERE</a>
              </p>
              <div>
                <input type="text" placeholder="Promo Code" />
                <button className="btn-submit">Submit</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DeliveryDetailsCheckout;


