import React from 'react';
import { Outlet } from 'react-router-dom';

const PublicLayout = () => {
  return (
    <div className="min-h-screen bg-white font-sans text-dark">
      <Outlet />
    </div>
  );
};

export default PublicLayout;
