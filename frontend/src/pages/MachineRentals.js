import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaPlus, FaTruck, FaFileExport, FaEllipsisV, FaChevronDown, FaChevronUp, FaCalendarAlt, FaUserTie, FaUser, FaEdit, FaTrash, FaClock } from 'react-icons/fa';
import ActionsCell from '../components/ActionsCell';
import '../index.css';
import { exportToCSV, formatDataForExport } from '../utils/exportUtils';

// Helper function to convert decimal hours to "XXh XXm" format
const formatHoursToHHMM = (decimalHours) => {
  const totalMinutes = Math.round(decimalHours * 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${minutes}m`;
};

const MachineRentals = () => {
  const [rentals, setRentals] = useState([]);
  const [dealers, setDealers] = useState([]);
  const [machines, setMachines] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedRental, setSelectedRental] = useState(null);
  const [editingRental, setEditingRental] = useState(null);
  const [filterStatus, setFilterStatus] = useState('All');
  const [showFilters, setShowFilters] = useState(false);
  const [showOverflowMenu, setShowOverflowMenu] = useState(false);
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
  
  const hasActiveFilters = filterStatus !== 'All';

  return (
    <div className="page-container">
      {/* Page Header with Actions */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', padding: '10px 0' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FaTruck /> Machine Rentals
          </h2>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', position: 'relative' }}>
          <button 
            className="btn btn-success" 
            onClick={() => setIsModalOpen(true)}
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
            <FaPlus /> New Rental
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
                  exportToCSV(formatDataForExport(filteredRentals, 'rentals'), 'machine_rentals');
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
          minWidth: '100px',
          padding: '12px 16px', 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
          color: 'white',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '11px', opacity: 0.9, marginBottom: '4px' }}>Total 📋</div>
          <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{rentals.length}</div>
        </div>
        <div style={{ 
          minWidth: '100px',
          padding: '12px 16px', 
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', 
          color: 'white',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '11px', opacity: 0.9, marginBottom: '4px' }}>Active ✓</div>
          <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{rentals.filter(r => r.status === 'Active').length}</div>
        </div>
        <div style={{ 
          minWidth: '110px',
          padding: '12px 16px', 
          background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', 
          color: 'white',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '11px', opacity: 0.9, marginBottom: '4px' }}>Completed ✔</div>
          <div style={{ fontSize: '20px', fontWeight: 'bold' }}>{rentals.filter(r => r.status === 'Completed').length}</div>
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
                Showing {filteredRentals.length} of {rentals.length} rentals
              </span>
              {hasActiveFilters && (
                <button 
                  onClick={() => setFilterStatus('All')}
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
                📊 Status Filter
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
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
                <option value="All">All Rentals</option>
                <option value="Active">Active</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Rentals List - Card Layout */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {filteredRentals.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '48px 20px',
            background: 'rgba(51, 65, 85, 0.4)',
            borderRadius: '12px',
            border: '1px solid rgba(100, 116, 139, 0.3)'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>🚜</div>
            <div style={{ fontSize: '16px', color: '#cbd5e1', fontWeight: '500' }}>
              No {filterStatus !== 'All' ? filterStatus.toLowerCase() : ''} rentals found
            </div>
            <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '6px' }}>
              Create your first rental agreement!
            </div>
          </div>
        ) : (
          filteredRentals.map((rental) => (
            <div 
              key={rental.id}
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
              {/* Header: Season and Status */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div style={{ fontSize: '16px', fontWeight: '600', color: '#e2e8f0' }}>
                  {rental.season_name}
                </div>
                <span style={{
                  padding: '4px 10px',
                  borderRadius: '12px',
                  fontSize: '11px',
                  fontWeight: '600',
                  backgroundColor: rental.status === 'Active' ? '#d4edda' : rental.status === 'Completed' ? '#cce5ff' : '#fff3cd',
                  color: rental.status === 'Active' ? '#155724' : rental.status === 'Completed' ? '#004085' : '#856404',
                  border: `1px solid ${rental.status === 'Active' ? '#c3e6cb' : rental.status === 'Completed' ? '#b8daff' : '#ffeaa7'}`
                }}>
                  {rental.status}
                </span>
              </div>

              {/* Dealer and Machine Info */}
              <div style={{ marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <FaUser style={{ fontSize: '12px', color: '#94a3b8' }} />
                  <span style={{ fontSize: '14px', color: '#cbd5e1', fontWeight: '500' }}>
                    {rental.dealer?.name}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingLeft: '20px' }}>
                  <FaTruck style={{ fontSize: '11px', color: '#94a3b8' }} />
                  <span style={{ fontSize: '13px', color: '#94a3b8' }}>
                    {rental.machine?.driver_name || 'Unknown'} - {rental.machine?.machine_owners?.name || 'Unknown'}
                  </span>
                </div>
              </div>

              {/* Period and Hours */}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                padding: '10px',
                background: 'rgba(15, 23, 42, 0.5)',
                borderRadius: '8px',
                marginBottom: '10px'
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>
                    <FaCalendarAlt style={{ fontSize: '10px', marginRight: '4px' }} />
                    Period
                  </div>
                  <div style={{ fontSize: '12px', color: '#cbd5e1', fontWeight: '500' }}>
                    {rental.start_date ? new Date(rental.start_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '-'}
                    {' to '}
                    {rental.end_date ? new Date(rental.end_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Ongoing'}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>
                    <FaClock style={{ fontSize: '10px', marginRight: '4px' }} />
                    Hours
                  </div>
                  <div style={{ fontSize: '14px', color: '#3b82f6', fontWeight: '600' }}>
                    {formatHoursToHHMM(rental.total_hours_used || 0)}
                  </div>
                </div>
              </div>

              {/* Financial Grid */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(2, 1fr)', 
                gap: '10px',
                marginBottom: '12px'
              }}>
                <div style={{ 
                  background: 'rgba(15, 23, 42, 0.5)', 
                  padding: '10px', 
                  borderRadius: '8px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>Charged</div>
                  <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#3b82f6' }}>
                    ₹{(rental.total_amount_charged || 0).toLocaleString('en-IN')}
                  </div>
                </div>
                <div style={{ 
                  background: 'rgba(15, 23, 42, 0.5)', 
                  padding: '10px', 
                  borderRadius: '8px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>Profit</div>
                  <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#10b981' }}>
                    ₹{(rental.profit_margin || 0).toLocaleString('en-IN')}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button 
                  onClick={() => handleEdit(rental)}
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
                  onClick={() => handleDelete(rental.id)}
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
        )}
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
                  <span className="value"><strong>{formatHoursToHHMM(selectedRental.total_hours_used || 0)}</strong></span>
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
