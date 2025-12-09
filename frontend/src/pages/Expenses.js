import React, { useState, useEffect } from 'react';
import { FaPlus, FaFileExport, FaEdit, FaTrash, FaCalendarAlt, FaTractor, FaEllipsisV, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import ActionsCell from '../components/ActionsCell';
import axios from 'axios';
import { exportToCSV, formatDataForExport } from '../utils/exportUtils';

const Expenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [machines, setMachines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [filterMachine, setFilterMachine] = useState(''); // '' means show all
  const [showFilters, setShowFilters] = useState(false);
  const [showOverflowMenu, setShowOverflowMenu] = useState(false);
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
      const response = await axios.get('/expenses', {
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
      const response = await axios.get('/machines', {
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
        await axios.put(`/expenses/${editingExpense.id}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post('/expenses', formData, {
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
        await axios.delete(`/expenses/${id}`, {
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

  const hasActiveFilters = filterMachine;

  return (
    <div className="page-container">
      {/* Page Header with Actions */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', padding: '10px 0' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600' }}>Daily Expenses</h2>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', position: 'relative' }}>
          <button 
            className="btn btn-success" 
            onClick={() => setShowModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 14px',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              border: 'none',
              background: '#28a745',
              color: 'white',
              cursor: 'pointer'
            }}
          >
            <FaPlus /> Add Expense
          </button>
          <button
            onClick={() => setShowOverflowMenu(!showOverflowMenu)}
            style={{
              padding: '10px 12px',
              borderRadius: '8px',
              background: 'rgba(100, 116, 139, 0.3)',
              border: '1px solid rgba(100, 116, 139, 0.4)',
              color: '#e2e8f0',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              fontSize: '16px'
            }}
          >
            <FaEllipsisV />
          </button>
          {showOverflowMenu && (
            <div style={{
              position: 'absolute',
              top: '45px',
              right: '0',
              background: 'rgba(30, 41, 59, 0.95)',
              border: '1px solid rgba(100, 116, 139, 0.4)',
              borderRadius: '8px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
              minWidth: '150px',
              zIndex: 1000
            }}>
              <button
                onClick={() => {
                  exportToCSV(formatDataForExport(filteredExpenses, 'expenses'), 'daily_expenses');
                  setShowOverflowMenu(false);
                }}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: 'transparent',
                  border: 'none',
                  color: '#e2e8f0',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  fontSize: '14px',
                  textAlign: 'left',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.background = 'rgba(102, 126, 234, 0.2)'}
                onMouseLeave={(e) => e.target.style.background = 'transparent'}
              >
                <FaFileExport /> Export
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Horizontal Stats Bar */}
      <div style={{ 
        display: 'flex', 
        gap: '12px', 
        marginBottom: '16px', 
        overflowX: 'auto',
        paddingBottom: '4px'
      }} className="hide-scrollbar">
        <div style={{ 
          minWidth: '140px',
          padding: '14px 18px', 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
          color: 'white',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)'
        }}>
          <div style={{ fontSize: '11px', opacity: 0.9, marginBottom: '4px' }}>
            {filterMachine ? 'Filtered' : 'Total'} 💸
          </div>
          <div style={{ fontSize: '22px', fontWeight: 'bold', letterSpacing: '-0.5px' }}>
            ₹{(totalExpensesAmount/1000).toFixed(1)}k
          </div>
        </div>
        <div style={{ 
          minWidth: '130px',
          padding: '14px 18px', 
          background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', 
          color: 'white',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(240, 147, 251, 0.3)'
        }}>
          <div style={{ fontSize: '11px', opacity: 0.9, marginBottom: '4px' }}>Transactions 📊</div>
          <div style={{ fontSize: '22px', fontWeight: 'bold' }}>{totalTransactions}</div>
        </div>
        <div style={{ 
          minWidth: '130px',
          padding: '14px 18px', 
          background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', 
          color: 'white',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(79, 172, 254, 0.3)'
        }}>
          <div style={{ fontSize: '11px', opacity: 0.9, marginBottom: '4px' }}>Machines 🚜</div>
          <div style={{ fontSize: '22px', fontWeight: 'bold' }}>{Object.keys(expensesByMachine).length}</div>
        </div>
      </div>

      {/* Collapsible Filter Section */}
      <div style={{ marginBottom: '16px' }}>
        <button
          onClick={() => setShowFilters(!showFilters)}
          style={{
            width: '100%',
            padding: '14px 16px',
            background: 'rgba(30, 41, 59, 0.6)',
            border: '1px solid rgba(100, 116, 139, 0.3)',
            borderRadius: '12px',
            color: '#e2e8f0',
            cursor: 'pointer',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '14px',
            fontWeight: '600',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => e.target.style.background = 'rgba(30, 41, 59, 0.8)'}
          onMouseLeave={(e) => e.target.style.background = 'rgba(30, 41, 59, 0.6)'}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            🔍 Filters
            {hasActiveFilters && (
              <span style={{
                background: '#667eea',
                color: 'white',
                padding: '2px 8px',
                borderRadius: '10px',
                fontSize: '11px',
                fontWeight: '600'
              }}>
                Active
              </span>
            )}
          </div>
          {showFilters ? <FaChevronUp /> : <FaChevronDown />}
        </button>

        {showFilters && (
          <div style={{ 
            background: 'rgba(30, 41, 59, 0.6)', 
            padding: '16px', 
            borderRadius: '12px', 
            marginTop: '8px',
            border: '1px solid rgba(100, 116, 139, 0.3)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ fontSize: '13px', color: '#94a3b8' }}>
                Showing {filteredExpenses.length} of {expenses.length} expenses
              </span>
              {hasActiveFilters && (
                <button 
                  onClick={() => setFilterMachine('')}
                  style={{
                    background: '#dc3545',
                    color: 'white',
                    border: 'none',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  Clear All
                </button>
              )}
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: '500', color: '#cbd5e1' }}>
                <FaTractor style={{ marginRight: '6px', fontSize: '12px' }} /> Machine
              </label>
              <select
                value={filterMachine}
                onChange={(e) => setFilterMachine(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: '8px',
                  border: '1px solid rgba(100, 116, 139, 0.3)',
                  background: 'rgba(15, 23, 42, 0.6)',
                  color: '#e2e8f0',
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                <option value="">All Machines</option>
                {machines.map((machine) => (
                  <option key={machine.id} value={machine.id}>
                    {machine.machine_owners?.name || 'N/A'} + {machine.driver_name || 'N/A'}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Expenses List - Card Layout */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {filteredExpenses.length > 0 ? (
          filteredExpenses.map((expense) => (
            <div 
              key={expense.id}
              style={{
                background: 'rgba(51, 65, 85, 0.4)',
                border: '1px solid rgba(100, 116, 139, 0.3)',
                borderRadius: '12px',
                padding: '14px',
                transition: 'all 0.2s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(102, 126, 234, 0.15)';
                e.currentTarget.style.transform = 'translateX(4px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(51, 65, 85, 0.4)';
                e.currentTarget.style.transform = 'translateX(0)';
              }}
            >
              {/* Date and Amount Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FaCalendarAlt style={{ fontSize: '12px', color: '#94a3b8' }} />
                  <span style={{ fontSize: '13px', color: '#cbd5e1', fontWeight: '500' }}>
                    {new Date(expense.expense_date).toLocaleDateString()}
                  </span>
                </div>
                <div style={{ 
                  fontSize: '18px', 
                  fontWeight: 'bold', 
                  color: '#f59e0b',
                  textAlign: 'right'
                }}>
                  ₹{parseFloat(expense.amount).toLocaleString()}
                </div>
              </div>

              {/* Machine Info */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px'
                }}>
                  <FaTractor style={{ color: 'white' }} />
                </div>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: '#e2e8f0' }}>
                    {expense.machines?.machine_owners?.name || 'N/A'}
                  </div>
                  <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                    Driver: {expense.machines?.driver_name || 'N/A'}
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                    {expense.machines?.machine_type || 'N/A'} - {expense.machines?.machine_number || 'N/A'}
                  </div>
                </div>
              </div>

              {/* Notes */}
              {expense.notes && (
                <div style={{ 
                  fontSize: '13px', 
                  color: '#cbd5e1', 
                  marginBottom: '10px',
                  padding: '8px 10px',
                  background: 'rgba(15, 23, 42, 0.5)',
                  borderRadius: '6px',
                  fontStyle: 'italic'
                }}>
                  "{expense.notes}"
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button 
                  onClick={() => handleEdit(expense)}
                  style={{ 
                    background: '#17a2b8', 
                    color: 'white', 
                    border: 'none', 
                    padding: '8px 16px', 
                    borderRadius: '8px', 
                    cursor: 'pointer', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '6px', 
                    fontSize: '13px', 
                    fontWeight: '500',
                    minHeight: '40px',
                    transition: 'all 0.2s' 
                  }} 
                  onMouseEnter={(e) => e.target.style.background = '#138496'} 
                  onMouseLeave={(e) => e.target.style.background = '#17a2b8'}
                >
                  <FaEdit /> Edit
                </button>
                <button 
                  onClick={() => handleDelete(expense.id)}
                  style={{ 
                    background: '#dc3545', 
                    color: 'white', 
                    border: 'none', 
                    padding: '8px 16px', 
                    borderRadius: '8px', 
                    cursor: 'pointer', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '6px', 
                    fontSize: '13px', 
                    fontWeight: '500',
                    minHeight: '40px',
                    transition: 'all 0.2s' 
                  }} 
                  onMouseEnter={(e) => e.target.style.background = '#c82333'} 
                  onMouseLeave={(e) => e.target.style.background = '#dc3545'}
                >
                  <FaTrash /> Delete
                </button>
              </div>
            </div>
          ))
        ) : (
          <div style={{ 
            textAlign: 'center', 
            padding: '48px 20px',
            background: 'rgba(51, 65, 85, 0.4)',
            borderRadius: '12px',
            border: '1px solid rgba(100, 116, 139, 0.3)'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>💸</div>
            <div style={{ fontSize: '16px', color: '#cbd5e1', fontWeight: '500' }}>
              {filterMachine 
                ? 'No expenses found for this machine.' 
                : 'No expenses recorded yet.'}
            </div>
            <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '6px' }}>
              Click "Add Expense" to get started!
            </div>
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
