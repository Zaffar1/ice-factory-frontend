import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, DollarSign, Package, Users, TrendingUp, TrendingDown, Factory, Loader2, Wallet } from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, Legend
} from 'recharts';
import api from '../../api/axios';
import { useQuery } from '@tanstack/react-query';

const Dashboard = () => {
  const navigate = useNavigate();

  // Fetch Dashboard Stats
  const { data: statsData, isLoading: isStatsLoading, isError: isStatsError } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const response = await api.get('/reports/dashboard');
      return response.data?.data;
    }
  });

  // Fetch Profit Loss Chart Data
  const { data: profitLossData } = useQuery({
    queryKey: ['dashboard-profit-loss'],
    queryFn: async () => {
      const response = await api.get('/reports/profit-loss');
      return response.data?.data || [];
    }
  });

  // Fetch Production Mix Chart Data
  const { data: productionMixData } = useQuery({
    queryKey: ['dashboard-production-mix'],
    queryFn: async () => {
      const response = await api.get('/reports/production');
      return response.data?.data || [];
    }
  });

  if (isStatsLoading) {
    return (
      <div className="flex justify-center items-center py-40">
        <Loader2 className="animate-spin text-primary" size={40} />
      </div>
    );
  }

  if (isStatsError) {
    return (
      <div className="text-center py-40 text-red-500">
        Failed to load dashboard statistics from backend.
      </div>
    );
  }

  // Map stats data
  const { totalRevenue, totalOrders, dailyProduction, pendingPayments, totalExpenses, totalProfit, recentOrders = [], lowStockAlerts = [] } = statsData || {};

  const statCards = [
    { title: 'Total Revenue', value: `Rs ${Number(totalRevenue || 0).toLocaleString()}`, icon: DollarSign, trend: '+12%', isUp: true, color: 'bg-green-500' },
    { title: 'Total Expenses', value: `Rs ${Number(totalExpenses || 0).toLocaleString()}`, icon: Wallet, trend: '+5%', isUp: false, color: 'bg-orange-500' },
    { title: 'Net Profit', value: `Rs ${Number(totalProfit || 0).toLocaleString()}`, icon: TrendingUp, trend: '+15%', isUp: true, color: 'bg-blue-500' },
    { title: 'Total Orders', value: totalOrders || 0, icon: ShoppingCart, trend: '+8%', isUp: true, color: 'bg-primary' },
    { title: 'Daily Production', value: `${dailyProduction || 0} Units`, icon: Factory, trend: 'Stable', isUp: true, color: 'bg-purple-500' },
    { title: 'Pending Payments', value: `Rs ${Number(pendingPayments || 0).toLocaleString()}`, icon: TrendingDown, trend: '+4%', isUp: false, color: 'bg-red-500' },
  ];

  // Process profit-loss data for chart (format month names to e.g. "Jan", "Feb")
  const chartData = profitLossData.map(item => {
    const [year, month] = item.month.split('-');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return {
      name: months[parseInt(month, 10) - 1] || item.month,
      revenue: item.revenue,
      profit: item.profit
    };
  });

  // Process production mix data (group by ice type)
  const productionTypes = {};
  productionMixData.forEach(item => {
    productionTypes[item.type] = (productionTypes[item.type] || 0) + item.totalProduced;
  });
  
  const mixChartData = Object.keys(productionTypes).map(key => ({
    name: key,
    value: productionTypes[key]
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-dark mb-1">Dashboard Overview</h1>
          <p className="text-gray-500 text-sm">Welcome back, here's what's happening at the factory today.</p>
        </div>
        <button onClick={() => navigate('/admin/production')} className="btn-primary flex items-center gap-2">
          <Factory size={18} />
          <span>New Production Entry</span>
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {statCards.map((stat, index) => (
          <motion.div 
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
            className="card flex items-center gap-4 hover:shadow-md transition-shadow"
          >
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-white shadow-lg ${stat.color}`}>
              <stat.icon size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500 font-medium mb-1">{stat.title}</p>
              <h3 className="text-2xl font-bold text-dark">{stat.value}</h3>
              <p className={`text-xs mt-1 font-medium ${stat.isUp ? 'text-green-500' : 'text-red-500'}`}>
                {stat.trend} from last month
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card lg:col-span-2">
          <h3 className="text-lg font-bold text-dark mb-4">Revenue & Profit Analytics</h3>
          <div className="h-80 w-full">
            {chartData.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-500">
                No financial data found.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0EA5E9" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#0EA5E9" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `Rs${value}`} />
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Legend iconType="circle" />
                  <Area type="monotone" dataKey="revenue" stroke="#0EA5E9" fillOpacity={1} fill="url(#colorRevenue)" />
                  <Area type="monotone" dataKey="profit" stroke="#10B981" fillOpacity={1} fill="url(#colorProfit)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-bold text-dark mb-4">Ice Production Mix</h3>
          <div className="h-80 w-full">
            {mixChartData.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-500">
                No production data found.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mixChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0"/>
                  <XAxis dataKey="name" stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} />
                  <RechartsTooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="value" fill="#38BDF8" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Tables Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-dark">Recent Orders</h3>
            <button onClick={() => navigate('/admin/orders')} className="text-sm text-primary font-medium hover:underline">View All</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-500 border-b border-gray-100">
                <tr>
                  <th className="px-4 py-3 font-medium rounded-tl-lg">Order ID</th>
                  <th className="px-4 py-3 font-medium">Customer</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium rounded-tr-lg">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="text-center py-4 text-gray-500">
                      No recent orders.
                    </td>
                  </tr>
                ) : (
                  recentOrders.map((order) => (
                    <tr key={order.id || order._id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3 font-medium text-dark">{order.orderId}</td>
                      <td className="px-4 py-3 text-gray-600">
                        {order.customerAssociation?.name || order.customer?.name || 'Walk-in Customer'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          order.status === 'Delivered' ? 'bg-green-100 text-green-700' :
                          order.status === 'Processing' ? 'bg-blue-100 text-blue-700' :
                          'bg-orange-100 text-orange-700'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium text-dark">Rs {Number(order.amount).toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-dark">Low Stock Alerts</h3>
            <button onClick={() => navigate('/admin/inventory')} className="text-sm text-primary font-medium hover:underline">View Inventory</button>
          </div>
          <div className="space-y-4">
            {lowStockAlerts.length === 0 ? (
              <p className="text-gray-500 py-4 text-center text-sm">All inventory stocks are healthy!</p>
            ) : (
              lowStockAlerts.map((alert, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-red-100 bg-red-50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-500">
                      <Package size={18} />
                    </div>
                    <div>
                      <p className="font-medium text-dark">{alert.item}</p>
                      <p className="text-xs text-red-600">Min required: {alert.minQty} {alert.unit}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-red-600">{alert.qty} {alert.unit}</p>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-red-500">
                      {alert.qty === 0 ? 'Critical' : 'Low'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Dashboard;
