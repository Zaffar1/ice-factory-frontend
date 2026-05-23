import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, PackageOpen, AlertTriangle, ArrowUpCircle, ArrowDownCircle, Trash, Loader2 } from 'lucide-react';
import Modal from '../../components/ui/Modal';
import { useForm } from 'react-hook-form';
import api from '../../api/axios';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const Inventory = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [page, setPage] = useState(1);

  const queryClient = useQueryClient();
  const { register, handleSubmit, reset } = useForm();
  const { register: registerAdjust, handleSubmit: handleAdjustSubmit, reset: resetAdjust, watch: watchAdjust } = useForm({
    defaultValues: { adjustType: 'add', adjustQty: 0 }
  });

  const adjustType = watchAdjust('adjustType');

  // Fetch Inventory Query
  const { data: invData, isLoading, isError } = useQuery({
    queryKey: ['inventory', searchTerm, filterCategory, page],
    queryFn: async () => {
      const params = {
        search: searchTerm || undefined,
        category: filterCategory !== 'All' ? filterCategory : undefined,
        page,
        limit: 10
      };
      const response = await api.get('/inventory', { params });
      return response.data;
    },
    keepPreviousData: true
  });

  const inventoryList = invData?.data || [];
  const pagination = invData?.pagination || { page: 1, pages: 1, total: 0 };

  // Calculated Stats
  const totalItems = pagination.total || 0;
  const lowStockCount = inventoryList.filter(item => item.qty < item.minQty).length;

  // Add Item Mutation
  const addMutation = useMutation({
    mutationFn: async (formData) => {
      return api.post('/inventory', formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      setIsAddModalOpen(false);
      reset();
    }
  });

  // Adjust Stock Mutation
  const adjustMutation = useMutation({
    mutationFn: async ({ id, data }) => {
      return api.patch(`/inventory/${id}/adjust`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      setIsAdjustModalOpen(false);
      setSelectedItem(null);
      resetAdjust();
    }
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      return api.delete(`/inventory/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    }
  });

  const onAddSubmit = (data) => {
    addMutation.mutate({
      ...data,
      qty: Number(data.qty),
      minQty: Number(data.minQty)
    });
  };

  const onAdjustSubmit = (data) => {
    if (!selectedItem) return;
    const id = selectedItem.id || selectedItem._id;
    adjustMutation.mutate({
      id,
      data: {
        adjustType: data.adjustType,
        adjustQty: Number(data.adjustQty),
        reason: data.reason
      }
    });
  };

  const handleDelete = (item) => {
    const id = item.id || item._id;
    if (window.confirm(`Are you sure you want to delete ${item.item}?`)) {
      deleteMutation.mutate(id);
    }
  };

  const openAdjustModal = (item) => {
    setSelectedItem(item);
    setIsAdjustModalOpen(true);
  };

  const categories = ['All', 'Raw Material', 'Finished Goods', 'Packaging', 'Spare Parts'];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-dark mb-1">Inventory</h1>
          <p className="text-gray-500 text-sm">Track raw materials and finished goods stock levels.</p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="btn-primary flex items-center gap-2 w-full sm:w-auto justify-center"
        >
          <Plus size={18} />
          <span>Add Item</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-500 text-white rounded-lg"><PackageOpen size={20} /></div>
            <h3 className="font-semibold text-blue-900">Total Items</h3>
          </div>
          <p className="text-3xl font-bold text-blue-700">{totalItems}</p>
        </div>
        <div className="card bg-gradient-to-br from-red-50 to-red-100/50 border-red-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-red-500 text-white rounded-lg"><AlertTriangle size={20} /></div>
            <h3 className="font-semibold text-red-900">Low Stock Alerts</h3>
          </div>
          <p className="text-3xl font-bold text-red-700">{lowStockCount}</p>
        </div>
        <div className="card bg-gradient-to-br from-green-50 to-green-100/50 border-green-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-500 text-white rounded-lg"><PackageOpen size={20} /></div>
            <h3 className="font-semibold text-green-900">In Stock</h3>
          </div>
          <p className="text-3xl font-bold text-green-700">{Math.max(0, totalItems - lowStockCount)}</p>
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
              placeholder="Search items..."
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
            value={filterCategory}
            onChange={(e) => {
              setFilterCategory(e.target.value);
              setPage(1);
            }}
          >
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* Loading / Error States */}
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="animate-spin text-primary" size={32} />
          </div>
        ) : isError ? (
          <div className="text-center py-20 text-red-500">
            Failed to load inventory items from backend.
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-gray-50 text-gray-500 border-b border-gray-100">
                  <tr>
                    <th className="px-4 py-3 font-medium rounded-tl-lg">Item</th>
                    <th className="px-4 py-3 font-medium">Category</th>
                    <th className="px-4 py-3 font-medium">Current Stock</th>
                    <th className="px-4 py-3 font-medium">Min. Required</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium rounded-tr-lg text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {inventoryList.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center py-10 text-gray-500">
                        No inventory items found.
                      </td>
                    </tr>
                  ) : (
                    inventoryList.map((item) => {
                      const isLow = item.qty < item.minQty;
                      return (
                        <tr key={item.id || item._id} className="hover:bg-gray-50/50 transition-colors group">
                          <td className="px-4 py-4">
                            <div className="font-semibold text-dark flex items-center gap-2">
                              <PackageOpen size={16} className="text-primary" />
                              {item.item}
                            </div>
                          </td>
                          <td className="px-4 py-4 text-gray-600">{item.category}</td>
                          <td className="px-4 py-4 font-bold text-dark">{item.qty} {item.unit}</td>
                          <td className="px-4 py-4 text-gray-500">{item.minQty} {item.unit}</td>
                          <td className="px-4 py-4">
                            <span className={`px-2.5 py-1 text-xs font-medium rounded-full flex items-center gap-1 w-fit ${
                              !isLow ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                            }`}>
                              {isLow && <AlertTriangle size={12} />}
                              {isLow ? 'Low Stock' : 'In Stock'}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-right">
                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => openAdjustModal(item)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" title="Adjust Stock">
                                <ArrowUpCircle size={16} />
                              </button>
                              <button onClick={() => handleDelete(item)} className="p-1.5 text-red-500 hover:bg-red-50 rounded" title="Delete">
                                <Trash size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
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

      {/* Add Item Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add Inventory Item">
        <form onSubmit={handleSubmit(onAddSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Item Name</label>
            <input type="text" {...register('item', { required: true })} className="input-field" placeholder="E.g. Ammonia Gas" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select {...register('category')} className="input-field">
                <option value="Raw Material">Raw Material</option>
                <option value="Finished Goods">Finished Goods</option>
                <option value="Packaging">Packaging</option>
                <option value="Spare Parts">Spare Parts</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
              <select {...register('unit')} className="input-field">
                <option value="Kg">Kg</option>
                <option value="Blocks">Blocks</option>
                <option value="Bags">Bags</option>
                <option value="Liters">Liters</option>
                <option value="Pcs">Pcs</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Current Quantity</label>
              <input type="number" {...register('qty', { required: true, min: 0 })} className="input-field" placeholder="0" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Min. Stock Level</label>
              <input type="number" {...register('minQty', { required: true, min: 0 })} className="input-field" placeholder="0" />
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-gray-100 mt-6">
            <button type="button" onClick={() => setIsAddModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={addMutation.isPending} className="btn-primary flex items-center gap-2">
              {addMutation.isPending && <Loader2 className="animate-spin" size={16} />}
              <span>Add Item</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Adjust Stock Modal */}
      <Modal isOpen={isAdjustModalOpen} onClose={() => { setIsAdjustModalOpen(false); setSelectedItem(null); }} title="Adjust Stock">
        {selectedItem && (
          <form onSubmit={handleAdjustSubmit(onAdjustSubmit)} className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
              <p className="text-sm text-gray-500">Adjusting stock for:</p>
              <p className="text-lg font-bold text-dark">{selectedItem.item}</p>
              <p className="text-sm text-gray-500 mt-1">Current: <span className="font-semibold text-dark">{selectedItem.qty} {selectedItem.unit}</span></p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Adjustment Type</label>
              <div className="grid grid-cols-2 gap-3">
                <label className={`flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${adjustType === 'add' ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300'}`}>
                  <input type="radio" value="add" {...registerAdjust('adjustType')} className="sr-only" />
                  <ArrowUpCircle size={20} className={adjustType === 'add' ? 'text-green-600' : 'text-gray-400'} />
                  <span className={`font-medium ${adjustType === 'add' ? 'text-green-700' : 'text-gray-600'}`}>Stock In</span>
                </label>
                <label className={`flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${adjustType === 'remove' ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:border-gray-300'}`}>
                  <input type="radio" value="remove" {...registerAdjust('adjustType')} className="sr-only" />
                  <ArrowDownCircle size={20} className={adjustType === 'remove' ? 'text-red-600' : 'text-gray-400'} />
                  <span className={`font-medium ${adjustType === 'remove' ? 'text-red-700' : 'text-gray-600'}`}>Stock Out</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantity ({selectedItem.unit})</label>
              <input type="number" {...registerAdjust('adjustQty', { required: true, min: 1 })} className="input-field" placeholder="Enter quantity" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reason (Optional)</label>
              <input type="text" {...registerAdjust('reason')} className="input-field" placeholder="E.g. New delivery received" />
            </div>

            <div className="pt-4 flex justify-end gap-3 border-t border-gray-100 mt-6">
              <button type="button" onClick={() => { setIsAdjustModalOpen(false); setSelectedItem(null); }} className="btn-secondary">Cancel</button>
              <button type="submit" disabled={adjustMutation.isPending} className="btn-primary flex items-center gap-2">
                {adjustMutation.isPending && <Loader2 className="animate-spin" size={16} />}
                <span>Update Stock</span>
              </button>
            </div>
          </form>
        )}
      </Modal>
    </motion.div>
  );
};

export default Inventory;
