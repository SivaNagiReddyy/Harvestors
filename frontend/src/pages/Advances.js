import React, { useState, useEffect } from 'react';
import { advanceAPI, machineAPI } from '../api';
import { FaPlus, FaMoneyBillWave, FaFileExport } from 'react-icons/fa';
import ActionsCell from '../components/ActionsCell';
import FilterBar from '../components/FilterBar';
import { exportToCSV, formatDataForExport } from '../utils/exportUtils';

const Advances = () => {
  const [advances, setAdvances] = useState([]);
  const [machines, setMachines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAdvance, setEditingAdvance] = useState(null);
  const [formData, setFormData] = useState({
    machineId: '',
    amount: '',
    advanceDate: new Date().toISOString().split('T')[0],
    paidBy: 'Owner', // Owner or Farmer
    notes: ''
  });

  // Filter states
  const [filterMachine, setFilterMachine] = useState('');
  const [filterPaidBy, setFilterPaidBy] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');

  useEffect(() => {
    fetchAdvances();
    fetchMachines();
  }, []);

  const fetchAdvances = async () => {
    try {
      const response = await advanceAPI.getAll();
      setAdvances(response.data);
    } catch (error) {
      console.error('Error fetching advances:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMachines = async () => {
    try {
      const response = await machineAPI.getAll();
      setMachines(response.data.filter(m => m.status === 'Active'));
    } catch (error) {
      console.error('Error fetching machines:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingAdvance) {
        await advanceAPI.update(editingAdvance.id, formData);
      } else {
        await advanceAPI.create(formData);
      }
      fetchAdvances();
      fetchMachines(); // Refresh to update total_advances_given
      handleCloseModal();
    } catch (error) {
      alert(error.response?.data?.error || 'Error saving advance');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this advance?')) {
      try {
        await advanceAPI.delete(id);
        fetchAdvances();
        fetchMachines(); // Refresh to update total_advances_given
      } catch (error) {
        alert(error.response?.data?.error || 'Error deleting advance');
      }
    }
  };

  const handleEdit = (advance) => {
    setEditingAdvance(advance);
    setFormData({
      machineId: advance.machine_id || '',
      amount: advance.amount || '',
      advanceDate: advance.advance_date?.split('T')[0] || '',
      paidBy: advance.paid_by || 'Owner',
      notes: advance.notes || ''
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingAdvance(null);
    setFormData({
      machineId: '',
      amount: '',
      advanceDate: new Date().toISOString().split('T')[0],
      paidBy: 'Owner',
      notes: ''
    });
  };

  // Apply filters
  const filteredAdvances = advances.filter(advance => {
    if (filterMachine && advance.machine_id !== filterMachine) return false;
    if (filterPaidBy && advance.paid_by !== filterPaidBy) return false;
    
    const advanceDate = new Date(advance.advance_date);
    if (filterDateFrom && advanceDate < new Date(filterDateFrom)) return false;
    if (filterDateTo && advanceDate > new Date(filterDateTo)) return false;
    
    return true;
  });

  const clearFilters = () => {
    setFilterMachine('');
    setFilterPaidBy('');
    setFilterDateFrom('');
    setFilterDateTo('');
  };

  const hasActiveFilters = filterMachine || filterPaidBy || filterDateFrom || filterDateTo;

  const getTotalAdvances = () => {
    return advances.reduce((sum, adv) => sum + (parseFloat(adv.amount) || 0), 0);
  };

  const getTotalFiltered = () => {
    return filteredAdvances.reduce((sum, adv) => sum + (parseFloat(adv.amount) || 0), 0);
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div>
      <div className="page-header">
        <h2>Daily Advances</h2>
        <p>Track daily expenses given to machine drivers</p>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#3b82f6' }}>
            <FaMoneyBillWave />
          </div>
          <div className="stat-details">
            <h3>Total Advances Given</h3>
            <p className="stat-value">₹{getTotalAdvances().toLocaleString()}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#10b981' }}>
            <FaMoneyBillWave />
          </div>
          <div className="stat-details">
            <h3>Advances This Month</h3>
            <p className="stat-value">
              ₹{advances
                .filter(a => new Date(a.advance_date).getMonth() === new Date().getMonth())
                .reduce((sum, adv) => sum + (parseFloat(adv.amount) || 0), 0)
                .toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Filter Section */}
      <FilterBar
        filters={[
          {
            type: 'select',
            label: 'Machine',
            value: filterMachine,
            onChange: (e) => setFilterMachine(e.target.value),
            options: [
              { value: '', label: 'All Machines' },
              ...machines.map((machine) => ({
                value: machine.id,
                label: `${machine.machine_type} - ${machine.machine_number} (${machine.driver_name})`
              }))
            ]
          },
          {
            type: 'select',
            label: 'Paid By',
            value: filterPaidBy,
            onChange: (e) => setFilterPaidBy(e.target.value),
            options: [
              { value: '', label: 'All' },
              { value: 'Owner', label: 'Owner/Admin' },
              { value: 'Farmer', label: 'Farmer' }
            ]
          },
          {
            type: 'date',
            label: 'Date From',
            value: filterDateFrom,
            onChange: (e) => setFilterDateFrom(e.target.value)
          },
          {
            type: 'date',
            label: 'Date To',
            value: filterDateTo,
            onChange: (e) => setFilterDateTo(e.target.value)
          }
        ]}
        onClear={clearFilters}
        hasActiveFilters={hasActiveFilters}
        resultsText={`Showing ${filteredAdvances.length} of ${advances.length} advances`}
        totalText={hasActiveFilters ? `Total: ₹${getTotalFiltered().toLocaleString()}` : null}
      />

      <div className="table-container">
        <div className="table-header">
          <h3>Advance Records</h3>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn btn-secondary" onClick={() => exportToCSV(formatDataForExport(filteredAdvances, 'advances'), 'advances')}>
              <FaFileExport /> Export
            </button>
            <button className="btn btn-success" onClick={() => setShowModal(true)}>
              <FaPlus /> Add Advance
            </button>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Machine</th>
              <th>Driver</th>
              <th>Owner</th>
              <th>Amount</th>
              <th>Paid By</th>
              <th>Notes</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredAdvances.length > 0 ? (
              filteredAdvances.map((advance) => (
                <tr key={advance.id}>
                  <td>{new Date(advance.advance_date).toLocaleDateString()}</td>
                  <td>{advance.machines?.machine_type} - {advance.machines?.machine_number}</td>
                  <td>{advance.machines?.driver_name}</td>
                  <td>{advance.machines?.machine_owners?.name}</td>
                  <td>₹{advance.amount?.toLocaleString()}</td>
                  <td>
                    <span className={`status-badge ${advance.paid_by === 'Owner' ? 'active' : 'pending'}`}>
                      {advance.paid_by}
                    </span>
                  </td>
                  <td>{advance.notes || '-'}</td>
                  <td>
                    <ActionsCell
                      onEdit={() => handleEdit(advance)}
                      onDelete={() => handleDelete(advance.id)}
                    />
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '40px' }}>
                  {hasActiveFilters ? 'No advances match the selected filters.' : 'No advances recorded. Add the first daily advance!'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>{editingAdvance ? 'Edit Advance' : 'Add Daily Advance'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Machine (Driver) <span className="required-star">*</span></label>
                <select
                  value={formData.machineId}
                  onChange={(e) => setFormData({ ...formData, machineId: e.target.value })}
                  required
                >
                  <option value="">Select Machine</option>
                  {machines.map((machine) => (
                    <option key={machine.id} value={machine.id}>
                      {machine.machine_type} - {machine.machine_number} ({machine.driver_name}) - Owner: {machine.machine_owners?.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Date <span className="required-star">*</span></label>
                  <input
                    type="date"
                    value={formData.advanceDate}
                    onChange={(e) => setFormData({ ...formData, advanceDate: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Amount (₹) <span className="required-star">*</span></label>
                  <input
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    required
                    min="0"
                    step="10"
                    placeholder="e.g., 500"
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Paid By *</label>
                <select
                  value={formData.paidBy}
                  onChange={(e) => setFormData({ ...formData, paidBy: e.target.value })}
                  required
                >
                  <option value="Owner">Me (Owner/Admin) - Deduct from owner payment</option>
                  <option value="Farmer">Farmer - Deduct from farmer payment</option>
                </select>
                <small style={{ color: 'var(--text-secondary)', display: 'block', marginTop: '4px' }}>
                  {formData.paidBy === 'Owner' 
                    ? '💡 You gave money to driver - will be deducted when paying machine owner'
                    : '💡 Farmer gave money to driver - will be deducted from farmer payment to you'}
                </small>
              </div>
              <div className="form-group">
                <label>Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="e.g., Daily expenses, fuel money, etc."
                  rows="3"
                ></textarea>
              </div>

              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={handleCloseModal}>Cancel</button>
                <button type="submit" className="btn-primary">
                  {editingAdvance ? 'Update Advance' : 'Add Advance'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Advances;
