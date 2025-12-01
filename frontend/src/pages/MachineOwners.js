import React, { useState, useEffect } from 'react';
import { machineOwnerAPI } from '../api';
import { FaPlus, FaFileExport } from 'react-icons/fa';
import ActionsCell from '../components/ActionsCell';
import axios from 'axios';
import { exportToCSV, formatDataForExport } from '../utils/exportUtils';

const MachineOwners = () => {
  const [owners, setOwners] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [rentals, setRentals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingOwner, setEditingOwner] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    bankDetails: {
      accountHolderName: '',
      accountNumber: '',
      bankName: '',
      ifscCode: ''
    },
    status: 'Active'
  });

  useEffect(() => {
    fetchOwners();
    fetchExpenses();
    fetchJobs();
    fetchRentals();
  }, []);

  const fetchOwners = async () => {
    try {
      const response = await machineOwnerAPI.getAll();
      setOwners(response.data);
    } catch (error) {
      console.error('Error fetching owners:', error);
    } finally {
      setLoading(false);
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
    }
  };

  const fetchJobs = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/jobs', {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Jobs loaded:', response.data.length);
      if (response.data.length > 0) {
        console.log('Sample job:', response.data[0]);
        console.log('Job total_amount:', response.data[0].total_amount);
        console.log('Job hours:', response.data[0].hours);
        console.log('Job rate_per_hour:', response.data[0].rate_per_hour);
      }
      setJobs(response.data);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    }
  };

  const fetchRentals = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/rentals', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRentals(response.data || []);
    } catch (error) {
      console.error('Error fetching rentals:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Format data for backend (flatten bankDetails)
      const submitData = {
        name: formData.name,
        phone: formData.phone,
        bankAccountHolderName: formData.bankDetails.accountHolderName,
        bankAccountNumber: formData.bankDetails.accountNumber,
        bankName: formData.bankDetails.bankName,
        bankIfscCode: formData.bankDetails.ifscCode,
        status: formData.status
      };
      
      if (editingOwner) {
        await machineOwnerAPI.update(editingOwner.id, submitData);
      } else {
        await machineOwnerAPI.create(submitData);
      }
      fetchOwners();
      handleCloseModal();
    } catch (error) {
      alert(error.response?.data?.error || 'Error saving machine owner');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this machine owner?')) {
      try {
        await machineOwnerAPI.delete(id);
        fetchOwners();
      } catch (error) {
        alert(error.response?.data?.error || 'Error deleting machine owner');
      }
    }
  };

  const handleEdit = (owner) => {
    setEditingOwner(owner);
    setFormData({
      name: owner.name || '',
      phone: owner.phone || '',
      bankDetails: {
        accountHolderName: owner.bank_account_holder_name || '',
        accountNumber: owner.bank_account_number || '',
        bankName: owner.bank_name || '',
        ifscCode: owner.bank_ifsc_code || ''
      },
      status: owner.status || 'Active'
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingOwner(null);
    setFormData({
      name: '',
      phone: '',
      bankDetails: {
        accountHolderName: '',
        accountNumber: '',
        bankName: '',
        ifscCode: ''
      },
      status: 'Active'
    });
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div>
      <div className="page-header">
        <h2>Machine Owners</h2>
        <p>Manage harvesting machine owners</p>
      </div>

      <div className="table-container">
        <div className="table-header">
          <h3>Owners</h3>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn btn-secondary" onClick={() => exportToCSV(formatDataForExport(owners, 'machineOwners'), 'machine_owners')}>
              <FaFileExport /> Export
            </button>
            <button className="btn btn-success" onClick={() => setShowModal(true)}>
              <FaPlus /> Add Machine Owner
            </button>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Mobile Number</th>
              <th>Bank Account</th>
              <th>Bank Name</th>
              <th>Total Earned</th>
              <th>Expenses</th>
              <th>Net Payable</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {owners.length > 0 ? (
              owners.map((owner) => {
                console.log('Processing owner:', owner.name, 'ID:', owner.id);
                console.log('Total jobs:', jobs.length);
                
                // Calculate total earnings from all DIRECT HARVESTING jobs for this owner's machines
                const ownerJobs = jobs.filter(job => {
                  const machineOwnerId = job.machines?.machine_owner_id || job.machines?.machine_owners?.id;
                  const matches = machineOwnerId === owner.id;
                  if (matches) {
                    console.log('Job matches owner:', job.id);
                    console.log('  total_amount:', job.total_amount);
                    console.log('  hours:', job.hours);
                    console.log('  rate_per_hour:', job.rate_per_hour);
                  }
                  return matches;
                });
                
                console.log('Owner jobs count:', ownerJobs.length);
                
                const directEarnings = ownerJobs.reduce((sum, job) => {
                  // Use machine's owner_rate_per_hour (owner rate), NOT job's rate_per_hour (farmer rate)
                  const hours = parseFloat(job.hours || 0);
                  const ownerRate = parseFloat(job.machines?.owner_rate_per_hour || 0);
                  const amount = hours * ownerRate;
                  console.log('Calculated amount:', amount, '(', hours, 'hours *', ownerRate, 'rate)');
                  return sum + amount;
                }, 0);

                // Calculate total earnings from RENTAL HOURS for this owner's machines
                const ownerRentals = rentals.filter((rental) => {
                  const machineOwnerId = rental.machine?.machine_owners?.id || rental.machine?.machine_owner_id;
                  return machineOwnerId === owner.id;
                });

                // For rentals, OWNER EARNINGS = hours × machine.owner rate (owner_rate_per_hour)
                const rentalEarnings = ownerRentals.reduce((sum, rental) => {
                  const hours = parseFloat(rental.total_hours_used || 0);
                  const ownerRate = parseFloat(rental.machine?.owner_rate_per_hour || 0);
                  const amount = hours * ownerRate;
                  return sum + amount;
                }, 0);

                const totalEarnings = directEarnings + rentalEarnings;
                
                console.log('Total earnings for', owner.name, '=> Direct:', directEarnings, 'Rental:', rentalEarnings, 'Total:', totalEarnings);
                
                // Calculate total expenses for this owner's machines
                const ownerExpenses = expenses
                  .filter(exp => {
                    const machineOwnerId = exp.machines?.machine_owner_id || exp.machines?.machine_owners?.id;
                    return machineOwnerId === owner.id;
                  })
                  .reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0);
                
                const netPayable = totalEarnings - ownerExpenses;
                
                return (
                  <tr key={owner.id}>
                    <td>{owner.name}</td>
                    <td>{owner.phone}</td>
                    <td>{owner.bank_account_number || 'N/A'}</td>
                    <td>{owner.bank_name || 'N/A'}</td>
                    <td style={{ fontWeight: 'bold', color: '#3b82f6' }}>₹{totalEarnings.toLocaleString()}</td>
                    <td style={{ color: '#f59e0b' }}>₹{ownerExpenses.toLocaleString()}</td>
                    <td style={{ fontWeight: 'bold', color: '#10b981' }}>₹{netPayable.toLocaleString()}</td>
                    <td>
                      <span className={`status-badge ${owner.status.toLowerCase()}`}>
                        {owner.status}
                      </span>
                    </td>
                    <td>
                      <ActionsCell
                        onEdit={() => handleEdit(owner)}
                        onDelete={() => handleDelete(owner.id)}
                      />
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="9" style={{ textAlign: 'center', padding: '40px' }}>
                  No machine owners found. Add your first machine owner!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>{editingOwner ? 'Edit Machine Owner' : 'Add Machine Owner'}</h2>
            <form onSubmit={handleSubmit}>
                <div className="form-row">
                  <div className="form-group">
                    <label>Name <span className="required-star">*</span></label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value.toUpperCase() })}
                      placeholder="Enter owner name"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Mobile Number <span className="required-star">*</span></label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="10-digit mobile number"
                      pattern="[0-9]{10}"
                      required
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>
                <div className="form-section-header">
                  <h3>Bank Details</h3>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Account Holder Name</label>
                    <input
                      type="text"
                      value={formData.bankDetails.accountHolderName}
                      onChange={(e) => setFormData({
                        ...formData,
                        bankDetails: { ...formData.bankDetails, accountHolderName: e.target.value }
                      })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Account Number</label>
                    <input
                      type="text"
                      value={formData.bankDetails.accountNumber}
                      onChange={(e) => setFormData({
                        ...formData,
                        bankDetails: { ...formData.bankDetails, accountNumber: e.target.value }
                      })}
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Bank Name</label>
                    <input
                      type="text"
                      value={formData.bankDetails.bankName}
                      onChange={(e) => setFormData({
                        ...formData,
                        bankDetails: { ...formData.bankDetails, bankName: e.target.value }
                      })}
                    />
                  </div>
                  <div className="form-group">
                    <label>IFSC Code</label>
                    <input
                      type="text"
                      value={formData.bankDetails.ifscCode}
                      onChange={(e) => setFormData({
                        ...formData,
                        bankDetails: { ...formData.bankDetails, ifscCode: e.target.value }
                      })}
                    />
                  </div>
                </div>

              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={handleCloseModal}>Cancel</button>
                <button type="submit" className="btn-primary">
                  {editingOwner ? 'Update Owner' : 'Add Owner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MachineOwners;
