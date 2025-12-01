import React, { useState, useEffect } from 'react';
import { jobAPI, farmerAPI, machineAPI } from '../api';
import { FaPlus } from 'react-icons/fa';
import ActionsCell from '../components/ActionsCell';
import FilterBar from '../components/FilterBar';

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
  };

  const hasActiveFilters = filterMachine || filterFarmer || filterVillage;

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div>
      <div className="page-header">
        <h2>Harvesting Jobs</h2>
        <p>Manage and track harvesting assignments</p>
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
                label: `${machine.machine_type} - ${machine.machine_number}`
              }))
            ]
          },
          {
            type: 'select',
            label: 'Farmer',
            value: filterFarmer,
            onChange: (e) => setFilterFarmer(e.target.value),
            options: [
              { value: '', label: 'All Farmers' },
              ...farmers.map((farmer) => ({
                value: farmer.id,
                label: `${farmer.name} - ${farmer.village}`
              }))
            ]
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
          }
        ]}
        onClear={clearFilters}
        hasActiveFilters={hasActiveFilters}
        resultsText={`Showing ${filteredJobs.length} of ${jobs.length} jobs`}
      />

      <div className="table-container">
        <div className="table-header">
          <h3>Harvesting Records</h3>
          <button className="btn btn-success" onClick={() => setShowModal(true)}>
            <FaPlus /> Add Job
          </button>
        </div>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Farmer</th>
              <th>Machine</th>
              <th>Driver</th>
              <th>Hours</th>
              <th>Rate/Hour</th>
              <th>Total</th>
              <th>Advance</th>
              <th>Net Amount</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredJobs.length > 0 ? (
              filteredJobs.map((job) => {
                const totalAmount = (job.hours || 0) * (job.rate_per_hour || 0);
                const advanceFromFarmer = job.advance_from_farmer || 0;
                const netAmount = totalAmount - advanceFromFarmer;
                return (
                <tr key={job.id}>
                  <td>{new Date(job.scheduled_date || job.work_date).toLocaleDateString()}</td>
                  <td>{job.farmers?.name || job.farmer?.name || 'N/A'}</td>
                  <td>{job.machines?.machine_type || job.machine?.machine_type || 'N/A'} - {job.machines?.machine_number || job.machine?.machine_number || 'N/A'}</td>
                  <td>{job.machines?.driver_name || job.machine?.driver_name || 'N/A'}</td>
                  <td>{job.hours || 0}</td>
                  <td>₹{job.rate_per_hour || 0}</td>
                  <td>₹{totalAmount.toLocaleString()}</td>
                  <td style={{ color: advanceFromFarmer > 0 ? '#ef4444' : 'inherit' }}>
                    {advanceFromFarmer > 0 ? `-₹${advanceFromFarmer.toLocaleString()}` : '-'}
                  </td>
                  <td style={{ fontWeight: 'bold', color: '#10b981' }}>₹{netAmount.toLocaleString()}</td>
                  <td>
                    <span className={`status-badge ${job.status.toLowerCase().replace(' ', '-')}`}>
                      {job.status}
                    </span>
                  </td>
                  <td>
                    <ActionsCell
                      onEdit={() => handleEdit(job)}
                      onDelete={() => handleDelete(job.id)}
                    />
                  </td>
                </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="11" style={{ textAlign: 'center', padding: '40px' }}>
                  {hasActiveFilters ? 'No jobs match the selected filters.' : 'No jobs found. Add your first harvesting job!'}
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
