import React, { useState, useEffect } from 'react';
import { jobAPI } from '../api';
import { FaPercent, FaPlus, FaFileExport } from 'react-icons/fa';
import ActionsCell from '../components/ActionsCell';
import { exportToCSV, formatDataForExport } from '../utils/exportUtils';

const Discounts = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [formData, setFormData] = useState({
    discountType: '', // 'owner' or 'farmer'
    machineId: '',
    jobId: '',
    discountFromOwner: '',
    discountToFarmer: ''
  });

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      console.log('Fetching jobs for discount page...');
      const response = await jobAPI.getAll();
      console.log('Jobs fetched:', response.data?.length || 0, 'jobs');
      if (response.data?.length > 0) {
        console.log('First job sample:', response.data[0]);
        console.log('Machine data:', response.data[0].machines);
        console.log('Machine name:', response.data[0].machines?.name);
      }
      setJobs(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      console.error('Error details:', error.response?.data || error.message);
      alert(`Error loading jobs: ${error.response?.data?.error || error.message}`);
      setLoading(false);
    }
  };

  const handleEdit = (job) => {
    setEditingJob(job);
    const hasOwnerDiscount = parseFloat(job.discount_from_owner) > 0;
    const hasFarmerDiscount = parseFloat(job.discount_to_farmer) > 0;
    
    setFormData({
      discountType: hasOwnerDiscount ? 'owner' : hasFarmerDiscount ? 'farmer' : '',
      machineId: job.machine_id || '',
      jobId: job.id,
      discountFromOwner: job.discount_from_owner || '',
      discountToFarmer: job.discount_to_farmer || ''
    });
    setShowModal(true);
  };

  const handleAddNew = () => {
    setEditingJob(null);
    setFormData({
      discountType: '',
      machineId: '',
      jobId: '',
      discountFromOwner: '',
      discountToFarmer: ''
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!editingJob && !formData.discountType) {
        alert('Please select discount type');
        return;
      }

      if (formData.discountType === 'farmer' || (editingJob && formData.jobId)) {
        const jobId = editingJob ? editingJob.id : formData.jobId;
        
        if (!jobId) {
          alert('Please select a job');
          return;
        }

        const updateData = {};
        if (formData.discountType === 'owner' || editingJob) {
          updateData.discountFromOwner = parseFloat(formData.discountFromOwner) || 0;
        }
        if (formData.discountType === 'farmer' || editingJob) {
          updateData.discountToFarmer = parseFloat(formData.discountToFarmer) || 0;
        }

        console.log('Updating job', jobId, 'with data:', updateData);
        const response = await jobAPI.update(jobId, updateData);
        console.log('Update response:', response);
      } else if (formData.discountType === 'owner') {
        // For owner discount, we need to find jobs by machine and update them
        if (!formData.machineId) {
          alert('Please select a machine');
          return;
        }
        
        console.log('Looking for jobs with machine_id:', formData.machineId);
        console.log('All jobs:', jobs.map(j => ({ id: j.id, machine_id: j.machine_id, machine_name: j.machines?.name })));
        
        // Compare as strings since machine_id could be UUID
        const machineJobs = jobs.filter(job => String(job.machine_id) === String(formData.machineId));
        
        console.log(`Found ${machineJobs.length} jobs for machine ${formData.machineId}`);
        
        if (machineJobs.length === 0) {
          alert(`No jobs found for this machine. Available jobs: ${jobs.length}`);
          return;
        }
        
        console.log(`Updating ${machineJobs.length} jobs for machine ${formData.machineId}`);
        
        // Update all jobs for this machine with owner discount
        for (const job of machineJobs) {
          const updateData = { discountFromOwner: parseFloat(formData.discountFromOwner) || 0 };
          console.log('Updating job', job.id, 'with data:', updateData);
          await jobAPI.update(job.id, updateData);
        }
      }
      
      alert('Discounts updated successfully!');
      fetchJobs();
      handleCloseModal();
    } catch (error) {
      console.error('Error updating discounts:', error);
      console.error('Error details:', error.response?.data || error.message);
      alert(`Error updating discounts: ${error.response?.data?.error || error.message}`);
    }
  };

  const handleDelete = async (jobId) => {
    if (!window.confirm('Remove all discounts for this job?')) return;
    
    try {
      console.log('Removing discounts for job', jobId);
      const response = await jobAPI.update(jobId, {
        discountFromOwner: 0,
        discountToFarmer: 0
      });
      console.log('Delete response:', response);
      alert('Discounts removed successfully!');
      fetchJobs();
    } catch (error) {
      console.error('Error removing discount:', error);
      console.error('Error details:', error.response?.data || error.message);
      alert(`Error removing discount: ${error.response?.data?.error || error.message}`);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingJob(null);
    setFormData({
      discountType: '',
      machineId: '',
      jobId: '',
      discountFromOwner: '',
      discountToFarmer: ''
    });
  };

  // Calculate totals
  const totalDiscountFromOwner = jobs.reduce((sum, job) => sum + (parseFloat(job.discount_from_owner) || 0), 0);
  const totalDiscountToFarmer = jobs.reduce((sum, job) => sum + (parseFloat(job.discount_to_farmer) || 0), 0);
  const netDiscountImpact = totalDiscountFromOwner - totalDiscountToFarmer;

  if (loading) {
    return <div className="loading">Loading discounts...</div>;
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1><FaPercent /> Discount Management</h1>
          <p>Manage discounts from owners and to farmers</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-secondary" onClick={() => exportToCSV(formatDataForExport(jobs, 'discounts'), 'discounts')}>
            <FaFileExport /> Export
          </button>
          <button className="btn btn-primary" onClick={handleAddNew}>
            <FaPlus style={{ marginRight: '8px' }} />
            Add Discount
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', marginBottom: '20px' }}>
        <div className="stat-card" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
          <div className="stat-icon">💰</div>
          <div className="stat-details">
            <div className="stat-label">Discount from Owners</div>
            <div className="stat-value">₹{totalDiscountFromOwner.toFixed(2)}</div>
            <small style={{ opacity: 0.9 }}>Reduces what you pay</small>
          </div>
        </div>

        <div className="stat-card" style={{ background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' }}>
          <div className="stat-icon">💸</div>
          <div className="stat-details">
            <div className="stat-label">Discount to Farmers</div>
            <div className="stat-value">₹{totalDiscountToFarmer.toFixed(2)}</div>
            <small style={{ opacity: 0.9 }}>Reduces what you collect</small>
          </div>
        </div>

        <div className="stat-card" style={{ background: `linear-gradient(135deg, ${netDiscountImpact >= 0 ? '#3b82f6' : '#f59e0b'} 0%, ${netDiscountImpact >= 0 ? '#2563eb' : '#d97706'} 100%)` }}>
          <div className="stat-icon">{netDiscountImpact >= 0 ? '📈' : '📉'}</div>
          <div className="stat-details">
            <div className="stat-label">Net Impact</div>
            <div className="stat-value">₹{Math.abs(netDiscountImpact).toFixed(2)}</div>
            <small style={{ opacity: 0.9 }}>{netDiscountImpact >= 0 ? 'Benefit' : 'Cost'}</small>
          </div>
        </div>
      </div>

      {/* Jobs with Discounts Table */}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Job ID</th>
              <th>Farmer</th>
              <th>Machine</th>
              <th>Date</th>
              <th>Discount To</th>
              <th>Discount Amount</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {jobs.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '40px' }}>
                  <div style={{ opacity: 0.5 }}>
                    <FaPercent size={48} style={{ marginBottom: '10px' }} />
                    <p>No jobs found</p>
                  </div>
                </td>
              </tr>
            ) : (
              jobs.map((job, index) => {
                const discountFromOwner = parseFloat(job.discount_from_owner) || 0;
                const discountToFarmer = parseFloat(job.discount_to_farmer) || 0;
                const hasDiscount = discountFromOwner > 0 || discountToFarmer > 0;
                
                // Determine discount type and amount
                let discountType = '-';
                let discountAmount = 0;
                let discountColor = 'inherit';
                
                if (discountFromOwner > 0 && discountToFarmer > 0) {
                  discountType = 'Both';
                  discountAmount = `Owner: ₹${discountFromOwner.toFixed(2)}, Farmer: ₹${discountToFarmer.toFixed(2)}`;
                  discountColor = '#3b82f6';
                } else if (discountFromOwner > 0) {
                  discountType = 'Owner';
                  discountAmount = discountFromOwner;
                  discountColor = '#10b981';
                } else if (discountToFarmer > 0) {
                  discountType = 'Farmer';
                  discountAmount = discountToFarmer;
                  discountColor = '#ef4444';
                }

                return (
                  <tr key={job.id} style={{ opacity: hasDiscount ? 1 : 0.5 }}>
                    <td>#{index + 1}</td>
                    <td>{job.farmers?.name || 'N/A'}</td>
                    <td>{job.machines?.driver_name || 'N/A'} - {job.machines?.machine_owners?.name || 'N/A'}</td>
                    <td>{new Date(job.work_date || job.scheduled_date).toLocaleDateString()}</td>
                    <td>
                      <span style={{ 
                        color: discountColor,
                        fontWeight: hasDiscount ? '600' : 'normal',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        backgroundColor: hasDiscount ? `${discountColor}15` : 'transparent'
                      }}>
                        {discountType}
                      </span>
                    </td>
                    <td style={{ color: discountColor, fontWeight: hasDiscount ? '600' : 'normal' }}>
                      {typeof discountAmount === 'number' ? `₹${discountAmount.toFixed(2)}` : discountAmount}
                    </td>
                    <td>
                      <ActionsCell
                        onEdit={() => handleEdit(job)}
                        onDelete={() => handleDelete(job.id)}
                        deleteTitle="Remove all discounts"
                      />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Discount Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingJob ? `Edit Discount - ${editingJob.farmers?.name || 'Job'}` : 'Add Discount'}</h2>
              <button className="close-btn" onClick={handleCloseModal}>×</button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {!editingJob && (
                  <>
                    <div className="form-group">
                      <label>Discount Type *</label>
                      <select
                        value={formData.discountType}
                        onChange={(e) => setFormData({ ...formData, discountType: e.target.value, machineId: '', jobId: '' })}
                        required
                      >
                        <option value="">-- Select Discount Type --</option>
                        <option value="owner">From Owner (on machine payments)</option>
                        <option value="farmer">To Farmer (on specific job)</option>
                      </select>
                    </div>

                    {formData.discountType === 'owner' && (
                      <>
                        <div className="form-group">
                          <label>Select Machine *</label>
                          <select
                            value={formData.machineId}
                            onChange={(e) => setFormData({ ...formData, machineId: e.target.value })}
                            required
                          >
                            <option value="">-- Select a Machine --</option>
                            {[...new Map(jobs.map(job => [job.machine_id, job])).values()].map(job => (
                              <option key={job.machine_id} value={job.machine_id}>
                                {job.machines?.driver_name || 'N/A'} - {job.machines?.machine_owners?.name || 'N/A'}
                              </option>
                            ))}
                          </select>
                          <small style={{ color: 'var(--text-secondary)', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                            This will apply discount to all jobs using this machine
                          </small>
                        </div>

                        <div className="form-group">
                          <label>Discount Amount (₹) *</label>
                          <input
                            type="number"
                            value={formData.discountFromOwner}
                            onChange={(e) => setFormData({ ...formData, discountFromOwner: e.target.value })}
                            placeholder="0"
                            min="0"
                            step="0.01"
                            required
                          />
                          <small style={{ color: '#10b981', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                            ✓ Reduces what you pay to the machine owner
                          </small>
                        </div>
                      </>
                    )}

                    {formData.discountType === 'farmer' && (
                      <>
                        <div className="form-group">
                          <label>Select Job *</label>
                          <select
                            value={formData.jobId}
                            onChange={(e) => setFormData({ ...formData, jobId: e.target.value })}
                            required
                          >
                            <option value="">-- Select a Job --</option>
                            {jobs.map((job, idx) => (
                              <option key={job.id} value={job.id}>
                                {job.farmers?.name || 'N/A'} ({job.farmers?.village || 'N/A'}) - Driver: {job.machines?.driver_name || 'N/A'} - Owner: {job.machines?.machine_owners?.name || 'N/A'} - {new Date(job.work_date || job.scheduled_date).toLocaleDateString()}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="form-group">
                          <label>Discount Amount (₹) *</label>
                          <input
                            type="number"
                            value={formData.discountToFarmer}
                            onChange={(e) => setFormData({ ...formData, discountToFarmer: e.target.value })}
                            placeholder="0"
                            min="0"
                            step="0.01"
                            required
                          />
                          <small style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                            ✓ Reduces what farmer pays to you for this job
                          </small>
                        </div>
                      </>
                    )}
                  </>
                )}

                {editingJob && (
                  <>
                    <div style={{ marginBottom: '20px', padding: '15px', background: 'var(--card-bg)', borderRadius: '8px' }}>
                      <div style={{ marginBottom: '8px' }}>
                        <strong>Farmer:</strong> {editingJob?.farmers?.name || 'N/A'}
                      </div>
                      <div style={{ marginBottom: '8px' }}>
                        <strong>Machine:</strong> {editingJob?.machines?.name || 'N/A'}
                      </div>
                      <div style={{ marginBottom: '8px' }}>
                        <strong>Date:</strong> {new Date(editingJob?.work_date || editingJob?.scheduled_date).toLocaleDateString()}
                      </div>
                      <div>
                        <strong>Total Amount:</strong> ₹{parseFloat(editingJob?.total_amount || 0).toFixed(2)}
                      </div>
                    </div>

                    <div className="form-section-header" style={{ marginBottom: '15px' }}>
                      <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--primary)' }}>💰 Discount Management</h3>
                      <small style={{ color: 'var(--text-secondary)' }}>Optional discounts to adjust billing amounts</small>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label>Discount from Owner (₹)</label>
                        <input
                          type="number"
                          value={formData.discountFromOwner}
                          onChange={(e) => setFormData({ ...formData, discountFromOwner: e.target.value })}
                          placeholder="0"
                          min="0"
                          step="0.01"
                        />
                        <small style={{ color: '#10b981', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                          ✓ Reduces what you pay to the machine owner
                        </small>
                      </div>
                      <div className="form-group">
                        <label>Discount to Farmer (₹)</label>
                        <input
                          type="number"
                          value={formData.discountToFarmer}
                          onChange={(e) => setFormData({ ...formData, discountToFarmer: e.target.value })}
                          placeholder="0"
                          min="0"
                          step="0.01"
                        />
                        <small style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                          ✓ Reduces what farmer pays to you
                        </small>
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingJob ? 'Update Discounts' : 'Add Discounts'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Discounts;
