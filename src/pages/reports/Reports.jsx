import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, FileText, Calendar, ChevronDown, ChevronUp, Factory, DollarSign, Package, Users, Receipt, TrendingUp, Loader2 } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line
} from 'recharts';
import api from '../../api/axios';
import { useQuery } from '@tanstack/react-query';

const reportCards = [
  {
    id: 'production',
    title: 'Daily Production Report',
    desc: 'Detailed view of blocks produced, damaged, and machine shifts.',
    color: 'text-blue-500',
    bg: 'bg-blue-50',
    icon: Factory,
  },
  {
    id: 'revenue',
    title: 'Revenue & Sales',
    desc: 'Total sales, pending orders, and revenue generated.',
    color: 'text-green-500',
    bg: 'bg-green-50',
    icon: TrendingUp,
  },
  {
    id: 'profitloss',
    title: 'Profit & Loss',
    desc: 'Comprehensive P&L statement including all expenses.',
    color: 'text-primary',
    bg: 'bg-primary/10',
    icon: DollarSign,
  },
  {
    id: 'inventory',
    title: 'Inventory Status',
    desc: 'Current stock levels and low stock alerts.',
    color: 'text-orange-500',
    bg: 'bg-orange-50',
    icon: Package,
  },
  {
    id: 'udhar',
    title: 'Customer Dues (Udhar)',
    desc: 'List of customers with outstanding balances.',
    color: 'text-red-500',
    bg: 'bg-red-50',
    icon: Users,
  },
  {
    id: 'expenses',
    title: 'Expense Summary',
    desc: 'Breakdown of factory operating costs.',
    color: 'text-purple-500',
    bg: 'bg-purple-50',
    icon: Receipt,
  },
];

const COLORS = ['#0EA5E9', '#38BDF8', '#7DD3FC', '#F97316', '#EF4444', '#10B981', '#8B5CF6', '#FBBF24', '#6B7280'];

