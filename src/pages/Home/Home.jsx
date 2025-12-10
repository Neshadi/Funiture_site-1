import React, { useState } from 'react';
import "./Home.css";
import Header from '../../components/Header/Header';
import ExploreMenuHeader from '../../components/ExploreMenuHeader/ExploreMenuHeader';
import MobileSection from '../../components/MobileSection/MobileSection'; 
import { useDeviceType } from '../../components/Test/DetectDevice';


function Home() {
  const [category] = useState("All");
  const devive = useDeviceType();

  return (
    <div>
      <Header />
      <ExploreMenuHeader />
      <MobileSection /> 
    </div>
  );
}

export default Home;
