import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Filter, MoreVertical, Edit, Trash, CreditCard, Loader2 } from 'lucide-react';
import Modal from '../../components/ui/Modal';
import { useForm } from 'react-hook-form';
import api from '../../api/axios';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const Customers = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [page, setPage] = useState(1);

  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm();

  // Fetch Customers Query
  const { data, isLoading, isError } = useQuery({
    queryKey: ['customers', searchTerm, filterType, page],
    queryFn: async () => {
      const params = {
        search: searchTerm || undefined,
        type: filterType !== 'All' ? filterType : undefined,
        page,
        limit: 10
      };
      const response = await api.get('/customers', { params });
      return response.data;
    },
    keepPreviousData: true
  });

  const customersList = data?.data || [];
  const pagination = data?.pagination || { page: 1, pages: 1, total: 0 };

  // Create/Update Mutation
  const saveMutation = useMutation({
    mutationFn: async (formData) => {
      if (editingCustomer) {
        return api.put(`/customers/${editingCustomer.id || editingCustomer._id}`, formData);
      } else {
        return api.post('/customers', formData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setIsModalOpen(false);
      reset();
      setEditingCustomer(null);
    }
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      return api.delete(`/customers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    }
  });

  const onSubmit = (data) => {
    saveMutation.mutate({
      ...data,
      balance: Number(data.balance)
    });
  };

  const handleEdit = (customer) => {
    setEditingCustomer(customer);
    setValue('name', customer.name);
    setValue('phone', customer.phone);
    setValue('type', customer.type);
    setValue('address', customer.address || '');
    setValue('balance', customer.balance || 0);
    setValue('balanceType', customer.balanceType || 'Credit');
    setValue('status', customer.status || 'Active');
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setEditingCustomer(null);
    reset({
      name: '',
      phone: '',
      type: 'Retail',
      address: '',
      balance: 0,
      balanceType: 'Credit',
      status: 'Active'
    });
    setIsModalOpen(true);
  };

  const handleDelete = (customer) => {
    const id = customer.id || customer._id;
    if (window.confirm(`Are you sure you want to delete ${customer.name}?`)) {
      deleteMutation.mutate(id);
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
          <h1 className="text-2xl font-bold text-dark mb-1">Customers</h1>
          <p className="text-gray-500 text-sm">Manage your clients, track their udhar (credit), and payments.</p>
        </div>
        <button 
          onClick={handleAddNew}
          className="btn-primary flex items-center gap-2 w-full sm:w-auto justify-center"
        >
          <Plus size={18} />
          <span>Add Customer</span>
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
              placeholder="Search by name, phone or ID..."
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
              value={filterType}
              onChange={(e) => {
                setFilterType(e.target.value);
                setPage(1);
              }}
            >
              <option value="All">All Types</option>
              <option value="Wholesale">Wholesale</option>
              <option value="Retail">Retail</option>
            </select>
          </div>
        </div>

        {/* Loading / Error States */}
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="animate-spin text-primary" size={32} />
          </div>
        ) : isError ? (
          <div className="text-center py-20 text-red-500">
            Failed to load customers from backend.
          </div>
        ) : (
          <>
            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-gray-50 text-gray-500 border-b border-gray-100">
                  <tr>
                    <th className="px-4 py-3 font-medium rounded-tl-lg">ID</th>
                    <th className="px-4 py-3 font-medium">Customer Name</th>
                    <th className="px-4 py-3 font-medium">Phone</th>
                    <th className="px-4 py-3 font-medium">Type</th>
                    <th className="px-4 py-3 font-medium">Outstanding Balance</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium rounded-tr-lg text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {customersList.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="text-center py-10 text-gray-500">
                        No customers found.
                      </td>
                    </tr>
                  ) : (
                    customersList.map((customer) => (
                      <tr key={customer.id || customer._id} className="hover:bg-gray-50/50 transition-colors group">
                        <td className="px-4 py-4 text-gray-500 font-medium">{customer.customerId}</td>
                        <td className="px-4 py-4">
                          <div className="font-semibold text-dark">{customer.name}</div>
                        </td>
                        <td className="px-4 py-4 text-gray-600">{customer.phone}</td>
                        <td className="px-4 py-4 text-gray-600">{customer.type}</td>
                        <td className="px-4 py-4">
                          <span className={`font-bold ${customer.balance > 0 ? 'text-red-500' : 'text-green-500'}`}>
                            Rs {Number(customer.balance).toLocaleString()}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                            customer.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                          }`}>
                            {customer.status}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleEdit(customer)} className="p-1.5 text-gray-500 hover:bg-gray-100 rounded" title="Edit">
                              <Edit size={16} />
                            </button>
                            <button onClick={() => handleDelete(customer)} className="p-1.5 text-red-500 hover:bg-red-50 rounded" title="Delete">
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

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingCustomer ? "Edit Customer" : "Add New Customer"}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name / Business</label>
            <input type="text" {...register('name', { required: true })} className="input-field" placeholder="E.g. Ahmad Ice Depo" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              <input type="tel" {...register('phone', { required: true })} className="input-field" placeholder="0300-0000000" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Customer Type</label>
              <select {...register('type')} className="input-field">
                <option value="Retail">Retail</option>
                <option value="Wholesale">Wholesale</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address (Optional)</label>
            <textarea {...register('address')} className="input-field resize-none h-20" placeholder="Enter full address..."></textarea>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Opening/Current Balance (Rs)</label>
              <input type="number" {...register('balance')} className="input-field" placeholder="0" defaultValue="0" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Balance Type</label>
              <select {...register('balanceType')} className="input-field">
                <option value="Credit">They owe us (Udhar)</option>
                <option value="Advance">Advance Payment</option>
              </select>
            </div>
          </div>

          {editingCustomer && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select {...register('status')} className="input-field">
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          )}

          <div className="pt-4 flex justify-end gap-3 border-t border-gray-100 mt-6">
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saveMutation.isPending} className="btn-primary flex items-center gap-2">
              {saveMutation.isPending && <Loader2 className="animate-spin" size={16} />}
              <span>{editingCustomer ? "Save Changes" : "Save Customer"}</span>
            </button>
          </div>
        </form>
      </Modal>
    </motion.div>
  );
};

export default Customers;
