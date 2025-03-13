import { useState, useEffect } from "react";
import axios from "axios";
import "./ForgotPassword.css";

function ForgotPassword() {
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [successMessage, setSuccessMessage] = useState("");



  const checkIsEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const sendEmail = async (e) => {
    e.preventDefault();

    if (email.length==0) {
      setError("Enter Email");
      return
    }

    if (!checkIsEmail(email)) {
      setError("Email not valid");
      return
    }

    try {
      console.log("Sending email to:", email);
      const result = await axios.post(
        "http://localhost:5000/api/users/forgotpassword",
        { email }
      );

      if (result.status === 200) {
        setSuccessMessage("Email sent successfully!");
        setError(""); // Clear errors
      } else if (result.status === 404) {
        console.log(result.data);

        setError("Email not found. Please try again.");
        setSuccessMessage("");
      }
    } catch (err) {
      console.error("Error response:", err.response);
      setError(
        err.response?.data?.error || "Error sending email. Please try again."
      );
    }
  };

  return (
    <div className="container" data-testid='test_id-1'>
      <div className="form">
        <h1>Enter Your Email</h1>
        <input
          type="email"
          value={email}
          placeholder="Enter Your Email"
          onChange={(e) => setEmail(e.target.value)}
        />
        <button className="send-button" onClick={sendEmail}>
          Send
        </button>
        {error && <p className="error">{error}</p>}
        {successMessage && <p className="success">{successMessage}</p>}
      </div>
    </div>
  );
}

export default ForgotPassword;
