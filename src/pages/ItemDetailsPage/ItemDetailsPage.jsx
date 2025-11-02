import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Star } from "lucide-react";
import "./ItemDetailsPage.css";
import axios from "axios";
import QRCode from "react-qr-code";
import { Camera } from "lucide-react";

const ItemDetails = ({ onCartUpdate }) => {
  const { id } = useParams();
  const [quantity, setQuantity] = useState(1);
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [numReviews, setNumReviews] = useState(0);
  const [isAdded, setIsAdded] = useState(false);
  const [notification, setNotification] = useState("");
  const [loading, setLoading] = useState(true);
  const [showArViewer, setShowArViewer] = useState(false); // State to toggle AR Viewer

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
        "https://new-sever.vercel.app/api/cart",
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

        const updatedStock = product.countInStock - quantity;
        setProduct((prevProduct) => ({
          ...prevProduct,
          countInStock: updatedStock,
        }));

        // Update the stock on the backend
        const updateStockResponse = await axios.put(
          `https://new-sever.vercel.app/api/products/${id}`,
          {
            countInStock: updatedStock,
          },
          { withCredentials: true }
        );

        if (updateStockResponse.status === 200) {
          console.log("Stock updated on backend:", updateStockResponse.data);
          const productResponse = await axios.get(
            `https://new-sever.vercel.app/api/products/${id}`
          );
          if (productResponse.status === 200) {
            setProduct(productResponse.data); // Update product details
          }
        } else {
          console.error("Failed to update stock on backend");
        }
      }
    } catch (error) {
      console.error("Error adding to cart:", error);
      hideNotification();
    }
  };

  // Fetch product details and reviews
  useEffect(() => {
    const fetchItemDetails = async () => {
      try {
        setLoading(true);
        const productResponse = await axios.get(
          `https://new-sever.vercel.app/api/products/${id}`
        );

        if (productResponse.status === 200) {
          console.log("Fetched product:", productResponse.data);
          setProduct(productResponse.data);

          // Fetch reviews for this product
          const reviewsResponse = await axios.get(
            `https://new-sever.vercel.app/api/products/reviews/${id}`
          );

          if (reviewsResponse.status === 200) {
            const fetchedReviews = reviewsResponse.data || [];
            setReviews(fetchedReviews);
            if (fetchedReviews.length > 0) {
              const totalRating = fetchedReviews.reduce(
                (acc, r) => acc + r.rating,
                0
              );
              setAverageRating(totalRating / fetchedReviews.length);
              setNumReviews(fetchedReviews.length);
            } else {
              setAverageRating(0);
              setNumReviews(0);
            }
            console.log("Fetched reviews:", fetchedReviews);
          }
        }
      } catch (err) {
        console.error("Error fetching product data or reviews:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchItemDetails();
  }, [id]);

  // Log the product count in stock whenever the product state changes
  useEffect(() => {
    if (product) {
      console.log("Count in Stock:", product.countInStock);
    }
  }, [product]);

  // Function to handle AR button click
  const handleArView = () => {
    setShowArViewer(true);
  };
  const navigate = useNavigate();

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
            
              {product.modelImageUrl && (
              <div className="qr-code-container">
                <div className="QrCode">
                  <QRCode
                    size={256}
                    style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                    value={`${
                      window.location.origin
                    }/ar-viewer?model=${encodeURIComponent(
                      product.modelImageUrl
                    )}&name=${encodeURIComponent(product.name)}`}
                    viewBox={`0 0 256 256`}
                  />
                  <p className="qr-instructions">
                    Scan with your phone to view in AR
                  </p>
                </div>
              </div>
            )}
            </div>

            {product.modelImageUrl && (
              <div className="ar-button-container">
              <button
                className="button-ar-button"
                onClick={() =>
                  navigate(
                    `/ar-viewer?model=${encodeURIComponent(
                      product.modelImageUrl
                    )}&name=${encodeURIComponent(product.name)}`
                  )
                }
              >
                <Camera size={18} style={{ marginRight: "5px" }} />
                AR View
              </button>
              </div>    
            )}
            
            {/* Product Details */}
            <div className="details">
              <h2>{product.name}</h2>
               {/* Rating Display */}
              <div className="rating-display">
                <div className="rating-stars">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`star ${
                        averageRating >= star ? "filled" : ""
                      }`}
                      fill={averageRating >= star ? "#FFD700" : "none"}
                      stroke={
                        averageRating >= star ? "#FFD700" : "currentColor"
                      }
                      size={24}
                    />
                  ))}
                </div>
                <span className="rating-value">{averageRating.toFixed(1)}</span>
                <span className="review-count">({numReviews} reviews)</span>
              </div>
              <p className="description">{product.description}</p>
              
              <p className="price">LKR.{product.price?.toFixed(2)}</p>
             
              {/* Action Buttons */}
              <div className="actions">
                <button
                  onClick={addToCart}
                  className="button add-to-cart"
                  disabled={product.countInStock <= 0}
                >
                  Add to Cart
                </button>
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
                  disabled={quantity >= product.countInStock}
                >
                  +
                </button>
                 <p
                className={`stock1 ${
                  product.countInStock > 0 ? "in-stock" : "out-of-stock"
                }`}
              >
                {product.countInStock > 0
                  ? `(Only${product.countInStock} available)`
                  : " "}
              </p>
              </div>
             
              </div>
              <div className="actions-buy-now">
                <button
                  className="button buy-now"
                  disabled={product.countInStock <= 0}
                >
                  Buy Now
                </button>
                <p
                className={`stock2 ${
                  product.countInStock > 0 ? "in-stock" : "out-of-stock"
                }`}
              >
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

        {/* AR Viewer */}
        {showArViewer && product && (
          <ArViewer
            modelId={id}
            modelPath={product.modelImageUrl}
            onClose={() => setShowArViewer(false)}
          />
        )}
      </div>

      {/* Reviews Section */}
      {/* <div className="reviews-section">
        <h3>Customer Reviews</h3>

        {reviews.length > 0 ? (
          <div className="reviews-list">
            {reviews.map((review, index) => (
              <div className="review-item" key={index}>
                <div className="review-header">
                  <div className="review-rating">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`star-small ${
                          review.rating >= star ? "filled" : ""
                        }`}
                        fill={review.rating >= star ? "#FFD700" : "none"}
                        stroke={
                          review.rating >= star ? "#FFD700" : "currentColor"
                        }
                        size={16}
                      />
                    ))}
                  </div>
                  <div className="review-user">
                    <span className="user-name">
                      {review.name || "Anonymous"}
                    </span>
                    <span className="review-date">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="review-content">{review.comment}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-reviews">
            <p>No reviews available for this product yet.</p>
            <p className="review-prompt">
              Purchase this item to leave a review!
            </p>
          </div>
        )}
      </div> */}
    </div>
  );
};

export default ItemDetails;
