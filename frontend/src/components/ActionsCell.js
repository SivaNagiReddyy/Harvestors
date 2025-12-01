import React from 'react';
import { FaEdit, FaTrash } from 'react-icons/fa';

/**
 * ActionsCell - Reusable component for table action buttons
 * @param {Function} onEdit - Handler for edit button click (optional)
 * @param {Function} onDelete - Handler for delete button click (optional)
 * @param {string} editTitle - Tooltip text for edit button (default: "Edit")
 * @param {string} deleteTitle - Tooltip text for delete button (default: "Delete")
 * @param {boolean} showEdit - Show edit button (default: true)
 * @param {boolean} showDelete - Show delete button (default: true)
 * @param {boolean} editDisabled - Disable edit button (default: false)
 * @param {boolean} deleteDisabled - Disable delete button (default: false)
 */
const ActionsCell = ({ 
  onEdit, 
  onDelete, 
  editTitle = "Edit", 
  deleteTitle = "Delete",
  showEdit = true,
  showDelete = true,
  editDisabled = false,
  deleteDisabled = false
}) => {
  return (
    <div className="action-buttons">
      {showEdit && onEdit && (
        <button 
          className="action-btn action-btn-edit" 
          onClick={onEdit} 
          title={editTitle}
          aria-label={editTitle}
          disabled={editDisabled}
        >
          <FaEdit />
        </button>
      )}
      {showDelete && onDelete && (
        <button 
          className="action-btn action-btn-delete" 
          onClick={onDelete} 
          title={deleteTitle}
          aria-label={deleteTitle}
          disabled={deleteDisabled}
        >
          <FaTrash />
        </button>
      )}
    </div>
  );
};

export default ActionsCell;
