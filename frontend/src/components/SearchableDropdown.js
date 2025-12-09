import React, { useState, useEffect, useRef } from 'react';

const SearchableDropdown = ({ 
  options = [], 
  value, 
  onChange, 
  placeholder = "Search...", 
  displayKey = "name",
  valueKey = "id",
  allOptionLabel = "All"
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Get display text for selected value
  const getDisplayText = () => {
    if (!value) return allOptionLabel;
    const selected = options.find(opt => 
      typeof opt === 'string' ? opt === value : opt[valueKey] === value
    );
    if (!selected) return allOptionLabel;
    if (typeof selected === 'string') return selected;
    if (typeof displayKey === 'function') return displayKey(selected);
    return selected[displayKey];
  };

  // Filter options based on search term
  const filteredOptions = options.filter(option => {
    let text;
    if (typeof option === 'string') {
      text = option;
    } else if (typeof displayKey === 'function') {
      text = displayKey(option);
    } else {
      text = option[displayKey];
    }
    return text.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
        setSearchTerm('');
      }
    };
    
    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showDropdown]);

  const handleSelect = (option) => {
    const val = typeof option === 'string' ? option : option[valueKey];
    onChange(val);
    setShowDropdown(false);
    setSearchTerm('');
  };

  return (
    <div ref={dropdownRef} style={{ position: 'relative', width: '100%' }}>
      <input
        type="text"
        value={showDropdown ? searchTerm : getDisplayText()}
        onChange={(e) => setSearchTerm(e.target.value)}
        onFocus={() => setShowDropdown(true)}
        placeholder={placeholder}
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
      />
      {showDropdown && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            maxHeight: '200px',
            overflowY: 'auto',
            backgroundColor: 'rgba(30, 41, 59, 0.98)',
            border: '1px solid rgba(100, 116, 139, 0.3)',
            borderRadius: '8px',
            marginTop: '4px',
            zIndex: 1000,
            boxShadow: '0 4px 6px rgba(0,0,0,0.3)'
          }}
        >
          {/* "All" option */}
          <div
            onClick={() => handleSelect('')}
            style={{
              padding: '10px',
              cursor: 'pointer',
              borderBottom: '1px solid rgba(100, 116, 139, 0.2)',
              fontSize: '13px',
              color: value === '' ? '#3b82f6' : '#cbd5e1',
              backgroundColor: value === '' ? 'rgba(59, 130, 246, 0.1)' : 'transparent'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(100, 116, 139, 0.2)'}
            onMouseLeave={(e) => e.target.style.backgroundColor = value === '' ? 'rgba(59, 130, 246, 0.1)' : 'transparent'}
          >
            {allOptionLabel}
          </div>
          
          {/* Filtered options */}
          {filteredOptions.map((option, index) => {
            const optionValue = typeof option === 'string' ? option : option[valueKey];
            let optionText;
            if (typeof option === 'string') {
              optionText = option;
            } else if (typeof displayKey === 'function') {
              optionText = displayKey(option);
            } else {
              optionText = option[displayKey];
            }
            const isSelected = optionValue === value;
            
            return (
              <div
                key={index}
                onClick={() => handleSelect(option)}
                style={{
                  padding: '10px',
                  cursor: 'pointer',
                  borderBottom: index < filteredOptions.length - 1 ? '1px solid rgba(100, 116, 139, 0.2)' : 'none',
                  fontSize: '13px',
                  color: isSelected ? '#3b82f6' : '#cbd5e1',
                  backgroundColor: isSelected ? 'rgba(59, 130, 246, 0.1)' : 'transparent'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(100, 116, 139, 0.2)'}
                onMouseLeave={(e) => e.target.style.backgroundColor = isSelected ? 'rgba(59, 130, 246, 0.1)' : 'transparent'}
              >
                {optionText}
              </div>
            );
          })}
          
          {filteredOptions.length === 0 && (
            <div style={{ padding: '10px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
              No results found
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchableDropdown;
