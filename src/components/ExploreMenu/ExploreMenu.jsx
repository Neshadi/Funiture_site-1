import axios from "axios";
import React, { useEffect, useState } from "react";
import { assets } from "../../assets/assets";
import Item from "../Item/Item";
import "./ExploreMenu.css";
import Loading from "../Loading/Loading";
import { useQuery } from "@tanstack/react-query";
import { useDeviceType } from "../Test/DetectDevice";

const ExploreMenu = ({ category, setCategory }) => {
    const [searchQuery, setSearchQuery] = useState(""); // State for search query

    const categories = [
        { name: "Furnitures", image: assets.ellipse1 },
        { name: "Electronics", image: assets.ellipse2 },
        { name: "Kitchen Equipments", image: assets.ellipse3 },
        { name: "Bathwares", image: assets.ellipse4 },
        { name: "Wall Designs", image: assets.ellipse5 },
    ];

    const device = useDeviceType();

    const { data: allProducts = [], isLoading, isError } = useQuery({
        queryKey: ['products'], 
        queryFn: async () => {
            const response = await axios.get("https://new-sever.vercel.app/api/products");
            return response.data;
        },
        staleTime: 1000 * 60 * 500, // Cache for 500 minutes
    });

    // --- Core Filtering Logic ---
    const filteredProducts = allProducts.filter(product => {
        const modelUrl = product.modelImageUrl || "";

        if (device === 'ios') {
            // Checks if the full URL ends with '.usdz'
            // Example: ...Table.usdz?alt=media&token=... -> TRUE
            return modelUrl.endsWith('.usdz'); 
        } else if (device === 'Android') {
            // Checks if the full URL ends with '.glb'
            return modelUrl.endsWith('.glb');
        } else {
            // Keep all products for 'other' devices
            return true;
        }
    });

    const handleCategoryClick = (selectedCategory) => {
        setCategory(prev => prev === selectedCategory ? "All" : selectedCategory);
    };

    // Handle search input change
    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value.toLowerCase());
    };

    if (isLoading) return <Loading />;
    if (isError) return <div className="error-message">Failed to load products. Please try again.</div>;

    return (
        <div className="explore-menucat" id="explore-menucat">
            
            <h1>Explore Our Collection</h1>
            <p className="explore-menu-text">
                Browse our curated selection of furniture and home equipment, designed to blend style with functionality. Use our augmented reality feature to visualize each piece in your home, ensuring the perfect fit for your space and style preferences.
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

            {/* Products */}
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
