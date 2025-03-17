import { useState } from "react";
import "./resetPassword.css"
import axios from "axios";

function ResetPassword(){

 const [error, setError] = useState("");
  const [password, setPassword] = useState("");
  const [conformPassword, setConformPassword] = useState("");
  const [resetToken ,setRestToken] =useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading,setIsLoading]= useState(false);



  const CheckPasswordAndConform = (password,conformPassword) => {
    return password===conformPassword;
  };

  const sendresetPassword = async (e) => {
    e.preventDefault();

    if (password.length===0) {
      setError("Enter Email");
      return
    }

    if(!CheckPasswordAndConform(password,conformPassword)){
        setError("Passwords are not matched")
        return;
    }
    setIsLoading(true);
    try {
      console.log("Sending Password to:", password);
      const result = await axios.put(
        "https://new-sever.vercel.app/api/users/resetpassword",
        {   resetToken,
            password 
        }
      );

      setIsLoading(false);
      if (result.status === 200) {
        setSuccessMessage("Password Reset successfully!");
        setError(""); // Clear errors
      } else if (result.status === 404) {
        console.log(result.data);

        setError("Password not Accepted");
        setSuccessMessage("");
      }
    } catch (err) {
      console.error("Error response:", err.response);
      setError(
        err.response?.data?.error || "Error reseting Password. Please try again."
      );
    }
  };

  return (
    <div className="container" data-testid='test_id-1'>
      <div className="form">
        <h1>Enter Your New Password</h1>
        <input
          type="password"
          value={password}
          placeholder="Enter Your Password"
          onChange={(e) => setPassword(e.target.value)}
        />
        <input
          type="password"
          value={conformPassword}
          placeholder="Enter Your Password"
          onChange={(e) => setConformPassword(e.target.value)}
        />
        <input
          type="text"
          value={resetToken}
          placeholder="Enter Your rest token"
          onChange={(e) => setRestToken(e.target.value)}
        />
        <button className="send-button" onClick={sendresetPassword} disabled={isLoading}>
          {isLoading ? "Processing ": "Send"}
        </button>
        {error && <p className="error">{error}</p>}
        {successMessage && <p className="success">{successMessage}</p>}
      </div>
    </div>)

}


export default ResetPassword;