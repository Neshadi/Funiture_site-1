import axios from "axios";
import React, { useEffect, useState } from "react";
import { assets } from "../../assets/assets";
import Item from "../Item/Item";
import "./ExploreMenu.css";
import Loading from "../Loading/Loading";
import { useQuery } from "@tanstack/react-query";

// Reliable device detection
const isIOSDevice = () => /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
const isAndroidDevice = () => /Android/i.test(navigator.userAgent);

const ExploreMenu = ({ category, setCategory }) => {
    const [searchQuery, setSearchQuery] = useState("");

    const categories = [
        { name: "Furnitures", image: assets.ellipse1 },
        { name: "Electronics", image: assets.ellipse2 },
        { name: "Kitchen Equipments", image: assets.ellipse3 },
        { name: "Bathwares", image: assets.ellipse4 },
        { name: "Wall Designs", image: assets.ellipse5 },
    ];

    const { data: allProducts = [], isLoading, isError } = useQuery({
        queryKey: ['products'],
        queryFn: async () => {
            const response = await axios.get("https://new-sever.vercel.app/api/products");
            return response.data;
        },
        staleTime: 1000 * 60 * 30, // 30 minutes cache
    });

    // Detect device once
    const userIsIOS = isIOSDevice();
    const userIsAndroid = isAndroidDevice();

    const filteredProducts = allProducts.filter((product) => {
        // 1. Category filter
        const matchesCategory = category === "All" || product.category === category;

        // 2. Search filter
        const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());

        // 3. Device-specific model filter using the AR link pattern
        const arLink = `https://www.decorit.store/ar-viewer?model=${encodeURIComponent(product.model || '')}`;

        let hasCorrectModel = true;

        if (userIsIOS) {
            hasCorrectModel = product.model?.toLowerCase().includes('.usdz') || false;
        } else if (userIsAndroid) {
            hasCorrectModel = product.model?.toLowerCase().includes('.glb') || false;
        }
        // On desktop → show all (for admin/preview)
        // If no model field → still show (maybe image-only product)

        return matchesCategory && matchesSearch && hasCorrectModel;
    });

    const handleCategoryClick = (selectedCategory) => {
        setCategory(prev => prev === selectedCategory ? "All" : selectedCategory);
    };

    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
    };

    if (isLoading) return <Loading />;
    if (isError) return <div className="error-message">Failed to load products. Please try again.</div>;

    return (
        <div className="explore-menucat" id="explore-menucat">
            <h1>Explore Our Collection</h1>
            <p className="explore-menu-text">
                Browse our curated selection of furniture and home equipment, designed to blend style with functionality. 
                Use our augmented reality feature to visualize each piece in your home.
            </p>

            {/* Search Input */}
            <input
                type="text"
                placeholder="Search items..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="search-input"
            />

            {/* Categories */}
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
                            // Pass the raw model URL so Item component can build correct link
                            modelUrl={product.model}
                        />
                    ))
                ) : (
                    <div className="no-results">
                        {userIsIOS || userIsAndroid
                            ? "No AR models available for your device yet. We're adding more soon!"
                            : "No items found."}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ExploreMenu;