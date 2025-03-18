import axios from "axios";
import React, { useState } from "react";
import "./DeliveryDetailsCheckout.css";

function DeliveryDetailsCheckout({ cartTotals }) {
  
  const [deliveryDetails, setDeliveryDetails] = useState({
    firstName: "",
    lastName: "",
    email: "",
    street: "",
    city: "",
    province: "",
    zipCode: "",
    country: "",
    phone: "",
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setDeliveryDetails((prevDetails) => ({
      ...prevDetails,
      [name]: value,
    }));
  };

  const handleCheckout = async () => {
    try {
<<<<<<< HEAD
<<<<<<< HEAD
<<<<<<< HEAD
      let response = await axios.post("https://new-sever.vercel.app/api/order", orderData, { withCredentials: true } );
      
      if (response.status === 200 && response.data.success) {
=======
=======
>>>>>>> parent of 23499c1 (Merge branch 'parakkrama_2')
=======
>>>>>>> parent of 23499c1 (Merge branch 'parakkrama_2')
      const response = await axios.post("https://new-sever.vercel.app/api/checkout", {
        deliveryDetails,
        totals: cartTotals,
      });

      if (response.status === 200) {
<<<<<<< HEAD
<<<<<<< HEAD
>>>>>>> parent of 23499c1 (Merge branch 'parakkrama_2')
=======
>>>>>>> parent of 23499c1 (Merge branch 'parakkrama_2')
=======
>>>>>>> parent of 23499c1 (Merge branch 'parakkrama_2')
        alert("Order successfully placed!");
      }
    } catch (error) {
      console.error("Error during checkout:", error);
    }
<<<<<<< HEAD
<<<<<<< HEAD
<<<<<<< HEAD
    

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
      let response = await axios.post("https://new-sever.vercel.app/api/checkout", orderData, { headers: { token } });
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
=======
>>>>>>> parent of 23499c1 (Merge branch 'parakkrama_2')
=======
>>>>>>> parent of 23499c1 (Merge branch 'parakkrama_2')
=======
>>>>>>> parent of 23499c1 (Merge branch 'parakkrama_2')
  };

  return (
    <div className="delivery-checkout-container">
      <div className="delivery-form">
        <h3>DELIVERY INFORMATION</h3>
        <form>
          <div className="form-row">
            <input
              type="text"
              name="firstName"
              placeholder="First Name"
              value={deliveryDetails.firstName}
              onChange={handleInputChange}
            />
            <input
              type="text"
              name="lastName"
              placeholder="Last Name"
              value={deliveryDetails.lastName}
              onChange={handleInputChange}
            />
          </div>
          <input
            type="email"
            name="email"
            placeholder="Email Address"
            value={deliveryDetails.email}
            onChange={handleInputChange}
          />
          <input
            type="text"
            name="street"
            placeholder="Street"
            value={deliveryDetails.street}
            onChange={handleInputChange}
          />
          <div className="form-row">
            <input
              type="text"
              name="city"
              placeholder="City"
              value={deliveryDetails.city}
              onChange={handleInputChange}
            />
            <input
              type="text"
              name="province"
              placeholder="Province"
              value={deliveryDetails.province}
              onChange={handleInputChange}
            />
          </div>
          <div className="form-row">
            <input
              type="text"
              name="zipCode"
              placeholder="Zip Code"
              value={deliveryDetails.zipCode}
              onChange={handleInputChange}
            />
            <input
              type="text"
              name="country"
              placeholder="Country"
              value={deliveryDetails.country}
              onChange={handleInputChange}
            />
          </div>
          <input
            type="text"
            name="phone"
            placeholder="Phone"
            value={deliveryDetails.phone}
            onChange={handleInputChange}
          />
        </form>
      </div>

      {/* <div className="cart-totals-section">
        <h3>CART TOTALS</h3>
        <table>
          <tbody>
            <tr>
              <td>Sub Total</td>
              <td>Rs. {cartTotals.subTotal.toLocaleString()}</td>
            </tr>
            <tr>
              <td>Delivery fee</td>
              <td>Rs. {cartTotals.deliveryFee.toLocaleString()}</td>
            </tr>
            <tr>
              <td>Total</td>
              <td>Rs. {cartTotals.total.toLocaleString()}</td>
            </tr>
          </tbody>
        </table>
        <button className="checkout-btn" onClick={handleCheckout}>
          Proceed to Checkout
        </button>
      </div> */}
    </div>
  );
}

export default DeliveryDetailsCheckout;
