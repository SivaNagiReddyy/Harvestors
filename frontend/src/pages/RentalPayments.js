import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaPlus, FaMoneyBillWave } from 'react-icons/fa';
import ActionsCell from '../components/ActionsCell';
import FilterBar from '../components/FilterBar';
import '../index.css';

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
      <div className="page-header">
        <div>
          <h1>
            <FaMoneyBillWave /> Rental Payments
          </h1>
          <p className="page-subtitle">Track payments received from dealers for machine rentals</p>
        </div>
        <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
          <FaPlus /> Record Payment
        </button>
      </div>

      {/* Filter Section */}
      <FilterBar
        filters={[
          {
            type: 'select',
            label: 'Dealer',
            value: filterDealer,
            onChange: (e) => setFilterDealer(e.target.value),
            options: [
              { value: '', label: 'All Dealers' },
              ...dealers.map((dealer) => ({
                value: dealer.id,
                label: dealer.name
              }))
            ]
          },
          {
            type: 'select',
            label: 'Payment Method',
            value: filterMethod,
            onChange: (e) => setFilterMethod(e.target.value),
            options: [
              { value: '', label: 'All Methods' },
              { value: 'Cash', label: 'Cash' },
              { value: 'Bank Transfer', label: 'Bank Transfer' },
              { value: 'Cheque', label: 'Cheque' },
              { value: 'UPI', label: 'UPI' }
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
        resultsText={`Showing ${filteredPayments.length} of ${payments.length} payments`}
        totalText={hasActiveFilters ? `Total: ₹${totalFiltered.toLocaleString()}` : null}
      />

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Dealer</th>
              <th>Driver - Owner</th>
              <th>Season</th>
              <th>Amount</th>
              <th>Payment Method</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredPayments.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '40px' }}>
                  {hasActiveFilters ? 'No payments match the selected filters' : 'No payments recorded yet'}
                </td>
              </tr>
            ) : (
              filteredPayments.map((payment) => (
                <tr key={payment.id}>
                  <td>{payment.payment_date ? new Date(payment.payment_date).toLocaleDateString('en-IN') : '-'}</td>
                  <td><strong>{payment.dealer?.name}</strong></td>
                  <td>{payment.rental?.machine?.driver_name || '-'} - {payment.rental?.machine?.machine_owners?.name || '-'}</td>
                  <td>{payment.rental?.season_name}</td>
                  <td className="amount">₹{(payment.amount || 0).toLocaleString()}</td>
                  <td>
                    <span className="payment-method-badge">{payment.payment_method}</span>
                  </td>
                  <td className="actions">
                    <ActionsCell
                      onEdit={() => handleEdit(payment)}
                      onDelete={() => handleDelete(payment.id)}
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
