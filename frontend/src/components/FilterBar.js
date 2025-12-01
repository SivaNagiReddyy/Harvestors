import React from 'react';
import '../index.css';

/**
 * Reusable FilterBar Component
 * 
 * @param {Object} props
 * @param {Array} props.filters - Array of filter configurations
 * @param {Function} props.onClear - Callback when clear filters is clicked
 * @param {boolean} props.hasActiveFilters - Whether any filters are active
 * @param {string} props.resultsText - Text to display for results count
 * @param {string} props.totalText - Optional total amount text for financial pages
 * 
 * Filter configuration example:
 * {
 *   type: 'select' | 'text' | 'date',
 *   label: 'Filter Label',
 *   value: currentValue,
 *   onChange: (e) => handleChange(e.target.value),
 *   options: [{value: '', label: 'All'}], // for select type
 *   placeholder: 'Search...', // for text type
 * }
 */
const FilterBar = ({ 
  filters = [], 
  onClear, 
  hasActiveFilters = false, 
  resultsText = '',
  totalText = null 
}) => {
  return (
    <div className="filter-bar-container">
      <div className="filter-bar-grid">
        {filters.map((filter, index) => (
          <div key={index} className="filter-field">
            <label className="filter-label">{filter.label}</label>
            {filter.type === 'select' && (
              <select
                className="filter-input filter-select"
                value={filter.value}
                onChange={filter.onChange}
              >
                {filter.options?.map((option, optIndex) => (
                  <option key={optIndex} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            )}
            {filter.type === 'text' && (
              <input
                type="text"
                className="filter-input filter-text"
                value={filter.value}
                onChange={filter.onChange}
                placeholder={filter.placeholder || 'Search...'}
              />
            )}
            {filter.type === 'date' && (
              <input
                type="date"
                className="filter-input filter-date"
                value={filter.value}
                onChange={filter.onChange}
              />
            )}
          </div>
        ))}
        
        {hasActiveFilters && (
          <div className="filter-field filter-actions">
            <label className="filter-label" style={{ opacity: 0 }}>Actions</label>
            <button className="filter-clear-btn" onClick={onClear}>
              Clear Filters
            </button>
          </div>
        )}
      </div>
      
      {(resultsText || totalText) && (
        <div className="filter-results-bar">
          {resultsText && <span className="filter-results-text">{resultsText}</span>}
          {totalText && <span className="filter-total-text">{totalText}</span>}
        </div>
      )}
    </div>
  );
};

export default FilterBar;
