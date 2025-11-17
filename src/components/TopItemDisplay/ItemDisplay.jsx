import React, { useContext } from "react";
import { StoreContext } from "../../context/StoreContext";
import Item from "../Item/Item";
import "./ItemDisplay.css";

const ItemDisplay = ({ category }) => {
  const { item_list } = useContext(StoreContext);

  return (
    <div className="item-display" id="item-display">
      <h2>Top Items For You</h2>
      <div className="item-display-products">
        {item_list.length > 0 ? (
          item_list
            .filter((item) => category === "All" || item.category === category)
            .map((item) => (
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
            ))
        ) : (
          <p>Loading items...</p>
        )}
      </div>
    </div>
  );
};

export default ItemDisplay;
