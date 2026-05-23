import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, DollarSign, Download, Trash, TrendingUp, Wallet, Loader2 } from 'lucide-react';
import Modal from '../../components/ui/Modal';
import { useForm } from 'react-hook-form';
import api from '../../api/axios';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const Payments = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMethod, setFilterMethod] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [page, setPage] = useState(1);

  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  // Fetch Payments Query
  const { data: paymentsData, isLoading, isError } = useQuery({
    queryKey: ['payments', searchTerm, filterMethod, page],
    queryFn: async () => {
      const params = {
        search: searchTerm || undefined,
        method: filterMethod !== 'All' ? filterMethod : undefined,
        page,
        limit: 10
      };
      const response = await api.get('/payments', { params });
      return response.data;
    },
    keepPreviousData: true
  });

  // Fetch Customers for Selector
  const { data: customersData } = useQuery({
    queryKey: ['customers-list'],
    queryFn: async () => {
      const response = await api.get('/customers', { params: { limit: 100 } });
      return response.data?.data || [];
    }
  });

  const paymentsList = paymentsData?.data || [];
  const pagination = paymentsData?.pagination || { page: 1, pages: 1, total: 0 };
  const customersList = customersData || [];

  // Calculate metrics
  const totalReceived = paymentsList.reduce((sum, p) => sum + (p.amount || 0), 0);
  const todayStr = new Date().toISOString().split('T')[0];
  const todayPayments = paymentsList.filter(p => p.date?.split('T')[0] === todayStr);
  const todayTotal = todayPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

  // Create Payment Mutation
  const createMutation = useMutation({
    mutationFn: async (formData) => {
      return api.post('/payments', formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] }); // Reduces customer balance
      setIsModalOpen(false);
      reset();
    }
  });

  // Delete Payment Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      return api.delete(`/payments/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    }
  });

  const onSubmit = (data) => {
    createMutation.mutate({
      ...data,
      amount: Number(data.amount)
    });
  };

  const handleDelete = (payment) => {
    const id = payment.id || payment._id;
    if (window.confirm(`Are you sure you want to delete payment record ${payment.paymentId}?`)) {
      deleteMutation.mutate(id);
    }
  };

  const handleAddNew = () => {
    reset({
      customer: customersList[0]?.id || customersList[0]?._id || '',
      date: new Date().toISOString().split('T')[0],
      amount: '',
      method: 'Cash',
      note: ''
    });
    setIsModalOpen(true);
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
          <h1 className="text-2xl font-bold text-dark mb-1">Payments</h1>
          <p className="text-gray-500 text-sm">Manage incoming payments and customer ledgers.</p>
        </div>
        <button
          onClick={handleAddNew}
          className="btn-primary flex items-center gap-2 w-full sm:w-auto justify-center"
        >
          <Plus size={18} />
          <span>Record Payment</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card bg-gradient-to-br from-green-50 to-green-100/50 border-green-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-500 text-white rounded-lg"><TrendingUp size={20} /></div>
            <h3 className="font-semibold text-green-900">Total Collection</h3>
          </div>
          <p className="text-3xl font-bold text-green-700">Rs {totalReceived.toLocaleString()}</p>
        </div>
        <div className="card bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-500 text-white rounded-lg"><Wallet size={20} /></div>
            <h3 className="font-semibold text-blue-900">Today's Collection</h3>
          </div>
          <p className="text-3xl font-bold text-blue-700">Rs {todayTotal.toLocaleString()}</p>
        </div>
        <div className="card bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-500 text-white rounded-lg"><DollarSign size={20} /></div>
            <h3 className="font-semibold text-purple-900">Total Transactions</h3>
          </div>
          <p className="text-3xl font-bold text-purple-700">{pagination.total || 0}</p>
        </div>
      </div>

      <div className="card">
        <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search payments..."
              className="input-field pl-10"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <select 
            className="input-field w-auto bg-gray-50"
            value={filterMethod}
            onChange={(e) => {
              setFilterMethod(e.target.value);
              setPage(1);
            }}
          >
            <option value="All">All Methods</option>
            <option value="Cash">Cash</option>
            <option value="Bank Transfer">Bank Transfer</option>
            <option value="Easypaisa">Easypaisa</option>
            <option value="JazzCash">JazzCash</option>
            <option value="Cheque">Cheque</option>
          </select>
        </div>

        {/* Loading / Error States */}
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="animate-spin text-primary" size={32} />
          </div>
        ) : isError ? (
          <div className="text-center py-20 text-red-500">
            Failed to load payment history from backend.
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-gray-50 text-gray-500 border-b border-gray-100">
                  <tr>
                    <th className="px-4 py-3 font-medium rounded-tl-lg">Receipt No</th>
                    <th className="px-4 py-3 font-medium">Date</th>
                    <th className="px-4 py-3 font-medium">Customer</th>
                    <th className="px-4 py-3 font-medium">Amount</th>
                    <th className="px-4 py-3 font-medium">Method</th>
                    <th className="px-4 py-3 font-medium">Note</th>
                    <th className="px-4 py-3 font-medium rounded-tr-lg text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paymentsList.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="text-center py-10 text-gray-500">
                        No payments recorded yet.
                      </td>
                    </tr>
                  ) : (
                    paymentsList.map((payment) => (
                      <tr key={payment.id || payment._id} className="hover:bg-gray-50/50 transition-colors group">
                        <td className="px-4 py-4 text-gray-500 font-medium">{payment.paymentId}</td>
                        <td className="px-4 py-4 text-gray-500">
                          {payment.date ? new Date(payment.date).toLocaleDateString() : ''}
                        </td>
                        <td className="px-4 py-4 font-semibold text-dark">
                          {payment.customer?.name || 'Customer'}
                        </td>
                        <td className="px-4 py-4">
                          <span className="font-bold text-green-600 flex items-center gap-1">
                            + Rs {Number(payment.amount).toLocaleString()}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700">
                            {payment.method}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-gray-500 text-xs max-w-[200px] truncate">{payment.note || '–'}</td>
                        <td className="px-4 py-4 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleDelete(payment)} className="p-1.5 text-red-500 hover:bg-red-50 rounded" title="Delete">
                              <Trash size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="flex items-center justify-between mt-6 border-t border-gray-100 pt-4">
                <p className="text-sm text-gray-500">
                  Showing page <span className="font-medium text-dark">{pagination.page}</span> of <span className="font-medium text-dark">{pagination.pages}</span>
                </p>
                <div className="flex gap-1">
                  <button 
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1 border border-gray-200 rounded text-sm disabled:opacity-50"
                  >
                    Prev
                  </button>
                  {[...Array(pagination.pages)].map((_, i) => (
                    <button
                      key={i + 1}
                      onClick={() => setPage(i + 1)}
                      className={`px-3 py-1 rounded text-sm ${page === i + 1 ? 'bg-primary text-white' : 'border border-gray-200 hover:bg-gray-50'}`}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button 
                    onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                    disabled={page === pagination.pages}
                    className="px-3 py-1 border border-gray-200 rounded text-sm disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Record Payment Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Record Payment">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Customer</label>
              <select {...register('customer', { required: true })} className="input-field">
                {customersList.map((c) => (
                  <option key={c.id || c._id} value={c.id || c._id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input type="date" {...register('date')} className="input-field" defaultValue={new Date().toISOString().split('T')[0]} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount (Rs)</label>
              <input type="number" {...register('amount', { required: true, min: 1 })} className="input-field" placeholder="Enter amount" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
              <select {...register('method')} className="input-field">
                <option value="Cash">Cash</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Easypaisa">Easypaisa</option>
                <option value="JazzCash">JazzCash</option>
                <option value="Cheque">Cheque</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Note / Reference</label>
            <textarea {...register('note')} className="input-field resize-none h-20" placeholder="E.g. Partial payment for May orders..."></textarea>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-gray-100 mt-6">
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={createMutation.isPending} className="btn-primary flex items-center gap-2">
              {createMutation.isPending && <Loader2 className="animate-spin" size={16} />}
              <span>Record Payment</span>
            </button>
          </div>
        </form>
      </Modal>
    </motion.div>
  );
};

export default Payments;
