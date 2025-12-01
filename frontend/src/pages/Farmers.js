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

  useEffect(() => {
    fetchFarmers();
    fetchJobs();
    fetchPayments();
  }, []);

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

  // Load villages from localStorage on mount
  useEffect(() => {
    const savedVillages = localStorage.getItem('villages');
    if (savedVillages) {
      setVillages(JSON.parse(savedVillages));
    }
  }, []);

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
      <div className="page-header">
        <h2>Farmers</h2>
        <p>Manage farmers and their information</p>
      </div>

      {/* Job Statistics */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', margin: '0 30px 20px 30px' }}>
        <div className="stat-card success">
          <h3>Farmers</h3>
          <div className="stat-value">{farmers.length || 0}</div>
          <small>Total registered farmers</small>
        </div>
        <div className="stat-card warning">
          <h3>Total Jobs</h3>
          <div className="stat-value">{jobs.length || 0}</div>
          <small>All harvesting jobs</small>
        </div>
        <div className="stat-card success">
          <h3>Completed</h3>
          <div className="stat-value">{jobs.filter(j => j.status === 'Completed').length || 0}</div>
          <small>Jobs completed</small>
        </div>
        <div className="stat-card warning">
          <h3>Pending</h3>
          <div className="stat-value">{jobs.filter(j => j.status !== 'Completed').length || 0}</div>
          <small>Jobs pending</small>
        </div>
      </div>

      {/* Filter Section */}
      <FilterBar
        filters={[
          {
            type: 'text',
            label: 'Farmer Name',
            value: filterName,
            onChange: (e) => setFilterName(e.target.value),
            placeholder: 'Search by name...'
          },
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
              { value: 'Paid', label: 'Fully Paid' }
            ]
          }
        ]}
        onClear={clearFilters}
        hasActiveFilters={hasActiveFilters}
        resultsText={`Showing ${filteredFarmers.length} of ${farmers.length} farmers`}
      />

      <div className="table-container" style={{ 
        boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
        borderRadius: '12px',
        overflow: 'hidden',
        background: 'rgba(30, 41, 59, 0.6)',
        border: '1px solid rgba(100, 116, 139, 0.2)'
      }}>
        <div className="table-header" style={{ padding: '20px', borderBottom: '1px solid rgba(100, 116, 139, 0.3)' }}>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#e2e8f0' }}>👨‍🌾 Farmers List</h3>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn btn-secondary" onClick={() => exportToCSV(formatDataForExport(filteredFarmers, 'farmers'), 'farmers')} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: '8px', fontSize: '14px', fontWeight: '500', transition: 'all 0.2s' }}>
              <FaFileExport /> Export
            </button>
            <button className="btn btn-success" onClick={() => setShowModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: '8px', fontSize: '14px', fontWeight: '500', transition: 'all 0.2s' }}>
              <FaPlus /> Add Farmer
            </button>
          </div>
        </div>
        <table style={{ width: '100%' }}>
          <thead>
            <tr>
              <th style={{ padding: '14px 16px', textAlign: 'left' }}><FaUserAlt style={{ marginRight: '6px', fontSize: '12px', opacity: 0.7 }} />Name</th>
              <th style={{ padding: '14px 16px', textAlign: 'left' }}><FaPhone style={{ marginRight: '6px', fontSize: '12px', opacity: 0.7 }} />Phone</th>
              <th style={{ padding: '14px 16px', textAlign: 'left' }}><FaHome style={{ marginRight: '6px', fontSize: '12px', opacity: 0.7 }} />Village</th>
              <th style={{ padding: '14px 16px', textAlign: 'right' }}>Total Amount</th>
              <th style={{ padding: '14px 16px', textAlign: 'right' }}>Discounts Received</th>
              <th style={{ padding: '14px 16px', textAlign: 'right' }}>Paid Amount</th>
              <th style={{ padding: '14px 16px', textAlign: 'right' }}>Balance</th>
              <th style={{ padding: '14px 16px', textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
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
                  .reduce((sum, job) => sum + parseFloat(job.discount_to_farmer || 0), 0);
                
                return (
                  <tr key={farmer.id} style={{ transition: 'background-color 0.2s', cursor: 'pointer', borderBottom: '1px solid rgba(100, 116, 139, 0.2)' }} onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(102, 126, 234, 0.1)'} onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#28a745', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold' }}>{farmer.name.charAt(0).toUpperCase()}</span>
                        <span>{farmer.name}</span>
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px' }}><FaPhone style={{ marginRight: '6px', fontSize: '11px', opacity: 0.6 }} />{farmer.phone}</td>
                    <td style={{ padding: '14px 16px' }}><FaHome style={{ marginRight: '6px', fontSize: '11px', opacity: 0.6 }} />{farmer.village}</td>
                    <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: '500' }}>{totalAmount.toLocaleString()}</td>
                    <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: totalDiscountsReceived > 0 ? 'bold' : 'normal', color: totalDiscountsReceived > 0 ? '#10b981' : '#6b7280' }}>{totalDiscountsReceived.toLocaleString()}</td>
                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>{paidAmount.toLocaleString()}</td>
                    <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 'bold', color: balance > 0 ? '#ef4444' : '#10b981', fontSize: '15px' }}>{balance.toLocaleString()}</td>
                    <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        <button onClick={() => handleEdit(farmer)} style={{ background: '#17a2b8', color: 'white', border: 'none', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', transition: 'all 0.2s' }} onMouseEnter={(e) => e.target.style.background = '#138496'} onMouseLeave={(e) => e.target.style.background = '#17a2b8'} title="Edit Farmer"><FaEdit /></button>
                        <button onClick={() => handleDelete(farmer.id)} style={{ background: '#dc3545', color: 'white', border: 'none', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', transition: 'all 0.2s' }} onMouseEnter={(e) => e.target.style.background = '#c82333'} onMouseLeave={(e) => e.target.style.background = '#dc3545'} title="Delete Farmer"><FaTrash /></button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '40px' }}>
                  {hasActiveFilters ? 'No farmers match the selected filters.' : 'No farmers found. Add your first farmer!'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
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
