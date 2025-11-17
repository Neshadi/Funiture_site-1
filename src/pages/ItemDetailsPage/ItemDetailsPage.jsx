import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Star } from "lucide-react";
import "./ItemDetailsPage.css";
import axios from "axios";
import QRCode from "react-qr-code";
import CameraIcon from "../../assets/camera.png";

const ItemDetails = ({ onCartUpdate }) => {
  const { id } = useParams();
  const [quantity, setQuantity] = useState(2); // Default 2 as per design
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [numReviews, setNumReviews] = useState(0);
  const [isAdded, setIsAdded] = useState(false);
  const [notification, setNotification] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Hide notification after 3s
  const hideNotification = () => {
    setTimeout(() => {
      setNotification("");
      setIsAdded(false);
    }, 3000);
  };

  const addToCart = async () => {
    try {
      const response = await axios.post(
        "https://new-sever.vercel.app/api/cart",
        { productId: id, quantity },
        { withCredentials: true }
      );

      if (response.status === 201) {
        setIsAdded(true);
        setNotification("Item added to cart successfully!");
        onCartUpdate?.();
        hideNotification();

        const updatedStock = product.countInStock - quantity;
        setProduct((prev) => ({ ...prev, countInStock: updatedStock }));

        await axios.put(
          `https://new-sever.vercel.app/api/products/${id}`,
          { countInStock: updatedStock },
          { withCredentials: true }
        );

        const refreshed = await axios.get(
          `https://new-sever.vercel.app/api/products/${id}`
        );
        setProduct(refreshed.data);
      }
    } catch (error) {
      console.error("Error adding to cart:", error);
      hideNotification();
    }
  };

  useEffect(() => {
    const fetchItemDetails = async () => {
      try {
        setLoading(true);
        const productRes = await axios.get(
          `https://new-sever.vercel.app/api/products/${id}`
        );
        setProduct(productRes.data);

        const reviewsRes = await axios.get(
          `https://new-sever.vercel.app/api/products/reviews/${id}`
        );
        const fetchedReviews = reviewsRes.data || [];
        setReviews(fetchedReviews);

        if (fetchedReviews.length > 0) {
          const avg =
            fetchedReviews.reduce((a, r) => a + r.rating, 0) /
            fetchedReviews.length;
          setAverageRating(avg);
          setNumReviews(fetchedReviews.length);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchItemDetails();
  }, [id]);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading product details...</p>
      </div>
    );
  }

  if (!product) return <p>Product not found.</p>;

  const arUrl = `${window.location.origin}/ar-viewer?model=${encodeURIComponent(
    product.modelImageUrl
  )}&name=${encodeURIComponent(product.name)}`;

  return (
    <>
      {notification && (
        <div className={`notification ${isAdded ? "success" : "error"}`}>
          {notification}
        </div>
      )}

      <div className="item-details-container">
        <div className="product-layout">
          {/* Product Image */}
          <div className="product-image-wrapper">
            <img
              src={product.image}
              alt={product.name}
              className="product-img"
            />
          </div>

          {/* Product Details */}
          <div className="product-details">
            <h1 className="product-title">{product.name}</h1>

            {/* Rating */}
            <div className="rating">
              <div className="stars">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    size={20}
                    fill={averageRating >= star ? "#FFD700" : "none"}
                    stroke={averageRating >= star ? "#FFD700" : "#999"}
                    className="star"
                  />
                ))}
              </div>
              <span className="rating-text">
                {averageRating.toFixed(1)}{" "}
                <span className="review-count">({numReviews} Reviews)</span>
              </span>
            </div>

            {/* Description */}
            <p className="description">
              Browse our curated selection of furniture and home equipment,
              designed to blend style with functionality. Use our augmented
              reality feature to visualize each piece in your home, ensuring the
              perfect fit for your space and style preferences.
            </p>

            {/* Price */}
            <p className="price">LKR {product.price?.toFixed(0)}</p>

            {/* Actions */}
            <div className="actions-row">
              <button
                onClick={addToCart}
                className="btn-add-to-cart-desktop"
                disabled={product.countInStock <= 0}
              >
                Add to Cart
              </button>
              <div className="quantity-selector">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity <= 1}
                  className="qty-btn"
                >
                  –
                </button>
                <span className="qty-value">{quantity}</span>
                <button
                  onClick={() =>
                    setQuantity((q) => Math.min(product.countInStock, q + 1))
                  }
                  disabled={quantity >= product.countInStock}
                  className="qty-btn"
                >
                  +
                </button>
                <span className="stock-availability">
                  (Only {product.countInStock} Available)
                </span>
              </div>
              <button
                onClick={addToCart}
                className="btn-add-to-cart-mobile"
                disabled={product.countInStock <= 0}
              >
                Add to Cart
              </button>
            </div>

            <div className="buy-now-row">
              <button
                className="btn-buy-now"
                disabled={product.countInStock <= 0}
                onClick={() => addToCart()}
              >
                Buy Now
              </button>
              <div className="in-stock">In Stock</div>
            </div>

            {/* QR Code - Bottom Left */}
            {product.modelImageUrl && (
              <div className="qr-container">
                <div className="qr-code">
                  <QRCode value={arUrl} size={80} />
                </div>
                <div className="ar-tooltip">
                  <span>AR View</span>
                  <p>
                    Scan this QR code using your mobile for view item in AR, if
                    you are using a desktop now.
                  </p>
                </div>
              </div>
            )}
          </div>
          {/* AR Button (Mobile Only - Optional) */}
          {product.modelImageUrl && (
            <div className="ar-section">
              {/* AR View Button */}
              <button
                className="ar-mobile-btn"
                onClick={() =>
                  navigate(
                    `/ar-viewer?model=${encodeURIComponent(
                      product.modelImageUrl
                    )}&name=${encodeURIComponent(product.name)}`
                  )
                }
              >
                <img src={CameraIcon} alt="AR" className="ar-icon" />
                <b>AR View</b>
              </button>

              {/* Blue Help Link (exactly like the image) */}
              <a href="https://your-help-link.com" className="ar-help-link">
                If you need help Click Here
              </a>
            </div>
          )}
        </div>

        {/* Reviews Section */}
        <div className="reviews-section">
          <h3>Customer Reviews</h3>
          {reviews.length > 0 ? (
            <div className="reviews-list">
              {reviews.map((review, i) => (
                <div key={i} className="review-card">
                  <div className="review-header">
                    <div className="review-stars">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          size={16}
                          fill={review.rating >= s ? "#FFD700" : "none"}
                          stroke={review.rating >= s ? "#FFD700" : "#ccc"}
                        />
                      ))}
                    </div>
                    <div className="review-meta">
                      <span className="reviewer-name">
                        {review.name || "Anonymous"}
                      </span>
                      <span className="review-date">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <p className="review-comment">{review.comment}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-reviews">
              <p>No reviews available for this product yet.</p>
              <p>Purchase this item to leave a review!</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ItemDetails;
