import axios from "axios";
import React, { useEffect, useState } from "react";
import { assets } from "../../assets/assets";
import Item from "../Item/Item";
import "./ExploreMenu.css";
import Loading from "../Loading/Loading";
import { useQuery } from "@tanstack/react-query";

// List of item names that should appear ONLY on iOS
const IOS_ONLY_ITEMS = [
  "Dark Wood Round Table",
  "Table Lamp",
  "Heavy-Duty Outdoor Bench",
  "Copper-Tone Saucepan",
  "Modern Asymmetrical Cube Shelf",
  "Home Wooden Chair"
];

const ExploreMenu = ({ category, setCategory }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [platform, setPlatform] = useState("desktop"); // default

  const categories = [
    { name: "Furnitures", image: assets.ellipse1 },
    { name: "Electronics", image: assets.ellipse2 },
    { name: "Kitchen Equipments", image: assets.ellipse3 },
    { name: "Bathwares", image: assets.ellipse4 },
    { name: "Wall Designs", image: assets.ellipse5 },
  ];

  const { data: allProducts = [], isLoading, isError } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const response = await axios.get("https://new-sever.vercel.app/api/products");
      return response.data;
    },
    staleTime: 1000 * 60 * 500,
  });

  // Detect platform (iOS, Android, Desktop)
  useEffect(() => {
    const userAgent = navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(userAgent);
    const isAndroid = /android/.test(userAgent);

    if (isIOS) {
      setPlatform("ios");
    } else if (isAndroid) {
      setPlatform("android");
    } else {
      setPlatform("desktop");
    }
  }, []);

  // Filter products based on category, search, and platform rules
  const filteredProducts = allProducts.filter((product) => {
    // Category filter
    const matchesCategory = category === "All" || product.category === category;

    // Search filter
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());

    // Platform-specific visibility
    let visibleOnPlatform = true;

    const isIosOnlyItem = IOS_ONLY_ITEMS.includes(product.name);

    if (platform === "ios") {
      // On iOS: show only iOS-only items + (if needed, others can be added later)
      visibleOnPlatform = isIosOnlyItem;
    } else if (platform === "android") {
      // On Android: show everything EXCEPT iOS-only items
      visibleOnPlatform = !isIosOnlyItem;
    }
    // On desktop: show all → visibleOnPlatform remains true

    return matchesCategory && matchesSearch && visibleOnPlatform;
  });

  const handleCategoryClick = (selectedCategory) => {
    setCategory((prev) => (prev === selectedCategory ? "All" : selectedCategory));
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  if (isLoading) return <Loading />;
  if (isError)
    return <div className="error-message">Failed to load products. Please try again.</div>;

  return (
    <div className="explore-menucat" id="explore-menucat">
      <h1>Explore Our Collection</h1>
      <p className="explore-menu-text">
        Browse our curated selection of furniture and home equipment...
      </p>

      <input
        type="text"
        placeholder="Search items..."
        value={searchQuery}
        onChange={handleSearchChange}
        className="search-input"
      />

      <div className="explore-menu-categories">
        {categories.map((cat, index) => (
          <div
            key={index}
            className={`explore-menu-category-item ${category === cat.name ? "active" : ""}`}
            onClick={() => handleCategoryClick(cat.name)}
          >
            <img src={cat.image} alt={cat.name} />
            <p>{cat.name}</p>
          </div>
        ))}
      </div>

      <h2>All Items</h2>

      <div className="explore-menu-products">
        {filteredProducts.length > 0 ? (
          filteredProducts.map((product) => (
            <Item
              key={product._id}
              id={product._id}
              name={product.name}
              description={product.description}
              price={product.price}
              image={product.image}
              rating={product.rating}
              reviews={product.reviews}
            />
          ))
        ) : (
          <div className="no-results">No items found.</div>
        )}
      </div>
    </div>
  );
};

export default ExploreMenu;