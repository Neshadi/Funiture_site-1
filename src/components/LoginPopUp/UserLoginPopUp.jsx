import axios from 'axios';
import { GoogleAuthProvider, signInWithPopup} from 'firebase/auth';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Import navigate
import { assets } from '../../assets/assets';
import { auth } from '../../firebase/firebaseConfig';
import './UserLoginPopUp.css';

const UserLoginPopUp = ({ setShowLogin, setUserType, setIsLoggedIn }) => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [currentState, setCurrentState] = useState("LOG IN");
    // const [isLoggedIn, setIsLoggedIn] = useState(false);

    const navigate = useNavigate(); // Initialize navigate

    // Password validation function
    const validatePassword = (password) => {
        return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@!#$%^&()_+{}[\]:;"'<>,.?/])[A-Za-z\d@!#$%^&()_+{}[\]:;"'<>,.?/]{8,}$/.test(password);
    };

    // Sign-up logic
    const signUp = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');

        if (!validatePassword(password)) {
            setError('Password must be at least 8 characters long, include one uppercase letter, one lowercase letter, and one number.');
            return;
        }

        try {
            await axios.post('https://new-sever.vercel.app/api/users/', {
                name: username,
                email: email,
                password: password
            });

            setSuccessMessage('Account created successfully!');
            setUsername('');
            setEmail('');
            setPassword('');
            setCurrentState("LOG IN");
        } catch (err) {
            setError(err.response.data.message);
        }
    };

    // User login logic
    const logIn = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');

        try {
            const result = await axios.post('https://new-sever.vercel.app/api/users/auth', {
                email: email,
                password: password
            }, {
                withCredentials: true
            });

            if (result.status === 200) {
                setSuccessMessage('Logged in successfully!');
                setUserType('user'); // Set user type to 'user'
                setShowLogin(false); // Close the login popup
                setIsLoggedIn(true);
                // navigate('/cart');
            } else {
                setError('Invalid login credentials. Please try again.');
            }
        } catch (err) {
            setError(err.response.data.message);
        }
    };

    // Admin login logic
    const adminLogIn = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');

        try {
            const result = await axios.post('https://new-sever.vercel.app/api/users/adminauth', {
                email: email,
                password: password
            }, {
                withCredentials: true
            });

            if (result.status === 200) {
                setSuccessMessage('Admin logged in successfully!');
                setUserType('admin'); // Set user type to 'admin'
                setShowLogin(false); // Close the login popup
                navigate('/admin'); // Navigate to admin dashboard
            } else {
                setError('Invalid admin login credentials. Please try again.');
            }
        } catch (err) {
            setError('Error during admin login. Please try again.');
        }
    };

    // Form submission handler
    const checkSubmission = (e) => {
        if (currentState === "Sign Up") {
            signUp(e);
        } else if (currentState === "ADMIN LOGIN") {
            adminLogIn(e);
        } else {
            logIn(e);
        }
    };

    //Google login logic
    const googleLogin = () => {
        const provider = new GoogleAuthProvider();
        signInWithPopup(auth, provider)
            .then((result) => {
                console.log("Google Sign-In Successful:", result);
                 
            
                // Set user state and navigate to the next page
                setIsLoggedIn(true);
                setTimeout(() => {
                    setShowLogin(false);
                }, 100);
                // login(e);
                
                navigate('/'); // Example navigation after login
            })
            .catch((error) => {
                console.error("Google Sign-In Error:", error);
            }
        );

     };

    // const googleLogin = () => {
    //     const provider = new GoogleAuthProvider();
    //     signInWithPopup(auth, provider)
    //         .then(async (result) => {
    //             console.log("Google Sign-In Successful:", result);
    
    //             const user = result.user;
    //             const googleEmail = user.email;
    //             const password = user.password;
    
    //             try {
    //                 // Send only email (no password needed)
    //                 const loginResponse = await axios.post('https://new-sever.vercel.app/api/users/auth', {
    //                     email: googleEmail,
    //                     password: password
    //                 }, { withCredentials: true });
    
    //                 if (loginResponse.status === 200) {
    //                     setIsLoggedIn(true);
    //                     setShowLogin(false);
    //                     setUserType('user'); // Set user type if needed
    //                     navigate('/');
    //                 }
    //             } catch (error) {
    //                 console.error("Google Login Backend Error:", error);
    //                 setError(error.response?.data?.message || 'Google login failed. Please try again.');
    //             }
    //         })
    //         .catch((error) => {
    //             console.error("Google Sign-In Error:", error);
    //         });
    // };
    

    const forgotPasswordNavigate = () => {
        navigate('/forgot-password');
        setShowLogin(false); // Close the login popup
    };

    return (
        <div className="login-popup">
            <form onSubmit={checkSubmission} className="login-popup-container">
                <div className="login-popup-title">
                    <h2>{currentState}</h2>
                    <img 
                        onClick={() => {
                            console.log('Close button clicked');
                            setShowLogin(false);
                        }} 
                        src={assets.close} 
                        alt="close" 
                    />
                </div>
                <div className="login-popup-inputs">
                    {currentState === "Sign Up" && (
                        <input
                            type="text"
                            placeholder="Your name"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    )}
                    <input
                        type="email"
                        placeholder="Your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>
                {error && <p className="error-message">{error}</p>}
                {successMessage && <p className="success-message">{successMessage}</p>}
                <button type="submit" id="button1">
                    {currentState === "Sign Up" ? "Create Account" : "Log In"}
                </button>
                <button id="button2" onClick={googleLogin}>
                    {currentState !== "Sign Up" ? "Log In With Google" : "Sign Up With Google"}
                    <img src={assets.google} alt="Google Login" />
                </button>
                <button onClick={forgotPasswordNavigate} className='fogotPasswordButton'>
                    Forgot Password ?
                </button>

                <div className="login-popup-condition">
                    <input type="checkbox" required />
                    <p>By continuing, I agree to the terms of use & privacy policy.</p>
                </div>
                {currentState !== "ADMIN LOGIN" && (
                    currentState === "LOG IN" ? (
                        <p>Create a new account? <span onClick={() => setCurrentState("Sign Up")}>CLICK HERE</span></p>
                    ) : (
                        <p>Already have an account? <span onClick={() => setCurrentState("LOG IN")}>LOGIN HERE</span></p>
                    )
                )}
                {currentState === "LOG IN" && (
                    <a className='adminlogin_text'>Login As an Admin <span onClick={() => setCurrentState("ADMIN LOGIN")}>CLICK HERE</span></a>
                )}
            </form>
        </div>
    );
};

export default UserLoginPopUp;
