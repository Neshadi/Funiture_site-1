import React from 'react';
import { Link } from 'react-router-dom';
import './ExploreMenuHeader.css';
import { assets } from '../../assets/assets';

const ExploreMenu = () => {

    // ===== CATEGORY LIST INSIDE SAME FILE =====
    const category_list = [
        {
            menu_name: "Furnitures",
            menu_image: assets.furnitures
        },
        {
            menu_name: "Bathwares",
            menu_image: assets.bathware2
        },
        {
            menu_name: "Kitchenwares",
            menu_image: assets.kitchen2
        },
        {
            menu_name: "Wall Designs",
            menu_image: assets.wall_art
        },
        {
            menu_name: "Electronics",
            menu_image: assets.electronics
        }
    ];

    return (
        <div className='explore-menu' id='explore-menu'>

            {/* Existing Section */}
            <h1>Explore Our Collection</h1>
            <p className='explore-menu-text'>
                Browse our curated selection of furniture and home equipment, designed to blend style with functionality. Use our augmented reality feature to visualize each piece in your home, ensuring the perfect fit for your space and style preferences.
            </p>

            <Link to="/category" className="explore-link">
                <button className='explore-button'>
                    Explore Our Collection 
                    <img src={assets.arrow} alt="Arrow" className="arrow-image" />
                </button>
            </Link>


            {/* =============================== */}
            {/*     NEW CATEGORY PREVIEW       */}
            {/* =============================== */}

            <div className="category-preview-section">
                <h2 className="category-title">Top Categories</h2>

                <div className="category-grid">
                    {category_list.map((item, index) => (
                        <div key={index} className="category-card">
                            <img 
                                src={item.menu_image} 
                                alt={item.menu_name} 
                                className="category-img" 
                            />
                            <p className="category-name">{item.menu_name}</p>
                        </div>
                    ))}
                </div>
            </div>

        </div>
    );
};

export default ExploreMenu;
