import React, { useState, useEffect } from 'react';
import { jobAPI, farmerAPI, machineAPI } from '../api';
import { FaPlus, FaFileExport, FaTimes, FaTractor, FaUserAlt, FaHome, FaClock, FaEdit, FaTrash, FaCalendarAlt } from 'react-icons/fa';
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
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
        <div>
          <h2>Harvesting Jobs</h2>
          <p>Manage and track harvesting assignments</p>
        </div>
        
        {/* Total Hours Summary - Top Right */}
        {filteredJobs.length > 0 && (() => {
          const totalMinutes = filteredJobs.reduce((sum, job) => {
            const hours = parseFloat(job.hours || 0);
            return sum + (hours * 60);
          }, 0);
          const hours = Math.floor(totalMinutes / 60);
          const minutes = Math.round(totalMinutes % 60);
          return (
            <div style={{ 
              padding: '20px 28px', 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
              color: 'white',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              boxShadow: '0 8px 24px rgba(102, 126, 234, 0.4)',
              minWidth: '240px',
              transition: 'all 0.3s ease',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 12px 32px rgba(102, 126, 234, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(102, 126, 234, 0.4)';
            }}
            >
              <FaClock style={{ fontSize: '36px', opacity: 0.9 }} />
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '13px', opacity: 0.9, marginBottom: '4px', fontWeight: '500', letterSpacing: '0.5px' }}>
                  Total Working Hours
                </div>
                <div style={{ fontSize: '32px', fontWeight: 'bold', letterSpacing: '-1px', lineHeight: '1' }}>
                  {hours}h {minutes}m
                </div>
                <div style={{ fontSize: '12px', opacity: 0.95, marginTop: '6px', fontWeight: '500' }}>
                  From {filteredJobs.length} job{filteredJobs.length !== 1 ? 's' : ''}
                </div>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Filter Section with Icons */}
      <div style={{ 
        background: 'rgba(30, 41, 59, 0.6)', 
        padding: '20px', 
        borderRadius: '12px', 
        marginBottom: '30px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
        border: '1px solid rgba(100, 116, 139, 0.2)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '15px' }}>
          <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#e2e8f0' }}>
            🔍 Filter Jobs
          </h4>
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
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => e.target.style.background = '#c82333'}
              onMouseOut={(e) => e.target.style.background = '#dc3545'}
            >
              <FaTimes /> Reset Filters
            </button>
          )}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
          {/* Machine Filter */}
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: '#cbd5e1' }}>
              <FaTractor style={{ color: '#667eea' }} /> Machine
            </label>
            <select 
              value={filterMachine}
              onChange={(e) => setFilterMachine(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid rgba(100, 116, 139, 0.3)',
                background: 'rgba(15, 23, 42, 0.6)',
                color: '#e2e8f0',
                fontSize: '14px',
                transition: 'all 0.2s',
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
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: '#cbd5e1' }}>
              <FaUserAlt style={{ color: '#28a745' }} /> Farmer
            </label>
            <select 
              value={filterFarmer}
              onChange={(e) => setFilterFarmer(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid rgba(100, 116, 139, 0.3)',
                background: 'rgba(15, 23, 42, 0.6)',
                color: '#e2e8f0',
                fontSize: '14px',
                transition: 'all 0.2s',
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
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: '#cbd5e1' }}>
              <FaHome style={{ color: '#fd7e14' }} /> Village
            </label>
            <select 
              value={filterVillage}
              onChange={(e) => setFilterVillage(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid rgba(100, 116, 139, 0.3)',
                background: 'rgba(15, 23, 42, 0.6)',
                color: '#e2e8f0',
                fontSize: '14px',
                transition: 'all 0.2s',
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
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: '#cbd5e1' }}>
              <span style={{ fontSize: '16px' }}>📊</span> Status
            </label>
            <select 
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid rgba(100, 116, 139, 0.3)',
                background: 'rgba(15, 23, 42, 0.6)',
                color: '#e2e8f0',
                fontSize: '14px',
                transition: 'all 0.2s',
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
        <div style={{ marginTop: '12px', fontSize: '14px', color: '#94a3b8' }}>
          Showing {filteredJobs.length} of {jobs.length} jobs
        </div>
      </div>

      <div className="table-container" style={{ 
        marginTop: '30px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
        borderRadius: '12px',
        overflow: 'hidden',
        background: 'rgba(30, 41, 59, 0.6)',
        border: '1px solid rgba(100, 116, 139, 0.2)'
      }}>
        <div className="table-header" style={{ padding: '20px', borderBottom: '1px solid rgba(100, 116, 139, 0.3)' }}>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#e2e8f0' }}>📋 Harvesting Records</h3>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              className="btn btn-secondary" 
              onClick={() => exportToCSV(formatDataForExport(filteredJobs, 'jobs'), 'harvesting_jobs')}
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
              <FaPlus /> Add Job
            </button>
          </div>
        </div>
        <table style={{ width: '100%' }}>
          <thead>
            <tr>
              <th style={{ padding: '14px 16px', textAlign: 'left' }}>
                <FaCalendarAlt style={{ marginRight: '6px', fontSize: '12px', opacity: 0.7 }} />
                Date
              </th>
              <th style={{ padding: '14px 16px', textAlign: 'left' }}>Farmer</th>
              <th style={{ padding: '14px 16px', textAlign: 'left' }}>Machine</th>
              <th style={{ padding: '14px 16px', textAlign: 'left' }}>Driver</th>
              <th style={{ padding: '14px 16px', textAlign: 'right' }}>
                <FaClock style={{ marginRight: '6px', fontSize: '12px', opacity: 0.7 }} />
                Hours
              </th>
              <th style={{ padding: '14px 16px', textAlign: 'right' }}>Rate/Hour</th>
              <th style={{ padding: '14px 16px', textAlign: 'right' }}>Total</th>
              <th style={{ padding: '14px 16px', textAlign: 'right' }}>Advance</th>
              <th style={{ padding: '14px 16px', textAlign: 'right' }}>Net Amount</th>
              <th style={{ padding: '14px 16px', textAlign: 'center' }}>Status</th>
              <th style={{ padding: '14px 16px', textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
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
                <tr key={job.id} style={{ 
                  transition: 'background-color 0.2s',
                  cursor: 'pointer',
                  borderBottom: '1px solid rgba(100, 116, 139, 0.2)'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(102, 126, 234, 0.1)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <FaCalendarAlt style={{ fontSize: '12px', color: '#6c757d' }} />
                      {new Date(job.scheduled_date || job.work_date).toLocaleDateString()}
                    </div>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ 
                        width: '32px', 
                        height: '32px', 
                        borderRadius: '50%', 
                        background: '#28a745',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                        fontWeight: 'bold'
                      }}>
                        {(job.farmers?.name || job.farmer?.name || 'N').charAt(0).toUpperCase()}
                      </span>
                      <span>{job.farmers?.name || job.farmer?.name || 'N/A'}</span>
                    </div>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <FaTractor style={{ fontSize: '14px', color: '#667eea' }} />
                      <span>{job.machines?.machine_type || job.machine?.machine_type || 'N/A'} - {job.machines?.machine_number || job.machine?.machine_number || 'N/A'}</span>
                    </div>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ 
                        width: '28px', 
                        height: '28px', 
                        borderRadius: '50%', 
                        background: '#667eea',
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '11px',
                        fontWeight: 'bold'
                      }}>
                        {(job.machines?.driver_name || job.machine?.driver_name || 'D').charAt(0).toUpperCase()}
                      </span>
                      <span>{job.machines?.driver_name || job.machine?.driver_name || 'N/A'}</span>
                    </div>
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: '500' }}>{job.hours || 0}h</td>
                  <td style={{ padding: '14px 16px', textAlign: 'right' }}>{(job.rate_per_hour || 0).toLocaleString()}</td>
                  <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: '600' }}>{totalAmount.toLocaleString()}</td>
                  <td style={{ padding: '14px 16px', textAlign: 'right', color: advanceFromFarmer > 0 ? '#dc3545' : '#6c757d' }}>
                    {advanceFromFarmer > 0 ? advanceFromFarmer.toLocaleString() : '-'}
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 'bold', color: '#28a745', fontSize: '15px' }}>
                    {netAmount.toLocaleString()}
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                    <span style={{
                      padding: '6px 12px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: '600',
                      backgroundColor: statusStyle.bg,
                      color: statusStyle.color,
                      border: `1px solid ${statusStyle.border}`,
                      display: 'inline-block'
                    }}>
                      {job.status}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      <button
                        onClick={() => handleEdit(job)}
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
                        title="Edit Job"
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => handleDelete(job.id)}
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
                        title="Delete Job"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </td>
                </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="11" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8', fontSize: '14px' }}>
                  {hasActiveFilters ? '🔍 No jobs match the selected filters.' : '📋 No jobs found. Add your first harvesting job!'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
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
