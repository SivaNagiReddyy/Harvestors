import React, { useState, useEffect } from 'react';
import { jobAPI, farmerAPI, machineAPI } from '../api';
import { FaPlus, FaFileExport, FaTimes, FaTractor, FaUserAlt, FaHome, FaClock, FaEdit, FaTrash, FaCalendarAlt, FaEllipsisV, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import ActionsCell from '../components/ActionsCell';
import FilterBar from '../components/FilterBar';
import { exportToCSV, formatDataForExport } from '../utils/exportUtils';

const Jobs = () => {
  const [jobs, setJobs] = useState([]);
  const [farmers, setFarmers] = useState([]);
  const [machines, setMachines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [formData, setFormData] = useState({
    farmer: '',
    machine: '',
    workDate: '',
    hours: '',
    ratePerHour: '',
    advanceFromFarmer: '',
    status: 'Completed',
    notes: ''
  });

  // Filter states
  const [filterMachine, setFilterMachine] = useState('');
  const [filterFarmer, setFilterFarmer] = useState('');
  const [filterVillage, setFilterVillage] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showOverflowMenu, setShowOverflowMenu] = useState(false);

  useEffect(() => {
    fetchJobs();
    fetchFarmers();
    fetchMachines();
  }, []);

  const fetchJobs = async () => {
    try {
      const response = await jobAPI.getAll();
      setJobs(response.data);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFarmers = async () => {
    try {
      const response = await farmerAPI.getAll();
      setFarmers(response.data.filter(f => f.status === 'Active'));
    } catch (error) {
      console.error('Error fetching farmers:', error);
    }
  };

  const fetchMachines = async () => {
    try {
      const response = await machineAPI.getAll();
      setMachines(response.data.filter(m => m.status === 'Active'));
    } catch (error) {
      console.error('Error fetching machines:', error);
    }
  };

  const handleMachineChange = (machineId) => {
    const selectedMachine = machines.find(m => m.id === machineId);
    if (selectedMachine) {
      setFormData({
        ...formData,
        machine: machineId,
        ratePerHour: selectedMachine.owner_rate_per_hour || ''
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = {
        ...formData,
        totalAmount: formData.hours * formData.ratePerHour
      };

      if (editingJob) {
        await jobAPI.update(editingJob.id, submitData);
      } else {
        await jobAPI.create(submitData);
      }
      fetchJobs();
      handleCloseModal();
    } catch (error) {
      alert(error.response?.data?.error || 'Error saving job');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this job?')) {
      try {
        await jobAPI.delete(id);
        fetchJobs();
      } catch (error) {
        alert(error.response?.data?.error || 'Error deleting job');
      }
    }
  };

  const handleEdit = (job) => {
    setEditingJob(job);
    setFormData({
      farmer: job.farmer_id || '',
      machine: job.machine_id || '',
      workDate: job.scheduled_date?.split('T')[0] || job.work_date?.split('T')[0] || '',
      hours: job.hours || '',
      ratePerHour: job.rate_per_hour || '',
      advanceFromFarmer: job.advance_from_farmer || '',
      status: job.status || 'Completed',
      notes: job.notes || ''
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingJob(null);
    setFormData({
      farmer: '',
      machine: '',
      workDate: '',
      hours: '',
      ratePerHour: '',
      advanceFromFarmer: '',
      status: 'Completed',
      notes: ''
    });
  };

  // Get unique villages from farmers
  const uniqueVillages = [...new Set(farmers.map(f => f.village).filter(Boolean))];

  // Apply filters
  const filteredJobs = jobs.filter(job => {
    if (filterMachine && job.machine_id !== filterMachine) return false;
    if (filterFarmer && job.farmer_id !== filterFarmer) return false;
    if (filterStatus && job.status !== filterStatus) return false;
    
    // Filter by village through farmer
    if (filterVillage) {
      const jobFarmer = farmers.find(f => f.id === job.farmer_id);
      if (!jobFarmer || jobFarmer.village !== filterVillage) return false;
    }
    
    return true;
  });

  const clearFilters = () => {
    setFilterMachine('');
    setFilterFarmer('');
    setFilterVillage('');
    setFilterStatus('');
  };

  const hasActiveFilters = filterMachine || filterFarmer || filterVillage || filterStatus;

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div>
      {/* Page Header with Title and Buttons */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', padding: '10px 0' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600' }}>Harvesting Jobs</h2>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', position: 'relative' }}>
          <button 
            className="btn btn-success" 
            onClick={() => setShowModal(true)}
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
            <FaPlus /> Add Job
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
                  exportToCSV(formatDataForExport(filteredJobs, 'jobs'), 'harvesting_jobs');
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

      {/* Compact Total Hours Summary */}
      {filteredJobs.length > 0 && (() => {
        const totalMinutes = filteredJobs.reduce((sum, job) => {
          const hours = parseFloat(job.hours || 0);
          return sum + (hours * 60);
        }, 0);
        const hours = Math.floor(totalMinutes / 60);
        const minutes = Math.round(totalMinutes % 60);
        return (
          <div style={{ 
            padding: '14px 20px', 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
            color: 'white',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
            marginBottom: '16px',
            maxHeight: '90px'
          }}>
            <FaClock style={{ fontSize: '28px', opacity: 0.9 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '11px', opacity: 0.9, marginBottom: '2px', fontWeight: '500' }}>
                Total Working Hours
              </div>
              <div style={{ fontSize: '24px', fontWeight: 'bold', letterSpacing: '-0.5px', lineHeight: '1' }}>
                {hours}h {minutes}m
              </div>
            </div>
            <div style={{ fontSize: '11px', opacity: 0.9, textAlign: 'right' }}>
              {filteredJobs.length} job{filteredJobs.length !== 1 ? 's' : ''}
            </div>
          </div>
        );
      })()}

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
                Showing {filteredJobs.length} of {jobs.length} jobs
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
                    fontSize: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <FaTimes /> Clear All
                </button>
              )}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
              {/* Machine Filter */}
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', fontSize: '12px', fontWeight: '500', color: '#cbd5e1' }}>
                  <FaTractor style={{ color: '#667eea', fontSize: '12px' }} /> Machine
                </label>
                <select 
                  value={filterMachine}
                  onChange={(e) => setFilterMachine(e.target.value)}
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
                  <option value="">All Machines</option>
                  {machines.map((machine) => (
                    <option key={machine.id} value={machine.id}>
                      {machine.machine_type} - {machine.machine_number}
                    </option>
                  ))}
                </select>
              </div>

              {/* Farmer Filter */}
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', fontSize: '12px', fontWeight: '500', color: '#cbd5e1' }}>
                  <FaUserAlt style={{ color: '#28a745', fontSize: '12px' }} /> Farmer
                </label>
                <select 
                  value={filterFarmer}
                  onChange={(e) => setFilterFarmer(e.target.value)}
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
                  <option value="">All Farmers</option>
                  {farmers.map((farmer) => (
                    <option key={farmer.id} value={farmer.id}>
                      {farmer.name} - {farmer.village}
                    </option>
                  ))}
                </select>
              </div>

              {/* Village Filter */}
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', fontSize: '12px', fontWeight: '500', color: '#cbd5e1' }}>
                  <FaHome style={{ color: '#fd7e14', fontSize: '12px' }} /> Village
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

              {/* Status Filter */}
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', fontSize: '12px', fontWeight: '500', color: '#cbd5e1' }}>
                  📊 Status
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
                  <option value="">All Status</option>
                  <option value="Scheduled">Scheduled</option>
                  <option value="Completed">Completed</option>
                  <option value="Pending Payment">Pending Payment</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Card-Style Jobs List */}
      <div style={{ 
        background: 'rgba(30, 41, 59, 0.6)',
        borderRadius: '12px',
        overflow: 'hidden',
        border: '1px solid rgba(100, 116, 139, 0.3)'
      }}>
        <div style={{ padding: '16px', borderBottom: '1px solid rgba(100, 116, 139, 0.3)' }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#e2e8f0' }}>📋 Jobs List</h3>
        </div>
        <div style={{ padding: '12px' }}>
          {filteredJobs.length > 0 ? (
            filteredJobs.map((job) => {
              const totalAmount = (job.hours || 0) * (job.rate_per_hour || 0);
              const advanceFromFarmer = job.advance_from_farmer || 0;
              const netAmount = totalAmount - advanceFromFarmer;
              
              // Get status color
              const getStatusStyle = (status) => {
                const statusLower = status?.toLowerCase() || '';
                if (statusLower === 'completed') return { bg: '#d4edda', color: '#155724', border: '#c3e6cb' };
                if (statusLower === 'scheduled') return { bg: '#d1ecf1', color: '#0c5460', border: '#bee5eb' };
                if (statusLower.includes('pending')) return { bg: '#fff3cd', color: '#856404', border: '#ffeaa7' };
                return { bg: '#f8f9fa', color: '#495057', border: '#dee2e6' };
              };
              
              const statusStyle = getStatusStyle(job.status);
              
              return (
                <div 
                  key={job.id} 
                  style={{ 
                    background: 'rgba(51, 65, 85, 0.4)',
                    borderRadius: '10px',
                    padding: '16px',
                    marginBottom: '12px',
                    border: '1px solid rgba(100, 116, 139, 0.3)',
                    transition: 'all 0.2s',
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
                  {/* Date at top */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#94a3b8' }}>
                      <FaCalendarAlt style={{ fontSize: '11px' }} />
                      {new Date(job.scheduled_date || job.work_date).toLocaleDateString()}
                    </div>
                    <span style={{
                      padding: '4px 10px',
                      borderRadius: '12px',
                      fontSize: '11px',
                      fontWeight: '600',
                      backgroundColor: statusStyle.bg,
                      color: statusStyle.color,
                      border: `1px solid ${statusStyle.border}`
                    }}>
                      {job.status}
                    </span>
                  </div>

                  {/* Farmer and Machine in primary row */}
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <span style={{ 
                        width: '36px', 
                        height: '36px', 
                        borderRadius: '50%', 
                        background: 'linear-gradient(135deg, #34d399 0%, #10b981 100%)',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '14px',
                        fontWeight: 'bold'
                      }}>
                        {(job.farmers?.name || job.farmer?.name || 'N').charAt(0).toUpperCase()}
                      </span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '15px', fontWeight: '600', color: '#e2e8f0' }}>
                          {job.farmers?.name || job.farmer?.name || 'N/A'}
                        </div>
                        <div style={{ fontSize: '12px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <FaHome style={{ fontSize: '10px' }} />
                          {job.farmers?.village || job.farmer?.village || 'N/A'}
                        </div>
                      </div>
                    </div>
                    <div style={{ fontSize: '13px', color: '#cbd5e1', marginLeft: '44px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <FaTractor style={{ color: '#667eea', fontSize: '12px' }} />
                      {job.machines?.machine_type || job.machine?.machine_type || 'N/A'} - {job.machines?.machine_number || job.machine?.machine_number || 'N/A'}
                    </div>
                  </div>

                  {/* Financial grid - 2x2 layout */}
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: '1fr 1fr', 
                    gap: '8px',
                    marginBottom: '12px',
                    padding: '10px',
                    background: 'rgba(15, 23, 42, 0.4)',
                    borderRadius: '8px'
                  }}>
                    <div>
                      <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '2px' }}>Duration</div>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: '#e2e8f0' }}>
                        <FaClock style={{ fontSize: '10px', marginRight: '4px', opacity: 0.7 }} />
                        {(() => {
                          const totalMinutes = Math.round((job.hours || 0) * 60);
                          const hours = Math.floor(totalMinutes / 60);
                          const minutes = totalMinutes % 60;
                          return `${hours}h ${minutes}m`;
                        })()}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '2px' }}>Rate/Hour</div>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: '#e2e8f0' }}>
                        ₹{(job.rate_per_hour || 0).toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '2px' }}>Total</div>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: '#10b981' }}>
                        ₹{totalAmount.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '2px' }}>Net Amount</div>
                      <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#34d399' }}>
                        ₹{netAmount.toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                    <button
                      onClick={() => handleEdit(job)}
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
                        minHeight: '40px'
                      }}
                    >
                      <FaEdit /> Edit
                    </button>
                    <button
                      onClick={() => handleDelete(job.id)}
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
                        minHeight: '40px'
                      }}
                    >
                      <FaTrash /> Delete
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>
              {hasActiveFilters ? '🔍 No jobs match the selected filters.' : '📋 No jobs found. Add your first harvesting job!'}
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>{editingJob ? 'Edit Job' : 'Add Harvesting Job'}</h2>
            <form onSubmit={handleSubmit}>
                <div className="form-row">
                  <div className="form-group">
                    <label>Farmer (Field Owner) <span className="required-star">*</span></label>
                    <select
                      value={formData.farmer}
                      onChange={(e) => setFormData({ ...formData, farmer: e.target.value })}
                      required
                    >
                      <option value="">Select Farmer</option>
                      {farmers.map((farmer) => (
                        <option key={farmer.id} value={farmer.id}>
                          {farmer.name} - {farmer.village}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Machine <span className="required-star">*</span></label>
                    <select
                      value={formData.machine}
                      onChange={(e) => handleMachineChange(e.target.value)}
                      required
                    >
                      <option value="">Select Machine</option>
                      {machines.map((machine) => (
                        <option key={machine.id} value={machine.id}>
                          {machine.driver_name} + {machine.machine_owners?.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Work Date <span className="required-star">*</span></label>
                    <input
                      type="date"
                      value={formData.workDate}
                      onChange={(e) => setFormData({ ...formData, workDate: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Hours Worked *</label>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <div style={{ flex: 1 }}>
                        <input
                          type="number"
                          min="0"
                          max="24"
                          value={Math.floor(formData.hours || 0)}
                          onChange={(e) => {
                            const hours = parseInt(e.target.value) || 0;
                            const minutes = (formData.hours % 1) * 60;
                            setFormData({ ...formData, hours: hours + (minutes / 60) });
                          }}
                          onFocus={(e) => e.target.value === '0' && (e.target.value = '')}
                          onBlur={(e) => !e.target.value && (e.target.value = '0')}
                          placeholder="0"
                          required
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
                          value={Math.round(((formData.hours || 0) % 1) * 60)}
                          onChange={(e) => {
                            const hours = Math.floor(formData.hours || 0);
                            const minutes = parseInt(e.target.value) || 0;
                            setFormData({ ...formData, hours: hours + (minutes / 60) });
                          }}
                          onFocus={(e) => e.target.value === '0' && (e.target.value = '')}
                          onBlur={(e) => !e.target.value && (e.target.value = '0')}
                          placeholder="0"
                          style={{ textAlign: 'center' }}
                        />
                        <small style={{ display: 'block', textAlign: 'center', marginTop: '4px', color: 'var(--text-secondary)' }}>Minutes</small>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Farmer Rate Per Hour (₹) *</label>
                    <input
                      type="number"
                      value={formData.ratePerHour}
                      onChange={(e) => setFormData({ ...formData, ratePerHour: e.target.value })}
                      required
                      step="100"
                      placeholder="Rate charged to farmer"
                    />
                    <small style={{ color: '#6b7280', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                      Amount charged to farmer per hour (your revenue)
                    </small>
                  </div>
                  <div className="form-group">
                    <label>Advance from Farmer (₹)</label>
                    <input
                      type="number"
                      value={formData.advanceFromFarmer || ''}
                      onChange={(e) => setFormData({ ...formData, advanceFromFarmer: e.target.value })}
                      placeholder="Advance received from farmer"
                      min="0"
                      step="0.01"
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
                      <option value="Completed">Completed</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Scheduled">Scheduled</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>
                {formData.hours && formData.ratePerHour && (
                  <div style={{ padding: '12px', backgroundColor: '#f1f5f9', borderRadius: '8px', marginBottom: '16px' }}>
                    <div style={{ fontWeight: 'bold', color: '#10b981', fontSize: '16px' }}>
                      Total Amount: ₹{(formData.hours * formData.ratePerHour).toLocaleString()}
                    </div>
                  </div>
                )}
                <div className="form-group">
                  <label>Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Additional notes..."
                  />
                </div>

              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={handleCloseModal}>Cancel</button>
                <button type="submit" className="btn-primary">
                  {editingJob ? 'Update Job' : 'Add Job'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Jobs;
