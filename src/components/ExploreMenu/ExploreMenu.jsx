import axios from "axios";
import React, { useEffect, useState } from "react";
import { assets } from "../../assets/assets";
import Item from "../Item/Item";
import "./ExploreMenu.css";
import Loading from "../Loading/Loading";
import { useQuery } from "@tanstack/react-query";

// Items that should appear ONLY on iOS & iPadOS (not Android)
const IOS_EXCLUSIVE_ITEMS = [
  "Light Wood Armchair",
  "Wooden Storage Shelf",
  "Copper-Tone Saucepan",
  "Table Lamp",
  "Dark Wood Round Table",
  "Vintage-Style Grey & Beige Medallion Rug",
  "White Space-Saving Corner Wardrobe"

];

const ExploreMenu = ({ category, setCategory }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [platform, setPlatform] = useState("desktop"); // 'ios', 'android', or 'desktop'

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

  // Accurate platform detection: iOS (iPhone + iPad), Android, Desktop
  useEffect(() => {
    const ua = navigator.userAgent.toLowerCase();
    const isIPadOS = /macintosh/.test(ua) && "ontouchend" in document; // iPad on iPadOS 13+
    const isIOS = /iphone|ipad|ipod/.test(ua) || isIPadOS;
    const isAndroid = /android/.test(ua);

    if (isIOS) {
      setPlatform("ios"); // Includes iPhone + iPad
    } else if (isAndroid) {
      setPlatform("android");
    } else {
      setPlatform("desktop");
    }
  }, []);

  // Filter products by category, search, and platform rules
  const filteredProducts = allProducts.filter((product) => {
    const matchesCategory = category === "All" || product.category === category;
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());

    const isIosExclusiveItem = IOS_EXCLUSIVE_ITEMS.includes(product.name);

    let visibleOnPlatform = true;

    if (platform === "ios") {
      // On iPhone & iPad: Show ONLY the exclusive items
      visibleOnPlatform = isIosExclusiveItem;
    } else if (platform === "android") {
      // On Android: Hide the iOS-exclusive items
      visibleOnPlatform = !isIosExclusiveItem;
    }
    // Desktop: show all → no change needed

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
        Browse our curated selection of furniture and home equipment, designed to blend style with functionality...
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
          <div className="no-results">No items found for your current filters.</div>
        )}
      </div>
    </div>
  );
};

export default ExploreMenu;