import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Star } from "lucide-react";
import axios from "axios";
import QRCode from "react-qr-code";
import "./ItemDetailsPage.css";

const ItemDetails = ({ onCartUpdate }) => {
  const { id } = useParams();
  const [quantity, setQuantity] = useState(1);
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [avgRating, setAvgRating] = useState(0);
  const [isAdded, setIsAdded] = useState(false);
  const [notification, setNotification] = useState("");
  const [loading, setLoading] = useState(true);

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
        onCartUpdate && onCartUpdate();

        const updatedStock = product.countInStock - quantity;
        setProduct((prev) => ({ ...prev, countInStock: updatedStock }));

        await axios.put(
          `https://new-sever.vercel.app/api/products/${id}`,
          { countInStock: updatedStock },
          { withCredentials: true }
        );

        const updatedProduct = await axios.get(
          `https://new-sever.vercel.app/api/products/${id}`
        );
        setProduct(updatedProduct.data);
        hideNotification();
      }
    } catch (error) {
      console.error("Error adding to cart:", error);
      setNotification("Failed to add item to cart.");
      hideNotification();
    }
  };

  useEffect(() => {
    const fetchItemDetails = async () => {
      try {
        setLoading(true);
        const productResponse = await axios.get(
          `https://new-sever.vercel.app/api/products/${id}`
        );
        if (productResponse.status === 200) {
          setProduct(productResponse.data);

          const reviewsResponse = await axios.get(
            `https://new-sever.vercel.app/api/products/reviews/${id}`
          );
          if (reviewsResponse.status === 200) {
            setReviews(reviewsResponse.data.reviews || []);

            const ratings = reviewsResponse.data.reviews?.map(r => r.rating) || [];
            const avg = ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;
            setAvgRating(avg.toFixed(1));
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
    <div className="item-details-container">
      {notification && (
        <div className={`notification ${isAdded ? "success" : "error"}`}>
          {notification}
        </div>
      )}

      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading product details...</p>
        </div>
      ) : product ? (
        <div className="modern-product-card">
          <div className="image-section">
            <img src={product.image} alt={product.name} className="main-image" />
            <div className="qr-section">
              <QRCode value={product.name} size={128} />
              <div>
                <p className="qr-heading">AR View</p>
                <p className="qr-text">Scan this QR to see it in AR on mobile.</p>
              </div>
            </div>
          </div>

          <div className="info-section">
            <h2>{product.name}</h2>
            <p className="description">{product.description}</p>

            {/* ⭐ AVERAGE RATING SECTION ADDED HERE */}
            <div className="rating-display">
              <span className="rating-value">{avgRating} / 5</span>
              {[1,2,3,4,5].map((n) => (
                <Star
                  key={n}
                  size={22}
                  fill={n <= avgRating ? "#FFD700" : "none"}
                  stroke={n <= avgRating ? "#FFD700" : "#6b7280"}
                />
              ))}
              <span className="rating-count">({reviews.length} Reviews)</span>
            </div>

            <p className="price">LKR {product.price?.toFixed(2)}</p>

            <div className="action-buttons">
              <button onClick={addToCart} className="btn add-cart" disabled={product.countInStock <= 0}>
                Add to Cart
              </button>
              <div className="quantity-btn">
                <button onClick={() => setQuantity((q) => Math.max(q - 1, 1))} disabled={quantity <= 1}>−</button>
                <span>{quantity}</span>
                <button onClick={() => setQuantity((q) => q + 1)} disabled={quantity >= product.countInStock}>+</button>
              </div>
            </div>

            <div className="action-buttons">
              <button className="btn buy-now" disabled={product.countInStock <= 0}>Buy Now</button>
              <p className={`stock ${product.countInStock > 0 ? "in-stock" : "out-of-stock"}`}>
                {product.countInStock > 0
                  ? `In Stock (${product.countInStock} available)`
                  : "Out of Stock"}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <p>Product not found.</p>
      )}

      {/* Reviews Section */}
      <div className="reviews-modern">
        <h3>Customer Reviews</h3>
        {reviews.length > 0 ? (
          reviews.map((review, idx) => (
            <div className="review-card" key={idx}>
              <div className="review-header">
                <strong>{review.name || "Anonymous"}</strong>
                <span>{new Date(review.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="review-rating">
                {[1,2,3,4,5].map((s) => (
                  <Star
                    key={s}
                    fill={review.rating >= s ? "#FFD700" : "none"}
                    stroke={review.rating >= s ? "#FFD700" : "currentColor"}
                    size={18}
                  />
                ))}
              </div>
              <p>{review.comment}</p>
            </div>
          ))
        ) : (
          <p className="no-reviews">No reviews yet. Be the first to leave one!</p>
        )}
      </div>
    </div>
  );
};

export default ItemDetails;
