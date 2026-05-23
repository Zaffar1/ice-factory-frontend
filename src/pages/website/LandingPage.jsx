import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Factory, Droplets, ShieldCheck, Clock, ArrowRight, CheckCircle2, TrendingUp } from 'lucide-react';

const LandingPage = () => {
  return (
    <div className="overflow-hidden">
      {/* Navbar */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
             <div className="w-10 h-10 bg-primary rounded flex items-center justify-center text-white shadow-lg">
               <span className="text-xl font-bold">❄️</span>
             </div>
             <span className="text-xl font-bold text-dark">ColdChain<span className="text-primary">ERP</span></span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
            <a href="#features" className="hover:text-primary transition-colors">Features</a>
            <a href="#benefits" className="hover:text-primary transition-colors">Benefits</a>
            <a href="#contact" className="hover:text-primary transition-colors">Contact</a>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/login" className="text-sm font-medium text-dark hover:text-primary transition-colors">Sign In</Link>
            <Link to="/login" className="btn-primary flex items-center gap-2 shadow-lg shadow-primary/20">
              Get Started <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto min-h-screen flex items-center">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              The #1 Ice Factory Management System
            </div>
            <h1 className="text-5xl lg:text-6xl font-extrabold text-dark leading-tight mb-6 tracking-tight">
              Manage Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Ice Factory</span> With Confidence
            </h1>
            <p className="text-lg text-gray-600 mb-8 max-w-lg leading-relaxed">
              An all-in-one ERP solution designed specifically for ice manufacturing plants. Track production, manage inventory, handle orders, and monitor sales in real-time.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/login" className="btn-primary py-3 px-8 text-center text-lg shadow-xl shadow-primary/20">
                Go to Dashboard
              </Link>
              <button className="btn-secondary py-3 px-8 text-center text-lg">
                View Demo
              </button>
            </div>
            
            <div className="mt-12 flex items-center gap-6 text-sm font-medium text-gray-500">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="text-green-500" size={18} /> No setup fee
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="text-green-500" size={18} /> Cloud hosted
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            {/* Decorative background blobs */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-to-tr from-primary/20 to-secondary/20 rounded-full blur-3xl -z-10" />
            
            {/* Dashboard Mockup Component */}
            <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-2 transform rotate-2 hover:rotate-0 transition-transform duration-500">
              <div className="bg-gray-50 rounded-xl overflow-hidden border border-gray-200 aspect-[4/3] relative flex flex-col">
                {/* Mockup header */}
                <div className="h-8 bg-gray-100 flex items-center px-3 gap-2 border-b border-gray-200">
                  <div className="w-3 h-3 rounded-full bg-red-400"></div>
                  <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                  <div className="w-3 h-3 rounded-full bg-green-400"></div>
                </div>
                {/* Mockup content */}
                <div className="flex-1 p-4 flex flex-col gap-3">
                  <div className="h-6 w-32 bg-gray-200 rounded animate-pulse"></div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="h-16 bg-blue-100 rounded-lg"></div>
                    <div className="h-16 bg-green-100 rounded-lg"></div>
                    <div className="h-16 bg-orange-100 rounded-lg"></div>
                  </div>
                  <div className="flex-1 bg-gray-100 rounded-lg mt-2"></div>
                </div>
              </div>
            </div>
            
            {/* Floating badge */}
            <motion.div 
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
              className="absolute -bottom-6 -left-6 bg-white p-4 rounded-xl shadow-xl border border-gray-100 flex items-center gap-4"
            >
              <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                <TrendingUp size={24} />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Monthly Revenue</p>
                <p className="text-lg font-bold text-dark">+45%</p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-gray-50 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-dark mb-4">Everything you need to run your factory</h2>
            <p className="text-gray-600">Built specifically for the cold chain industry, our software handles all your operational needs in one unified platform.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: Factory, title: 'Production Tracking', desc: 'Monitor daily ice block production, shifts, and machine status.', color: 'text-blue-500', bg: 'bg-blue-100' },
              { icon: Droplets, title: 'Inventory Control', desc: 'Real-time stock levels of ice blocks, crushed ice, and raw materials.', color: 'text-cyan-500', bg: 'bg-cyan-100' },
              { icon: ShieldCheck, title: 'Order Management', desc: 'Process customer orders, assign deliveries, and generate invoices.', color: 'text-emerald-500', bg: 'bg-emerald-100' },
              { icon: Clock, title: 'Payment Tracking', desc: 'Manage credit (Udhar), record cash payments, and track outstanding dues.', color: 'text-violet-500', bg: 'bg-violet-100' }
            ].map((feature, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 ${feature.bg} ${feature.color}`}>
                  <feature.icon size={24} />
                </div>
                <h3 className="text-xl font-bold text-dark mb-2">{feature.title}</h3>
                <p className="text-gray-500 leading-relaxed text-sm">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="bg-dark text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
             <div className="w-8 h-8 bg-primary rounded flex items-center justify-center text-white">
               <span className="font-bold">❄️</span>
             </div>
             <span className="text-xl font-bold">ColdChain<span className="text-primary">ERP</span></span>
          </div>
          <p className="text-gray-400 text-sm">© 2026 ColdChain ERP. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
