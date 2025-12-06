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

  const fetchMachines = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5001/api'}/machines`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      setMachines(data);
    } catch (error) {
      console.error('Error fetching machines:', error);
    }
  };

  const fetchVillages = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5001/api'}/farmers`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      const uniqueVillages = [...new Set(data.map(f => f.village).filter(Boolean))];
      setVillages(uniqueVillages.sort());
    } catch (error) {
      console.error('Error fetching villages:', error);
    }
  };

  const fetchStats = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (selectedMachine) params.append('machine_id', selectedMachine);
      if (selectedVillage) params.append('village', selectedVillage);
      const queryParam = params.toString() ? `?${params.toString()}` : '';
      const response = await dashboardAPI.getStats(queryParam);
      console.log('Dashboard stats received:', response.data);
      console.log('Total Machines count:', response.data?.counts?.totalMachines);
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
              <div className="enterprise-card revenue-card">
                <div className="card-header">
                  <span className="card-icon">💰</span>
                  <h4>Total Revenue</h4>
                </div>
                <div className="card-amount positive">₹{(Math.round((stats?.combined?.totalRevenue || 0) * 100) / 100).toLocaleString()}</div>
                <p className="card-description">From all business sections</p>
                <div className="card-footer">
                  <span className="card-badge success">Combined Income</span>
                </div>
              </div>

              <div className="enterprise-card profit-card">
                <div className="card-header">
                  <span className="card-icon">📊</span>
                  <h4>Total Profit</h4>
                </div>
                <div className="card-amount profit">₹{(Math.round((stats?.combined?.totalProfit || 0) * 100) / 100).toLocaleString()}</div>
                <p className="card-description">Combined profit margin</p>
                <div className="card-footer">
                  <span className="card-badge info">Net Income</span>
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
                    <span className="breakdown-value">₹{(Math.round((stats?.harvesting?.profit || 0) * 100) / 100).toLocaleString()}</span>
                    <span className="breakdown-sublabel">Profit contribution</span>
                  </div>
                </div>
                <div className="breakdown-card">
                  <div className="breakdown-icon">🏢</div>
                  <div className="breakdown-details">
                    <span className="breakdown-label">Dealer Rental System</span>
                    <span className="breakdown-value">₹{(Math.round((stats?.dealerRentals?.totalProfit || 0) * 100) / 100).toLocaleString()}</span>
                    <span className="breakdown-sublabel">Profit contribution</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="metrics-breakdown">
              <h4 className="subsection-title">Pending Transactions</h4>
              <div className="breakdown-grid">
                <div className="breakdown-card receivable">
                  <div className="breakdown-icon">⬇️</div>
                  <div className="breakdown-details">
                    <span className="breakdown-label">To Receive (Combined)</span>
                    <span className="breakdown-value">₹{(Math.round(((stats?.harvesting?.pendingFromFarmers || 0) + (stats?.dealerRentals?.pendingFromDealers || 0)) * 100) / 100).toLocaleString()}</span>
                    <span className="breakdown-sublabel">From farmers & dealers</span>
                  </div>
                </div>
                <div className="breakdown-card payable">
                  <div className="breakdown-icon">⬆️</div>
                  <div className="breakdown-details">
                    <span className="breakdown-label">To Pay to Owners</span>
                    <span className="breakdown-value">₹{(Math.round((stats?.harvesting?.totalToPayToOwners || 0) * 100) / 100).toLocaleString()}</span>
                    <span className="breakdown-sublabel">Total owner cost (at agreed rate)</span>
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
              <div className="enterprise-card revenue-card">
                <div className="card-header">
                  <span className="card-icon">💰</span>
                  <h4>Revenue</h4>
                </div>
                <div className="card-amount positive">₹{(Math.round((stats?.harvesting?.totalRevenue || 0) * 100) / 100).toLocaleString()}</div>
                <p className="card-description">Total charged to farmers</p>
                <div className="card-footer">
                  <span className="card-badge success">Income</span>
                </div>
              </div>

              <div className="enterprise-card costs-card">
                <div className="card-header">
                  <span className="card-icon">💸</span>
                  <h4>To Pay to Owners</h4>
                </div>
                <div className="card-amount negative">₹{(Math.round((stats?.harvesting?.totalToPayToOwners || 0) * 100) / 100).toLocaleString()}</div>
                <p className="card-description">Total owner cost (at agreed rate)</p>
                <div className="card-footer">
                  <span className="card-badge danger">Expense</span>
                </div>
              </div>

              <div className="enterprise-card profit-card">
                <div className="card-header">
                  <span className="card-icon">📈</span>
                  <h4>Net Profit</h4>
                </div>
                <div className="card-amount profit">₹{(Math.round((stats?.harvesting?.profit || 0) * 100) / 100).toLocaleString()}</div>
                <p className="card-description">Revenue minus costs</p>
                <div className="card-footer">
                  <span className="card-badge info">Net Income</span>
                </div>
              </div>
            </div>

            <div className="metrics-breakdown">
              <h4 className="subsection-title">Discount Summary</h4>
              <div className="breakdown-grid">
                <div className="breakdown-card receivable">
                  <div className="breakdown-icon">✅</div>
                  <div className="breakdown-details">
                    <span className="breakdown-label">Discounts from Owners</span>
                    <span className="breakdown-value" style={{color: '#10b981'}}>₹{(Math.round((stats?.harvesting?.totalDiscountsFromOwners || 0) * 100) / 100).toLocaleString()}</span>
                    <span className="breakdown-sublabel">Savings on payments to owners</span>
                  </div>
                </div>
                <div className="breakdown-card payable">
                  <div className="breakdown-icon">🎁</div>
                  <div className="breakdown-details">
                    <span className="breakdown-label">Discounts to Farmers</span>
                    <span className="breakdown-value" style={{color: '#ef4444'}}>₹{(Math.round((stats?.harvesting?.totalDiscountsToFarmers || 0) * 100) / 100).toLocaleString()}</span>
                    <span className="breakdown-sublabel">Revenue reduction for farmers</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="metrics-breakdown">
              <h4 className="subsection-title">Pending Transactions</h4>
              <div className="breakdown-grid">
                <div className="breakdown-card receivable">
                  <div className="breakdown-icon">⬇️</div>
                  <div className="breakdown-details">
                    <span className="breakdown-label">To Receive from Farmers</span>
                    <span className="breakdown-value">₹{(Math.round((stats?.harvesting?.pendingFromFarmers || 0) * 100) / 100).toLocaleString()}</span>
                    <span className="breakdown-sublabel">Accounts receivable</span>
                  </div>
                </div>
                <div className="breakdown-card payable">
                  <div className="breakdown-icon">⬆️</div>
                  <div className="breakdown-details">
                    <span className="breakdown-label">To Pay to Owners</span>
                    <span className="breakdown-value">₹{(Math.round((stats?.harvesting?.pendingToOwners || 0) * 100) / 100).toLocaleString()}</span>
                    <span className="breakdown-sublabel">Accounts payable</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* DEALER RENTAL TAB */}
        {activeTab === 'dealer' && (
          <div className="enterprise-section">
            <div className="enterprise-grid">
              <div className="enterprise-card revenue-card">
                <div className="card-header">
                  <span className="card-icon">💰</span>
                  <h4>Revenue from Dealers</h4>
                </div>
                <div className="card-amount positive">₹{(Math.round((stats?.dealerRentals?.totalRevenue || 0) * 100) / 100).toLocaleString()}</div>
                <p className="card-description">Total charged to dealers</p>
                <div className="card-footer">
                  <span className="card-badge success">Income</span>
                </div>
              </div>

              <div className="enterprise-card costs-card">
                <div className="card-header">
                  <span className="card-icon">💸</span>
                  <h4>Cost to Owners</h4>
                </div>
                <div className="card-amount negative">₹{(Math.round((stats?.dealerRentals?.totalOwnerCost || 0) * 100) / 100).toLocaleString()}</div>
                <p className="card-description">Total to pay owners</p>
                <div className="card-footer">
                  <span className="card-badge danger">Expense</span>
                </div>
              </div>

              <div className="enterprise-card profit-card">
                <div className="card-header">
                  <span className="card-icon">📊</span>
                  <h4>Commission Earned</h4>
                </div>
                <div className="card-amount profit">₹{(Math.round((stats?.dealerRentals?.totalProfit || 0) * 100) / 100).toLocaleString()}</div>
                <p className="card-description">Total commission profit</p>
                <div className="card-footer">
                  <span className="card-badge info">Net Income</span>
                </div>
              </div>
            </div>

            <div className="metrics-breakdown">
              <h4 className="subsection-title">Billing Status</h4>
              <div className="breakdown-grid">
                <div className="breakdown-card payable">
                  <div className="breakdown-icon">⬆️</div>
                  <div className="breakdown-details">
                    <span className="breakdown-label">To Pay to Owners</span>
                    <span className="breakdown-value">₹{(Math.round((stats?.dealerRentals?.pendingToOwners || 0) * 100) / 100).toLocaleString()}</span>
                    <span className="breakdown-sublabel">Accounts payable</span>
                  </div>
                </div>
                <div className="breakdown-card receivable">
                  <div className="breakdown-icon">⬇️</div>
                  <div className="breakdown-details">
                    <span className="breakdown-label">Pending from Dealers</span>
                    <span className="breakdown-value">₹{(Math.round((stats?.dealerRentals?.pendingFromDealers || 0) * 100) / 100).toLocaleString()}</span>
                    <span className="breakdown-sublabel">Accounts receivable</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="metrics-breakdown">
              <h4 className="subsection-title">Operational Metrics</h4>
              <div className="breakdown-grid">
                <div className="breakdown-card">
                  <div className="breakdown-icon">🚜</div>
                  <div className="breakdown-details">
                    <span className="breakdown-label">Total Rentals</span>
                    <span className="breakdown-value">{stats?.counts?.totalRentals || 0}</span>
                    <span className="breakdown-sublabel">All time rentals</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="metrics-breakdown">
              <h4 className="subsection-title">Dealer Information</h4>
              <div className="breakdown-grid">
                <div className="breakdown-card">
                  <div className="breakdown-icon">🏢</div>
                  <div className="breakdown-details">
                    <span className="breakdown-label">Total Dealers</span>
                    <span className="breakdown-value">{stats?.counts?.totalDealers || 0}</span>
                    <span className="breakdown-sublabel">Active partnerships</span>
                  </div>
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
