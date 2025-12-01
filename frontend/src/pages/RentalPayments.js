import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaPlus, FaMoneyBillWave, FaFileExport, FaEllipsisV, FaChevronDown, FaChevronUp, FaCalendarAlt, FaUserTie, FaEdit, FaTrash, FaTruck } from 'react-icons/fa';
import ActionsCell from '../components/ActionsCell';
import FilterBar from '../components/FilterBar';
import '../index.css';
import { exportToCSV, formatDataForExport } from '../utils/exportUtils';

const RentalPayments = () => {
  const [payments, setPayments] = useState([]);
  const [rentals, setRentals] = useState([]);
  const [dealers, setDealers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);
  const [formData, setFormData] = useState({
    rental_id: '',
    dealer_id: '',
    amount: '',
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: 'Cash'
  });

  // Filter states
  const [filterDealer, setFilterDealer] = useState('');
  const [filterMethod, setFilterMethod] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showOverflowMenu, setShowOverflowMenu] = useState(false);

  useEffect(() => {
    fetchPayments();
    fetchRentals();
    fetchDealers();
  }, []);

  const fetchPayments = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/rental-payments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPayments(response.data);
    } catch (error) {
      console.error('Error fetching payments:', error);
    }
  };

  const fetchRentals = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/rentals', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRentals(response.data.filter(r => r.status === 'Active' || r.status === 'Completed'));
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Auto-fill dealer when rental is selected
    if (name === 'rental_id') {
      const selectedRental = rentals.find(r => r.id === value);
      if (selectedRental) {
        setFormData({ 
          ...formData, 
          rental_id: value,
          dealer_id: selectedRental.dealer_id 
        });
        return;
      }
    }
    
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const submitData = {
        rental_id: formData.rental_id,
        dealer_id: formData.dealer_id,
        amount: parseFloat(formData.amount),
        payment_date: formData.payment_date,
        payment_method: formData.payment_method
      };

      if (editingPayment) {
        await axios.put(`/rental-payments/${editingPayment.id}`, submitData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post(`/rental-payments`, submitData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }

      fetchPayments();
      fetchDealers(); // Refresh to update pending amounts
      closeModal();
    } catch (error) {
      console.error('Error saving payment:', error);
      alert('Error saving payment. Please try again.');
    }
  };

  const handleEdit = (payment) => {
    setEditingPayment(payment);
    setFormData({
      rental_id: payment.rental_id || '',
      dealer_id: payment.dealer_id || '',
      amount: payment.amount || '',
      payment_date: payment.payment_date ? payment.payment_date.split('T')[0] : new Date().toISOString().split('T')[0],
      payment_method: payment.payment_method || 'Cash'
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this payment?')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`/rental-payments/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        fetchPayments();
        fetchDealers(); // Refresh to update pending amounts
      } catch (error) {
        console.error('Error deleting payment:', error);
        alert('Error deleting payment. Please try again.');
      }
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingPayment(null);
    setFormData({
      rental_id: '',
      dealer_id: '',
      amount: '',
      payment_date: new Date().toISOString().split('T')[0],
      payment_method: 'Cash'
    });
  };

  // Apply filters
  const filteredPayments = payments.filter(payment => {
    if (filterDealer && payment.dealer_id !== filterDealer) return false;
    if (filterMethod && payment.payment_method !== filterMethod) return false;
    
    const paymentDate = new Date(payment.payment_date);
    if (filterDateFrom && paymentDate < new Date(filterDateFrom)) return false;
    if (filterDateTo && paymentDate > new Date(filterDateTo)) return false;
    
    return true;
  });

  const clearFilters = () => {
    setFilterDealer('');
    setFilterMethod('');
    setFilterDateFrom('');
    setFilterDateTo('');
  };

  const hasActiveFilters = filterDealer || filterMethod || filterDateFrom || filterDateTo;

  const totalFiltered = filteredPayments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

  return (
    <div className="page-container">
      {/* Page Header with Actions */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', padding: '10px 0' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FaMoneyBillWave /> Rental Payments
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
            <FaPlus /> Record Payment
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
                  exportToCSV(formatDataForExport(filteredPayments, 'rentalPayments'), 'rental_payments');
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
                Showing {filteredPayments.length} of {payments.length} payments
                {hasActiveFilters && <span style={{ color: '#667eea', fontWeight: '600', marginLeft: '8px' }}>
                  (₹{totalFiltered.toLocaleString()})
                </span>}
              </span>
              {hasActiveFilters && (
                <button 
                  onClick={clearFilters}
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: '500', color: '#cbd5e1' }}>
                  <FaUser style={{ marginRight: '6px', fontSize: '12px' }} /> Dealer
                </label>
                <select
                  value={filterDealer}
                  onChange={(e) => setFilterDealer(e.target.value)}
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
                  <option value="">All Dealers</option>
                  {dealers.map((dealer) => (
                    <option key={dealer.id} value={dealer.id}>
                      {dealer.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: '500', color: '#cbd5e1' }}>
                  💳 Payment Method
                </label>
                <select
                  value={filterMethod}
                  onChange={(e) => setFilterMethod(e.target.value)}
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
                  <option value="">All Methods</option>
                  <option value="Cash">Cash</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Cheque">Cheque</option>
                  <option value="UPI">UPI</option>
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: '500', color: '#cbd5e1' }}>
                    From
                  </label>
                  <input
                    type="date"
                    value={filterDateFrom}
                    onChange={(e) => setFilterDateFrom(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      border: '1px solid rgba(100, 116, 139, 0.3)',
                      background: 'rgba(15, 23, 42, 0.6)',
                      color: '#e2e8f0',
                      fontSize: '13px'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: '500', color: '#cbd5e1' }}>
                    To
                  </label>
                  <input
                    type="date"
                    value={filterDateTo}
                    onChange={(e) => setFilterDateTo(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      border: '1px solid rgba(100, 116, 139, 0.3)',
                      background: 'rgba(15, 23, 42, 0.6)',
                      color: '#e2e8f0',
                      fontSize: '13px'
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Payments List - Card Layout */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {filteredPayments.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '48px 20px',
            background: 'rgba(51, 65, 85, 0.4)',
            borderRadius: '12px',
            border: '1px solid rgba(100, 116, 139, 0.3)'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>💰</div>
            <div style={{ fontSize: '16px', color: '#cbd5e1', fontWeight: '500' }}>
              {hasActiveFilters ? 'No payments match the selected filters' : 'No payments recorded yet'}
            </div>
            <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '6px' }}>
              Record your first rental payment!
            </div>
          </div>
        ) : (
          filteredPayments.map((payment) => (
            <div 
              key={payment.id}
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
              {/* Header: Date and Amount */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FaCalendarAlt style={{ fontSize: '12px', color: '#94a3b8' }} />
                  <span style={{ fontSize: '13px', color: '#cbd5e1', fontWeight: '500' }}>
                    {payment.payment_date ? new Date(payment.payment_date).toLocaleDateString('en-IN') : '-'}
                  </span>
                </div>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#10b981', textAlign: 'right' }}>
                  ₹{(payment.amount || 0).toLocaleString()}
                </div>
              </div>

              {/* Dealer Info */}
              <div style={{ marginBottom: '10px' }}>
                <div style={{ fontSize: '15px', fontWeight: '600', color: '#e2e8f0', marginBottom: '4px' }}>
                  {payment.dealer?.name}
                </div>
                <div style={{ fontSize: '13px', color: '#94a3b8' }}>
                  {payment.rental?.season_name}
                </div>
              </div>

              {/* Machine Info */}
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px',
                padding: '8px 10px',
                background: 'rgba(15, 23, 42, 0.5)',
                borderRadius: '8px',
                marginBottom: '10px'
              }}>
                <FaTruck style={{ fontSize: '12px', color: '#94a3b8' }} />
                <span style={{ fontSize: '13px', color: '#cbd5e1' }}>
                  {payment.rental?.machine?.driver_name || '-'} - {payment.rental?.machine?.machine_owners?.name || '-'}
                </span>
              </div>

              {/* Payment Method Badge */}
              <div style={{ marginBottom: '12px' }}>
                <span style={{
                  padding: '6px 12px',
                  borderRadius: '20px',
                  fontSize: '11px',
                  fontWeight: '600',
                  backgroundColor: '#e0f2fe',
                  color: '#0369a1',
                  border: '1px solid #bae6fd'
                }}>
                  {payment.payment_method}
                </span>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button 
                  onClick={() => handleEdit(payment)}
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
                  onClick={() => handleDelete(payment.id)}
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
            <h2>{editingPayment ? 'Edit Payment' : 'Record Payment from Dealer'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-section-header">
                <h3>Rental Agreement</h3>
              </div>

              <div className="form-group">
                <label>Select Rental Agreement <span className="required-star">*</span></label>
                <select
                  name="rental_id"
                  value={formData.rental_id}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Choose rental agreement</option>
                  {rentals.map((rental) => {
                    const driverName = rental.machine?.driver_name || 'Unknown Driver';
                    const ownerName = rental.machine?.machine_owners?.name || 'Unknown Owner';
                    return (
                      <option key={rental.id} value={rental.id}>
                        {driverName} - {ownerName}
                        {' (Total: ₹'}
                        {(rental.total_amount_charged || 0).toLocaleString()}
                        {')'}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="form-group">
                <label>Dealer (Auto-filled) <span className="required-star">*</span></label>
                <input
                  type="text"
                  value={formData.dealer_id ? (dealers.find(d => d.id === formData.dealer_id)?.name || 'Select rental first') : 'Select rental first'}
                  disabled
                  style={{ backgroundColor: '#f0f9ff', color: '#0369a1', fontWeight: '600', cursor: 'not-allowed' }}
                />
                <small style={{ color: '#6b7280', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                  Auto-filled from selected rental agreement
                </small>
              </div>

              <div className="form-section-header">
                <h3>Payment Details</h3>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Amount (₹) <span className="required-star">*</span></label>
                  <input
                    type="number"
                    name="amount"
                    value={formData.amount}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    placeholder="Payment amount"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Payment Date <span className="required-star">*</span></label>
                  <input
                    type="date"
                    name="payment_date"
                    value={formData.payment_date}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Payment Method <span className="required-star">*</span></label>
                <select
                  name="payment_method"
                  value={formData.payment_method}
                  onChange={handleInputChange}
                  required
                >
                  <option value="Cash">Cash</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Cheque">Cheque</option>
                  <option value="UPI">UPI</option>
                </select>
              </div>

              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingPayment ? 'Update Payment' : 'Record Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RentalPayments;
