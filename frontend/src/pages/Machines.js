import React, { useState, useEffect } from 'react';
import { machineAPI, machineOwnerAPI } from '../api';
import { FaPlus, FaTrash, FaCog, FaFileExport, FaEdit, FaTractor, FaPhone, FaUserTie, FaEllipsisV, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import ActionsCell from '../components/ActionsCell';
import FilterBar from '../components/FilterBar';
import axios from 'axios';
import { exportToCSV, formatDataForExport } from '../utils/exportUtils';

const Machines = () => {
  const [machines, setMachines] = useState([]);
  const [owners, setOwners] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [rentals, setRentals] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingMachine, setEditingMachine] = useState(null);
  const [machineTypes, setMachineTypes] = useState([]);
  const [showAddMachineType, setShowAddMachineType] = useState(false);
  const [newMachineType, setNewMachineType] = useState('');
  const [showManageMachineTypes, setShowManageMachineTypes] = useState(false);
  const [formData, setFormData] = useState({
    machineOwnerId: '',
    machineType: '',
    machineNumber: '',
    ratePerHour: '',
    discountHours: '',
    discountMinutes: '',
    driverName: '',
    driverPhone: '',
    status: 'Active'
  });

  // Filter states
  const [filterOwner, setFilterOwner] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showOverflowMenu, setShowOverflowMenu] = useState(false);

  useEffect(() => {
    fetchMachines();
    fetchOwners();
    fetchExpenses();
    fetchJobs();
    fetchRentals();
    fetchPayments();
  }, []);

  useEffect(() => {
    // Initialize machine types from localStorage or set defaults
    const savedTypes = localStorage.getItem('machineTypes');
    if (savedTypes) {
      setMachineTypes(JSON.parse(savedTypes));
    } else {
      // Default machine types - can be customized
      const defaultTypes = ['Chain Bandi Karthar', 'Tractor', 'Harvester', 'Combine Harvester'];
      setMachineTypes(defaultTypes);
      localStorage.setItem('machineTypes', JSON.stringify(defaultTypes));
    }
  }, []);

  useEffect(() => {
    // Extract unique machine types from existing machines
    if (machines.length > 0) {
      const existingTypes = [...new Set(machines.map(m => m.machine_type).filter(Boolean))];
      const savedTypes = JSON.parse(localStorage.getItem('machineTypes') || '[]');
      
      // Merge existing types with saved types
      const mergedTypes = [...new Set([...savedTypes, ...existingTypes])];
      if (mergedTypes.length > savedTypes.length) {
        setMachineTypes(mergedTypes);
        localStorage.setItem('machineTypes', JSON.stringify(mergedTypes));
      }
    }
  }, [machines]);

  const fetchMachines = async () => {
    try {
      const response = await machineAPI.getAll();
      console.log('🚜 Machines fetched:', response.data);
      setMachines(response.data);
    } catch (error) {
      console.error('Error fetching machines:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOwners = async () => {
    try {
      const response = await machineOwnerAPI.getAll();
      setOwners(response.data);
    } catch (error) {
      console.error('Error fetching owners:', error);
    }
  };

  const fetchExpenses = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/expenses', {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('💸 Expenses fetched:', response.data);
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
      console.log('📋 Jobs fetched:', response.data);
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
      console.log('💰 Payments fetched:', response.data);
      setPayments(response.data);
    } catch (error) {
      console.error('Error fetching payments:', error);
    }
  };

  const fetchRentals = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/rentals', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRentals(response.data);
    } catch (error) {
      console.error('Error fetching rentals:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Convert hours and minutes to decimal hours
      const hours = parseFloat(formData.discountHours) || 0;
      const minutes = parseFloat(formData.discountMinutes) || 0;
      const totalDiscountHours = hours + (minutes / 60);
      
      const submitData = {
        ...formData,
        discountHours: totalDiscountHours.toFixed(2)
      };
      
      if (editingMachine) {
        await machineAPI.update(editingMachine.id, submitData);
      } else {
        await machineAPI.create(submitData);
      }
      fetchMachines();
      handleCloseModal();
    } catch (error) {
      alert(error.response?.data?.error || 'Error saving machine');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this machine?')) {
      try {
        await machineAPI.delete(id);
        fetchMachines();
      } catch (error) {
        alert(error.response?.data?.error || 'Error deleting machine');
      }
    }
  };

  const handleEdit = (machine) => {
    setEditingMachine(machine);
    
    // Split discount hours into hours and minutes
    const totalDiscountHours = parseFloat(machine.discount_hours) || 0;
    const hours = Math.floor(totalDiscountHours);
    const minutes = Math.round((totalDiscountHours - hours) * 60);
    
    setFormData({
      machineOwnerId: machine.machine_owner_id || '',
      machineType: machine.machine_type || '',
      machineNumber: machine.machine_number || '',
      ratePerHour: machine.owner_rate_per_hour || '',
      discountHours: hours.toString(),
      discountMinutes: minutes.toString(),
      driverName: machine.driver_name || '',
      driverPhone: machine.driver_phone || '',
      status: machine.status || 'Active'
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingMachine(null);
    setShowAddMachineType(false);
    setNewMachineType('');
    setFormData({
      machineOwnerId: '',
      machineType: '',
      machineNumber: '',
      ratePerHour: '',
      discountHours: '',
      discountMinutes: '',
      driverName: '',
      driverPhone: '',
      status: 'Active'
    });
  };

  const handleAddMachineType = () => {
    if (newMachineType.trim() && !machineTypes.includes(newMachineType.trim())) {
      const updatedTypes = [...machineTypes, newMachineType.trim()];
      setMachineTypes(updatedTypes);
      setFormData({ ...formData, machineType: newMachineType.trim() });
      setNewMachineType('');
      setShowAddMachineType(false);
      localStorage.setItem('machineTypes', JSON.stringify(updatedTypes));
    }
  };

  const handleDeleteMachineType = (typeToDelete) => {
    // Check if any machine is using this type
    const machinesUsingType = machines.filter(m => m.machine_type === typeToDelete);
    
    if (machinesUsingType.length > 0) {
      alert(`Cannot delete "${typeToDelete}" because ${machinesUsingType.length} machine(s) are using it.`);
      return;
    }
    
    if (window.confirm(`Are you sure you want to delete machine type "${typeToDelete}"?`)) {
      const updatedTypes = machineTypes.filter(t => t !== typeToDelete);
      setMachineTypes(updatedTypes);
      localStorage.setItem('machineTypes', JSON.stringify(updatedTypes));
      
      // If the deleted type was selected in the form, clear it
      if (formData.machineType === typeToDelete) {
        setFormData({ ...formData, machineType: '' });
      }
    }
  };

  // Apply filters
  const filteredMachines = machines.filter(machine => {
    if (filterOwner && machine.machine_owner_id !== filterOwner) return false;
    return true;
  });

  const clearFilters = () => {
    setFilterOwner('');
  };

  const hasActiveFilters = filterOwner;

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div>
      {/* Page Header with Actions */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', padding: '10px 0' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '600' }}>Machines</h2>
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
            <FaPlus /> Add Machine
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
                  exportToCSV(formatDataForExport(filteredMachines, 'machines'), 'machines');
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
                Showing {filteredMachines.length} of {machines.length} machines
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
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '12px', fontWeight: '500', color: '#cbd5e1' }}>
                <FaUserTie style={{ marginRight: '6px', fontSize: '12px' }} /> Owner
              </label>
              <select
                value={filterOwner}
                onChange={(e) => setFilterOwner(e.target.value)}
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
                <option value="">All Owners</option>
                {owners.map((owner) => (
                  <option key={owner.id} value={owner.id}>{owner.name}</option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Card-Style Machine List */}
      <div style={{ 
        background: 'rgba(30, 41, 59, 0.6)',
        borderRadius: '12px',
        overflow: 'hidden',
        border: '1px solid rgba(100, 116, 139, 0.3)'
      }}>
        <div style={{ padding: '16px', borderBottom: '1px solid rgba(100, 116, 139, 0.3)' }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#e2e8f0' }}>🚜 Machines List</h3>
          <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
            Earnings include both Harvesting Jobs and Dealer Rentals
          </div>
        </div>
        <div style={{ padding: '12px' }}>
            {filteredMachines.length > 0 ? (
              filteredMachines.map((machine) => {
                // ============================================
                // PART 1: DIRECT HARVESTING EARNINGS
                // ============================================
                // Calculate earnings from direct harvesting jobs
                const harvestingEarned = jobs
                  .filter(job => job.machine_id === machine.id)
                  .reduce((sum, job) => {
                    const hours = parseFloat(job.hours || 0);
                    const ownerRate = parseFloat(machine.owner_rate_per_hour || 0);
                    const amount = hours * ownerRate;
                    console.log(`Machine ${machine.machine_number} - Harvesting Job:`, {
                      jobId: job.id,
                      hours,
                      ownerRate,
                      amount
                    });
                    return sum + amount;
                  }, 0);
                
                // ============================================
                // PART 2: RENTAL EARNINGS
                // ============================================
                // Calculate earnings from dealer rentals (owner gets total_cost_to_owner)
                const rentalEarned = rentals
                  .filter(rental => rental.machine_id === machine.id)
                  .reduce((sum, rental) => {
                    const ownerCost = parseFloat(rental.total_cost_to_owner || 0);
                    console.log(`Machine ${machine.machine_number} - Rental:`, {
                      rentalId: rental.id,
                      dealerName: rental.dealer?.name,
                      ownerCost
                    });
                    return sum + ownerCost;
                  }, 0);
                
                // TOTAL EARNED = Harvesting + Rentals
                const totalEarned = harvestingEarned + rentalEarned;
                
                console.log(`Machine ${machine.machine_number} - Total Earned:`, {
                  harvestingEarned,
                  rentalEarned,
                  totalEarned
                });
                
                // ============================================
                // EXPENSES (for both harvesting and rentals)
                // ============================================
                const machineExpenses = expenses
                  .filter(exp => exp.machine_id === machine.id)
                  .reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0);
                
                console.log(`Machine ${machine.machine_number} - Expenses:`, machineExpenses);
                
                // ============================================
                // PAYMENTS (to owner for both harvesting and rentals)
                // ============================================
                const machinePaid = payments
                  .filter(p => p.machine_id === machine.id && p.type === 'To Machine Owner')
                  .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
                
                console.log(`Machine ${machine.machine_number} - Paid:`, machinePaid);
                
                // BALANCE = Total Earned - Expenses - Paid
                const netPayable = totalEarned - machineExpenses - machinePaid;
                
                console.log(`Machine ${machine.machine_number} - Balance:`, netPayable);
                
                // ============================================
                // DISCOUNT HOURS GIVEN BY OWNER
                // ============================================
                const discountHours = parseFloat(machine.discount_hours || 0);
                const discountHoursDisplay = discountHours > 0 ? `${Math.floor(discountHours)}h ${Math.round((discountHours - Math.floor(discountHours)) * 60)}m` : '0h 0m';
                
                return (
                  <div
                    key={`${machine.id}-${totalEarned}-${machineExpenses}-${machinePaid}`}
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
                    {/* Machine Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                          <FaTractor style={{ fontSize: '20px', color: '#667eea' }} />
                          <div>
                            <div style={{ fontSize: '16px', fontWeight: '600', color: '#e2e8f0' }}>
                              {machine.machine_owners?.name || 'N/A'}
                            </div>
                            <div style={{ fontSize: '13px', color: '#cbd5e1', marginTop: '2px' }}>
                              Driver: {machine.driver_name || 'N/A'}
                              {machine.driver_phone && (
                                <span style={{ marginLeft: '8px' }}>
                                  <FaPhone style={{ fontSize: '10px', marginRight: '4px' }} />
                                  <a href={`tel:${machine.driver_phone}`} style={{ color: '#60a5fa', textDecoration: 'none' }}>
                                    {machine.driver_phone}
                                  </a>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div style={{ fontSize: '12px', color: '#94a3b8', marginLeft: '30px' }}>
                          {machine.machine_type} - {machine.machine_number}
                        </div>
                      </div>
                      <div style={{ fontSize: '12px', color: '#94a3b8', textAlign: 'right' }}>
                        <div style={{ color: '#f59e0b', fontWeight: '600' }}>
                          Rate: ₹{machine.owner_rate_per_hour?.toLocaleString() || 0}/hr
                        </div>
                      </div>
                    </div>

                    {/* Financial Grid - 3x2 */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(3, 1fr)',
                      gap: '8px',
                      marginBottom: '12px',
                      padding: '10px',
                      background: 'rgba(15, 23, 42, 0.4)',
                      borderRadius: '8px'
                    }}>
                      <div>
                        <div style={{ fontSize: '10px', color: '#94a3b8', marginBottom: '2px' }}>Earned</div>
                        <div style={{ fontSize: '13px', fontWeight: '600', color: '#10b981' }}>
                          ₹{totalEarned.toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '10px', color: '#94a3b8', marginBottom: '2px' }}>Expenses</div>
                        <div style={{ fontSize: '13px', fontWeight: '600', color: '#f59e0b' }}>
                          ₹{machineExpenses.toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '10px', color: '#94a3b8', marginBottom: '2px' }}>Paid</div>
                        <div style={{ fontSize: '13px', fontWeight: '600', color: '#cbd5e1' }}>
                          ₹{machinePaid.toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '10px', color: '#94a3b8', marginBottom: '2px' }}>Balance</div>
                        <div style={{ fontSize: '13px', fontWeight: 'bold', color: netPayable > 0 ? '#34d399' : '#94a3b8' }}>
                          ₹{netPayable.toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '10px', color: '#94a3b8', marginBottom: '2px' }}>Discount Hours</div>
                        <div style={{ fontSize: '13px', fontWeight: '600', color: discountHours > 0 ? '#fbbf24' : '#6b7280' }}>
                          {discountHoursDisplay}
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => handleEdit(machine)}
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
                        onClick={() => handleDelete(machine.id)}
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
                {hasActiveFilters ? '🔍 No machines match the selected filters.' : '🚜 No machines found. Add your first machine!'}
              </div>
            )}
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>{editingMachine ? 'Edit Machine' : 'Add Machine'}</h2>
            <form onSubmit={handleSubmit}>
                <div className="form-row">
                  <div className="form-group">
                    <label>Machine Owner <span className="required-star">*</span></label>
                    <select
                      value={formData.machineOwnerId}
                      onChange={(e) => setFormData({ ...formData, machineOwnerId: e.target.value })}
                      required
                    >
                      <option value="">Select Owner</option>
                      {owners.map((owner) => (
                        <option key={owner.id} value={owner.id}>
                          {owner.name} - {owner.phone}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Machine Type <span className="required-star">*</span></label>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                      <select
                        value={formData.machineType}
                        onChange={(e) => setFormData({ ...formData, machineType: e.target.value })}
                        required
                        style={{ flex: 1 }}
                      >
                        <option value="">Select Machine Type</option>
                        {machineTypes.map((type) => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        className="btn btn-success"
                        onClick={() => setShowAddMachineType(!showAddMachineType)}
                        style={{ padding: '8px 16px', minWidth: 'auto' }}
                        title="Add new machine type"
                      >
                        <FaPlus />
                      </button>
                      <button
                        type="button"
                        className="btn"
                        onClick={() => setShowManageMachineTypes(true)}
                        style={{ padding: '8px 16px', minWidth: 'auto', backgroundColor: '#6b7280', color: 'white' }}
                        title="Manage machine types"
                      >
                        <FaCog />
                      </button>
                    </div>
                    {showAddMachineType && (
                      <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
                        <input
                          type="text"
                          value={newMachineType}
                          onChange={(e) => setNewMachineType(e.target.value)}
                          placeholder="Enter new machine type"
                          style={{ flex: 1 }}
                          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddMachineType())}
                        />
                        <button
                          type="button"
                          className="btn btn-success"
                          onClick={handleAddMachineType}
                          style={{ padding: '8px 16px' }}
                        >
                          Add
                        </button>
                        <button
                          type="button"
                          className="btn"
                          onClick={() => {
                            setShowAddMachineType(false);
                            setNewMachineType('');
                          }}
                          style={{ padding: '8px 16px' }}
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Machine Number <span className="required-star">*</span></label>
                    <input
                      type="text"
                      value={formData.machineNumber}
                      onChange={(e) => setFormData({ ...formData, machineNumber: e.target.value.toUpperCase() })}
                      required
                      placeholder="e.g., MH12AB1234"
                    />
                  </div>
                  <div className="form-group">
                    <label>Owner Rate Per Hour (₹) <span className="required-star">*</span></label>
                    <input
                      type="number"
                      value={formData.ratePerHour}
                      onChange={(e) => setFormData({ ...formData, ratePerHour: e.target.value })}
                      required
                      min="0"
                      step="100"
                      placeholder="Rate you pay the machine owner"
                    />
                    <small style={{ color: '#6b7280', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                      Amount you pay to owner per hour (different from rate charged to farmer)
                    </small>
                  </div>
                </div>
                
                <div className="form-section-header">
                  <h3>Owner Discount (Cumulative for this Machine)</h3>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Discount Hours 🕒</label>
                    <input
                      type="number"
                      value={formData.discountHours || ''}
                      onChange={(e) => setFormData({ ...formData, discountHours: e.target.value })}
                      min="0"
                      step="1"
                      placeholder="Hours (e.g., 2)"
                    />
                    <small style={{ color: '#6b7280', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                      💡 Total hours (whole number)
                    </small>
                  </div>
                  <div className="form-group">
                    <label>Discount Minutes ⏱️</label>
                    <input
                      type="number"
                      value={formData.discountMinutes || ''}
                      onChange={(e) => setFormData({ ...formData, discountMinutes: e.target.value })}
                      min="0"
                      max="59"
                      step="1"
                      placeholder="Minutes (e.g., 15)"
                    />
                    <small style={{ color: '#6b7280', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                      💡 Minutes (0-59)
                    </small>
                  </div>
                </div>
                {(formData.discountHours || formData.discountMinutes) && (
                  <div style={{ padding: '12px', backgroundColor: '#fef3c7', borderRadius: '8px', marginBottom: '16px', border: '2px solid #f59e0b' }}>
                    <div style={{ fontWeight: 'bold', color: '#78350f', fontSize: '16px', textAlign: 'center' }}>
                      Total Discount: {formData.discountHours || 0}h {formData.discountMinutes || 0}m 
                      ({((parseFloat(formData.discountHours) || 0) + (parseFloat(formData.discountMinutes) || 0) / 60).toFixed(2)} hours)
                    </div>
                  </div>
                )}
                <div className="form-section-header">
                  <h3>Driver Details</h3>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Driver Name <span className="required-star">*</span></label>
                    <input
                      type="text"
                      value={formData.driverName}
                      onChange={(e) => setFormData({ ...formData, driverName: e.target.value.toUpperCase() })}
                      placeholder="Enter driver name"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Driver Phone <span className="required-star">*</span></label>
                    <input
                      type="tel"
                      value={formData.driverPhone}
                      onChange={(e) => setFormData({ ...formData, driverPhone: e.target.value })}
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

              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={handleCloseModal}>Cancel</button>
                <button type="submit" className="btn-primary">
                  {editingMachine ? 'Update Machine' : 'Add Machine'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manage Machine Types Modal */}
      {showManageMachineTypes && (
        <div className="modal-overlay" onClick={() => setShowManageMachineTypes(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <h2>Manage Machine Types</h2>
            <div style={{ marginTop: '20px' }}>
              {machineTypes.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#6b7280', padding: '20px' }}>No machine types added yet</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {machineTypes.map((type) => {
                    const machinesCount = machines.filter(m => m.machine_type === type).length;
                    return (
                      <div
                        key={type}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '12px 16px',
                          border: '2px solid #e5e7eb',
                          borderRadius: '8px',
                          backgroundColor: machinesCount > 0 ? '#f3f4f6' : 'white'
                        }}
                      >
                        <div>
                          <span style={{ fontWeight: '600', fontSize: '16px', color: '#1f2937' }}>{type}</span>
                          {machinesCount > 0 && (
                            <span style={{ marginLeft: '10px', fontSize: '13px', color: '#6b7280', fontWeight: '500' }}>
                              ({machinesCount} machine{machinesCount !== 1 ? 's' : ''})
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          className="btn btn-danger"
                          onClick={() => handleDeleteMachineType(type)}
                          style={{ padding: '6px 12px', minWidth: 'auto' }}
                          title="Delete machine type"
                          disabled={machinesCount > 0}
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
                onClick={() => setShowManageMachineTypes(false)}
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

export default Machines;
