import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { assets } from '../../assets/assets.js';
import './Profile.css';

const Profile = ({ setUserType }) => {
  // Set up state for each field with draft values
  const [userName, setUserName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  // const [displayName, setDisplayName] = useState(' ');
  const [address, setaddress] = useState('');
  const [areaDistrict, setAreaDistrict] = useState('');
  const [stateProvince, setStateProvince] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [contactNumber, setcontactNumber] = useState('');
  const [error, setError] = useState('');
  const [error1, setError1] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Shipping address as an object
  const shippingAddress = {
    address,
    district: areaDistrict,
    province: stateProvince,
    zipCode,
  };

  // Fetch user data when the component loads
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await axios.get('https://new-sever.vercel.app/api/users/profile', {
          withCredentials: true,  // Send cookies with the request if needed
        });
        const userData = response.data;
        console.log(userData);


        // Set user data into state
        setUserName(userData.name);
        setEmail(userData.email);
        setPassword(userData.password);
        setFirstName(userData.firstName);
        setLastName(userData.lastName);
        // setDisplayName(userData.displayName);
        setaddress(userData.shippingAddress.address);
        setAreaDistrict(userData.shippingAddress.district);
        setStateProvince(userData.shippingAddress.province);
        setZipCode(userData.shippingAddress.zipCode);
        setcontactNumber(userData.contactNumber);
      } catch (err) {
        setError('Error fetching user data');
      }
    };


    // Call the async function
    fetchUserData();
  }, []); // Empty array ensures this runs only once after the initial render

  const provinces = [
    'Central', 'Eastern', 'Northern', 'North Central', 'North Western',
    'Sabaragamuwa', 'Southern', 'Uva', 'Western',
  ].sort();

  const districts = {
    Central: ['Kandy', 'Matale', 'Nuwara Eliya'].sort(),
    Eastern: ['Ampara', 'Batticaloa', 'Trincomalee'].sort(),
    Northern: ['Jaffna', 'Kilinochchi', 'Mannar', 'Vavuniya', 'Mullaitivu'].sort(),
    'North Central': ['Anuradhapura', 'Polonnaruwa'].sort(),
    'North Western': ['Kurunegala', 'Puttalam'].sort(),
    Sabaragamuwa: ['Kegalle', 'Ratnapura'].sort(),
    Southern: ['Galle', 'Matara', 'Hambantota'].sort(),
    Uva: ['Badulla', 'Monaragala'].sort(),
    Western: ['Colombo', 'Gampaha', 'Kalutara'].sort(),
  };

  useEffect(() => {
    if (successMessage) {
      const timeout = setTimeout(() => {
        setSuccessMessage('');
      }, 3000);

      return () => clearTimeout(timeout); // Cleanup the timeout on unmount or when successMessage changes
    }
  }, [successMessage]);

  useEffect(() => {
    if (error) {
      const timeout = setTimeout(() => {
        setError('');
      }, 3000);

      return () => clearTimeout(timeout); // Cleanup the timeout on unmount or when successMessage changes
    }
  }, [error]);

  useEffect(() => {
    if (error1) {
      const timeout = setTimeout(() => {
        setError1('');
      }, 3000);

      return () => clearTimeout(timeout); // Cleanup the timeout on unmount or when successMessage changes
    }
  }, [error1]);

  // Function to clear input when the user clicks (focuses) on the field
  const handleFocus = (setValue) => {
    setValue('');
  };

  const handleResetClick = async () => {
    try {
      const response = await axios.get('https://new-sever.vercel.app/api/users/profile', {
        withCredentials: true,
      });
      const userData = response.data;
      console.log(userData);


      // Set user data into state
      setUserName(userData.name);
      setEmail(userData.email);
      setPassword(userData.password);
      setFirstName(userData.firstName);
      setLastName(userData.lastName);
      // setDisplayName(userData.displayName);
      setaddress(userData.shippingAddress.address);
      setAreaDistrict(userData.shippingAddress.district);
      setStateProvince(userData.shippingAddress.province);
      setZipCode(userData.shippingAddress.zipCode);
      setcontactNumber(userData.contactNumber);
    } catch (err) {
      setError('Error fetching user data');
    }
  };

  // Profile save logic
  const handleSaveClick = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    try {
      const result = await axios.put('https://new-sever.vercel.app/api/users/profile', {
        name: userName,
        email: email,
        firstName: firstName,
        lastName: lastName,
        contactNumber: contactNumber,
        shippingAddress: shippingAddress,
        password: password
      }, {
        withCredentials: true  // Send cookies with the request
      });

      if (result.status === 200) {
        setSuccessMessage('Profile Saved Successfully!');
        // setUserType('user'); 
      } else {
        setError('Invalid profile details. Please try again.');
      }
    } catch (err) {
      console.error('Error during saving:', err);
      setError('Error during saving. Please try again.');
    }

    console.log('Current State After Save:', {
      userName,
      email,
      firstName,
      lastName,
      contactNumber,
      shippingAddress,
      password,
    });
    
  };
  const handleProvinceChange = (province) => {
    setStateProvince(province);
    setAreaDistrict(''); // Clear district when province changes
  };

  return (
    <div className="profile-page">
      <div className="profile-container">
        <div className="profile-header">
          <div className="profile-image">
            <img src={assets.profile} alt="profile" className="profile-image" />

          </div>
          <div className="icon-container">
            <img src={assets.delete1} alt="Delete Profile" className="delete-icon" title="Delete Profile" />
            <img src={assets.edit} alt="Edit Profile" className="edit-icon" title="Edit Profile" />
          </div>

          <div className="profile-welcome">
            <h2>WELCOME</h2>
            <h3>{userName}</h3>
          </div>
        </div>
        <div className="profile-form">
          {/* Form for profile details */}
          <form>
            <div className="form-group">
              <label>First Name:</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                onFocus={() => handleFocus(setFirstName)}  // Clears when clicked
                placeholder='Type here'
              />
            </div>
            <div className="form-group">
              <label>Last Name:</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                onFocus={() => handleFocus(setLastName)}  // Clears when clicked
                placeholder='Type here'
              />
            </div>
            <div className="form-group">
              <label>Display Name:</label>
              <input className='input display-name-input'
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}

              />
            </div>
            <br></br>
            <div className="form-group">
              <label>Your Address:</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setaddress(e.target.value)}
                onFocus={() => handleFocus(setaddress)}  // Clears when clicked
                placeholder='Your Address'
              />
            </div>
            <br></br>
            <div className="form-group">
              <label>Province:</label>
              <select
                value={stateProvince}
                onChange={(e) => handleProvinceChange(e.target.value)}
              >
                <option value="">Select Province</option>
                {provinces.map((province) => (
                  <option key={province} value={province}>
                    {province}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>District:</label>
              <select
                value={areaDistrict}
                onChange={(e) => setAreaDistrict(e.target.value)}
                disabled={!stateProvince}
              >
                <option value="">Select District</option>
                {stateProvince &&
                  districts[stateProvince].map((district) => (
                    <option key={district} value={district}>
                      {district}
                    </option>
                  ))}
              </select>
            </div>
            <div className="form-group">
              <label>Zip Code:</label>
              <input
                type="text"
                value={zipCode}
                onChange={(e) => setZipCode(e.target.value)}
                onFocus={() => handleFocus(setZipCode)}  // Clears when clicked
                placeholder='Type here'
              />
            </div>
            <br></br>
            <div className="form-group">
              <label>Your Email:</label>
              <input className='input display-name-input'
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              // onFocus={() => handleFocus(setEmail)}  // Clears when clicked
              />
            </div>
            <br></br>

            <div className="form-group">
              <label>Contact Number:</label>
              <input
                type="tel"  // Keep type as 'tel'
                value={contactNumber}
                onChange={(e) => {
                  const { value } = e.target;
                  // Allow only digits and the '+' sign
                  if (/^[+\d]*$/.test(value)) {
                    setcontactNumber(value);
                  } else {
                    setError1("Please enter a valid number");
                  }
                }}
                onFocus={() => handleFocus(setcontactNumber)}  // Clears when clicked
                placeholder="Type here"
              />
              {error1 && <p className="error-message" style={{ color: 'red' }}>{error1}</p>}
            </div>
            {/* <div className="form-group">
              <label>Password:</label>
              <input className='input display-name-input'
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder='********'
                onFocus={() => handleFocus(setPassword)}  // Clears when clicked
              />
            </div> */}
            <br />
            <div className="form-actions">
              <button className="reset-btn" onClick={handleResetClick}>
                Reset Data
              </button>
              <button className="save-btn" onClick={handleSaveClick}>
                Save
              </button>
            </div>
            {successMessage && (
              <p className="success-message" style={{ color: 'green' }}>
                {successMessage}
              </p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;
