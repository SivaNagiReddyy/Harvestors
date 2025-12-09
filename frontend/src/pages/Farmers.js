import React, { useState, useEffect } from 'react';
import { farmerAPI } from '../api';
import { FaPlus, FaTrash, FaCog, FaFileExport, FaEdit, FaUserAlt, FaHome, FaPhone } from 'react-icons/fa';
import ActionsCell from '../components/ActionsCell';
import FilterBar from '../components/FilterBar';
import axios from 'axios';
import { exportToCSV, formatDataForExport } from '../utils/exportUtils';

const Farmers = () => {
  const [farmers, setFarmers] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingFarmer, setEditingFarmer] = useState(null);
  const [villages, setVillages] = useState([]);
  const [showAddVillage, setShowAddVillage] = useState(false);
  const [newVillage, setNewVillage] = useState('');
  const [showManageVillages, setShowManageVillages] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    village: '',
    status: 'Active'
  });

  // Filter states
  const [filterName, setFilterName] = useState('');
  const [filterVillage, setFilterVillage] = useState('');
  const [filterBalanceStatus, setFilterBalanceStatus] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchFarmers();
    fetchJobs();
    fetchPayments();
  }, []);

  useEffect(() => {
    // Initialize villages from localStorage or set defaults
    const savedVillages = localStorage.getItem('villages');
    if (savedVillages) {
      setVillages(JSON.parse(savedVillages));
    } else {
      // Default villages - can be customized
      const defaultVillages = ['Maseedupuram', 'Ayyalur', 'Shamsulla', 'Munagala'];
      setVillages(defaultVillages);
      localStorage.setItem('villages', JSON.stringify(defaultVillages));
    }
  }, []);

  useEffect(() => {
    // Extract unique villages from existing farmers
    if (farmers.length > 0) {
      const existingVillages = [...new Set(farmers.map(f => f.village).filter(Boolean))];
      const savedVillages = JSON.parse(localStorage.getItem('villages') || '[]');
      
      // Merge existing villages with saved villages
      const mergedVillages = [...new Set([...savedVillages, ...existingVillages])];
      if (mergedVillages.length > savedVillages.length) {
        setVillages(mergedVillages.sort());
        localStorage.setItem('villages', JSON.stringify(mergedVillages));
      }
    }
  }, [farmers]);

  const fetchFarmers = async () => {
    try {
      const response = await farmerAPI.getAll();
      setFarmers(response.data);
    } catch (error) {
      console.error('Error fetching farmers:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchJobs = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/jobs', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setJobs(response.data);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    }
  };

  const fetchPayments = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/payments', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPayments(response.data);
    } catch (error) {
      console.error('Error fetching payments:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingFarmer) {
        await farmerAPI.update(editingFarmer.id, formData);
      } else {
        await farmerAPI.create(formData);
      }
      fetchFarmers();
      handleCloseModal();
    } catch (error) {
      alert(error.response?.data?.error || 'Error saving farmer');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this farmer?')) {
      try {
        await farmerAPI.delete(id);
        fetchFarmers();
      } catch (error) {
        alert(error.response?.data?.error || 'Error deleting farmer');
      }
    }
  };

  const handleEdit = (farmer) => {
    setEditingFarmer(farmer);
    setFormData(farmer);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingFarmer(null);
    setShowAddVillage(false);
    setNewVillage('');
    setFormData({
      name: '',
      phone: '',
      village: '',
      status: 'Active'
    });
  };

  const handleAddVillage = () => {
    if (newVillage.trim() && !villages.includes(newVillage.trim())) {
      const updatedVillages = [...villages, newVillage.trim()];
      setVillages(updatedVillages);
      setFormData({ ...formData, village: newVillage.trim() });
      setNewVillage('');
      setShowAddVillage(false);
      // Save to localStorage for persistence
      localStorage.setItem('villages', JSON.stringify(updatedVillages));
    }
  };

  const handleDeleteVillage = (villageToDelete) => {
    // Check if any farmer is using this village
    const farmersUsingVillage = farmers.filter(f => f.village === villageToDelete);
    
    if (farmersUsingVillage.length > 0) {
      alert(`Cannot delete "${villageToDelete}" because ${farmersUsingVillage.length} farmer(s) are using it.`);
      return;
    }
    
    if (window.confirm(`Are you sure you want to delete village "${villageToDelete}"?`)) {
      const updatedVillages = villages.filter(v => v !== villageToDelete);
      setVillages(updatedVillages);
      localStorage.setItem('villages', JSON.stringify(updatedVillages));
      
      // If the deleted village was selected in the form, clear it
      if (formData.village === villageToDelete) {
        setFormData({ ...formData, village: '' });
      }
    }
  };

  // Get unique villages from farmers
  const uniqueVillages = [...new Set(farmers.map(f => f.village).filter(Boolean))];

  // Apply filters
  const filteredFarmers = farmers.filter(farmer => {
    // Safety check for farmer.name
    if (filterName && (!farmer.name || !farmer.name.toLowerCase().includes(filterName.toLowerCase()))) return false;
    if (filterVillage && farmer.village !== filterVillage) return false;
    
    if (filterBalanceStatus) {
      const totalAmount = jobs
        .filter(job => job.farmer_id === farmer.id)
        .reduce((sum, job) => {
          const amount = parseFloat(job.total_amount) || (parseFloat(job.hours || 0) * parseFloat(job.rate_per_hour || 0));
          return sum + amount;
        }, 0);
      
      const advancesFromJobs = jobs
        .filter(job => job.farmer_id === farmer.id)
        .reduce((sum, job) => sum + parseFloat(job.advance_from_farmer || 0), 0);
      
      const paymentsFromFarmer = payments
        .filter(payment => payment.type === 'From Farmer' && payment.farmer_id === farmer.id)
        .reduce((sum, payment) => sum + parseFloat(payment.amount || 0), 0);
      
      const balance = totalAmount - advancesFromJobs - paymentsFromFarmer;
      
      if (filterBalanceStatus === 'Pending' && balance <= 0) return false;
      if (filterBalanceStatus === 'Paid' && balance > 0) return false;
    }
    
    return true;
  });

  const clearFilters = () => {
    setFilterName('');
    setFilterVillage('');
    setFilterBalanceStatus('');
  };

  const hasActiveFilters = filterName || filterVillage || filterBalanceStatus;

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div>
      {/* Page Header with Add Button */}
      <div className="page-header" style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        padding: '16px 20px',
        marginBottom: '12px'
      }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '22px' }}>Farmers</h2>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px' }}>Manage farmers and their information</p>
        </div>
        <button 
          className="btn btn-success" 
          onClick={() => setShowModal(true)}
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '6px', 
            padding: '10px 16px',
            fontSize: '14px',
            borderRadius: '8px',
            whiteSpace: 'nowrap'
          }}
        >
          <FaPlus /> Add
        </button>
      </div>

      {/* Horizontal Scrolling Stats Bar */}
      <div style={{ 
        display: 'flex',
        gap: '12px',
        overflowX: 'auto',
        padding: '0 20px 16px 20px',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
        WebkitOverflowScrolling: 'touch'
      }}
      className="hide-scrollbar">
        <div style={{
          minWidth: '140px',
          padding: '16px',
          background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
          borderRadius: '12px',
          color: 'white',
          boxShadow: '0 4px 12px rgba(34, 197, 94, 0.3)'
        }}>
          <div style={{ fontSize: '13px', opacity: 0.9, marginBottom: '8px' }}>👨‍🌾 Farmers</div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', lineHeight: '1' }}>{farmers.length || 0}</div>
        </div>
        <div style={{
          minWidth: '140px',
          padding: '16px',
          background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
          borderRadius: '12px',
          color: 'white',
          boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)'
        }}>
          <div style={{ fontSize: '13px', opacity: 0.9, marginBottom: '8px' }}>📋 Total Jobs</div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', lineHeight: '1' }}>{jobs.length || 0}</div>
        </div>
        <div style={{
          minWidth: '140px',
          padding: '16px',
          background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
          borderRadius: '12px',
          color: 'white',
          boxShadow: '0 4px 12px rgba(34, 197, 94, 0.3)'
        }}>
          <div style={{ fontSize: '13px', opacity: 0.9, marginBottom: '8px' }}>✅ Completed</div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', lineHeight: '1' }}>{jobs.filter(j => j.status === 'Completed').length || 0}</div>
        </div>
        <div style={{
          minWidth: '140px',
          padding: '16px',
          background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
          borderRadius: '12px',
          color: 'white',
          boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)'
        }}>
          <div style={{ fontSize: '13px', opacity: 0.9, marginBottom: '8px' }}>⏳ Pending</div>
          <div style={{ fontSize: '32px', fontWeight: 'bold', lineHeight: '1' }}>{jobs.filter(j => j.status !== 'Completed').length || 0}</div>
        </div>
      </div>

      {/* Collapsible Filters Accordion */}
      <div style={{ margin: '0 20px 16px 20px' }}>
        <button
          onClick={() => setShowFilters(!showFilters)}
          style={{
            width: '100%',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '14px 16px',
            background: 'rgba(30, 41, 59, 0.6)',
            border: '1px solid rgba(100, 116, 139, 0.3)',
            borderRadius: '10px',
            color: '#e2e8f0',
            fontSize: '15px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            🔍 Filters {hasActiveFilters && <span style={{ 
              background: '#ef4444', 
              color: 'white', 
              padding: '2px 8px', 
              borderRadius: '12px', 
              fontSize: '11px' 
            }}>Active</span>}
          </span>
          <span style={{ fontSize: '12px' }}>{showFilters ? '▲' : '▼'}</span>
        </button>
        
        {showFilters && (
          <div style={{
            marginTop: '12px',
            padding: '16px',
            background: 'rgba(30, 41, 59, 0.4)',
            border: '1px solid rgba(100, 116, 139, 0.2)',
            borderRadius: '10px'
          }}>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: '#94a3b8' }}>
                Farmer Name
              </label>
              <input
                type="text"
                value={filterName}
                onChange={(e) => setFilterName(e.target.value)}
                placeholder="Search by name..."
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid rgba(100, 116, 139, 0.3)',
                  borderRadius: '8px',
                  color: '#e2e8f0',
                  fontSize: '14px'
                }}
              />
            </div>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: '#94a3b8' }}>
                Village
              </label>
              <select
                value={filterVillage}
                onChange={(e) => setFilterVillage(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid rgba(100, 116, 139, 0.3)',
                  borderRadius: '8px',
                  color: '#e2e8f0',
                  fontSize: '14px'
                }}
              >
                <option value="">All Villages</option>
                {uniqueVillages.map((village) => (
                  <option key={village} value={village}>{village}</option>
                ))}
              </select>
            </div>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: '600', color: '#94a3b8' }}>
                Balance Status
              </label>
              <select
                value={filterBalanceStatus}
                onChange={(e) => setFilterBalanceStatus(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: 'rgba(15, 23, 42, 0.6)',
                  border: '1px solid rgba(100, 116, 139, 0.3)',
                  borderRadius: '8px',
                  color: '#e2e8f0',
                  fontSize: '14px'
                }}
              >
                <option value="">All Balances</option>
                <option value="Pending">Has Pending Amount</option>
                <option value="Paid">Fully Paid</option>
              </select>
            </div>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                style={{
                  width: '100%',
                  padding: '10px',
                  background: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Clear All Filters
              </button>
            )}
            <div style={{ marginTop: '12px', fontSize: '13px', color: '#64748b', textAlign: 'center' }}>
              Showing {filteredFarmers.length} of {farmers.length} farmers
            </div>
          </div>
        )}
      </div>

      {/* Farmers List Header */}
      <div style={{ 
        padding: '0 20px 12px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '600', color: '#e2e8f0' }}>
          👨‍🌾 Farmers List
        </h3>
        <button 
          className="btn btn-secondary" 
          onClick={() => exportToCSV(formatDataForExport(filteredFarmers, 'farmers'), 'farmers')} 
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '6px', 
            padding: '8px 14px',
            fontSize: '13px',
            borderRadius: '8px'
          }}
        >
          <FaFileExport /> Export
        </button>
      </div>

      {/* Card-Style Farmers List */}
      <div style={{ padding: '0 20px 20px 20px' }}>
        {filteredFarmers.length > 0 ? (
          filteredFarmers.map((farmer) => {
                // Calculate total amount from jobs for this farmer
                const totalAmount = jobs
                  .filter(job => job.farmer_id === farmer.id)
                  .reduce((sum, job) => {
                    const amount = parseFloat(job.total_amount) || (parseFloat(job.hours || 0) * parseFloat(job.rate_per_hour || 0));
                    return sum + amount;
                  }, 0);
                
                // Calculate paid amount from both advances in jobs AND payments
                const advancesFromJobs = jobs
                  .filter(job => job.farmer_id === farmer.id)
                  .reduce((sum, job) => {
                    const advance = parseFloat(job.advance_from_farmer || 0);
                    return sum + advance;
                  }, 0);
                
                // Add payments made by this farmer
                const paymentsFromFarmer = payments
                  .filter(payment => payment.type === 'From Farmer' && payment.farmer_id === farmer.id)
                  .reduce((sum, payment) => {
                    return sum + parseFloat(payment.amount || 0);
                  }, 0);
                
                const paidAmount = advancesFromJobs + paymentsFromFarmer;
                const balance = totalAmount - paidAmount;
                
                // Calculate total discounts received by this farmer
                const totalDiscountsReceived = jobs
                  .filter(job => job.farmer_id === farmer.id)
                  .reduce((sum, job) => sum + parseFloat(job.discount_amount_to_farmer || 0), 0);
                
                return (
                  <div 
                    key={farmer.id}
                    style={{
                      background: 'rgba(30, 41, 59, 0.6)',
                      border: '1px solid rgba(100, 116, 139, 0.3)',
                      borderRadius: '12px',
                      padding: '16px',
                      marginBottom: '12px',
                      transition: 'all 0.2s',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(102, 126, 234, 0.1)';
                      e.currentTarget.style.transform = 'translateX(4px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(30, 41, 59, 0.6)';
                      e.currentTarget.style.transform = 'translateX(0)';
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                        <span style={{ 
                          width: '48px', 
                          height: '48px', 
                          borderRadius: '50%', 
                          background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)', 
                          color: 'white', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          fontSize: '20px', 
                          fontWeight: 'bold',
                          flexShrink: 0
                        }}>
                          {farmer.name.charAt(0).toUpperCase()}
                        </span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '17px', fontWeight: '600', color: '#e2e8f0', marginBottom: '4px' }}>
                            {farmer.name}
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', color: '#94a3b8' }}>
                              <FaPhone style={{ fontSize: '12px' }} />
                              <a href={`tel:${farmer.phone}`} style={{ color: '#60a5fa', textDecoration: 'none' }}>
                                {farmer.phone}
                              </a>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', color: '#94a3b8' }}>
                              <FaHome style={{ fontSize: '12px' }} />
                              <span>{farmer.village}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                        <button 
                          onClick={() => handleEdit(farmer)} 
                          style={{ 
                            background: '#17a2b8', 
                            color: 'white', 
                            border: 'none', 
                            padding: '10px', 
                            borderRadius: '8px', 
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '40px',
                            height: '40px',
                            fontSize: '16px'
                          }}
                          title="Edit Farmer"
                        >
                          <FaEdit />
                        </button>
                        <button 
                          onClick={() => handleDelete(farmer.id)} 
                          style={{ 
                            background: '#dc3545', 
                            color: 'white', 
                            border: 'none', 
                            padding: '10px', 
                            borderRadius: '8px', 
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '40px',
                            height: '40px',
                            fontSize: '16px'
                          }}
                          title="Delete Farmer"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </div>
                    
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(2, 1fr)', 
                      gap: '12px',
                      paddingTop: '12px',
                      borderTop: '1px solid rgba(100, 116, 139, 0.2)'
                    }}>
                      <div>
                        <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>Total Amount</div>
                        <div style={{ fontSize: '15px', fontWeight: '600', color: '#e2e8f0' }}>
                          {totalAmount.toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>Balance</div>
                        <div style={{ 
                          fontSize: '15px', 
                          fontWeight: 'bold', 
                          color: balance > 0 ? '#ef4444' : '#10b981' 
                        }}>
                          {balance.toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>Paid</div>
                        <div style={{ fontSize: '15px', fontWeight: '600', color: '#10b981' }}>
                          {paidAmount.toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>Discounts</div>
                        <div style={{ 
                          fontSize: '15px', 
                          fontWeight: '600', 
                          color: totalDiscountsReceived > 0 ? '#22c55e' : '#64748b' 
                        }}>
                          {totalDiscountsReceived.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={{ 
                textAlign: 'center', 
                padding: '40px', 
                background: 'rgba(30, 41, 59, 0.4)',
                borderRadius: '12px',
                color: '#94a3b8'
              }}>
                {hasActiveFilters ? 'No farmers match the selected filters.' : 'No farmers found. Add your first farmer!'}
              </div>
            )}
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>{editingFarmer ? 'Edit Farmer' : 'Add Farmer'}</h2>
            <form onSubmit={handleSubmit}>
                <div className="form-row">
                  <div className="form-group">
                    <label>Name <span className="required-star">*</span></label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value.toUpperCase() })}
                      placeholder="Enter farmer name"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Phone <span className="required-star">*</span></label>
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
                    <label>Village <span className="required-star">*</span></label>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                      <select
                        value={formData.village}
                        onChange={(e) => setFormData({ ...formData, village: e.target.value })}
                        required
                        style={{ flex: 1 }}
                      >
                        <option value="">Select Village</option>
                        {villages.map((village) => (
                          <option key={village} value={village}>{village}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        className="btn btn-success"
                        onClick={() => setShowAddVillage(!showAddVillage)}
                        style={{ padding: '8px 16px', minWidth: 'auto' }}
                        title="Add new village"
                      >
                        <FaPlus />
                      </button>
                      <button
                        type="button"
                        className="btn"
                        onClick={() => setShowManageVillages(true)}
                        style={{ padding: '8px 16px', minWidth: 'auto', backgroundColor: '#6b7280', color: 'white' }}
                        title="Manage villages"
                      >
                        <FaCog />
                      </button>
                    </div>
                    {showAddVillage && (
                      <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
                        <input
                          type="text"
                          value={newVillage}
                          onChange={(e) => setNewVillage(e.target.value)}
                          placeholder="Enter new village name"
                          style={{ flex: 1 }}
                          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddVillage())}
                        />
                        <button
                          type="button"
                          className="btn btn-success"
                          onClick={handleAddVillage}
                          style={{ padding: '8px 16px' }}
                        >
                          Add
                        </button>
                        <button
                          type="button"
                          className="btn"
                          onClick={() => {
                            setShowAddVillage(false);
                            setNewVillage('');
                          }}
                          style={{ padding: '8px 16px' }}
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
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

              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={handleCloseModal}>Cancel</button>
                <button type="submit" className="btn-primary">
                  {editingFarmer ? 'Update Farmer' : 'Add Farmer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manage Villages Modal */}
      {showManageVillages && (
        <div className="modal-overlay" onClick={() => setShowManageVillages(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <h2>Manage Villages</h2>
            <div style={{ marginTop: '20px' }}>
              {villages.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#6b7280', padding: '20px' }}>No villages added yet</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {villages.map((village) => {
                    const farmersCount = farmers.filter(f => f.village === village).length;
                    return (
                      <div
                        key={village}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '12px 16px',
                          border: '2px solid #e5e7eb',
                          borderRadius: '8px',
                          backgroundColor: farmersCount > 0 ? '#f3f4f6' : 'white'
                        }}
                      >
                        <div>
                          <span style={{ fontWeight: '600', fontSize: '16px', color: '#1f2937' }}>{village}</span>
                          {farmersCount > 0 && (
                            <span style={{ marginLeft: '10px', fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>
                              ({farmersCount} farmer{farmersCount !== 1 ? 's' : ''})
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          className="btn btn-danger"
                          onClick={() => handleDeleteVillage(village)}
                          style={{ padding: '6px 12px', minWidth: 'auto' }}
                          title="Delete village"
                          disabled={farmersCount > 0}
                        >
                          <FaTrash />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn"
                onClick={() => setShowManageVillages(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Farmers;
