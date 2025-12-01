import React, { useState, useEffect } from 'react';
import { jobAPI } from '../api';
import { FaPercent, FaPlus, FaFileExport, FaEllipsisV, FaEdit, FaTrash, FaTractor, FaUser } from 'react-icons/fa';
import ActionsCell from '../components/ActionsCell';
import { exportToCSV, formatDataForExport } from '../utils/exportUtils';

const Discounts = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [showOverflowMenu, setShowOverflowMenu] = useState(false);
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
      {/* Page Header with Actions */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', padding: '10px 0' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FaPercent /> Discount Management
          </h2>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', position: 'relative' }}>
          <button 
            className="btn btn-success" 
            onClick={handleAddNew}
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
            <FaPlus /> Add Discount
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
                  exportToCSV(formatDataForExport(jobs, 'discounts'), 'discounts');
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

      {/* Horizontal Stats Bar */}
      <div style={{ 
        display: 'flex', 
        gap: '12px', 
        marginBottom: '16px', 
        overflowX: 'auto',
        paddingBottom: '4px'
      }} className="hide-scrollbar">
        <div style={{ 
          minWidth: '150px',
          padding: '14px 18px', 
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', 
          color: 'white',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
        }}>
          <div style={{ fontSize: '11px', opacity: 0.9, marginBottom: '4px' }}>From Owners 💰</div>
          <div style={{ fontSize: '20px', fontWeight: 'bold', letterSpacing: '-0.5px' }}>
            ₹{(totalDiscountFromOwner/1000).toFixed(1)}k
          </div>
          <div style={{ fontSize: '10px', opacity: 0.8, marginTop: '2px' }}>Reduces what you pay</div>
        </div>
        <div style={{ 
          minWidth: '150px',
          padding: '14px 18px', 
          background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', 
          color: 'white',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
        }}>
          <div style={{ fontSize: '11px', opacity: 0.9, marginBottom: '4px' }}>To Farmers 💸</div>
          <div style={{ fontSize: '20px', fontWeight: 'bold', letterSpacing: '-0.5px' }}>
            ₹{(totalDiscountToFarmer/1000).toFixed(1)}k
          </div>
          <div style={{ fontSize: '10px', opacity: 0.8, marginTop: '2px' }}>Reduces what you collect</div>
        </div>
        <div style={{ 
          minWidth: '130px',
          padding: '14px 18px', 
          background: `linear-gradient(135deg, ${netDiscountImpact >= 0 ? '#3b82f6' : '#f59e0b'} 0%, ${netDiscountImpact >= 0 ? '#2563eb' : '#d97706'} 100%)`, 
          color: 'white',
          borderRadius: '12px',
          boxShadow: `0 4px 12px ${netDiscountImpact >= 0 ? 'rgba(59, 130, 246, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`
        }}>
          <div style={{ fontSize: '11px', opacity: 0.9, marginBottom: '4px' }}>Net Impact {netDiscountImpact >= 0 ? '📈' : '📉'}</div>
          <div style={{ fontSize: '20px', fontWeight: 'bold', letterSpacing: '-0.5px' }}>
            ₹{(Math.abs(netDiscountImpact)/1000).toFixed(1)}k
          </div>
          <div style={{ fontSize: '10px', opacity: 0.8, marginTop: '2px' }}>{netDiscountImpact >= 0 ? 'Benefit' : 'Cost'}</div>
        </div>
      </div>

      {/* Jobs List - Card Layout */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {jobs.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '48px 20px',
            background: 'rgba(51, 65, 85, 0.4)',
            borderRadius: '12px',
            border: '1px solid rgba(100, 116, 139, 0.3)'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>
              <FaPercent />
            </div>
            <div style={{ fontSize: '16px', color: '#cbd5e1', fontWeight: '500' }}>
              No jobs found
            </div>
            <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '6px' }}>
              Add discounts to jobs to track them here
            </div>
          </div>
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
              <div 
                key={job.id}
                style={{
                  background: hasDiscount ? 'rgba(51, 65, 85, 0.4)' : 'rgba(51, 65, 85, 0.2)',
                  border: '1px solid rgba(100, 116, 139, 0.3)',
                  borderRadius: '12px',
                  padding: '14px',
                  transition: 'all 0.2s ease',
                  cursor: 'pointer',
                  opacity: hasDiscount ? 1 : 0.6
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(102, 126, 234, 0.15)';
                  e.currentTarget.style.transform = 'translateX(4px)';
                  e.currentTarget.style.opacity = 1;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = hasDiscount ? 'rgba(51, 65, 85, 0.4)' : 'rgba(51, 65, 85, 0.2)';
                  e.currentTarget.style.transform = 'translateX(0)';
                  e.currentTarget.style.opacity = hasDiscount ? 1 : 0.6;
                }}
              >
                {/* Header: Job ID and Discount Type */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                  <div style={{ fontSize: '14px', color: '#94a3b8' }}>
                    Job #{index + 1}
                  </div>
                  <span style={{ 
                    color: discountColor,
                    fontWeight: hasDiscount ? '600' : 'normal',
                    padding: '4px 10px',
                    borderRadius: '12px',
                    fontSize: '11px',
                    backgroundColor: hasDiscount ? `${discountColor}15` : 'transparent',
                    border: hasDiscount ? `1px solid ${discountColor}40` : 'none'
                  }}>
                    {discountType}
                  </span>
                </div>

                {/* Farmer and Machine Info */}
                <div style={{ marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <FaUser style={{ fontSize: '12px', color: '#94a3b8' }} />
                    <span style={{ fontSize: '14px', color: '#e2e8f0', fontWeight: '500' }}>
                      {job.farmers?.name || 'N/A'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingLeft: '20px' }}>
                    <FaTractor style={{ fontSize: '11px', color: '#94a3b8' }} />
                    <span style={{ fontSize: '13px', color: '#94a3b8' }}>
                      {job.machines?.driver_name || 'N/A'} - {job.machines?.machine_owners?.name || 'N/A'}
                    </span>
                  </div>
                </div>

                {/* Date and Amount */}
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  padding: '10px',
                  background: 'rgba(15, 23, 42, 0.5)',
                  borderRadius: '8px',
                  marginBottom: '12px'
                }}>
                  <div style={{ fontSize: '13px', color: '#cbd5e1' }}>
                    {new Date(job.work_date || job.scheduled_date).toLocaleDateString()}
                  </div>
                  <div style={{ 
                    fontSize: '15px', 
                    fontWeight: 'bold', 
                    color: discountColor 
                  }}>
                    {typeof discountAmount === 'number' ? `₹${discountAmount.toLocaleString()}` : discountAmount}
                  </div>
                </div>

                {/* Action Buttons */}
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
                      minHeight: '40px',
                      transition: 'all 0.2s' 
                    }} 
                    onMouseEnter={(e) => e.target.style.background = '#138496'} 
                    onMouseLeave={(e) => e.target.style.background = '#17a2b8'}
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
                      minHeight: '40px',
                      transition: 'all 0.2s' 
                    }} 
                    onMouseEnter={(e) => e.target.style.background = '#c82333'} 
                    onMouseLeave={(e) => e.target.style.background = '#dc3545'}
                    title="Remove all discounts"
                  >
                    <FaTrash /> Remove
                  </button>
                </div>
              </div>
            );
          })
        )}
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