const Reports = () => {
  const [expandedReport, setExpandedReport] = useState(null);
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0]
  });

  const toggleReport = (id) => {
    setExpandedReport(prev => prev === id ? null : id);
  };

  // Queries for dynamic reports (only enabled when corresponding card is expanded)
  const { data: productionData, isLoading: isProdLoading } = useQuery({
    queryKey: ['report-production', dateRange],
    queryFn: async () => {
      const response = await api.get('/reports/production', { params: dateRange });
      return response.data?.data || [];
    },
    enabled: expandedReport === 'production'
  });

  const { data: revenueData, isLoading: isRevLoading } = useQuery({
    queryKey: ['report-revenue', dateRange],
    queryFn: async () => {
      const response = await api.get('/reports/revenue', { params: dateRange });
      return response.data?.data || [];
    },
    enabled: expandedReport === 'revenue'
  });

  const { data: profitLossData, isLoading: isPLLoading } = useQuery({
    queryKey: ['report-profit-loss', dateRange],
    queryFn: async () => {
      const response = await api.get('/reports/profit-loss', { params: dateRange });
      return response.data?.data || [];
    },
    enabled: expandedReport === 'profit-loss' || expandedReport === 'profitloss'
  });

  const { data: expenseData, isLoading: isExpLoading } = useQuery({
    queryKey: ['report-expenses', dateRange],
    queryFn: async () => {
      const response = await api.get('/reports/expenses', { params: dateRange });
      return response.data?.data || [];
    },
    enabled: expandedReport === 'expenses'
  });

  const { data: udharData, isLoading: isUdharLoading } = useQuery({
    queryKey: ['report-udhar'],
    queryFn: async () => {
      const response = await api.get('/reports/udhar');
      return response.data?.data || [];
    },
    enabled: expandedReport === 'udhar'
  });

  const { data: inventoryData, isLoading: isInvLoading } = useQuery({
    queryKey: ['report-inventory'],
    queryFn: async () => {
      const response = await api.get('/reports/inventory');
      return response.data?.data || [];
    },
    enabled: expandedReport === 'inventory'
  });

  const renderReportContent = (id) => {
    switch (id) {
      case 'production':
        if (isProdLoading) return <div className="flex justify-center py-6"><Loader2 className="animate-spin text-primary" /></div>;
        
        // Group production by day
        const groupedProd = {};
        productionData.forEach(item => {
          if (!groupedProd[item.date]) {
            groupedProd[item.date] = { date: item.date, 'Block Ice': 0, 'Tube Ice': 0, 'Crushed Ice': 0 };
          }
          groupedProd[item.date][item.type] = item.netProduced;
        });
        const prodChartData = Object.values(groupedProd);

        const totalBlock = productionData.filter(p => p.type === 'Block Ice').reduce((s, p) => s + p.netProduced, 0);
        const totalTube = productionData.filter(p => p.type === 'Tube Ice').reduce((s, p) => s + p.netProduced, 0);
        const totalCrushed = productionData.filter(p => p.type === 'Crushed Ice').reduce((s, p) => s + p.netProduced, 0);

        return (
          <div className="space-y-4">
            <div className="h-72">
              {prodChartData.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-500">No production logs in this period.</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={prodChartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="date" stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} />
                    <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Legend iconType="circle" />
                    <Bar dataKey="Block Ice" fill="#0EA5E9" radius={[4, 4, 0, 0]} barSize={20} />
                    <Bar dataKey="Tube Ice" fill="#38BDF8" radius={[4, 4, 0, 0]} barSize={20} />
                    <Bar dataKey="Crushed Ice" fill="#BAE6FD" radius={[4, 4, 0, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-700">{totalBlock.toLocaleString()}</p>
                <p className="text-xs text-blue-600 font-medium">Block Ice</p>
              </div>
              <div className="text-center p-3 bg-cyan-50 rounded-lg">
                <p className="text-2xl font-bold text-cyan-700">{totalTube.toLocaleString()}</p>
                <p className="text-xs text-cyan-600 font-medium">Tube Ice</p>
              </div>
              <div className="text-center p-3 bg-sky-50 rounded-lg">
                <p className="text-2xl font-bold text-sky-700">{totalCrushed.toLocaleString()}</p>
                <p className="text-xs text-sky-600 font-medium">Crushed Ice</p>
              </div>
            </div>
          </div>
        );

      case 'revenue':
        if (isRevLoading) return <div className="flex justify-center py-6"><Loader2 className="animate-spin text-primary" /></div>;
        const totalRevVal = revenueData.reduce((s, r) => s + r.revenue, 0);

        return (
          <div className="space-y-4">
            <div className="h-72">
              {revenueData.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-500">No revenue data in this period.</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="month" stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                    <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} formatter={(v) => `Rs ${v.toLocaleString()}`} />
                    <Legend iconType="circle" />
                    <Line type="monotone" dataKey="revenue" name="Revenue" stroke="#10B981" strokeWidth={3} dot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
            <div className="p-4 bg-green-50 rounded-lg border border-green-100 flex justify-between items-center">
              <span className="font-medium text-green-800">Total Revenue (This Period):</span>
              <span className="text-2xl font-bold text-green-700">Rs {totalRevVal.toLocaleString()}</span>
            </div>
          </div>
        );

      case 'profitloss':
        if (isPLLoading) return <div className="flex justify-center py-6"><Loader2 className="animate-spin text-primary" /></div>;
        const plRevenue = profitLossData.reduce((s, r) => s + r.revenue, 0);
        const plExpenses = profitLossData.reduce((s, r) => s + r.expenses, 0);
        const netProfit = plRevenue - plExpenses;

        return (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-green-50 rounded-lg border border-green-100 text-center">
                <p className="text-xs text-green-600 font-medium mb-1">Total Revenue</p>
                <p className="text-xl font-bold text-green-700">Rs {plRevenue.toLocaleString()}</p>
              </div>
              <div className="p-4 bg-red-50 rounded-lg border border-red-100 text-center">
                <p className="text-xs text-red-600 font-medium mb-1">Total Expenses</p>
                <p className="text-xl font-bold text-red-700">Rs {plExpenses.toLocaleString()}</p>
              </div>
              <div className={`p-4 rounded-lg border text-center ${netProfit > 0 ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
                <p className="text-xs font-medium mb-1 text-gray-600">Net Profit</p>
                <p className={`text-xl font-bold ${netProfit > 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                  Rs {netProfit.toLocaleString()}
                </p>
              </div>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold text-dark mb-3 font-medium text-sm">Monthly Breakdown</h4>
              <div className="space-y-3">
                {profitLossData.map(item => (
                  <div key={item.month} className="flex justify-between items-center text-sm">
                    <span className="text-gray-600 font-medium">{item.month}</span>
                    <div className="flex gap-4">
                      <span className="text-green-600">Rev: Rs {Number(item.revenue).toLocaleString()}</span>
                      <span className="text-red-600">Exp: Rs {Number(item.expenses).toLocaleString()}</span>
                      <span className="font-bold text-dark">Profit: Rs {Number(item.profit).toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'expenses':
        if (isExpLoading) return <div className="flex justify-center py-6"><Loader2 className="animate-spin text-primary" /></div>;
        const totalExp = expenseData.reduce((s, e) => s + e.totalAmount, 0);

        const expChartData = expenseData.map((e, idx) => ({
          name: e.category,
          value: e.totalAmount,
          color: COLORS[idx % COLORS.length]
        }));

        return (
          <div className="space-y-4">
            <div className="h-64 flex items-center justify-center">
              {expChartData.length === 0 ? (
                <div className="text-gray-500">No expenses in this period.</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={expChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {expChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <RechartsTooltip formatter={(v) => `Rs ${v.toLocaleString()}`} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Legend iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
            <div className="p-4 bg-red-50 rounded-lg border border-red-100 flex justify-between items-center">
              <span className="font-medium text-red-800">Total Expenses:</span>
              <span className="text-2xl font-bold text-red-700">Rs {totalExp.toLocaleString()}</span>
            </div>
          </div>
        );

      case 'udhar':
        if (isUdharLoading) return <div className="flex justify-center py-6"><Loader2 className="animate-spin text-primary" /></div>;
        const totalUdhar = udharData.reduce((s, u) => s + u.balance, 0);

        return (
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-500 border-b border-gray-100">
                  <tr>
                    <th className="px-4 py-3 font-medium rounded-tl-lg">Customer</th>
                    <th className="px-4 py-3 font-medium">Customer ID</th>
                    <th className="px-4 py-3 font-medium">Outstanding</th>
                    <th className="px-4 py-3 font-medium rounded-tr-lg">Type</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {udharData.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="text-center py-4 text-gray-500">No outstanding dues.</td>
                    </tr>
                  ) : (
                    udharData.map((u, i) => (
                      <tr key={i} className="hover:bg-gray-50/50">
                        <td className="px-4 py-3 font-semibold text-dark">{u.name}</td>
                        <td className="px-4 py-3 text-gray-500">{u.customerId}</td>
                        <td className="px-4 py-3 font-bold text-red-600">Rs {Number(u.balance).toLocaleString()}</td>
                        <td className="px-4 py-3 text-gray-500">{u.type}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="p-4 bg-red-50 rounded-lg border border-red-100 flex justify-between items-center">
              <span className="font-medium text-red-800">Total Outstanding Udhar:</span>
              <span className="text-2xl font-bold text-red-700">Rs {totalUdhar.toLocaleString()}</span>
            </div>
          </div>
        );

      case 'inventory':
        if (isInvLoading) return <div className="flex justify-center py-6"><Loader2 className="animate-spin text-primary" /></div>;

        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {inventoryData.length === 0 ? (
                <div className="col-span-2 text-center text-gray-500 py-6">No inventory items.</div>
              ) : (
                inventoryData.map((item, i) => {
                  const isLow = item.qty < item.minQty;
                  return (
                    <div key={i} className={`p-4 rounded-lg border ${isLow ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-semibold text-dark">{item.item}</span>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isLow ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                          {isLow ? 'LOW' : 'OK'}
                        </span>
                      </div>
                      <p className="text-2xl font-bold text-dark">{item.qty} <span className="text-sm font-medium text-gray-500">{item.unit}</span></p>
                      <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${isLow ? 'bg-red-500' : 'bg-green-500'}`}
                          style={{ width: `${Math.min(100, (item.qty / (item.minQty * 2 || 1)) * 100)}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Min required: {item.minQty} {item.unit}</p>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-dark mb-1">Reports</h1>
          <p className="text-gray-500 text-sm">Generate and export business performance reports.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2">
            <Calendar size={16} className="text-gray-400" />
            <input
              type="date"
              className="text-sm border-none outline-none bg-transparent"
              value={dateRange.from}
              onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
            />
            <span className="text-gray-300">–</span>
            <input
              type="date"
              className="text-sm border-none outline-none bg-transparent"
              value={dateRange.to}
              onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reportCards.map((report, idx) => {
          const isExpanded = expandedReport === report.id;
          const IconComp = report.icon;
          return (
            <motion.div
              key={report.id}
              layout
              className={`card hover:shadow-md transition-shadow cursor-pointer ${isExpanded ? 'md:col-span-2 lg:col-span-3' : ''}`}
              onClick={() => toggleReport(report.id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${report.bg} ${report.color}`}>
                    <IconComp size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-dark mb-1">{report.title}</h3>
                    <p className="text-gray-500 text-sm">{report.desc}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-4">
                  {isExpanded && (
                    <button
                      onClick={(e) => { e.stopPropagation(); window.print(); }}
                      className="btn-primary text-sm flex items-center gap-2"
                    >
                      <Download size={14} /> Export
                    </button>
                  )}
                  {isExpanded ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
                </div>
              </div>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="mt-6 pt-6 border-t border-gray-100"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {renderReportContent(report.id)}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default Reports;
