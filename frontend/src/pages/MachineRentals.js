import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaPlus } from 'react-icons/fa';
import ActionsCell from '../components/ActionsCell';
import '../index.css';

const MachineRentals = () => {
  const [rentals, setRentals] = useState([]);
  const [dealers, setDealers] = useState([]);
  const [machines, setMachines] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedRental, setSelectedRental] = useState(null);
  const [editingRental, setEditingRental] = useState(null);
  const [filterStatus, setFilterStatus] = useState('All');
  const [formData, setFormData] = useState({
    dealer_id: '',
    machine_id: '',
    start_date: '',
    end_date: '',
    rate_per_hour: '',
    total_hours_used: '',
    advance_paid: '',
    notes: ''
  });

  useEffect(() => {
    fetchRentals();
    fetchDealers();
    fetchMachines();
  }, []);

  const fetchRentals = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/rentals', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRentals(response.data);
    } catch (error) {
      console.error('Error fetching rentals:', error);
    }
  };

  const fetchDealers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/dealers`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDealers(response.data);
    } catch (error) {
      console.error('Error fetching dealers:', error);
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      
      // Get the machine's owner rate
      const selectedMachine = machines.find(m => m.id === formData.machine_id);
      const ownerRate = selectedMachine?.owner_rate_per_hour || 0;
      const dealerRate = parseFloat(formData.rate_per_hour);
      const hours = formData.total_hours_used ? parseFloat(formData.total_hours_used) : 0;
      
      // Calculate totals
      const totalCostToOwner = ownerRate * hours;
      const totalAmountCharged = dealerRate * hours;
      const profitMargin = totalAmountCharged - totalCostToOwner;
      
      // Map frontend fields to database schema
      const submitData = {
        dealer_id: formData.dealer_id,
        machine_id: formData.machine_id,
        season_name: formData.season_name || `Season ${new Date().getFullYear()}`,
        start_date: formData.start_date,
        end_date: formData.end_date || null,
        hourly_rate_to_dealer: dealerRate,
        hourly_cost_from_owner: ownerRate,
        total_hours_used: hours,
        total_amount_charged: totalAmountCharged,
        total_cost_to_owner: totalCostToOwner,
        profit_margin: profitMargin,
        advance_paid: formData.advance_paid ? parseFloat(formData.advance_paid) : 0,
        status: 'Active',
        notes: formData.notes || ''
      };

      if (editingRental) {
        await axios.put(`/rentals/${editingRental.id}`, submitData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post('/rentals', submitData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      fetchRentals();
      closeModal();
    } catch (error) {
      console.error('Error saving rental:', error);
      alert('Error saving rental. Please try again.');
    }
  };

  const handleEdit = (rental) => {
    setEditingRental(rental);
    setFormData({
      dealer_id: rental.dealer_id || '',
      machine_id: rental.machine_id || '',
      start_date: rental.start_date ? rental.start_date.split('T')[0] : '',
      end_date: rental.end_date ? rental.end_date.split('T')[0] : '',
      rate_per_hour: rental.rate_per_hour || rental.hourly_rate_to_dealer || '',
      total_hours_used: rental.total_hours_used || '',
      advance_paid: rental.advance_paid || '',
      notes: rental.notes || ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this rental?')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`/rentals/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        fetchRentals();
      } catch (error) {
        console.error('Error deleting rental:', error);
        alert('Error deleting rental. Please try again.');
      }
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingRental(null);
    setFormData({
      dealer_id: '',
      machine_id: '',
      start_date: '',
      end_date: '',
      rate_per_hour: '',
      total_hours_used: '',
      advance_paid: '',
      notes: ''
    });
  };

  // eslint-disable-next-line no-unused-vars
  const handleViewDetails = (rental) => {
    setSelectedRental(rental);
    setIsDetailsModalOpen(true);
  };

  const filteredRentals = filterStatus === 'All' 
    ? rentals 
    : rentals.filter(r => r.status === filterStatus);

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>
            <FaTruck /> Machine Rentals
          </h1>
          <p className="page-subtitle">Manage seasonal machine rental agreements with dealers</p>
        </div>
        <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
          <FaPlus /> New Rental Agreement
        </button>
      </div>

      <div className="filter-bar">
        <div className="filter-group">
          <label>Filter by Status:</label>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="All">All Rentals</option>
            <option value="Active">Active</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
        <div className="stats-summary">
          <span className="stat-item">Total: {rentals.length}</span>
          <span className="stat-item active">Active: {rentals.filter(r => r.status === 'Active').length}</span>
          <span className="stat-item completed">Completed: {rentals.filter(r => r.status === 'Completed').length}</span>
        </div>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Season</th>
              <th>Dealer</th>
              <th>Driver - Owner</th>
              <th>Period</th>
              <th>Hours Used</th>
              <th>Amount Charged</th>
              <th>Profit Margin</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredRentals.length === 0 ? (
              <tr>
                <td colSpan="9" style={{ textAlign: 'center', padding: '40px' }}>
                  No {filterStatus !== 'All' ? filterStatus.toLowerCase() : ''} rentals found
                </td>
              </tr>
            ) : (
              filteredRentals.map((rental) => (
                <tr key={rental.id}>
                  <td><strong>{rental.season_name}</strong></td>
                  <td>{rental.dealer?.name}</td>
                  <td>{rental.machine?.driver_name || 'Unknown'} - {rental.machine?.machine_owners?.name || 'Unknown'}</td>
                  <td>
                    {rental.start_date ? new Date(rental.start_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '-'}
                    {' to '}
                    {rental.end_date ? new Date(rental.end_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Ongoing'}
                  </td>
                  <td>{rental.total_hours_used || 0} hrs</td>
                  <td className="amount">₹{(rental.total_amount_charged || 0).toLocaleString()}</td>
                  <td className="amount profit">₹{(rental.profit_margin || 0).toLocaleString()}</td>
                  <td>
                    <span className={`status-badge ${rental.status}`}>
                      {rental.status}
                    </span>
                  </td>
                  <td className="actions">
                    <ActionsCell
                      onEdit={() => handleEdit(rental)}
                      onDelete={() => handleDelete(rental.id)}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>{editingRental ? 'Edit Rental Agreement' : 'New Rental Agreement'}</h2>
            <form onSubmit={handleSubmit}>
              
              <div className="form-section-header">
                <h3>Rental Details</h3>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Dealer <span className="required-star">*</span></label>
                  <select
                    name="dealer_id"
                    value={formData.dealer_id}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select dealer</option>
                    {dealers.map((dealer) => (
                      <option key={dealer.id} value={dealer.id}>
                        {dealer.name} - {dealer.business_name || dealer.phone}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Machine (Driver - Owner) <span className="required-star">*</span></label>
                  <select
                    name="machine_id"
                    value={formData.machine_id}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select machine</option>
                    {machines.map((machine) => {
                      const ownerName = machine.machine_owners?.name || 'NO OWNER';
                      const driverName = machine.driver_name || 'NO DRIVER';
                      return (
                        <option key={machine.id} value={machine.id}>
                          {driverName} - {ownerName} ({machine.machine_number})
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Start Date <span className="required-star">*</span></label>
                  <input
                    type="date"
                    name="start_date"
                    value={formData.start_date}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>End Date</label>
                  <input
                    type="date"
                    name="end_date"
                    value={formData.end_date}
                    onChange={handleInputChange}
                  />
                  <small style={{ color: '#6b7280', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                    Optional - leave blank if rental is ongoing
                  </small>
                </div>
              </div>

              <div className="form-section-header">
                <h3>Usage & Payment</h3>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Total Hours Used</label>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <div style={{ flex: 1 }}>
                      <input
                        type="number"
                        min="0"
                        max="9999"
                        value={Math.floor(formData.total_hours_used || 0)}
                        onChange={(e) => {
                          const hours = parseInt(e.target.value) || 0;
                          const minutes = ((formData.total_hours_used || 0) % 1) * 60;
                          handleInputChange({ target: { name: 'total_hours_used', value: hours + (minutes / 60) } });
                        }}
                        onFocus={(e) => e.target.value === '0' && (e.target.value = '')}
                        onBlur={(e) => !e.target.value && (e.target.value = '0')}
                        placeholder="0"
                        style={{ textAlign: 'center' }}
                      />
                      <small style={{ display: 'block', textAlign: 'center', marginTop: '4px', color: 'var(--text-secondary)' }}>Hours</small>
                    </div>
                    <span style={{ fontSize: '20px', fontWeight: 'bold' }}>:</span>
                    <div style={{ flex: 1 }}>
                      <input
                        type="number"
                        min="0"
                        max="59"
                        step="1"
                        value={Math.round(((formData.total_hours_used || 0) % 1) * 60)}
                        onChange={(e) => {
                          const hours = Math.floor(formData.total_hours_used || 0);
                          const minutes = parseInt(e.target.value) || 0;
                          handleInputChange({ target: { name: 'total_hours_used', value: hours + (minutes / 60) } });
                        }}
                        onFocus={(e) => e.target.value === '0' && (e.target.value = '')}
                        onBlur={(e) => !e.target.value && (e.target.value = '0')}
                        placeholder="0"
                        style={{ textAlign: 'center' }}
                      />
                      <small style={{ display: 'block', textAlign: 'center', marginTop: '4px', color: 'var(--text-secondary)' }}>Minutes</small>
                    </div>
                  </div>
                  <small style={{ color: '#6b7280', fontSize: '12px', marginTop: '8px', display: 'block', textAlign: 'center' }}>
                    Total hours the machine was used (overall)
                  </small>
                </div>

                <div className="form-group">
                  <label>Rate Per Hour (₹) <span className="required-star">*</span></label>
                  <input
                    type="number"
                    name="rate_per_hour"
                    value={formData.rate_per_hour}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    placeholder="0"
                    required
                  />
                  <small style={{ color: '#6b7280', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                    Amount to be paid per hour by the dealer
                  </small>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Advance Paid (₹)</label>
                  <input
                    type="number"
                    name="advance_paid"
                    value={formData.advance_paid}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    placeholder="0"
                  />
                  <small style={{ color: '#6b7280', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                    Any advance amount paid
                  </small>
                </div>

                <div className="form-group">
                  <label>Estimated Total Payable (₹)</label>
                  <input
                    type="text"
                    value={`₹${(
                      (parseFloat(formData.total_hours_used) || 0) * 
                      (parseFloat(formData.rate_per_hour) || 0) - 
                      (parseFloat(formData.advance_paid) || 0)
                    ).toFixed(2)}`}
                    disabled
                    style={{ backgroundColor: '#f0f9ff', color: '#0369a1', fontWeight: '600', cursor: 'not-allowed' }}
                  />
                  <small style={{ color: '#6b7280', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                    (Hours × Rate) - Advance
                  </small>
                </div>
              </div>

              <div className="form-group">
                <label>Notes</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows="3"
                  placeholder="Additional terms, conditions, or remarks (optional)"
                ></textarea>
              </div>

              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingRental ? 'Update Agreement' : 'Create Agreement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isDetailsModalOpen && selectedRental && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Rental Agreement Details</h2>
            <div className="details-grid">
              <div className="detail-section">
                <h3>Agreement Information</h3>
                <div className="detail-row">
                  <span className="label">Season:</span>
                  <span className="value"><strong>{selectedRental.season_name}</strong></span>
                </div>
                <div className="detail-row">
                  <span className="label">Dealer:</span>
                  <span className="value">{selectedRental.dealer?.name}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Business:</span>
                  <span className="value">{selectedRental.dealer?.business_name || '-'}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Machine (Driver - Owner):</span>
                  <span className="value">
                    {selectedRental.machine?.driver_name || 'NO DRIVER'}
                    {' - '}
                    {selectedRental.machine?.machine_owners?.name || 'NO OWNER'}
                    {' ('}
                    {selectedRental.machine?.machine_number}
                    {')'}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="label">Period:</span>
                  <span className="value">
                    {selectedRental.start_date ? new Date(selectedRental.start_date).toLocaleDateString() : '-'}
                    {' to '}
                    {selectedRental.end_date ? new Date(selectedRental.end_date).toLocaleDateString() : 'Ongoing'}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="label">Status:</span>
                  <span className={`status-badge ${selectedRental.status}`}>
                    {selectedRental.status}
                  </span>
                </div>
              </div>

              <div className="detail-section">
                <h3>Financial Details</h3>
                <div className="detail-row">
                  <span className="label">Rate to Dealer:</span>
                  <span className="value">₹{(selectedRental.hourly_rate_to_dealer || 0).toLocaleString()}/hr</span>
                </div>
                <div className="detail-row">
                  <span className="label">Cost from Owner:</span>
                  <span className="value">₹{(selectedRental.hourly_cost_from_owner || 0).toLocaleString()}/hr</span>
                </div>
                <div className="detail-row">
                  <span className="label">Profit per Hour:</span>
                  <span className="value profit">
                    ₹{((selectedRental.hourly_rate_to_dealer || 0) - (selectedRental.hourly_cost_from_owner || 0)).toLocaleString()}/hr
                  </span>
                </div>
                <div className="detail-row">
                  <span className="label">Total Hours:</span>
                  <span className="value"><strong>{selectedRental.total_hours_used || 0} hours</strong></span>
                </div>
                <div className="detail-row highlight">
                  <span className="label">Total Charged:</span>
                  <span className="value">₹{(selectedRental.total_amount_charged || 0).toLocaleString()}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Total Cost:</span>
                  <span className="value">₹{(selectedRental.total_cost_to_owner || 0).toLocaleString()}</span>
                </div>
                <div className="detail-row highlight profit-row">
                  <span className="label">Total Profit:</span>
                  <span className="value profit">₹{(selectedRental.profit_margin || 0).toLocaleString()}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Advance Paid:</span>
                  <span className="value">₹{(selectedRental.advance_paid || 0).toLocaleString()}</span>
                </div>
              </div>

              {selectedRental.notes && (
                <div className="detail-section full-width">
                  <h3>Notes</h3>
                  <p>{selectedRental.notes}</p>
                </div>
              )}
            </div>

            <div className="form-actions">
              <button className="btn-secondary" onClick={() => setIsDetailsModalOpen(false)}>
                Close
              </button>
              <button className="btn-primary" onClick={() => {
                setIsDetailsModalOpen(false);
                handleEdit(selectedRental);
              }}>
                Edit Agreement
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MachineRentals;
