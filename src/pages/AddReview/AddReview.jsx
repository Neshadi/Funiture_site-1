import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Star } from 'lucide-react';
import './AddReview.css';

const AddReview = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [orderDetails, setOrderDetails] = useState(null);
  const [reviewForm, setReviewForm] = useState({
    rating: 0,
    review: '',
    productId: '',
    selectedProduct: null
  });

  useEffect(() => {
    fetchOrderDetails();
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Replace with your actual API endpoint
      const response = await axios.get(`http://localhost:5000/api/order/${orderId}`, {
        withCredentials: true,
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.data.success) {
        setOrderDetails(response.data.data);
        
        // If order has items, set the first one as default
        if (response.data.data.items && response.data.data.items.length > 0) {
          setReviewForm(prev => ({
            ...prev,
            productId: response.data.data.items[0]._id || '',
            selectedProduct: response.data.data.items[0]
          }));
        }
      } else {
        toast.error("Couldn't fetch order details");
      }
    } catch (error) {
      console.error("Error fetching order details:", error);
      toast.error("Error loading order details");
    } finally {
      setLoading(false);
    }
  };

  const handleRatingChange = (newRating) => {
    setReviewForm(prev => ({
      ...prev,
      rating: newRating
    }));
  };

  const handleProductChange = (e) => {
    const productId = e.target.value;
    const selectedProduct = orderDetails.items.find(item => item._id === productId);
    
    setReviewForm(prev => ({
      ...prev,
      productId,
      selectedProduct
    }));
  };

  const handleReviewChange = (e) => {
    setReviewForm(prev => ({
      ...prev,
      review: e.target.value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (reviewForm.rating === 0) {
      toast.warning("Please select a rating");
      return;
    }

    if (!reviewForm.productId) {
      toast.warning("Please select a product to review");
      return;
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');
      
      // Replace with your actual review API endpoint
      const response = await axios.post(`http://localhost:5000/api/review`, {
        orderId,
        productId: reviewForm.productId,
        rating: reviewForm.rating,
        review: reviewForm.review
      }, {
        withCredentials: true,
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.data.success) {
        toast.success("Review submitted successfully");
        navigate('/my-orders');
      } else {
        toast.error(response.data.message || "Failed to submit review");
      }
    } catch (error) {
      console.error("Error submitting review:", error);
      toast.error("Error submitting review");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading order details...</p>
      </div>
    );
  }

  return (
    <div className="add-review-container">
      <h1>Add a Review</h1>
      
      {orderDetails ? (
        <form onSubmit={handleSubmit} className="review-form">
          <div className="form-group">
            <label>Select Product:</label>
            <select 
              value={reviewForm.productId} 
              onChange={handleProductChange}
              className="product-select"
            >
              <option value="">Select a product</option>
              {orderDetails.items.map((item) => (
                <option key={item._id || item.name} value={item._id || item.name}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>

          {reviewForm.selectedProduct && (
            <div className="selected-product">
              <h3>{reviewForm.selectedProduct.name}</h3>
              <p>Quantity: {reviewForm.selectedProduct.quantity}</p>
            </div>
          )}

          <div className="form-group">
            <label>Rating:</label>
            <div className="rating-stars">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`star ${reviewForm.rating >= star ? 'filled' : ''}`}
                  onClick={() => handleRatingChange(star)}
                  fill={reviewForm.rating >= star ? "#FFD700" : "none"}
                  stroke={reviewForm.rating >= star ? "#FFD700" : "currentColor"}
                  size={32}
                />
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>Your Review:</label>
            <textarea
              value={reviewForm.review}
              onChange={handleReviewChange}
              placeholder="Write your review here..."
              rows={5}
              className="review-textarea"
            />
          </div>

          <div className="form-actions">
            <button 
              type="button" 
              className="cancel-btn"
              onClick={() => navigate('/my-orders')}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="submit-btn"
              disabled={submitting}
            >
              {submitting ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        </form>
      ) : (
        <p className="error-message">Could not load order details. Please try again later.</p>
      )}
    </div>
  );
};

export default AddReview;