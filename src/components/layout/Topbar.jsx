import React from 'react';
import { Menu, Bell, Search, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Topbar = ({ sidebarOpen, setSidebarOpen }) => {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-30 flex h-20 bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm">
      <div className="flex items-center justify-between w-full px-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-md text-gray-500 hover:bg-gray-100 focus:outline-none"
          >
            <Menu size={24} />
          </button>
          
          <div className="hidden sm:flex items-center bg-gray-100 rounded-full px-4 py-2 border border-transparent focus-within:border-primary focus-within:bg-white transition-all w-72">
            <Search size={18} className="text-gray-400" />
            <input 
              type="text" 
              placeholder="Search customers, orders..." 
              className="bg-transparent border-none outline-none ml-2 w-full text-sm text-gray-700"
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button className="relative p-2 rounded-full text-gray-500 hover:bg-gray-100 transition-colors">
            <Bell size={20} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 border-2 border-white"></span>
          </button>
          
          <div className="h-8 w-px bg-gray-200 mx-2"></div>
          
          <div className="flex items-center gap-3 cursor-pointer">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-gray-700 leading-none mb-1">{user?.name || 'Admin'}</p>
              <p className="text-xs text-gray-500 leading-none">{user?.role || 'Manager'}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold border border-primary/20">
              {user?.name?.charAt(0) || 'A'}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
