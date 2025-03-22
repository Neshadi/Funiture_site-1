import { useState, useEffect } from "react";
import axios from "axios";
import "./verifyEmail.css";
import { useNavigate } from "react-router-dom";

function VerifyEmail() {
  const [error, setError] = useState("");
  const [code,setCode] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [sending ,setSending]= useState(false);
  const navigate= useNavigate();



 

  const verifyEmail = async (e) => {
    e.preventDefault();

    if (code.length==0) {
      setError("Enter Code");
      return
    }
    setSending(true);

    try {
      console.log("Sending email to:", code);
      const result = await axios.post(
        "https://new-sever.vercel.app/api/users/verify-Email",
        { code }
      );

      setSending(false);

      if (result.status === 200) {
        setSuccessMessage("Email sent successfully!");
        setError(""); // Clear errors

        setTimeout(() => navigate("/reset-password"), 2000); // Navigate after 2 seconds

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
        <h1>Enter verify code</h1>
        <input
          type="email"
          value={code}
          placeholder="Enter verify Code"
          onChange={(e) => setCode(e.target.value)}
        />
        <button className="send-button" onClick={verifyEmail} disabled={sending}>
          Send
        </button>
        {error && <p className="error">{error}</p>}
        {successMessage && <p className="success">{successMessage}</p>}
      </div>
    </div>
  );
}

export default VerifyEmail;

//test comment