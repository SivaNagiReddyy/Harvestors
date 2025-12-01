import React, { useState, useEffect } from 'react';
import { FaPlus } from 'react-icons/fa';
import ActionsCell from '../components/ActionsCell';
import axios from 'axios';

const Expenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [machines, setMachines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [filterMachine, setFilterMachine] = useState(''); // '' means show all
  const [formData, setFormData] = useState({
    machine: '',
    expenseDate: new Date().toISOString().split('T')[0],
    amount: '',
    notes: ''
  });

  useEffect(() => {
    fetchExpenses();
    fetchMachines();
  }, []);

  const fetchExpenses = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/expenses', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setExpenses(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching expenses:', error);
      setLoading(false);
    }
  };

  const fetchMachines = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/machines', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMachines(response.data);
    } catch (error) {
      console.error('Error fetching machines:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      if (editingExpense) {
        await axios.put(`/api/expenses/${editingExpense.id}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post('/api/expenses', formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      fetchExpenses();
      handleCloseModal();
    } catch (error) {
      console.error('Error saving expense:', error);
      alert('Failed to save expense');
    }
  };

  const handleEdit = (expense) => {
    setEditingExpense(expense);
    setFormData({
      machine: expense.machine_id,
      expenseDate: expense.expense_date?.split('T')[0] || '',
      amount: expense.amount || '',
      notes: expense.notes || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`/api/expenses/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        fetchExpenses();
      } catch (error) {
        console.error('Error deleting expense:', error);
        alert('Failed to delete expense');
      }
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingExpense(null);
    setFormData({
      machine: '',
      expenseDate: new Date().toISOString().split('T')[0],
      amount: '',
      notes: ''
    });
  };

  // Filter expenses based on selected machine
  const filteredExpenses = filterMachine 
    ? expenses.filter(exp => exp.machine_id === filterMachine)
    : expenses;

  // Calculate totals based on filtered expenses
  const totalExpensesAmount = filteredExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0);
  const totalTransactions = filteredExpenses.length;

  // Group filtered expenses by machine for any future use
  const expensesByMachine = filteredExpenses.reduce((acc, expense) => {
    const machineId = expense.machine_id;
    if (!acc[machineId]) {
      acc[machineId] = {
        machine: expense.machines,
        total: 0,
        count: 0
      };
    }
    acc[machineId].total += parseFloat(expense.amount || 0);
    acc[machineId].count += 1;
    return acc;
  }, {});

  if (loading) {
    return <div className="loading">Loading expenses...</div>;
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>Daily Expenses</h2>
        <button className="btn btn-success" onClick={() => setShowModal(true)}>
          <FaPlus /> Add Expense
        </button>
      </div>

      {/* Summary Cards - Updated to show filtered data */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div className="card" style={{ padding: '20px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', opacity: 0.9 }}>
            {filterMachine ? 'Filtered Expenses' : 'Total Expenses'}
          </h4>
          <p style={{ margin: 0, fontSize: '28px', fontWeight: 'bold' }}>
            ₹{totalExpensesAmount.toLocaleString()}
          </p>
        </div>
        <div className="card" style={{ padding: '20px', background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white' }}>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', opacity: 0.9 }}>
            {filterMachine ? 'Filtered Transactions' : 'Total Transactions'}
          </h4>
          <p style={{ margin: 0, fontSize: '28px', fontWeight: 'bold' }}>{totalTransactions}</p>
        </div>
        <div className="card" style={{ padding: '20px', background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white' }}>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', opacity: 0.9 }}>Machines Tracked</h4>
          <p style={{ margin: 0, fontSize: '28px', fontWeight: 'bold' }}>{Object.keys(expensesByMachine).length}</p>
        </div>
      </div>

      {/* All Expenses Table */}
      <div className="card">
        <div className="expense-filter-container" style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '20px', 
          flexWrap: 'wrap', 
          gap: '16px' 
        }}>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>All Expense Transactions</h3>
          
          {/* Filter Control Group */}
          <div className="expense-filter-controls" style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '10px',
            flexWrap: 'wrap'
          }}>
            <label style={{ 
              fontSize: '13px', 
              fontWeight: '500',
              color: '#6b7280',
              whiteSpace: 'nowrap'
            }}>
              Filter:
            </label>
            
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <span style={{
                position: 'absolute',
                left: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: '14px',
                color: '#9ca3af',
                pointerEvents: 'none'
              }}>
                🔍
              </span>
              <select 
                value={filterMachine} 
                onChange={(e) => setFilterMachine(e.target.value)}
                style={{ 
                  padding: '6px 12px 6px 32px',
                  borderRadius: '8px', 
                  border: '1px solid #d1d5db',
                  fontSize: '13px',
                  minWidth: '220px',
                  maxWidth: '100%',
                  cursor: 'pointer',
                  backgroundColor: '#ffffff',
                  color: '#374151',
                  fontWeight: '500',
                  transition: 'all 0.2s ease',
                  outline: 'none',
                  WebkitAppearance: 'none',
                  MozAppearance: 'none',
                  appearance: 'none',
                  backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3E%3Cpath stroke=\'%236b7280\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'M6 8l4 4 4-4\'/%3E%3C/svg%3E")',
                  backgroundPosition: 'right 8px center',
                  backgroundRepeat: 'no-repeat',
                  backgroundSize: '20px',
                  paddingRight: '32px'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.borderColor = '#9ca3af';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.borderColor = '#d1d5db';
                  e.currentTarget.style.boxShadow = 'none';
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#3b82f6';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#d1d5db';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <option value="">All Machines ({expenses.length})</option>
                {machines.map((machine) => {
                  const machineExpenses = expenses.filter(exp => exp.machine_id === machine.id);
                  const totalAmount = machineExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0);
                  return (
                    <option key={machine.id} value={machine.id}>
                      {machine.machine_type} - {machine.machine_number} ({machineExpenses.length}, ₹{totalAmount.toLocaleString()})
                    </option>
                  );
                })}
              </select>
            </div>
            
            {filterMachine && (
              <button 
                onClick={() => setFilterMachine('')}
                style={{ 
                  padding: '6px 14px',
                  background: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: '600',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                  whiteSpace: 'nowrap'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.background = '#dc2626';
                  e.currentTarget.style.boxShadow = '0 4px 6px rgba(239, 68, 68, 0.2)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.background = '#ef4444';
                  e.currentTarget.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.05)';
                }}
              >
                ✕ Clear
              </button>
            )}
          </div>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Machine</th>
              <th>Driver</th>
              <th>Amount</th>
              <th>Notes</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredExpenses.length > 0 ? (
              filteredExpenses.map((expense) => (
                <tr key={expense.id}>
                  <td>{new Date(expense.expense_date).toLocaleDateString()}</td>
                  <td>{expense.machines?.machine_type || 'N/A'} - {expense.machines?.machine_number || 'N/A'}</td>
                  <td>{expense.machines?.driver_name || 'N/A'}</td>
                  <td style={{ fontWeight: 'bold', color: '#f59e0b' }}>₹{parseFloat(expense.amount).toLocaleString()}</td>
                  <td>{expense.notes || '-'}</td>
                  <td>
                    <ActionsCell
                      onEdit={() => handleEdit(expense)}
                      onDelete={() => handleDelete(expense.id)}
                    />
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center', padding: '40px' }}>
                  {filterMachine 
                    ? `No expenses found for this machine.` 
                    : 'No expenses recorded yet. Add your first expense above!'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
        {filterMachine && filteredExpenses.length > 0 && (
          <div className="expense-filter-summary" style={{ 
            marginTop: '16px',
            padding: '14px 18px',
            background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
            borderRadius: '10px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
            border: '1px solid #d1d5db'
          }}>
            <span style={{ 
              fontSize: '13px',
              fontWeight: '600',
              color: '#4b5563'
            }}>
              📊 Showing {filteredExpenses.length} transaction{filteredExpenses.length !== 1 ? 's' : ''} for selected machine
            </span>
            <span style={{ 
              fontSize: '15px',
              fontWeight: '700',
              color: '#f59e0b',
              padding: '4px 12px',
              background: '#ffffff',
              borderRadius: '6px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
            }}>
              Total: ₹{filteredExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0).toLocaleString()}
            </span>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>{editingExpense ? 'Edit Expense' : 'Add Daily Expense'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Machine <span className="required-star">*</span></label>
                <select
                  value={formData.machine}
                  onChange={(e) => setFormData({ ...formData, machine: e.target.value })}
                  required
                >
                  <option value="">Select machine...</option>
                  {machines.map((machine) => (
                    <option key={machine.id} value={machine.id}>
                      {machine.driver_name || 'Unknown'} - {machine.machine_owners?.name || 'Unknown'}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Date <span className="required-star">*</span></label>
                <input
                  type="date"
                  value={formData.expenseDate}
                  onChange={(e) => setFormData({ ...formData, expenseDate: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Amount (₹) <span className="required-star">*</span></label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="Enter amount..."
                  required
                  min="0"
                  step="10"
                />
                <small style={{ color: 'var(--text-secondary)', display: 'block', marginTop: '4px' }}>
                  💡 Money given to driver for daily expenses
                </small>
              </div>
              <div className="form-group">
                <label>Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Fuel, food, etc..."
                  rows="3"
                ></textarea>
              </div>              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={handleCloseModal}>Cancel</button>
                <button type="submit" className="btn-primary">
                  {editingExpense ? 'Update Expense' : 'Add Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Expenses;
