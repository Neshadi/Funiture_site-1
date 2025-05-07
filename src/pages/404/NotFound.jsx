import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="flex flex-col items-center justify-center h-screen text-center">
      <h1 className="text-4xl font-bold text-red-500">404 - Page Not Found</h1>
      <p className="mt-4 text-lg">Oops! The page you're looking for doesn't exist.</p>
      <Link to="/" className="px-4 py-2 mt-6 text-white bg-blue-500 rounded hover:bg-blue-600">
        Go Back Home
      </Link>
    </div>
  );
};

export default NotFound;
