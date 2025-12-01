import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaPlus, FaBuilding, FaFileExport } from 'react-icons/fa';
import ActionsCell from '../components/ActionsCell';
import FilterBar from '../components/FilterBar';
import '../index.css';
import { exportToCSV, formatDataForExport } from '../utils/exportUtils';

const Dealers = () => {
  const [dealers, setDealers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedDealer, setSelectedDealer] = useState(null);
  const [editingDealer, setEditingDealer] = useState(null);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [villages, setVillages] = useState([]);
  const [showAddVillage, setShowAddVillage] = useState(false);
  const [newVillage, setNewVillage] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    village_name: ''
  });

  // Filter states
  const [filterVillage, setFilterVillage] = useState('');
  const [filterBalanceStatus, setFilterBalanceStatus] = useState('');

  useEffect(() => {
    fetchDealers();
    fetchVillages();
  }, []);

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

  const fetchVillages = async () => {
    try {
      const token = localStorage.getItem('token');
      // Get unique villages from dealers
      const response = await axios.get(`/dealers`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const uniqueVillages = [...new Set(response.data.map(d => d.village_name).filter(Boolean))];
      setVillages(uniqueVillages.sort());
    } catch (error) {
      console.error('Error fetching villages:', error);
    }
  };

  const handleAddVillage = () => {
    if (newVillage.trim()) {
      const upperCaseVillage = newVillage.trim().toUpperCase();
      if (!villages.includes(upperCaseVillage)) {
        setVillages([...villages, upperCaseVillage].sort());
      }
      setFormData({ ...formData, village_name: upperCaseVillage });
      setNewVillage('');
      setShowAddVillage(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // For phone, only allow digits
    if (name === 'phone') {
      const digitsOnly = value.replace(/\D/g, '');
      setFormData({ ...formData, [name]: digitsOnly });
    } else if (name === 'name' || name === 'village_name') {
      // Convert name and village_name to uppercase
      setFormData({ ...formData, [name]: value.toUpperCase() });
    } else {
      setFormData({ ...formData, [name]: value });
    }
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const handleBlur = (fieldName) => {
    setTouched({ ...touched, [fieldName]: true });
    validateField(fieldName);
  };

  const validateField = (fieldName) => {
    const newErrors = { ...errors };
    
    if (fieldName === 'name' && !formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (fieldName === 'name') {
      delete newErrors.name;
    }
    
    if (fieldName === 'phone') {
      if (!formData.phone.trim()) {
        newErrors.phone = 'Phone number is required';
      } else if (formData.phone.length < 10) {
        newErrors.phone = 'Phone number must be at least 10 digits';
      } else {
        delete newErrors.phone;
      }
    }
    
    setErrors(newErrors);
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (formData.phone.length < 10) {
      newErrors.phone = 'Phone number must be at least 10 digits';
    } else if (!/^\d+$/.test(formData.phone)) {
      newErrors.phone = 'Phone number must contain only digits';
    }
    
    setErrors(newErrors);
    setTouched({ name: true, phone: true, village_name: true });
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (editingDealer) {
        await axios.put(`/dealers/${editingDealer.id}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post(`/dealers`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      fetchDealers();
      closeModal();
    } catch (error) {
      console.error('Error saving dealer:', error);
      alert('Error saving dealer. Please try again.');
    }
  };

  const handleEdit = (dealer) => {
    setEditingDealer(dealer);
    setFormData({
      name: dealer.name || '',
      phone: dealer.phone || '',
      village_name: dealer.village_name || ''
    });
    setErrors({});
    setTouched({});
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this dealer?')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`/dealers/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        fetchDealers();
      } catch (error) {
        console.error('Error deleting dealer:', error);
        alert('Error deleting dealer. Please try again.');
      }
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingDealer(null);
    setErrors({});
    setTouched({});
    setShowAddVillage(false);
    setNewVillage('');
    setFormData({
      name: '',
      phone: '',
      village_name: ''
    });
  };

  // eslint-disable-next-line no-unused-vars
  const handleViewDetails = (dealer) => {
    setSelectedDealer(dealer);
    setIsDetailsModalOpen(true);
  };

  // Get unique villages
  const uniqueVillages = [...new Set(dealers.map(d => d.village_name).filter(Boolean))];

  // Apply filters
  const filteredDealers = dealers.filter(dealer => {
    if (filterVillage && dealer.village_name !== filterVillage) return false;
    
    if (filterBalanceStatus) {
      const balance = dealer.balance_amount || 0;
      if (filterBalanceStatus === 'Pending' && balance <= 0) return false;
      if (filterBalanceStatus === 'Cleared' && balance > 0) return false;
    }
    
    return true;
  });

  const clearFilters = () => {
    setFilterVillage('');
    setFilterBalanceStatus('');
  };

  const hasActiveFilters = filterVillage || filterBalanceStatus;

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1>
            <FaBuilding /> Dealers
          </h1>
          <p className="page-subtitle">Manage dealer information and business relationships</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn-secondary" onClick={() => exportToCSV(formatDataForExport(filteredDealers, 'dealers'), 'dealers')}>
            <FaFileExport /> Export
          </button>
          <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
            <FaPlus /> Add Dealer
          </button>
        </div>
      </div>

      {/* Filter Section */}
      <FilterBar
        filters={[
          {
            type: 'select',
            label: 'Village',
            value: filterVillage,
            onChange: (e) => setFilterVillage(e.target.value),
            options: [
              { value: '', label: 'All Villages' },
              ...uniqueVillages.map((village) => ({
                value: village,
                label: village
              }))
            ]
          },
          {
            type: 'select',
            label: 'Balance Status',
            value: filterBalanceStatus,
            onChange: (e) => setFilterBalanceStatus(e.target.value),
            options: [
              { value: '', label: 'All Balances' },
              { value: 'Pending', label: 'Has Pending Amount' },
              { value: 'Cleared', label: 'Fully Cleared' }
            ]
          }
        ]}
        onClear={clearFilters}
        hasActiveFilters={hasActiveFilters}
        resultsText={`Showing ${filteredDealers.length} of ${dealers.length} dealers`}
      />

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Phone</th>
              <th>Village Name</th>
              <th>Total Charged</th>
              <th>Total Paid</th>
              <th>Balance Amount</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredDealers.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '40px' }}>
                  No dealers found
                </td>
              </tr>
            ) : (
              filteredDealers.map((dealer) => {
                const totalCharged = dealer.total_amount_charged || 0;
                const totalPaid = dealer.total_amount_paid || 0;
                const balance = dealer.balance_amount || 0;
                return (
                  <tr key={dealer.id}>
                    <td><strong>{dealer.name}</strong></td>
                    <td>{dealer.phone}</td>
                    <td>{dealer.village_name || '-'}</td>
                    <td className="amount">₹{totalCharged.toLocaleString()}</td>
                    <td className="amount">₹{totalPaid.toLocaleString()}</td>
                    <td className="amount" style={{ fontWeight: 'bold', color: balance > 0 ? '#e74c3c' : '#27ae60' }}>
                      ₹{balance.toLocaleString()}
                    </td>
                    <td className="actions">
                      <ActionsCell
                        onEdit={() => handleEdit(dealer)}
                        onDelete={() => handleDelete(dealer.id)}
                      />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>{editingDealer ? 'Edit Dealer' : 'Add New Dealer'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Name <span className="required-star">*</span></label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  onBlur={() => handleBlur('name')}
                  placeholder="Full name of the dealer"
                  className={errors.name && touched.name ? 'input-error' : ''}
                />
                {errors.name && touched.name && <span className="error-message">{errors.name}</span>}
              </div>

              <div className="form-group">
                <label>Phone <span className="required-star">*</span></label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  onBlur={() => handleBlur('phone')}
                  placeholder="Contact number"
                  maxLength="15"
                  className={errors.phone && touched.phone ? 'input-error' : ''}
                />
                {errors.phone && touched.phone && <span className="error-message">{errors.phone}</span>}
              </div>

              <div className="form-group">
                <label>Village Name</label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    {!showAddVillage ? (
                      <select
                        name="village_name"
                        value={formData.village_name}
                        onChange={handleInputChange}
                        style={{ width: '100%' }}
                      >
                        <option value="">Select village...</option>
                        {villages.map((village) => (
                          <option key={village} value={village}>
                            {village}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={newVillage}
                        onChange={(e) => setNewVillage(e.target.value.toUpperCase())}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddVillage();
                          }
                        }}
                        placeholder="Enter new village name"
                        autoFocus
                      />
                    )}
                  </div>
                  {!showAddVillage ? (
                    <button
                      type="button"
                      onClick={() => setShowAddVillage(true)}
                      className="btn-secondary"
                      style={{ whiteSpace: 'nowrap' }}
                    >
                      + New Village
                    </button>
                  ) : (
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button
                        type="button"
                        onClick={handleAddVillage}
                        className="btn-primary"
                        style={{ padding: '8px 16px' }}
                      >
                        ✓
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddVillage(false);
                          setNewVillage('');
                        }}
                        className="btn-secondary"
                        style={{ padding: '8px 16px' }}
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingDealer ? 'Update Dealer' : 'Add Dealer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isDetailsModalOpen && selectedDealer && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Dealer Details</h2>
            <div className="details-grid">
              <div className="detail-section">
                <h3>Contact Information</h3>
                <div className="detail-row">
                  <span className="label">Name:</span>
                  <span className="value"><strong>{selectedDealer.name}</strong></span>
                </div>
                <div className="detail-row">
                  <span className="label">Phone:</span>
                  <span className="value">{selectedDealer.phone}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Village Name:</span>
                  <span className="value">{selectedDealer.village_name || '-'}</span>
                </div>
              </div>

              <div className="detail-section">
                <h3>Financial Summary</h3>
                <div className="detail-row">
                  <span className="label">Total Charged:</span>
                  <span className="value">₹{(selectedDealer.total_amount_charged || 0).toLocaleString()}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Total Paid:</span>
                  <span className="value">₹{(selectedDealer.total_amount_paid || 0).toLocaleString()}</span>
                </div>
                <div className="detail-row highlight">
                  <span className="label">Balance Amount:</span>
                  <span className="value" style={{ fontWeight: 'bold', color: (selectedDealer.balance_amount || 0) > 0 ? '#e74c3c' : '#27ae60' }}>
                    ₹{(selectedDealer.balance_amount || 0).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="form-actions">
              <button className="btn-secondary" onClick={() => setIsDetailsModalOpen(false)}>
                Close
              </button>
              <button className="btn-primary" onClick={() => {
                setIsDetailsModalOpen(false);
                handleEdit(selectedDealer);
              }}>
                Edit Dealer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dealers;
