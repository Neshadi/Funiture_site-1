import React, { useState } from 'react';
import Header from '../../components/Header/Header';
import ExploreMenuHeader from '../../components/ExploreMenuHeader/ExploreMenuHeader';
import MobileSection from '../../components/MobileSection/MobileSection'; 

function Home() {
  const [category] = useState("All");

  return (
    <div>
      <Header />
      <ExploreMenuHeader />
      <MobileSection /> 
    </div>
  );
}

export default Home;
