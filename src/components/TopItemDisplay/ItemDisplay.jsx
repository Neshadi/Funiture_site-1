// src/components/TopItemDisplay/ItemDisplay.jsx
import React from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import Item from "../Item/Item";
import Loading from "../Loading/Loading";
import "./ItemDisplay.css";

const ItemDisplay = ({ category = "All" }) => {
  const { data: item_list = [], isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const response = await axios.get("https://new-sever.vercel.app/api/products");
      return response.data;
    },
    staleTime: 1000 * 60 * 10, // 10 minutes cache
  });

  // Scroll to explore section
  const handleShowMore = () => {
    document.getElementById("explore-menucat")?.scrollIntoView({ behavior: "smooth" });
  };

  const displayedItems = item_list
    .filter((item) => category === "All" || item.category === category)
    .slice(0, 4);

  if (isLoading) return <Loading />;

  return (
    <div className="item-display" id="item-display">
      <h2>Top Items For You</h2>

      <div className="item-display-products">
        {displayedItems.map((item) => (
          <Item
            key={item._id}
            id={item._id}
            name={item.name}
            description={item.description}
            price={item.price}
            image={item.image}
            rating={item.rating}
            reviews={item.reviews}
          />
        ))}

        {/* + More Items Card */}
        <div className="more-items-card" onClick={handleShowMore}>
          <div className="more-items-inner">
            <span className="plus-sign">+</span>
            <p>More Items</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ItemDisplay;