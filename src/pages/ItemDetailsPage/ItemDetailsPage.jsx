import { useEffect, useState } from "react";
import { FaRegStar, FaStar, FaStarHalfAlt } from "react-icons/fa";
import { useParams } from "react-router-dom";
import "./ItemDetailsPage.css";
import axios from "axios";
import QRCode from "react-qr-code";

const ItemDetails = () => {
  const { id } = useParams();
  const [quantity, setQuantity] = useState(1);
  const maxStars = 5;
  const [_product, setProduct] = useState(null); // State for product data

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
    }
  };

  // Fetch product details
  useEffect(() => {
    const fetchItemDetails = async () => {
      try {
        const response = await axios.get(
          `https://new-sever.vercel.app/api/products/${id}`
        );
        if (response.status === 200) {
          setProduct(response.data);
          console.log("Product Data:", response.data); // Logs all data
        }
      } catch (err) {
        console.error("Error fetching data:", err);
      }
    };
    fetchItemDetails();
  }, [id]);

  return (
    <div>
      <div className="container">
        {_product ? (
          <div className="product">
            {/* Product Image */}
            <div className="product-image">
              <img src={_product.image} alt={_product.name} />
            </div>

            {/* Product Details */}
            <div className="details">
              <h2>{_product.name}</h2>
              <p className="description">{_product.description}</p>
              <p className="price">${_product.price?.toFixed(2)}</p>
              <p
                className={`stock ${
                  _product.stock > 0 ? "in-stock" : "out-of-stock"
                }`}
              >
                {_product.stock > 0
                  ? `In Stock (${_product.stock} left)`
                  : "Out of Stock"}
              </p>

              {/* Quantity Selector */}
              <div className="quantity">
                <button
                  onClick={() => setQuantity((prev) => Math.max(prev - 1, 1))}
                >
                  -
                </button>
                <span>{quantity}</span>
                <button onClick={() => setQuantity((prev) => prev + 1)}>
                  +
                </button>
              </div>

              {/* Reviews & Rating */}
              <div className="reviews">
                {[...Array(maxStars)].map((_, index) => {
                  const starValue = index + 1;
                  return (
                    <span key={index}>
                      {_product.ratings >= starValue ? (
                        <FaStar color="gold" />
                      ) : _product.ratings >= starValue - 0.5 ? (
                        <FaStarHalfAlt color="gold" />
                      ) : (
                        <FaRegStar color="gray" />
                      )}
                    </span>
                  );
                })}
              </div>

              {/* Action Buttons */}
              <div className="actions">
                <button onClick={addToCart} className="button add-to-cart">
                  Add to Cart
                </button>
                <button className="button buy-now">Buy Now</button>
              </div>
            </div>
            <div className="">
              <div className="QrCode" style={{}}>
                <QRCode
                  size={256}
                  style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                  value={_product.name}
                  viewBox={`0 0 16 16`}
                />
              </div>
            </div>
            {/* Reviews Section */}
          </div>
        ) : (
          <p>Loading product details...</p>
        )}
      </div>
      {/* Reviews Section */}
      {_product && _product.reviews && _product.reviews.length > 0 ? (
        <div className="reviews_list">
          <h3>Customer Reviews</h3>
          <ul className="review_comment ">
            {_product.reviews.map((review, index) => {
              // Extract only the character values and join them
              const reviewText = Object.keys(review)
                .filter((key) => key !== "_id") // Ignore `_id`
                .sort((a, b) => a - b) // Sort keys numerically
                .map((key) => review[key]) // Get character values
                .join(""); // Join characters into a string

              return <li className="single_review" key={index}>{reviewText}</li>;
            })}
          </ul>
        </div>
      ) : (
        <p>No reviews available.</p>
      )}
    </div>
  );
};
export default ItemDetails;
