import React from 'react';
import './MobileSection.css';
import { assets } from '../../assets/assets';

const MobileSection = () => {
    return (
        <div className='mobile-home' id='mobile-home'>
            <hr />
            <div className='mobile-home-content'>
                <img src={assets.ar_hand} alt="Preview in space" className='mobile-home-image' />
                <div className='mobile-home-text'>
                    <h1>See It in Your Space</h1>
                    <p>
                        See how our AR feature works. Virtually place items in your home, ensuring the perfect fit before purchase. Try it now for a seamless shopping experience.
                    </p>
                    <button className="continue-button">
                        Mobile App
                        <img src={assets.arrow} alt="Arrow" className="arrow-image" />
                    </button>
                </div>
            </div>
        </div>
    );
}

export default MobileSection;
