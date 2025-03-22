import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Star } from 'lucide-react';
import './AddReview.css';

const AddReview = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [orderDetails, setOrderDetails] = useState(null);
  const [reviewForm, setReviewForm] = useState({
    rating: 0,
    review: '',
    productId: '',
    selectedProduct: null
  });

  useEffect(() => {
    // First try to use the data passed in location state
    if (location.state?.orderDetails) {
      setOrderDetails(location.state.orderDetails);

      // If order has items, set the first one as default
      if (location.state.orderDetails.items && location.state.orderDetails.items.length > 0) {
        setReviewForm(prev => ({
          ...prev,
          productId: location.state.orderDetails.items[0]._id || location.state.orderDetails.items[0].name,
          selectedProduct: location.state.orderDetails.items[0]
        }));
      }
      setLoading(false);
    } else {
      // Fallback to fetching from API
      fetchOrderDetails();
    }
  }, [orderId, location.state]);

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);

      // Get order from API
      const response = await axios.get(`https://new-sever.vercel.app/api/order/${orderId}`, {
        withCredentials: true
      });
      console.log(response.data);
      if (response.data) {
        console.log("test2");
        setOrderDetails(response.data);


        // If order has items, set the first one as default
        if (response.data.orderItems && response.data.orderItems.length > 0) {
          console.log("test3");
          setReviewForm(prev => ({
            ...prev,
            productId: response.data.orderItems[0].productId || response.data.orderItems[0].name,
            selectedProduct: response.data.orderItems[0]
          }));
        }
      } else {
        toast.error(response.data.message || "Couldn't fetch order details");
      }
    } catch (error) {
      console.log("test4");
      console.error("Error fetching order details:", error);
      // Check for local orders in localStorage if API fails
      const latestOrderString = localStorage.getItem("latestOrder");
      if (latestOrderString && orderId.startsWith('local_')) {
        try {
          const latestOrder = JSON.parse(latestOrderString);

          // Format the order to match the expected structure
          const formattedOrder = {
            _id: orderId,
            items: latestOrder.orderItems.map(item => ({
              _id: item._id || item.name,
              name: item.name,
              quantity: item.quantity,
              price: item.price
            })),
            amount: latestOrder.totalPrice,
            status: "Delivered",
            shippingAddress: latestOrder.shippingAddress,
            paymentMethod: latestOrder.paymentMethod
          };

          setOrderDetails(formattedOrder);

          if (formattedOrder.items.length > 0) {
            setReviewForm(prev => ({
              ...prev,
              productId: formattedOrder.items[0]._id || formattedOrder.items[0].name,
              selectedProduct: formattedOrder.items[0]
            }));
          }
        } catch (parseError) {
          console.error("Error parsing local order:", parseError);
          toast.error("Error loading order details");
        }
      } else {
        // Display more specific error message
        if (error.response) {
          toast.error(`Error: ${error.response.data.message || "Server error"}`);
        } else if (error.request) {
          toast.error("Network error. Please check your connection.");
        } else {
          toast.error("Error loading order details");
        }
      }
    } finally {
      console.log("test5");
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
    const selectedProduct = orderDetails.items.find(item =>
      (item._id && item._id === productId) || (!item._id && item.name === productId)
    );

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
      console.log("test6");
      // Review API endpoint
      const response = await axios.post(`https://new-sever.vercel.app/api/products/reviews/${reviewForm.productId}`, {
        rating: reviewForm.rating,
        comment: reviewForm.review,
      }, {
        withCredentials: true
      });

      if (response.status == 201) {
        toast.success("Review submitted successfully");
        navigate('/my-orders');
      } else {
        toast.error(response.data.message || "Failed to submit review");
      }
    } catch (error) {
      console.log("test7");
      console.error("Error submitting review:", error);

      // If it's a local order (not yet in the database), store in localStorage
      if (orderId.startsWith('local_')) {
        try {
          // Store review in localStorage
          const reviewsString = localStorage.getItem('productReviews') || '{}';
          const reviews = JSON.parse(reviewsString);

          const productKey = reviewForm.productId || reviewForm.selectedProduct.name;
          if (!reviews[productKey]) {
            reviews[productKey] = [];
          }

          reviews[productKey].push({
            rating: reviewForm.rating,
            review: reviewForm.review,
            productName: reviewForm.selectedProduct.name,
            timestamp: new Date().toISOString(),
            userId: localStorage.getItem('userId') || 'anonymous'
          });

          localStorage.setItem('productReviews', JSON.stringify(reviews));
          toast.success("Review saved successfully");
          navigate('/my-orders');
        } catch (saveError) {
          console.error("Error saving review locally:", saveError);
          toast.error("Error saving review");
        }
      } else {
        toast.error("Error submitting review. Please try again later.");
      }
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
              {orderDetails.orderItems.map((item, index) => (
                <option key={item._id || `${item.name}-${index}`} value={item._id || item.name}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>

          {reviewForm.selectedProduct && (
            <div className="selected-product">
              <h3>{reviewForm.selectedProduct.name}</h3>
              <p>Quantity: {reviewForm.selectedProduct.quantity}</p>
              <p>Price: Rs. {reviewForm.selectedProduct.price ? reviewForm.selectedProduct.price.toLocaleString() : 'N/A'}</p>
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