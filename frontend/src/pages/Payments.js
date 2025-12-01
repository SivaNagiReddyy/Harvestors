import React, { useState, useEffect } from 'react';
import { paymentAPI, jobAPI, machineOwnerAPI, farmerAPI, machineAPI } from '../api';
import { FaPlus, FaFileExport, FaTractor, FaEdit, FaTrash, FaCalendarAlt, FaDollarSign } from 'react-icons/fa';
import ActionsCell from '../components/ActionsCell';
import FilterBar from '../components/FilterBar';
import axios from 'axios';
import { exportToCSV, formatDataForExport } from '../utils/exportUtils';

const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [machines, setMachines] = useState([]);
  // const [machineOwners, setMachineOwners] = useState([]);
  // const [farmers, setFarmers] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [rentals, setRentals] = useState([]);
  const [machineBalances, setMachineBalances] = useState({});
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);
  const [formData, setFormData] = useState({
    type: 'From Farmer',
    machine: '',
    machineOwner: '',
    farmer: '',
    job: '',
    amount: '',
    discountAmount: '',
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'Cash',
    businessSource: 'harvesting' // Add business source field
  });

  // Filter states
  const [filterMachine, setFilterMachine] = useState('');

  useEffect(() => {
    fetchPayments();
    fetchJobs();
    fetchMachines();
    fetchMachineOwners();
    fetchFarmers();
    fetchExpenses();
    fetchRentals();
  }, []);

  useEffect(() => {
    // Calculate balance for each machine separately for harvesting and rental
    if (machines.length > 0) {
      const balances = {};
      machines.forEach(machine => {
        // Harvesting balance
        const harvestingEarned = jobs
          .filter(job => job.machine_id === machine.id)
          .reduce((sum, job) => {
            const amount = parseFloat(job.total_amount) || (parseFloat(job.hours || 0) * parseFloat(job.rate_per_hour || 0));
            return sum + amount;
          }, 0);
        
        const machineExpenses = expenses
          .filter(exp => exp.machine_id === machine.id)
          .reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0);
        
        const harvestingPaid = payments
          .filter(p => p.machine_id === machine.id && p.type === 'To Machine Owner' && p.business_source === 'harvesting')
          .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
        
        const harvestingBalance = harvestingEarned - machineExpenses - harvestingPaid;
        
        // Rental balance from machine_rentals table
        const rentalOwed = rentals
          .filter(rental => rental.machine_id === machine.id)
          .reduce((sum, rental) => sum + parseFloat(rental.total_cost_to_owner || 0), 0);
        
        const rentalPaid = payments
          .filter(p => p.machine_id === machine.id && p.type === 'To Machine Owner' && p.business_source === 'rental')
          .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
        
        const rentalBalance = rentalOwed - rentalPaid;
        
        balances[machine.id] = { 
          harvesting: { earned: harvestingEarned, expenses: machineExpenses, paid: harvestingPaid, balance: harvestingBalance },
          rental: { owed: rentalOwed, paid: rentalPaid, balance: rentalBalance }
        };
      });
      setMachineBalances(balances);
    }
  }, [jobs, machines, expenses, payments, rentals]);

  const fetchPayments = async () => {
    try {
      const response = await paymentAPI.getAll();
      setPayments(response.data);
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchJobs = async () => {
    try {
      const response = await jobAPI.getAll();
      setJobs(response.data.filter(j => j.status === 'Completed'));
    } catch (error) {
      console.error('Error fetching jobs:', error);
    }
  };

  const fetchMachineOwners = async () => {
    try {
      const response = await machineOwnerAPI.getAll();
      // setMachineOwners(response.data);
      console.log('Machine owners:', response.data);
    } catch (error) {
      console.error('Error fetching machine owners:', error);
    }
  };

  const fetchFarmers = async () => {
    try {
      const response = await farmerAPI.getAll();
      // setFarmers(response.data);
      console.log('Farmers:', response.data);
    } catch (error) {
      console.error('Error fetching farmers:', error);
    }
  };

  const fetchMachines = async () => {
    try {
      const response = await machineAPI.getAll();
      setMachines(response.data);
    } catch (error) {
      console.error('Error fetching machines:', error);
    }
  };

  const fetchExpenses = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/expenses', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setExpenses(response.data);
    } catch (error) {
      console.error('Error fetching expenses:', error);
      setExpenses([]);
    }
  };

  const fetchRentals = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/rentals', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRentals(response.data);
    } catch (error) {
      console.error('Error fetching rentals:', error);
      setRentals([]);
    }
  };

  const handleJobChange = (jobId) => {
    const selectedJob = jobs.find(j => j.id === jobId);
    if (selectedJob) {
      const jobAmount = parseFloat(selectedJob.total_amount) || (parseFloat(selectedJob.hours || 0) * parseFloat(selectedJob.rate_per_hour || 0));
      setFormData({
        ...formData,
        job: jobId,
        amount: jobAmount,
        machineOwner: selectedJob.machines?.machine_owners?.id || '',
        farmer: selectedJob.farmers?.id || ''
      });
    }
  };

  const handleMachineChange = (machineId) => {
    const machine = machines.find(m => m.id === machineId);
    const balanceData = machineBalances[machineId];
    const machineBalance = formData.businessSource === 'rental'
      ? (balanceData?.rental?.balance || 0)
      : (balanceData?.harvesting?.balance || 0);
    setFormData({
      ...formData,
      machine: machineId,
      machineOwner: machine?.machine_owner_id || '',
      amount: Math.abs(machineBalance), // Show positive amount
      job: '',
      farmer: ''
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Convert camelCase to snake_case for Supabase
      const submitData = {
        type: formData.type,
        machine: formData.machine || null,
        machineOwner: formData.machineOwner,
        farmer: formData.farmer,
        job: formData.job || null,
        amount: formData.amount,
        payment_date: formData.paymentDate,
        payment_method: formData.paymentMethod,
        status: 'Completed',
        businessSource: formData.businessSource // Add business source
      };
      
      if (formData.type === 'To Machine Owner') {
        delete submitData.farmer;
      } else {
        delete submitData.machineOwner;
        // Farmer payments are always harvesting
        submitData.businessSource = 'harvesting';
      }

      if (editingPayment) {
        await paymentAPI.update(editingPayment.id, submitData);
      } else {
        await paymentAPI.create(submitData);
      }
      fetchPayments();
      fetchMachineOwners();
      fetchFarmers();
      handleCloseModal();
    } catch (error) {
      alert(error.response?.data?.error || 'Error saving payment');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this payment?')) {
      try {
        await paymentAPI.delete(id);
        fetchPayments();
        fetchMachineOwners();
        fetchFarmers();
      } catch (error) {
        alert(error.response?.data?.error || 'Error deleting payment');
      }
    }
  };

  const handleEdit = (payment) => {
    setEditingPayment(payment);
    setFormData({
      type: payment.type,
      machine: payment.machine_id || '',
      machineOwner: payment.machine_owner?.id || '',
      farmer: payment.farmer?.id || '',
      job: payment.job?.id || '',
      amount: payment.gross_amount || payment.amount,
      discountAmount: payment.discount_amount || '',
      paymentDate: payment.payment_date?.split('T')[0] || payment.paymentDate?.split('T')[0] || '',
      paymentMethod: payment.payment_method || payment.paymentMethod,
      businessSource: payment.business_source || 'harvesting'
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingPayment(null);
    setFormData({
      type: 'From Farmer',
      machine: '',
      machineOwner: '',
      farmer: '',
      job: '',
      amount: '',
      discountAmount: '',
      paymentDate: new Date().toISOString().split('T')[0],
      paymentMethod: 'Cash',
      businessSource: 'harvesting'
    });
  };

  // Apply filters
  const filteredPayments = payments.filter(payment => {
    if (filterMachine && payment.machine_id !== filterMachine) return false;
    return true;
  });

  const clearFilters = () => {
    setFilterMachine('');
  };

  const hasActiveFilters = filterMachine;

  const totalFiltered = filteredPayments.reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div>
      <div className="page-header">
        <h2>Payments</h2>
        <p>Manage payments to machine owners and from farmers</p>
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
                label: `${machine.machine_number} - ${machine.driver_name}`
              }))
            ]
          }
        ]}
        onClear={clearFilters}
        hasActiveFilters={hasActiveFilters}
        resultsText={`Showing ${filteredPayments.length} of ${payments.length} payments`}
        totalText={hasActiveFilters ? `Total: ₹${totalFiltered.toLocaleString()}` : null}
      />

      <div className="table-container" style={{ 
        boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
        borderRadius: '12px',
        overflow: 'hidden',
        background: 'rgba(30, 41, 59, 0.6)',
        border: '1px solid rgba(100, 116, 139, 0.2)'
      }}>
        <div className="table-header" style={{ padding: '20px', borderBottom: '1px solid rgba(100, 116, 139, 0.3)' }}>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#e2e8f0' }}>💰 All Payments</h3>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              className="btn btn-secondary" 
              onClick={() => exportToCSV(formatDataForExport(filteredPayments, 'payments'), 'payments')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 16px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'all 0.2s'
              }}
            >
              <FaFileExport /> Export
            </button>
            <button 
              className="btn btn-success" 
              onClick={() => setShowModal(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 16px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'all 0.2s'
              }}
            >
              <FaPlus /> Add Payment
            </button>
          </div>
        </div>
        <table style={{ width: '100%' }}>
          <thead>
            <tr>
              <th style={{ padding: '14px 16px', textAlign: 'left' }}>Type</th>
              <th style={{ padding: '14px 16px', textAlign: 'left' }}>Party</th>
              <th style={{ padding: '14px 16px', textAlign: 'right' }}>
                <FaDollarSign style={{ marginRight: '6px', fontSize: '12px', opacity: 0.7 }} />
                Amount
              </th>
              <th style={{ padding: '14px 16px', textAlign: 'left' }}>Payment Method</th>
              <th style={{ padding: '14px 16px', textAlign: 'left' }}>
                <FaCalendarAlt style={{ marginRight: '6px', fontSize: '12px', opacity: 0.7 }} />
                Payment Date
              </th>
              <th style={{ padding: '14px 16px', textAlign: 'center' }}>Status</th>
              <th style={{ padding: '14px 16px', textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredPayments.length > 0 ? (
              filteredPayments.map((payment) => (
                <tr key={payment.id} style={{ 
                  transition: 'background-color 0.2s',
                  cursor: 'pointer',
                  borderBottom: '1px solid rgba(100, 116, 139, 0.2)'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(102, 126, 234, 0.1)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{
                      padding: '6px 12px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: '600',
                      backgroundColor: payment.type === 'To Machine Owner' ? '#fee2e2' : '#d4edda',
                      color: payment.type === 'To Machine Owner' ? '#991b1b' : '#155724',
                      border: `1px solid ${payment.type === 'To Machine Owner' ? '#fecaca' : '#c3e6cb'}`,
                      display: 'inline-block'
                    }}>
                      {payment.type}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    {payment.type === 'To Machine Owner'
                      ? payment.machine_owner?.name
                      : payment.farmer?.name}
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: '600', fontSize: '15px', color: payment.type === 'To Machine Owner' ? '#dc3545' : '#28a745' }}>
                    {payment.amount?.toLocaleString()}
                  </td>
                  <td style={{ padding: '14px 16px' }}>{payment.payment_method}</td>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <FaCalendarAlt style={{ fontSize: '12px', color: '#6c757d' }} />
                      {new Date(payment.payment_date).toLocaleDateString()}
                    </div>
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                    <span style={{
                      padding: '6px 12px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: '600',
                      backgroundColor: payment.status?.toLowerCase() === 'paid' ? '#d4edda' : '#fff3cd',
                      color: payment.status?.toLowerCase() === 'paid' ? '#155724' : '#856404',
                      border: `1px solid ${payment.status?.toLowerCase() === 'paid' ? '#c3e6cb' : '#ffeaa7'}`,
                      display: 'inline-block'
                    }}>
                      {payment.status}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      <button
                        onClick={() => handleEdit(payment)}
                        style={{
                          background: '#17a2b8',
                          color: 'white',
                          border: 'none',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '13px',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => e.target.style.background = '#138496'}
                        onMouseLeave={(e) => e.target.style.background = '#17a2b8'}
                        title="Edit Payment"
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => handleDelete(payment.id)}
                        style={{
                          background: '#dc3545',
                          color: 'white',
                          border: 'none',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '13px',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => e.target.style.background = '#c82333'}
                        onMouseLeave={(e) => e.target.style.background = '#dc3545'}
                        title="Delete Payment"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '40px' }}>
                  {hasActiveFilters ? 'No payments match the selected filters.' : 'No payments found. Record your first payment!'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>{editingPayment ? 'Edit Payment' : 'Add Payment'}</h2>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Payment Type <span className="required-star">*</span></label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value, job: '', amount: '', businessSource: e.target.value === 'From Farmer' ? 'harvesting' : formData.businessSource })}
                    required
                    disabled={editingPayment}
                  >
                    <option value="From Farmer">From Farmer</option>
                    <option value="To Machine Owner">To Machine Owner</option>
                  </select>
                </div>
                
                {formData.type === 'To Machine Owner' && (
                  <div className="form-group">
                    <label>Business Source <span className="required-star">*</span></label>
                    <select
                      value={formData.businessSource}
                      onChange={(e) => setFormData({ ...formData, businessSource: e.target.value })}
                      required
                    >
                      <option value="harvesting">Direct Harvesting</option>
                      <option value="rental">Dealer Rental</option>
                    </select>
                  </div>
                )}
                
                {formData.type === 'From Farmer' ? (
                  <div className="form-group">
                    <label>Job *</label>
                    <select
                      value={formData.job}
                      onChange={(e) => handleJobChange(e.target.value)}
                      required
                    >
                      <option value="">Select Job</option>
                      {jobs.map((job) => {
                        const farmerName = job.farmers?.name || 'Unknown Farmer';
                        const driverName = job.machines?.driver_name || 'Unknown Driver';
                        const ownerName = job.machines?.machine_owners?.name || 'Unknown Owner';
                        const jobAmount = parseFloat(job.total_amount) || (parseFloat(job.hours || 0) * parseFloat(job.rate_per_hour || 0));
                        return (
                          <option key={job.id} value={job.id}>
                            {farmerName} - {driverName} - {ownerName} (₹{jobAmount.toLocaleString()})
                          </option>
                        );
                      })}
                    </select>
                  </div>
                ) : (
                  <div className="form-group">
                    <label>Machine *</label>
                    <select
                      value={formData.machine}
                      onChange={(e) => handleMachineChange(e.target.value)}
                      required
                    >
                      <option value="">Select Machine</option>
                      {machines.map((machine) => {
                        // Show balance based on selected business source
                        const balanceData = machineBalances[machine.id];
                        const balance = formData.businessSource === 'rental' 
                          ? (balanceData?.rental?.balance || 0)
                          : (balanceData?.harvesting?.balance || 0);
                        const ownerName = machine.machine_owners?.name || 'Unknown Owner';
                        const driverName = machine.driver_name || 'Unknown Driver';
                        return (
                          <option key={machine.id} value={machine.id}>
                            {driverName} - {ownerName} (₹{balance.toLocaleString()} balance)
                          </option>
                        );
                      })}
                    </select>
                  </div>
                )}
                <div className="form-row">
                  <div className="form-group">
                    <label>Gross Amount (₹) *</label>
                    <input
                      type="number"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      required
                      step="0.01"
                      placeholder="Original payment amount"
                    />
                    <small style={{ color: 'var(--text-secondary)', fontSize: '12px', display: 'block', marginTop: '4px' }}>
                      Amount before discount
                    </small>
                  </div>
                  <div className="form-group">
                    <label>Discount (₹)</label>
                    <input
                      type="number"
                      value={formData.discountAmount || ''}
                      onChange={(e) => setFormData({ ...formData, discountAmount: e.target.value })}
                      min="0"
                      max={formData.amount || 0}
                      step="0.01"
                      placeholder="0"
                    />
                    <small style={{ color: formData.type === 'To Machine Owner' ? '#10b981' : '#ef4444', fontSize: '12px', display: 'block', marginTop: '4px' }}>
                      {formData.type === 'To Machine Owner' ? '✓ Reduces payment to owner' : '✓ Reduces collection from farmer'}
                    </small>
                  </div>
                </div>
                
                {formData.discountAmount > 0 && (
                  <div style={{ 
                    padding: '12px', 
                    backgroundColor: '#f0fdf4', 
                    border: '1px solid #86efac', 
                    borderRadius: '8px', 
                    marginBottom: '15px' 
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ color: '#6b7280' }}>Gross Amount:</span>
                      <span style={{ fontWeight: '500' }}>₹{parseFloat(formData.amount || 0).toLocaleString()}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ color: '#ef4444' }}>Discount:</span>
                      <span style={{ fontWeight: '500', color: '#ef4444' }}>-₹{parseFloat(formData.discountAmount || 0).toLocaleString()}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px solid #d1fae5' }}>
                      <span style={{ fontWeight: '600', color: '#059669' }}>Net Payment:</span>
                      <span style={{ fontWeight: '700', fontSize: '18px', color: '#059669' }}>
                        ₹{(parseFloat(formData.amount || 0) - parseFloat(formData.discountAmount || 0)).toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Payment Date *</label>
                    <input
                      type="date"
                      value={formData.paymentDate}
                      onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Payment Method *</label>
                  <select
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                    required
                  >
                    <option value="Cash">Cash</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="UPI">UPI</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>

              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={handleCloseModal}>Cancel</button>
                <button type="submit" className="btn-primary">
                  {editingPayment ? 'Update Payment' : 'Add Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payments;
