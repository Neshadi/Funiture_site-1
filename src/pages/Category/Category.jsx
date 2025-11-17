import React, { useState } from 'react';
import ExploreMenu from '../../components/ExploreMenu/ExploreMenu';
//import ItemDisplay from '../../components/TopItemDisplay/ItemDisplay';
import "./Category.css";

function Home() {
  const [category, setCategory] = useState("All");

  return (
    <div>
      <ExploreMenu category={category} setCategory={setCategory} />
      {/* <ItemDisplay category={category} /> */}
    </div>
  );
}

export default Home;
