import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, DollarSign, Wallet, Loader2, Edit, Trash } from 'lucide-react';
import Modal from '../../components/ui/Modal';
import { useForm } from 'react-hook-form';
import api from '../../api/axios';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const Expenses = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [page, setPage] = useState(1);

  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm();

  // Fetch Expenses Query
  const { data: expData, isLoading, isError } = useQuery({
    queryKey: ['expenses', searchTerm, filterCategory, page],
    queryFn: async () => {
      const params = {
        search: searchTerm || undefined,
        category: filterCategory !== 'All' ? filterCategory : undefined,
        page,
        limit: 10
      };
      const response = await api.get('/expenses', { params });
      return response.data;
    },
    keepPreviousData: true
  });

  const expensesList = expData?.data || [];
  const pagination = expData?.pagination || { page: 1, pages: 1, total: 0 };

  // Calculate stats
  const totalExpenses = expensesList.reduce((sum, e) => sum + (e.amount || 0), 0);

  const categories = ['Electricity', 'Diesel/Fuel', 'Salaries', 'Maintenance', 'Office & Others'];
  
  // Category-based amounts
  const categoryStats = categories.map(cat => {
    const total = expensesList.filter(e => e.category === cat).reduce((sum, e) => sum + (e.amount || 0), 0);
    const percentage = totalExpenses > 0 ? Math.round((total / totalExpenses) * 100) : 0;
    return { name: cat, total, percentage };
  });

  // Save Mutation (Create/Update)
  const saveMutation = useMutation({
    mutationFn: async (formData) => {
      if (editingExpense) {
        return api.put(`/expenses/${editingExpense.id || editingExpense._id}`, formData);
      } else {
        return api.post('/expenses', formData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      setIsModalOpen(false);
      reset();
      setEditingExpense(null);
    }
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      return api.delete(`/expenses/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
    }
  });

  const onSubmit = (data) => {
    saveMutation.mutate({
      ...data,
      amount: Number(data.amount)
    });
  };

  const handleAddNew = () => {
    setEditingExpense(null);
    reset({
      date: new Date().toISOString().split('T')[0],
      category: 'Electricity',
      amount: '',
      description: ''
    });
    setIsModalOpen(true);
  };

  const handleEdit = (expense) => {
    setEditingExpense(expense);
    setValue('date', expense.date ? new Date(expense.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
    setValue('category', expense.category);
    setValue('amount', expense.amount);
    setValue('description', expense.description);
    setIsModalOpen(true);
  };

  const handleDelete = (expense) => {
    const id = expense.id || expense._id;
    if (window.confirm(`Are you sure you want to delete this expense record?`)) {
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
          <h1 className="text-2xl font-bold text-dark mb-1">Expenses</h1>
          <p className="text-gray-500 text-sm">Monitor business running costs, fuel, electricity, and maintenance.</p>
        </div>
        <button
          onClick={handleAddNew}
          className="btn-primary flex items-center gap-2 w-full sm:w-auto justify-center"
        >
          <Plus size={18} />
          <span>Add Expense</span>
        </button>
      </div>

      {/* Category Wise Summary */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="card md:col-span-2 bg-gradient-to-br from-red-50 to-red-100/50 border-red-100 flex flex-col justify-between p-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-red-500 text-white rounded-lg"><DollarSign size={20} /></div>
              <h3 className="font-semibold text-red-900">Total Monthly Expenses</h3>
            </div>
            <p className="text-3xl font-bold text-red-700 mt-2">Rs {totalExpenses.toLocaleString()}</p>
          </div>
          <span className="text-xs text-gray-500 mt-4">Updated in real-time</span>
        </div>

        {categoryStats.slice(0, 3).map((cat) => (
          <div key={cat.name} className="card flex flex-col justify-between">
            <div>
              <h4 className="text-sm font-semibold text-gray-500">{cat.name}</h4>
              <p className="text-xl font-bold text-dark mt-2">Rs {cat.total.toLocaleString()}</p>
            </div>
            <div className="mt-4">
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>Share</span>
                <span>{cat.percentage}%</span>
              </div>
              <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                <div className="bg-red-500 h-full" style={{ width: `${cat.percentage}%` }}></div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search description..."
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
            <option value="All">All Categories</option>
            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        </div>

        {/* Loading / Error States */}
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="animate-spin text-primary" size={32} />
          </div>
        ) : isError ? (
          <div className="text-center py-20 text-red-500">
            Failed to load expenses from backend.
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-gray-50 text-gray-500 border-b border-gray-100">
                  <tr>
                    <th className="px-4 py-3 font-medium rounded-tl-lg">ID</th>
                    <th className="px-4 py-3 font-medium">Date</th>
                    <th className="px-4 py-3 font-medium">Category</th>
                    <th className="px-4 py-3 font-medium">Description</th>
                    <th className="px-4 py-3 font-medium">Amount</th>
                    <th className="px-4 py-3 font-medium rounded-tr-lg text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {expensesList.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center py-10 text-gray-500">
                        No expense records found.
                      </td>
                    </tr>
                  ) : (
                    expensesList.map((expense) => (
                      <tr key={expense.id || expense._id} className="hover:bg-gray-50/50 transition-colors group">
                        <td className="px-4 py-4 text-gray-500 font-medium">{expense.expenseId}</td>
                        <td className="px-4 py-4 text-gray-500">
                          {expense.date ? new Date(expense.date).toLocaleDateString() : ''}
                        </td>
                        <td className="px-4 py-4">
                          <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-red-50 text-red-700">
                            {expense.category}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-gray-700 font-medium text-xs max-w-[200px] truncate">{expense.description || '–'}</td>
                        <td className="px-4 py-4 font-bold text-dark">
                          Rs {Number(expense.amount).toLocaleString()}
                        </td>
                        <td className="px-4 py-4 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleEdit(expense)} className="p-1.5 text-gray-500 hover:bg-gray-100 rounded" title="Edit">
                              <Edit size={16} />
                            </button>
                            <button onClick={() => handleDelete(expense)} className="p-1.5 text-red-500 hover:bg-red-50 rounded" title="Delete">
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

      {/* Add / Edit Expense Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingExpense ? "Edit Expense Entry" : "Record New Expense"}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input type="date" {...register('date', { required: true })} className="input-field" defaultValue={new Date().toISOString().split('T')[0]} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select {...register('category')} className="input-field">
                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount (Rs)</label>
            <input type="number" {...register('amount', { required: true, min: 1 })} className="input-field" placeholder="Enter amount" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description / Details</label>
            <textarea {...register('description', { required: true })} className="input-field resize-none h-20" placeholder="E.g. Electricity bill for April..."></textarea>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-gray-100 mt-6">
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={saveMutation.isPending} className="btn-primary flex items-center gap-2">
              {saveMutation.isPending && <Loader2 className="animate-spin" size={16} />}
              <span>{editingExpense ? "Save Changes" : "Record Expense"}</span>
            </button>
          </div>
        </form>
      </Modal>
    </motion.div>
  );
};

export default Expenses;
