import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Filter, Eye, Printer, Navigation, Trash, Edit, Loader2 } from 'lucide-react';
import Modal from '../../components/ui/Modal';
import { useForm } from 'react-hook-form';
import api from '../../api/axios';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const Orders = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [page, setPage] = useState(1);

  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, setValue, formState: { errors }, watch } = useForm({
    defaultValues: { type: 'Block Ice', qty: 1, rate: 500 }
  });

  const qty = watch('qty') || 0;
  const rate = watch('rate') || 0;
  const totalAmount = qty * rate;

  // Fetch Orders Query
  const { data: ordersData, isLoading: isOrdersLoading, isError: isOrdersError } = useQuery({
    queryKey: ['orders', searchTerm, filterStatus, page],
    queryFn: async () => {
      const params = {
        search: searchTerm || undefined,
        status: filterStatus !== 'All' ? filterStatus : undefined,
        page,
        limit: 10
      };
      const response = await api.get('/orders', { params });
      return response.data;
    },
    keepPreviousData: true
  });

  // Fetch Customers for Select Dropdown
  const { data: customersData } = useQuery({
    queryKey: ['customers-list'],
    queryFn: async () => {
      const response = await api.get('/customers', { params: { limit: 100 } });
      return response.data?.data || [];
    }
  });

  const ordersList = ordersData?.data || [];
  const pagination = ordersData?.pagination || { page: 1, pages: 1, total: 0 };
  const customersList = customersData || [];

  // Create/Update Order Mutation
  const saveMutation = useMutation({
    mutationFn: async (formData) => {
      if (editingOrder) {
        return api.put(`/orders/${editingOrder.id || editingOrder._id}`, formData);
      } else {
        return api.post('/orders', formData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] }); // Customer balance might change
      setIsModalOpen(false);
      reset();
      setEditingOrder(null);
    }
  });

  // Delete Order Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      return api.delete(`/orders/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    }
  });

  // Update Status / Dispatch Order Mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }) => {
      return api.put(`/orders/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    }
  });

  const onSubmit = (data) => {
    saveMutation.mutate({
      ...data,
      qty: Number(data.qty),
      rate: Number(data.rate)
    });
  };

  const handleAddNew = () => {
    setEditingOrder(null);
    reset({
      customer: customersList[0]?.id || customersList[0]?._id || '',
      type: 'Block Ice',
      qty: 1,
      rate: 500,
      payment: 'Paid',
      status: 'Pending',
      date: new Date().toISOString().split('T')[0]
    });
    setIsModalOpen(true);
  };

  const handleEdit = (order) => {
    setEditingOrder(order);
    setValue('customer', order.customer?.id || order.customer?._id || order.customer || '');
    setValue('type', order.type);
    setValue('qty', order.qty);
    setValue('rate', order.rate);
    setValue('payment', order.payment);
    setValue('status', order.status);
    setValue('date', order.date ? new Date(order.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
    setIsModalOpen(true);
  };

  const handleDelete = (order) => {
    const id = order.id || order._id;
    if (window.confirm(`Are you sure you want to delete order ${order.orderId}?`)) {
      deleteMutation.mutate(id);
    }
  };

  const handleDispatch = (order) => {
    const id = order.id || order._id;
    updateStatusMutation.mutate({ id, status: 'Delivered' });
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'Delivered': return 'bg-green-100 text-green-700 border-green-200';
      case 'Processing': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Pending': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'Cancelled': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getPaymentColor = (status) => {
    switch(status) {
      case 'Paid': return 'text-green-600';
      case 'Pending': return 'text-amber-600';
      case 'Credit': return 'text-blue-600';
      case 'Refunded': return 'text-red-600';
      default: return 'text-gray-600';
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
          <h1 className="text-2xl font-bold text-dark mb-1">Orders</h1>
          <p className="text-gray-500 text-sm">Manage sales orders, deliveries, and invoicing.</p>
        </div>
        <button 
          onClick={handleAddNew}
          className="btn-primary flex items-center gap-2 w-full sm:w-auto justify-center"
        >
          <Plus size={18} />
          <span>Create New Order</span>
        </button>
      </div>

      <div className="card">
        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search order ID, customer..."
              className="input-field pl-10"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <div className="flex gap-2">
            <select 
              className="input-field w-auto bg-gray-50"
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setPage(1);
              }}
            >
              <option value="All">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Processing">Processing</option>
              <option value="Delivered">Delivered</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Loading / Error States */}
        {isOrdersLoading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="animate-spin text-primary" size={32} />
          </div>
        ) : isOrdersError ? (
          <div className="text-center py-20 text-red-500">
            Failed to load orders from backend.
          </div>
        ) : (
          <>
            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-gray-50 text-gray-500 border-b border-gray-100">
                  <tr>
                    <th className="px-4 py-3 font-medium rounded-tl-lg">Order ID</th>
                    <th className="px-4 py-3 font-medium">Date</th>
                    <th className="px-4 py-3 font-medium">Customer</th>
                    <th className="px-4 py-3 font-medium">Items</th>
                    <th className="px-4 py-3 font-medium">Amount</th>
                    <th className="px-4 py-3 font-medium">Payment</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium rounded-tr-lg text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {ordersList.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="text-center py-10 text-gray-500">
                        No orders found.
                      </td>
                    </tr>
                  ) : (
                    ordersList.map((order) => (
                      <tr key={order.id || order._id} className="hover:bg-gray-50/50 transition-colors group">
                        <td className="px-4 py-4">
                          <span className="font-semibold text-primary">{order.orderId}</span>
                        </td>
                        <td className="px-4 py-4 text-gray-500">
                          {order.date ? new Date(order.date).toLocaleDateString() : ''}
                        </td>
                        <td className="px-4 py-4">
                          <div className="font-semibold text-dark">
                            {order.customerAssociation?.name || order.customer?.name || 'Walk-in Customer'}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-gray-600">
                          {order.qty} x {order.type}
                        </td>
                        <td className="px-4 py-4 font-bold text-dark">
                          Rs {Number(order.amount).toLocaleString()}
                        </td>
                        <td className="px-4 py-4">
                          <span className={`font-medium ${getPaymentColor(order.payment)}`}>
                            {order.payment}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <span className={`px-2.5 py-1 text-xs font-medium rounded-full border ${getStatusColor(order.status)}`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleEdit(order)} className="p-1.5 text-gray-500 hover:bg-gray-100 rounded" title="Edit">
                              <Edit size={16} />
                            </button>
                            {order.status !== 'Delivered' && order.status !== 'Cancelled' && (
                              <button onClick={() => handleDispatch(order)} className="p-1.5 text-orange-500 hover:bg-orange-50 rounded" title="Deliver">
                                <Navigation size={16} />
                              </button>
                            )}
                            <button onClick={() => handleDelete(order)} className="p-1.5 text-red-500 hover:bg-red-50 rounded" title="Delete">
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

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingOrder ? "Edit Order" : "Create New Order"}>
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

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ice Type</label>
              <select {...register('type')} className="input-field">
                <option value="Block Ice">Block Ice</option>
                <option value="Tube Ice">Tube Ice</option>
                <option value="Crushed Ice">Crushed Ice</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
              <input type="number" {...register('qty', { required: true, min: 1 })} className="input-field" min="1" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rate (Rs)</label>
              <input type="number" {...register('rate', { required: true, min: 1 })} className="input-field" min="1" />
            </div>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 flex justify-between items-center">
            <span className="font-medium text-gray-600">Total Amount:</span>
            <span className="text-xl font-bold text-dark">Rs {totalAmount.toLocaleString()}</span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Status</label>
              <select {...register('payment')} className="input-field">
                <option value="Paid">Paid</option>
                <option value="Pending">Pending</option>
                <option value="Credit">Credit</option>
                <option value="Refunded">Refunded</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Order Status</label>
              <select {...register('status')} className="input-field">
                <option value="Pending">Pending</option>
                <option value="Processing">Processing</option>
                <option value="Delivered">Delivered</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-gray-100 mt-6">
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saveMutation.isPending} className="btn-primary flex items-center gap-2">
              {saveMutation.isPending && <Loader2 className="animate-spin" size={16} />}
              <span>{editingOrder ? "Save Changes" : "Create Order"}</span>
            </button>
          </div>
        </form>
      </Modal>
    </motion.div>
  );
};

export default Orders;
