import React, { useState, useEffect, useCallback } from 'react';
import { dashboardAPI } from '../api';
import { FaSeedling, FaBuilding, FaChartLine, FaFilter, FaTimes } from 'react-icons/fa';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [machines, setMachines] = useState([]);
  const [villages, setVillages] = useState([]);
  const [selectedMachine, setSelectedMachine] = useState('');
  const [selectedVillage, setSelectedVillage] = useState('');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  // Helper function to convert decimal hours to HH:MM format
  const formatHoursToHHMM = (decimalHours) => {
    const hours = Math.floor(decimalHours);
    const minutes = Math.round((decimalHours - hours) * 60);
    return `${hours}h ${minutes}m`;
  };

  // Helper function to format numbers in Indian numbering system (lakhs format)
  const formatIndianCurrency = (number) => {
    if (number === 0 || number === null || number === undefined) return '0';
    
    const numStr = Math.round(number).toString();
    const lastThree = numStr.substring(numStr.length - 3);
    const otherNumbers = numStr.substring(0, numStr.length - 3);
    
    if (otherNumbers !== '') {
      return otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + lastThree;
    }
    return lastThree;
  };

  const fetchMachines = async () => {
    try {
      const token = localStorage.getItem('token');
      const API_URL = process.env.REACT_APP_API_URL || 'https://munagala-harvestors-52ow7o5s9.vercel.app';
      const response = await fetch(`${API_URL}/api/machines`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) {
        throw new Error(`Machines API failed: ${response.status}`);
      }
      const data = await response.json();
      setMachines(data || []);
    } catch (error) {
      console.error('Error fetching machines:', error);
      setMachines([]);
    }
  };

  const fetchVillages = async () => {
    try {
      const token = localStorage.getItem('token');
      const API_URL = process.env.REACT_APP_API_URL || 'https://munagala-harvestors-52ow7o5s9.vercel.app';
      
      // Fetch farmer villages
      const farmersResponse = await fetch(`${API_URL}/api/farmers`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!farmersResponse.ok) {
        throw new Error(`Farmers API failed: ${farmersResponse.status}`);
      }
      const farmersData = await farmersResponse.json();
      const farmerVillages = (farmersData || []).map(f => f.village).filter(Boolean);
      
      // Fetch dealer villages
      const dealersResponse = await fetch(`${API_URL}/api/dealers`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!dealersResponse.ok) {
        throw new Error(`Dealers API failed: ${dealersResponse.status}`);
      }
      const dealersData = await dealersResponse.json();
      const dealerVillages = (dealersData || []).map(d => d.village_name).filter(Boolean);
      
      // Combine and get unique villages
      const allVillages = [...farmerVillages, ...dealerVillages];
      const uniqueVillages = [...new Set(allVillages)];
      setVillages(uniqueVillages.sort());
    } catch (error) {
      console.error('Error fetching villages:', error);
      setVillages([]);
    }
  };

  const fetchStats = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (selectedMachine) params.append('machine_id', selectedMachine);
      if (selectedVillage) params.append('village', selectedVillage);
      const queryParam = params.toString() ? `?${params.toString()}` : '';
      const response = await dashboardAPI.getStats(queryParam);
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedMachine, selectedVillage]);

  useEffect(() => {
    fetchMachines();
    fetchVillages();
    fetchStats();
  }, [fetchStats]);

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  const selectedMachineData = machines.find(m => m.id === selectedMachine);
  const selectedMachineName = selectedMachineData 
    ? `${selectedMachineData.driver_name || 'Unknown'} - ${selectedMachineData.machine_owners?.name || 'Unknown'}`
    : null;

  const filterLabel = selectedMachine && selectedVillage 
    ? `${selectedMachineName} • ${selectedVillage}`
    : selectedMachine 
      ? selectedMachineName
      : selectedVillage
        ? selectedVillage
        : 'All Data';

  return (
    <div style={{ position: 'relative' }}>
      {/* PROFESSIONAL FILTER COMPONENT - ABSOLUTE TOP RIGHT */}
      <div style={{ 
        position: 'absolute', 
        top: '0', 
        right: '0', 
        zIndex: 1000
      }}>
        <button
          onClick={() => setShowFilterDropdown(!showFilterDropdown)}
          onBlur={(e) => {
            // Only close if clicking outside the dropdown
            if (!e.relatedTarget || !e.currentTarget.parentElement.contains(e.relatedTarget)) {
              setTimeout(() => setShowFilterDropdown(false), 200);
            }
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 16px',
            background: (selectedMachine || selectedVillage) ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#ffffff',
            color: (selectedMachine || selectedVillage) ? '#ffffff' : '#4b5563',
            border: (selectedMachine || selectedVillage) ? 'none' : '2px solid #e5e7eb',
            borderRadius: '10px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            boxShadow: (selectedMachine || selectedVillage) ? '0 4px 12px rgba(102, 126, 234, 0.4)' : '0 2px 4px rgba(0,0,0,0.1)',
            minWidth: '200px',
            justifyContent: 'space-between'
          }}
          onMouseEnter={(e) => {
            if (!selectedMachine && !selectedVillage) {
              e.currentTarget.style.borderColor = '#667eea';
              e.currentTarget.style.boxShadow = '0 4px 8px rgba(102, 126, 234, 0.2)';
            }
          }}
          onMouseLeave={(e) => {
            if (!selectedMachine && !selectedVillage) {
              e.currentTarget.style.borderColor = '#e5e7eb';
              e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
            }
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
            <FaFilter style={{ fontSize: '13px', flexShrink: 0 }} />
            <span style={{ 
              overflow: 'hidden', 
              textOverflow: 'ellipsis', 
              whiteSpace: 'nowrap',
              textAlign: 'left'
            }}>
              {filterLabel}
            </span>
          </div>
          {(selectedMachine || selectedVillage) ? (
            <FaTimes 
              onClick={(e) => {
                e.stopPropagation();
                setSelectedMachine('');
                setSelectedVillage('');
                setShowFilterDropdown(false);
              }}
              style={{ 
                fontSize: '14px', 
                flexShrink: 0,
                padding: '2px',
                borderRadius: '50%',
                transition: 'background 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            />
          ) : (
            <span style={{ fontSize: '10px', marginLeft: '4px' }}>▼</span>
          )}
        </button>

        {/* DROPDOWN MENU */}
        {showFilterDropdown && (
          <div 
            className="dashboard-filter-dropdown"
            onMouseDown={(e) => e.preventDefault()} 
            style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              right: 0,
              background: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: '10px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
                minWidth: '280px',
                maxHeight: '450px',
                overflowY: 'auto',
                zIndex: 1001
              }}>
              
              {/* Machine Filter Section */}
              <div style={{
                padding: '12px 16px',
                borderBottom: '1px solid #e5e7eb',
                background: '#f9fafb',
                borderTopLeftRadius: '10px',
                borderTopRightRadius: '10px',
                fontSize: '12px',
                fontWeight: '600',
                color: '#6b7280',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Filter by Machine
              </div>
              
              <div
                onClick={() => {
                  setSelectedMachine('');
                }}
                style={{
                  padding: '12px 16px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: selectedMachine ? '500' : '600',
                  color: selectedMachine ? '#6b7280' : '#667eea',
                  background: selectedMachine ? 'transparent' : '#f3f4f6',
                  transition: 'all 0.2s ease',
                  borderBottom: '1px solid #f3f4f6'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#f9fafb';
                  e.currentTarget.style.paddingLeft = '20px';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = selectedMachine ? 'transparent' : '#f3f4f6';
                  e.currentTarget.style.paddingLeft = '16px';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {!selectedMachine && <span style={{ fontSize: '16px' }}>✓</span>}
                  <span>All Machines</span>
                </div>
              </div>

              {machines.map((machine) => {
                const driverName = machine.driver_name || 'Unknown Driver';
                const ownerName = machine.machine_owners?.name || 'Unknown Owner';
                const isSelected = selectedMachine === machine.id;
                
                return (
                  <div
                    key={machine.id}
                    onClick={() => {
                      setSelectedMachine(machine.id);
                    }}
                    style={{
                      padding: '12px 16px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: isSelected ? '600' : '500',
                      color: isSelected ? '#667eea' : '#374151',
                      background: isSelected ? '#f3f4f6' : 'transparent',
                      transition: 'all 0.2s ease',
                      borderBottom: '1px solid #f3f4f6'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#f9fafb';
                      e.currentTarget.style.paddingLeft = '20px';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = isSelected ? '#f3f4f6' : 'transparent';
                      e.currentTarget.style.paddingLeft = '16px';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {isSelected && <span style={{ fontSize: '16px' }}>✓</span>}
                      <div>
                        <div style={{ fontWeight: '600' }}>{driverName}</div>
                        <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>
                          Owner: {ownerName}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Village Filter Section */}
              <div style={{
                padding: '12px 16px',
                borderTop: '2px solid #e5e7eb',
                borderBottom: '1px solid #e5e7eb',
                background: '#f9fafb',
                fontSize: '12px',
                fontWeight: '600',
                color: '#6b7280',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                marginTop: '8px'
              }}>
                Filter by Village
              </div>
              
              <div
                onClick={() => {
                  setSelectedVillage('');
                }}
                style={{
                  padding: '12px 16px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: selectedVillage ? '500' : '600',
                  color: selectedVillage ? '#6b7280' : '#667eea',
                  background: selectedVillage ? 'transparent' : '#f3f4f6',
                  transition: 'all 0.2s ease',
                  borderBottom: '1px solid #f3f4f6'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#f9fafb';
                  e.currentTarget.style.paddingLeft = '20px';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = selectedVillage ? 'transparent' : '#f3f4f6';
                  e.currentTarget.style.paddingLeft = '16px';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {!selectedVillage && <span style={{ fontSize: '16px' }}>✓</span>}
                  <span>All Villages</span>
                </div>
              </div>

              {villages.map((village) => {
                const isSelected = selectedVillage === village;
                
                return (
                  <div
                    key={village}
                    onClick={() => {
                      setSelectedVillage(village);
                    }}
                    style={{
                      padding: '12px 16px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: isSelected ? '600' : '500',
                      color: isSelected ? '#667eea' : '#374151',
                      background: isSelected ? '#f3f4f6' : 'transparent',
                      transition: 'all 0.2s ease',
                      borderBottom: '1px solid #f3f4f6'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#f9fafb';
                      e.currentTarget.style.paddingLeft = '20px';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = isSelected ? '#f3f4f6' : 'transparent';
                      e.currentTarget.style.paddingLeft = '16px';
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {isSelected && <span style={{ fontSize: '16px' }}>✓</span>}
                      <span>{village}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
      </div>

      {/* PAGE HEADER */}
      <div className="page-header">
        <h2>Dashboard</h2>
      </div>

      {/* TABS */}
      <div className="dashboard-tabs">
        <button 
          className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <FaChartLine /> Combined Overview
        </button>
        <button 
          className={`tab-button ${activeTab === 'harvesting' ? 'active' : ''}`}
          onClick={() => setActiveTab('harvesting')}
        >
          <FaSeedling /> Direct Harvesting
        </button>
        <button 
          className={`tab-button ${activeTab === 'dealer' ? 'active' : ''}`}
          onClick={() => setActiveTab('dealer')}
        >
          <FaBuilding /> Dealer Rental System
        </button>
      </div>

      {/* TAB CONTENT */}
      <div className="tab-content">
        {/* COMBINED OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="enterprise-section">
            <div className="enterprise-grid">
              {/* 1️⃣ Revenue */}
              <div className="enterprise-card revenue-card">
                <div className="card-header">
                  <span className="card-icon">💰</span>
                  <h4>Revenue</h4>
                </div>
                <div style={{ padding: '20px 24px' }}>
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px', fontWeight: '600' }}>From Farmers/Dealers</div>
                    <div className="card-amount positive">₹{formatIndianCurrency(Math.round((stats?.combined?.revenue || 0) * 100) / 100)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px', fontWeight: '600' }}>To Owners</div>
                    <div style={{ fontSize: '24px', color: '#f59e0b', fontWeight: '700' }}>₹{formatIndianCurrency(Math.round((stats?.combined?.ownerRevenue || 0) * 100) / 100)}</div>
                  </div>
                </div>
                <div className="card-footer">
                  <span className="card-badge success">Total Income</span>
                </div>
              </div>

              {/* 2️⃣ Profit */}
              <div className="enterprise-card profit-card">
                <div className="card-header">
                  <span className="card-icon">📊</span>
                  <h4>Profit</h4>
                </div>
                <div className={`card-amount ${(stats?.combined?.profit || 0) >= 0 ? 'profit' : 'negative'}`}>
                  ₹{formatIndianCurrency(Math.round((stats?.combined?.profit || 0) * 100) / 100)}
                </div>
                <div className="card-footer">
                  <span className="card-badge info">Net Profit</span>
                </div>
              </div>

              {/* 3️⃣ Total Hours */}
              <div className="enterprise-card hours-card">
                <div className="card-header">
                  <span className="card-icon">⏱️</span>
                  <h4>Total Hours</h4>
                </div>
                <div className="card-amount" style={{ color: '#667eea' }}>{formatHoursToHHMM(stats?.combined?.totalHours || 0)}</div>
                <div className="card-footer">
                  <span className="card-badge" style={{ background: '#eef2ff', color: '#667eea' }}>Work Time</span>
                </div>
              </div>

              {/* 4️⃣ Expenses */}
              <div className="enterprise-card expenses-card">
                <div className="card-header">
                  <span className="card-icon">💸</span>
                  <h4>Expenses</h4>
                </div>
                <div className="card-amount" style={{ color: '#f59e0b' }}>₹{formatIndianCurrency(Math.round((stats?.combined?.expenses || 0) * 100) / 100)}</div>
                <div className="card-footer">
                  <span className="card-badge" style={{ background: '#fef3c7', color: '#92400e' }}>Total Cost</span>
                </div>
              </div>

              {/* 5️⃣ Pending Transactions */}
              <div className="enterprise-card" style={{ display: 'flex', flexDirection: 'column', height: 'auto', minHeight: '200px' }}>
                <div className="card-header">
                  <span className="card-icon">⏳</span>
                  <h4>Pending Transactions</h4>
                </div>
                <div style={{ padding: '20px 24px', flex: 1 }}>
                  <div style={{ marginBottom: '20px' }}>
                    <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '6px', fontWeight: '600' }}>To Receive</div>
                    <div style={{ fontSize: '28px', color: '#10b981', fontWeight: '700', lineHeight: '1.2' }}>₹{formatIndianCurrency(Math.round((stats?.combined?.pendingFromFarmers || 0) * 100) / 100)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '6px', fontWeight: '600' }}>To Pay Owners</div>
                    <div style={{ fontSize: '28px', color: '#ef4444', fontWeight: '700', lineHeight: '1.2' }}>₹{formatIndianCurrency(Math.round((stats?.combined?.pendingToOwners || 0) * 100) / 100)}</div>
                  </div>
                </div>
                <div className="card-footer">
                  <span className="card-badge" style={{ background: '#fef2f2', color: '#991b1b' }}>Outstanding</span>
                </div>
              </div>
            </div>

            <div className="metrics-breakdown">
              <h4 className="subsection-title">Business Unit Breakdown</h4>
              <div className="breakdown-grid">
                <div className="breakdown-card">
                  <div className="breakdown-icon">🌾</div>
                  <div className="breakdown-details">
                    <span className="breakdown-label">Direct Harvesting</span>
                    <span className="breakdown-value">₹{formatIndianCurrency(Math.round((stats?.harvesting?.profit || 0) * 100) / 100)}</span>
                    <span className="breakdown-sublabel">Profit contribution</span>
                  </div>
                </div>
                <div className="breakdown-card">
                  <div className="breakdown-icon">🏢</div>
                  <div className="breakdown-details">
                    <span className="breakdown-label">Dealer Rental System</span>
                    <span className="breakdown-value">₹{formatIndianCurrency(Math.round((stats?.dealerRentals?.profit || 0) * 100) / 100)}</span>
                    <span className="breakdown-sublabel">Profit contribution</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="metrics-breakdown">
              <h4 className="subsection-title">Discounts Overview</h4>
              <div className="breakdown-grid">
                <div className="breakdown-card" style={{ background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)', border: '2px solid #d97706' }}>
                  <div className="breakdown-icon">🕒</div>
                  <div className="breakdown-details">
                    <span className="breakdown-label" style={{ color: '#78350f', fontWeight: '700' }}>From Owner (Hours)</span>
                    <span className="breakdown-value" style={{ color: '#78350f', fontWeight: '800', fontSize: '26px' }}>{formatHoursToHHMM(stats?.combined?.discountHoursFromOwners || 0)}</span>
                    <span className="breakdown-sublabel" style={{ color: '#92400e', fontWeight: '600' }}>Discount hours given by owners</span>
                  </div>
                </div>
                <div className="breakdown-card" style={{ background: 'linear-gradient(135deg, #34d399 0%, #10b981 100%)', border: '2px solid #059669' }}>
                  <div className="breakdown-icon">💰</div>
                  <div className="breakdown-details">
                    <span className="breakdown-label" style={{ color: '#064e3b', fontWeight: '700' }}>Additional Profit from Owner Discount</span>
                    <span className="breakdown-value" style={{ color: '#064e3b', fontWeight: '800', fontSize: '26px' }}>₹{formatIndianCurrency(Math.round((stats?.combined?.additionalProfitFromOwnerDiscount || 0) * 100) / 100)}</span>
                    <span className="breakdown-sublabel" style={{ color: '#065f46', fontWeight: '600' }}>Extra profit gained</span>
                  </div>
                </div>
                <div className="breakdown-card" style={{ background: 'linear-gradient(135deg, #f87171 0%, #ef4444 100%)', border: '2px solid #dc2626' }}>
                  <div className="breakdown-icon">🎁</div>
                  <div className="breakdown-details">
                    <span className="breakdown-label" style={{ color: '#7f1d1d', fontWeight: '700' }}>To Farmers (Money)</span>
                    <span className="breakdown-value" style={{ color: '#7f1d1d', fontWeight: '800', fontSize: '26px' }}>₹{formatIndianCurrency(Math.round((stats?.combined?.discountAmountToFarmers || 0) * 100) / 100)}</span>
                    <span className="breakdown-sublabel" style={{ color: '#991b1b', fontWeight: '600' }}>Discount money given to farmers</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* DIRECT HARVESTING TAB */}
        {activeTab === 'harvesting' && (
          <div className="enterprise-section">
            <div className="enterprise-grid">
              {/* 1️⃣ Revenue */}
              <div className="enterprise-card revenue-card">
                <div className="card-header">
                  <span className="card-icon">💰</span>
                  <h4>Revenue</h4>
                </div>
                <div style={{ padding: '20px 24px' }}>
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px', fontWeight: '600' }}>From Farmers</div>
                    <div className="card-amount positive">₹{formatIndianCurrency(Math.round((stats?.harvesting?.revenue || 0) * 100) / 100)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px', fontWeight: '600' }}>To Owners</div>
                    <div style={{ fontSize: '24px', color: '#f59e0b', fontWeight: '700' }}>₹{formatIndianCurrency(Math.round((stats?.harvesting?.ownerRevenue || 0) * 100) / 100)}</div>
                  </div>
                </div>
                <div className="card-footer">
                  <span className="card-badge success">Income</span>
                </div>
              </div>

              {/* 2️⃣ Profit */}
              <div className="enterprise-card profit-card">
                <div className="card-header">
                  <span className="card-icon">📊</span>
                  <h4>Profit</h4>
                </div>
                <div className={`card-amount ${(stats?.harvesting?.profit || 0) >= 0 ? 'profit' : 'negative'}`}>
                  ₹{formatIndianCurrency(Math.round((stats?.harvesting?.profit || 0) * 100) / 100)}
                </div>
                <div className="card-footer">
                  <span className="card-badge info">Net Profit</span>
                </div>
              </div>

              {/* 3️⃣ Total Hours */}
              <div className="enterprise-card hours-card">
                <div className="card-header">
                  <span className="card-icon">⏱️</span>
                  <h4>Total Hours</h4>
                </div>
                <div className="card-amount" style={{ color: '#667eea' }}>{formatHoursToHHMM(stats?.harvesting?.totalHours || 0)}</div>
                <div className="card-footer">
                  <span className="card-badge" style={{ background: '#eef2ff', color: '#667eea' }}>Work Time</span>
                </div>
              </div>

              {/* 4️⃣ Expenses */}
              <div className="enterprise-card expenses-card">
                <div className="card-header">
                  <span className="card-icon">💸</span>
                  <h4>Expenses</h4>
                </div>
                <div className="card-amount" style={{ color: '#f59e0b' }}>₹{formatIndianCurrency(Math.round((stats?.harvesting?.expenses || 0) * 100) / 100)}</div>
                <div className="card-footer">
                  <span className="card-badge" style={{ background: '#fef3c7', color: '#92400e' }}>Total Cost</span>
                </div>
              </div>

              {/* 5️⃣ Pending Transactions */}
              <div className="enterprise-card" style={{ display: 'flex', flexDirection: 'column', height: 'auto', minHeight: '200px' }}>
                <div className="card-header">
                  <span className="card-icon">⏳</span>
                  <h4>Pending Transactions</h4>
                </div>
                <div style={{ padding: '20px 24px', flex: 1 }}>
                  <div style={{ marginBottom: '20px' }}>
                    <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '6px', fontWeight: '600' }}>To Receive</div>
                    <div style={{ fontSize: '28px', color: '#10b981', fontWeight: '700', lineHeight: '1.2' }}>₹{formatIndianCurrency(Math.round((stats?.harvesting?.pendingFromFarmers || 0) * 100) / 100)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '6px', fontWeight: '600' }}>To Pay Owners</div>
                    <div style={{ fontSize: '28px', color: '#ef4444', fontWeight: '700', lineHeight: '1.2' }}>₹{formatIndianCurrency(Math.round((stats?.harvesting?.pendingToOwners || 0) * 100) / 100)}</div>
                  </div>
                </div>
                <div className="card-footer">
                  <span className="card-badge" style={{ background: '#fef2f2', color: '#991b1b' }}>Outstanding</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* DEALER RENTAL TAB */}
        {activeTab === 'dealer' && (
          <div className="enterprise-section">
            <div className="enterprise-grid">
              {/* 1️⃣ Revenue */}
              <div className="enterprise-card revenue-card">
                <div className="card-header">
                  <span className="card-icon">💰</span>
                  <h4>Revenue</h4>
                </div>
                <div style={{ padding: '20px 24px' }}>
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px', fontWeight: '600' }}>From Dealers</div>
                    <div className="card-amount positive">₹{formatIndianCurrency(Math.round((stats?.dealerRentals?.revenue || 0) * 100) / 100)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px', fontWeight: '600' }}>To Owners</div>
                    <div style={{ fontSize: '24px', color: '#f59e0b', fontWeight: '700' }}>₹{formatIndianCurrency(Math.round((stats?.dealerRentals?.ownerRevenue || 0) * 100) / 100)}</div>
                  </div>
                </div>
                <div className="card-footer">
                  <span className="card-badge success">Income</span>
                </div>
              </div>

              {/* 2️⃣ Profit */}
              <div className="enterprise-card profit-card">
                <div className="card-header">
                  <span className="card-icon">📊</span>
                  <h4>Profit</h4>
                </div>
                <div className={`card-amount ${(stats?.dealerRentals?.profit || 0) >= 0 ? 'profit' : 'negative'}`}>
                  ₹{formatIndianCurrency(Math.round((stats?.dealerRentals?.profit || 0) * 100) / 100)}
                </div>
                <p className="card-description">Revenue - Owner Cost</p>
                <div className="card-footer">
                  <span className="card-badge info">Commission</span>
                </div>
              </div>

              {/* 3️⃣ Total Hours */}
              <div className="enterprise-card hours-card">
                <div className="card-header">
                  <span className="card-icon">⏱️</span>
                  <h4>Total Hours</h4>
                </div>
                <div className="card-amount" style={{ color: '#667eea' }}>{formatHoursToHHMM(stats?.dealerRentals?.totalHours || 0)}</div>
                <p className="card-description">SUM(rental hours)</p>
                <div className="card-footer">
                  <span className="card-badge" style={{ background: '#eef2ff', color: '#667eea' }}>Rental Time</span>
                </div>
              </div>

              {/* 4️⃣ Expenses */}
              <div className="enterprise-card expenses-card">
                <div className="card-header">
                  <span className="card-icon">💸</span>
                  <h4>Expenses</h4>
                </div>
                <div className="card-amount" style={{ color: '#f59e0b' }}>₹{formatIndianCurrency(Math.round((stats?.dealerRentals?.expenses || 0) * 100) / 100)}</div>
                <p className="card-description">Rental-specific expenses</p>
                <div className="card-footer">
                  <span className="card-badge" style={{ background: '#fef3c7', color: '#92400e' }}>Total Cost</span>
                </div>
              </div>

              {/* 5️⃣ Pending Transactions */}
              <div className="enterprise-card" style={{ display: 'flex', flexDirection: 'column', height: 'auto', minHeight: '200px' }}>
                <div className="card-header">
                  <span className="card-icon">⏳</span>
                  <h4>Pending Transactions</h4>
                </div>
                <div style={{ padding: '20px 24px', flex: 1 }}>
                  <div style={{ marginBottom: '20px' }}>
                    <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '6px', fontWeight: '600' }}>To Receive</div>
                    <div style={{ fontSize: '28px', color: '#10b981', fontWeight: '700', lineHeight: '1.2' }}>₹{formatIndianCurrency(Math.round((stats?.dealerRentals?.pendingFromDealers || 0) * 100) / 100)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '6px', fontWeight: '600' }}>To Pay Owners</div>
                    <div style={{ fontSize: '28px', color: '#ef4444', fontWeight: '700', lineHeight: '1.2' }}>₹{formatIndianCurrency(Math.round((stats?.dealerRentals?.pendingToOwners || 0) * 100) / 100)}</div>
                  </div>
                </div>
                <div className="card-footer">
                  <span className="card-badge" style={{ background: '#fef2f2', color: '#991b1b' }}>Outstanding</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
