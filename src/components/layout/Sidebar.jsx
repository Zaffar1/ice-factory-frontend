import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Users, ShoppingCart, Factory, 
  Package, DollarSign, FileText, Settings, X, LogOut, Receipt
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';

const Sidebar = ({ sidebarOpen, setSidebarOpen }) => {
  const location = useLocation();
  const { logout } = useAuth();

  const navItems = [
    { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { name: 'Customers', path: '/admin/customers', icon: Users },
    { name: 'Orders', path: '/admin/orders', icon: ShoppingCart },
    { name: 'Production', path: '/admin/production', icon: Factory },
    { name: 'Inventory', path: '/admin/inventory', icon: Package },
    { name: 'Payments', path: '/admin/payments', icon: DollarSign },
    { name: 'Expenses', path: '/admin/expenses', icon: Receipt },
    { name: 'Reports', path: '/admin/reports', icon: FileText },
  ];

  return (
    <>
      {/* Mobile sidebar overlay */}
      <div 
        className={`fixed inset-0 bg-dark/50 z-40 lg:hidden transition-opacity duration-300 ${sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} 
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <motion.div 
        initial={false}
        animate={{ x: sidebarOpen ? 0 : -280 }}
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-dark text-white shadow-xl lg:static lg:translate-x-0 transition-transform duration-300 ease-in-out lg:!transform-none flex flex-col`}
      >
        {/* Header */}
        <div className="flex items-center justify-between h-20 px-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-primary flex items-center justify-center">
              <span className="font-bold text-lg">❄️</span>
            </div>
            <span className="text-lg font-bold tracking-tight">ColdChain<span className="text-primary">ERP</span></span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-gray-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-6 px-4">
          <ul className="space-y-2">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <li key={item.name}>
                  <NavLink
                    to={item.path}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                      isActive 
                        ? 'bg-primary text-white shadow-lg shadow-primary/30' 
                        : 'text-gray-400 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <item.icon size={20} className={isActive ? "text-white" : "text-gray-400"} />
                    <span className="font-medium">{item.name}</span>
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Footer actions */}
        <div className="p-4 border-t border-white/10">
          <button 
            onClick={logout}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-gray-400 hover:bg-red-500/10 hover:text-red-400 transition-colors"
          >
            <LogOut size={20} />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </motion.div>
    </>
  );
};

export default Sidebar;
