import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaPlus, FaBuilding, FaFileExport, FaEllipsisV, FaChevronDown, FaChevronUp, FaHome, FaPhone, FaEdit, FaTrash } from 'react-icons/fa';
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
  const [showFilters, setShowFilters] = useState(false);
  const [showOverflowMenu, setShowOverflowMenu] = useState(false);

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
      // Initialize from localStorage or defaults
      const savedVillages = localStorage.getItem('dealerVillages');
      const defaultVillages = ['MASEEDUPURAM', 'AYYALUR', 'SHAMSULLA', 'MUNAGALA'];
      
      const token = localStorage.getItem('token');
      // Get unique villages from dealers
      const response = await axios.get(`/dealers`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const existingVillages = [...new Set(response.data.map(d => d.village_name).filter(Boolean))];
      
      // Merge saved, default, and existing villages
      const initialVillages = savedVillages ? JSON.parse(savedVillages) : defaultVillages;
      const mergedVillages = [...new Set([...initialVillages, ...existingVillages])];
      
      setVillages(mergedVillages.sort());
      localStorage.setItem('dealerVillages', JSON.stringify(mergedVillages));
    } catch (error) {
      console.error('Error fetching villages:', error);
      // Set defaults on error
      const defaultVillages = ['MASEEDUPURAM', 'AYYALUR', 'SHAMSULLA', 'MUNAGALA'];
      setVillages(defaultVillages);
      localStorage.setItem('dealerVillages', JSON.stringify(defaultVillages));
    }
  };

  const handleAddVillage = () => {
    if (newVillage.trim()) {
      const upperCaseVillage = newVillage.trim().toUpperCase();
      if (!villages.includes(upperCaseVillage)) {
        const updatedVillages = [...villages, upperCaseVillage].sort();
        setVillages(updatedVillages);
        localStorage.setItem('dealerVillages', JSON.stringify(updatedVillages));
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
      {/* Page Header with Actions */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', padding: '10px 0' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FaBuilding /> Dealers
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
            <FaPlus /> Add Dealer
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
                  exportToCSV(formatDataForExport(filteredDealers, 'dealers'), 'dealers');
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
                Showing {filteredDealers.length} of {dealers.length} dealers
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
                  <FaHome style={{ marginRight: '6px', fontSize: '12px' }} /> Village
                </label>
                <select
                  value={filterVillage}
                  onChange={(e) => setFilterVillage(e.target.value)}
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
                  <option value="">All Villages</option>
                  {uniqueVillages.map((village) => (
                    <option key={village} value={village}>
                      {village}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: '500', color: '#cbd5e1' }}>
                  💰 Balance Status
                </label>
                <select
                  value={filterBalanceStatus}
                  onChange={(e) => setFilterBalanceStatus(e.target.value)}
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
                  <option value="">All Balances</option>
                  <option value="Pending">Has Pending Amount</option>
                  <option value="Cleared">Fully Cleared</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Dealers List - Card Layout */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {filteredDealers.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '48px 20px',
            background: 'rgba(51, 65, 85, 0.4)',
            borderRadius: '12px',
            border: '1px solid rgba(100, 116, 139, 0.3)'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>🏢</div>
            <div style={{ fontSize: '16px', color: '#cbd5e1', fontWeight: '500' }}>
              No dealers found
            </div>
            <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '6px' }}>
              Add your first dealer to get started!
            </div>
          </div>
        ) : (
          filteredDealers.map((dealer) => {
            const totalCharged = dealer.total_amount_charged || 0;
            const totalPaid = dealer.total_amount_paid || 0;
            const balance = dealer.balance_amount || 0;
            return (
              <div 
                key={dealer.id}
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
                {/* Header: Name and Village */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div>
                    <div style={{ fontSize: '16px', fontWeight: '600', color: '#e2e8f0', marginBottom: '4px' }}>
                      {dealer.name}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#94a3b8' }}>
                      <FaHome style={{ fontSize: '11px' }} />
                      {dealer.village_name || '-'}
                    </div>
                  </div>
                </div>

                {/* Phone */}
                <a 
                  href={`tel:${dealer.phone}`}
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px', 
                    marginBottom: '12px',
                    padding: '8px 10px',
                    background: 'rgba(15, 23, 42, 0.5)',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    color: '#3b82f6',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(59, 130, 246, 0.2)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(15, 23, 42, 0.5)'}
                >
                  <FaPhone style={{ fontSize: '12px' }} />
                  {dealer.phone}
                </a>

                {/* Financial Grid (3x2) */}
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(3, 1fr)', 
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
                      ₹{(totalCharged/1000).toFixed(1)}k
                    </div>
                  </div>
                  <div style={{ 
                    background: 'rgba(15, 23, 42, 0.5)', 
                    padding: '10px', 
                    borderRadius: '8px',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>Paid</div>
                    <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#10b981' }}>
                      ₹{(totalPaid/1000).toFixed(1)}k
                    </div>
                  </div>
                  <div style={{ 
                    background: 'rgba(15, 23, 42, 0.5)', 
                    padding: '10px', 
                    borderRadius: '8px',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>Balance</div>
                    <div style={{ 
                      fontSize: '14px', 
                      fontWeight: 'bold', 
                      color: balance > 0 ? '#ef4444' : '#10b981' 
                    }}>
                      ₹{(balance/1000).toFixed(1)}k
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                  <button 
                    onClick={() => handleEdit(dealer)}
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
                    onClick={() => handleDelete(dealer.id)}
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
            );
          })
        )}
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
