import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Filter, Settings, Activity, Trash, Edit, Loader2 } from 'lucide-react';
import Modal from '../../components/ui/Modal';
import { useForm } from 'react-hook-form';
import api from '../../api/axios';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const Production = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterShift, setFilterShift] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduction, setEditingProduction] = useState(null);
  const [page, setPage] = useState(1);

  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm();

  // Fetch Production Logs Query
  const { data: prodData, isLoading, isError } = useQuery({
    queryKey: ['production', searchTerm, filterShift, page],
    queryFn: async () => {
      const params = {
        search: searchTerm || undefined,
        shift: filterShift !== 'All' ? filterShift : undefined,
        page,
        limit: 10
      };
      const response = await api.get('/production', { params });
      return response.data;
    },
    keepPreviousData: true
  });

  const productionsList = prodData?.data || [];
  const pagination = prodData?.pagination || { page: 1, pages: 1, total: 0 };

  // Calculate stats based on today's date
  const todayStr = new Date().toISOString().split('T')[0];
  const todayProductions = productionsList.filter(p => p.date?.split('T')[0] === todayStr);
  const todayTotalProduced = todayProductions.reduce((sum, p) => sum + (p.produced || 0), 0);
  const todayWastage = todayProductions.reduce((sum, p) => sum + (p.damaged || 0), 0);

  // Save Mutation (Create/Update)
  const saveMutation = useMutation({
    mutationFn: async (formData) => {
      if (editingProduction) {
        return api.put(`/production/${editingProduction.id || editingProduction._id}`, formData);
      } else {
        return api.post('/production', formData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['production'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] }); // Inventory quantities update automatically
      setIsModalOpen(false);
      reset();
      setEditingProduction(null);
    }
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      return api.delete(`/production/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['production'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
    }
  });

  const onSubmit = (data) => {
    saveMutation.mutate({
      ...data,
      produced: Number(data.produced),
      damaged: Number(data.damaged)
    });
  };

  const handleAddNew = () => {
    setEditingProduction(null);
    reset({
      date: new Date().toISOString().split('T')[0],
      shift: 'Morning',
      type: 'Block Ice',
      operator: '',
      produced: '',
      damaged: 0,
      status: 'Completed'
    });
    setIsModalOpen(true);
  };

  const handleEdit = (prod) => {
    setEditingProduction(prod);
    setValue('date', prod.date ? new Date(prod.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
    setValue('shift', prod.shift);
    setValue('type', prod.type);
    setValue('operator', prod.operator);
    setValue('produced', prod.produced);
    setValue('damaged', prod.damaged);
    setValue('status', prod.status);
    setIsModalOpen(true);
  };

  const handleDelete = (prod) => {
    const id = prod.id || prod._id;
    if (window.confirm(`Are you sure you want to delete this production entry?`)) {
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
          <h1 className="text-2xl font-bold text-dark mb-1">Production</h1>
          <p className="text-gray-500 text-sm">Monitor daily manufacturing, machine shifts, and wastage.</p>
        </div>
        <button 
          onClick={handleAddNew}
          className="btn-primary flex items-center gap-2 w-full sm:w-auto justify-center"
        >
          <Plus size={18} />
          <span>New Production Entry</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="card bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-500 text-white rounded-lg">
              <Activity size={20} />
            </div>
            <h3 className="font-semibold text-blue-900">Today's Total</h3>
          </div>
          <p className="text-3xl font-bold text-blue-700">{todayTotalProduced.toLocaleString()} <span className="text-sm font-medium">Units</span></p>
        </div>
        <div className="card bg-gradient-to-br from-green-50 to-green-100/50 border-green-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-500 text-white rounded-lg">
              <Settings size={20} className="animate-spin-slow" />
            </div>
            <h3 className="font-semibold text-green-900">Active Runs</h3>
          </div>
          <p className="text-3xl font-bold text-green-700">{productionsList.filter(p => p.status === 'In Progress').length} <span className="text-sm font-medium">Active</span></p>
        </div>
        <div className="card bg-gradient-to-br from-orange-50 to-orange-100/50 border-orange-100">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-orange-500 text-white rounded-lg">
              <Settings size={20} />
            </div>
            <h3 className="font-semibold text-orange-900">Today's Wastage</h3>
          </div>
          <p className="text-3xl font-bold text-orange-700">{todayWastage.toLocaleString()} <span className="text-sm font-medium">Units</span></p>
        </div>
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
              placeholder="Search operator, type..."
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
              value={filterShift}
              onChange={(e) => {
                setFilterShift(e.target.value);
                setPage(1);
              }}
            >
              <option value="All">All Shifts</option>
              <option value="Morning">Morning</option>
              <option value="Evening">Evening</option>
              <option value="Night">Night</option>
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
            Failed to load production entries from backend.
          </div>
        ) : (
          <>
            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-gray-50 text-gray-500 border-b border-gray-100">
                  <tr>
                    <th className="px-4 py-3 font-medium rounded-tl-lg">ID</th>
                    <th className="px-4 py-3 font-medium">Date & Shift</th>
                    <th className="px-4 py-3 font-medium">Type</th>
                    <th className="px-4 py-3 font-medium">Produced</th>
                    <th className="px-4 py-3 font-medium">Damaged</th>
                    <th className="px-4 py-3 font-medium">Operator</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium rounded-tr-lg text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {productionsList.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="text-center py-10 text-gray-500">
                        No production records found.
                      </td>
                    </tr>
                  ) : (
                    productionsList.map((prod) => (
                      <tr key={prod.id || prod._id} className="hover:bg-gray-50/50 transition-colors group">
                        <td className="px-4 py-4 text-gray-500 font-medium">{prod.productionId}</td>
                        <td className="px-4 py-4">
                          <div className="font-semibold text-dark">
                            {prod.date ? new Date(prod.date).toLocaleDateString() : ''}
                          </div>
                          <div className="text-xs text-gray-500">{prod.shift} Shift</div>
                        </td>
                        <td className="px-4 py-4 text-gray-600">{prod.type}</td>
                        <td className="px-4 py-4 font-bold text-dark">{prod.produced}</td>
                        <td className="px-4 py-4">
                          <span className={`font-medium ${prod.damaged > 0 ? 'text-red-500' : 'text-gray-400'}`}>
                            {prod.damaged}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-gray-600">{prod.operator}</td>
                        <td className="px-4 py-4">
                          <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                            prod.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700 animate-pulse'
                          }`}>
                            {prod.status}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleEdit(prod)} className="p-1.5 text-gray-500 hover:bg-gray-100 rounded" title="Edit">
                              <Edit size={16} />
                            </button>
                            <button onClick={() => handleDelete(prod)} className="p-1.5 text-red-500 hover:bg-red-50 rounded" title="Delete">
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

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingProduction ? "Edit Production Entry" : "New Production Entry"}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input type="date" {...register('date', { required: true })} className="input-field" defaultValue={new Date().toISOString().split('T')[0]} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Shift</label>
              <select {...register('shift')} className="input-field">
                <option value="Morning">Morning</option>
                <option value="Evening">Evening</option>
                <option value="Night">Night</option>
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ice Type</label>
              <select {...register('type')} className="input-field">
                <option value="Block Ice">Block Ice</option>
                <option value="Tube Ice">Tube Ice</option>
                <option value="Crushed Ice">Crushed Ice</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Operator Name</label>
              <input type="text" {...register('operator', { required: true })} className="input-field" placeholder="E.g. Ali Khan" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Total Produced (Units)</label>
              <input type="number" {...register('produced', { required: true, min: 1 })} className="input-field" placeholder="0" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Damaged/Wasted</label>
              <input type="number" {...register('damaged', { required: true, min: 0 })} className="input-field" placeholder="0" defaultValue="0" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select {...register('status')} className="input-field">
              <option value="Completed">Completed</option>
              <option value="In Progress">In Progress</option>
            </select>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-gray-100 mt-6">
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saveMutation.isPending} className="btn-primary flex items-center gap-2">
              {saveMutation.isPending && <Loader2 className="animate-spin" size={16} />}
              <span>{editingProduction ? "Save Changes" : "Save Entry"}</span>
            </button>
          </div>
        </form>
      </Modal>
    </motion.div>
  );
};

export default Production;
