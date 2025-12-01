import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { FaTachometerAlt, FaTractor, FaSeedling, FaBriefcase, FaMoneyBillWave, FaHandHoldingUsd, FaSignOutAlt, FaMoon, FaSun, FaReceipt, FaBuilding, FaTruck, FaChevronDown, FaChevronRight, FaPercent, FaBars, FaTimes } from 'react-icons/fa';

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'light';
  });
  
  const [expandedSections, setExpandedSections] = useState(() => {
    const saved = localStorage.getItem('expandedSections');
    return saved ? JSON.parse(saved) : { 0: true, 1: true, 2: true, 3: true };
  });

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('expandedSections', JSON.stringify(expandedSections));
  }, [expandedSections]);

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  const toggleSection = (index) => {
    setExpandedSections(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  const menuSections = [
    {
      title: 'Overview',
      items: [
        { path: '/', icon: <FaTachometerAlt />, label: 'Dashboard' },
      ]
    },
    {
      title: 'Machine Ownership',
      items: [
        { path: '/machine-owners', icon: <FaTractor />, label: 'Machine Owners' },
        { path: '/machines', icon: <FaTractor />, label: 'Machines' },
      ]
    },
    {
      title: 'Direct Harvesting',
      items: [
        { path: '/farmers', icon: <FaSeedling />, label: 'Farmers' },
        { path: '/jobs', icon: <FaBriefcase />, label: 'Harvesting Jobs' },
        { path: '/expenses', icon: <FaReceipt />, label: 'Daily Expenses' },
        { path: '/payments', icon: <FaMoneyBillWave />, label: 'Payments' },
        { path: '/discounts', icon: <FaPercent />, label: 'Discounts' },
      ]
    },
    {
      title: 'Dealer Rental System',
      items: [
        { path: '/dealers', icon: <FaBuilding />, label: 'Dealers' },
        { path: '/machine-rentals', icon: <FaTruck />, label: 'Machine Rentals' },
        { path: '/rental-payments', icon: <FaHandHoldingUsd />, label: 'Rental Payments' },
      ]
    }
  ];

  return (
    <div className="app">
      {/* Mobile Header */}
      <div className="mobile-header">
        <button className="mobile-menu-btn" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <FaTimes /> : <FaBars />}
        </button>
        <div className="logo">
          <div className="logo-icon">🚜</div>
          <div className="logo-text">
            <div className="logo-title">Munagala</div>
          </div>
        </div>
        <button 
          onClick={toggleTheme} 
          className="theme-toggle"
          style={{ background: 'none', border: 'none', color: 'var(--text-primary)', fontSize: '20px', cursor: 'pointer' }}
        >
          {theme === 'light' ? <FaMoon /> : <FaSun />}
        </button>
      </div>

      {/* Mobile Overlay */}
      <div className={`mobile-overlay ${mobileMenuOpen ? 'open' : ''}`} onClick={closeMobileMenu}></div>

      <aside className={`sidebar ${mobileMenuOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="logo">
              <div className="logo-icon">🚜</div>
              <div className="logo-text">
                <div className="logo-title">Munagala</div>
                <div className="logo-subtitle">AgriTech</div>
              </div>
            </div>
            <button 
              onClick={toggleTheme} 
              className="theme-toggle"
              title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
              {theme === 'light' ? <FaMoon /> : <FaSun />}
            </button>
          </div>
          <p style={{ fontSize: '12px', marginTop: '12px', color: 'var(--text-secondary)' }}>
            Welcome, {user?.name}
          </p>
        </div>
        <nav>
          <ul className="sidebar-menu">
            {menuSections.map((section, sectionIndex) => (
              <React.Fragment key={sectionIndex}>
                <li 
                  className="menu-section-title" 
                  onClick={() => toggleSection(sectionIndex)}
                  style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
                >
                  <span>{section.title}</span>
                  {expandedSections[sectionIndex] ? 
                    <FaChevronDown style={{ fontSize: '10px' }} /> : 
                    <FaChevronRight style={{ fontSize: '10px' }} />
                  }
                </li>
                <div className={`menu-section-items ${expandedSections[sectionIndex] ? 'expanded' : 'collapsed'}`}>
                  {section.items.map((item) => (
                    <li key={item.path}>
                      <Link
                        to={item.path}
                        className={location.pathname === item.path ? 'active' : ''}
                        onClick={closeMobileMenu}
                      >
                        {item.icon}
                        <span>{item.label}</span>
                      </Link>
                    </li>
                  ))}
                </div>
                {sectionIndex < menuSections.length - 1 && <li className="menu-divider"></li>}
              </React.Fragment>
            ))}
          </ul>
        </nav>
      </aside>
      <main className="main-content">
        <header className="top-header">
          <div className="header-content">
            <div className="header-left"></div>
            <div className="header-right">
              <button className="logout-btn-header" onClick={logout}>
                <FaSignOutAlt style={{ marginRight: '8px' }} />
                Logout
              </button>
            </div>
          </div>
        </header>
        <div className="content-wrapper">{children}</div>
      </main>
    </div>
  );
};

export default Layout;
