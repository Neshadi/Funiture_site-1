import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Star } from "lucide-react";
import "./ItemDetailsPage.css";
import axios from "axios";
import QRCode from "react-qr-code";

const ItemDetails = ({ onCartUpdate }) => {
  const { id } = useParams();
  const [quantity, setQuantity] = useState(1);
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [isAdded, setIsAdded] = useState(false);
  const [notification, setNotification] = useState("");
  const [loading, setLoading] = useState(true);

  // Function to hide notification after 3 seconds
  const hideNotification = () => {
    setTimeout(() => {
      setNotification("");
      setIsAdded(false);
    }, 3000);
  };

  const addToCart = async () => {
    try {
      const response = await axios.post(
        "http://localhost:5000/api/cart",
        {
          productId: id,
          quantity: quantity,
        },
        {
          withCredentials: true,
        }
      );

      if (response.status === 201) {
        setIsAdded(true);
        setNotification("Item added to cart successfully!");
        if (onCartUpdate) {
          onCartUpdate(); // Update cart count in navbar
        }
        hideNotification();
      }
    } catch (error) {
      console.error("Error adding to cart:", error);
      setNotification("Failed to add item to cart.");
      hideNotification();
    }
  };

  // Fetch product details and reviews
  useEffect(() => {
    const fetchItemDetails = async () => {
      try {
        setLoading(true);
        const productResponse = await axios.get(
          `http://localhost:5000/api/products/${id}`
        );

        if (productResponse.status === 200) {
          setProduct(productResponse.data);

          // Fetch reviews for this product
          try {
            const reviewsResponse = await axios.get(
              `http://localhost:5000/api/products/reviews/${id}`
            );

            if (reviewsResponse.status === 200) {
              setReviews(reviewsResponse.data || []);
              console.log(reviews);
            }
          } catch (reviewErr) {
            console.error("Error fetching reviews:", reviewErr);
          }
        }
      } catch (err) {
        console.error("Error fetching product data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchItemDetails();
  }, [id]);


  return (
    <div>
      {notification && (
        <div className={`notification ${isAdded ? "success" : "error"}`}>
          {notification}
        </div>
      )}

      <div className="container">
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading product details...</p>
          </div>
        ) : product ? (
          <div className="product">
            {/* Product Image */}
            <div className="product-image">
              <img src={product.image} alt={product.name} />
            </div>

            {/* Product Details */}
            <div className="details">
              <h2>{product.name}</h2>
              <p className="description">{product.description}</p>
              <p className="price">${product.price?.toFixed(2)}</p>
              <p
                className={`stock ${product.stock > 0 ? "in-stock" : "out-of-stock"
                  }`}
              >
                {product.stock > 0
                  ? `In Stock (${product.stock} left)`
                  : "Out of Stock"}
              </p>

              {/* Quantity Selector */}
              <div className="quantity">
                <button
                  onClick={() => setQuantity((prev) => Math.max(prev - 1, 1))}
                  disabled={quantity <= 1}
                >
                  -
                </button>
                <span>{quantity}</span>
                <button
                  onClick={() => setQuantity((prev) => prev + 1)}
                  disabled={quantity >= product.stock}
                >
                  +
                </button>
              </div>

              {/* Rating Display */}
              <div className="rating-display">
                <div className="rating-stars">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`star ${reviews.rating >= star ? 'filled' : ''}`}
                      fill={reviews.rating >= star ? "#FFD700" : "none"}
                      stroke={reviews.rating >= star ? "#FFD700" : "currentColor"}
                      size={24}
                    />
                  ))}
                </div>
                <span className="rating-value">{reviews.rating.toFixed(1)}</span>
                <span className="review-count">({reviews.numReviews} reviews)</span>
              </div>

              {/* Action Buttons */}
              <div className="actions">
                <button
                  onClick={addToCart}
                  className="button add-to-cart"
                  disabled={product.stock <= 0}
                >
                  Add to Cart
                </button>
                <button
                  className="button buy-now"
                  disabled={product.stock <= 0}
                >
                  Buy Now
                </button>
              </div>
            </div>

            <div className="qr-code-container">
              <div className="QrCode">
                <QRCode
                  size={256}
                  style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                  value={product.name}
                  viewBox={`0 0 16 16`}
                />
              </div>
            </div>
          </div>
        ) : (
          <p>Product not found.</p>
        )}
      </div>

      {/* Reviews Section */}
      <div className="reviews-section">
        <h3>Customer Reviews</h3>

        {reviews.reviews && reviews.reviews.length > 0 ? (
          <div className="reviews-list">
            {reviews.reviews.map((review, index) => (
              <div className="review-item" key={index}>
                <div className="review-header">
                  <div className="review-rating">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`star-small ${review.rating >= star ? 'filled' : ''}`}
                        fill={review.rating >= star ? "#FFD700" : "none"}
                        stroke={review.rating >= star ? "#FFD700" : "currentColor"}
                        size={16}
                      />
                    ))}
                  </div>
                  <div className="review-user">
                    <span className="user-name">{review.name || "Anonymous"}</span>
                    <span className="review-date">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="review-content">
                  {review.comment}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-reviews">
            <p>No reviews available for this product yet.</p>
            <p className="review-prompt">Purchase this item to leave a review!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ItemDetails;