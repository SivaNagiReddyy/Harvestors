import React, { useState, useEffect } from 'react';
import { fieldAPI, farmerAPI } from '../api';
import { FaPlus } from 'react-icons/fa';
import ActionsCell from '../components/ActionsCell';

const Fields = () => {
  const [fields, setFields] = useState([]);
  const [farmers, setFarmers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingField, setEditingField] = useState(null);
  const [formData, setFormData] = useState({
    farmer: '',
    location: '',
    village: '',
    surveyNumber: '',
    acres: '',
    cropType: '',
    ratePerHour: '',
    status: 'Available'
  });

  useEffect(() => {
    fetchFields();
    fetchFarmers();
  }, []);

  const fetchFields = async () => {
    try {
      const response = await fieldAPI.getAll();
      setFields(response.data);
    } catch (error) {
      console.error('Error fetching fields:', error);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingField) {
        await fieldAPI.update(editingField._id, formData);
      } else {
        await fieldAPI.create(formData);
      }
      fetchFields();
      handleCloseModal();
    } catch (error) {
      alert(error.response?.data?.error || 'Error saving field');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this field?')) {
      try {
        await fieldAPI.delete(id);
        fetchFields();
      } catch (error) {
        alert(error.response?.data?.error || 'Error deleting field');
      }
    }
  };

  const handleEdit = (field) => {
    setEditingField(field);
    setFormData({
      farmer: field.farmer._id,
      location: field.location,
      village: field.village,
      surveyNumber: field.surveyNumber,
      acres: field.acres,
      cropType: field.cropType,
      ratePerHour: field.ratePerHour,
      status: field.status
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingField(null);
    setFormData({
      farmer: '',
      location: '',
      village: '',
      surveyNumber: '',
      acres: '',
      cropType: '',
      ratePerHour: '',
      status: 'Available'
    });
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div>
      <div className="page-header">
        <h2>Fields</h2>
        <p>Manage agricultural fields</p>
      </div>

      <div className="table-container">
        <div className="table-header">
          <h3>All Fields</h3>
          <button className="btn btn-success" onClick={() => setShowModal(true)}>
            <FaPlus /> Add Field
          </button>
        </div>
        <table>
          <thead>
            <tr>
              <th>Farmer</th>
              <th>Location</th>
              <th>Village</th>
              <th>Survey No.</th>
              <th>Acres</th>
              <th>Crop Type</th>
              <th>Rate/Acre</th>
              <th>Total Amount</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {fields.length > 0 ? (
              fields.map((field) => (
                <tr key={field._id}>
                  <td>{field.farmer?.name}</td>
                  <td>{field.location}</td>
                  <td>{field.village}</td>
                  <td>{field.surveyNumber || '-'}</td>
                  <td>{field.acres}</td>
                  <td>{field.cropType}</td>
                  <td>₹{field.ratePerHour}</td>
                  <td>₹{field.totalAmount?.toLocaleString()}</td>
                  <td>
                    <span className={`status-badge ${field.status.toLowerCase()}`}>
                      {field.status}
                    </span>
                  </td>
                  <td>
                    <ActionsCell
                      onEdit={() => handleEdit(field)}
                      onDelete={() => handleDelete(field._id)}
                    />
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="10" style={{ textAlign: 'center', padding: '40px' }}>
                  No fields found. Add your first field!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>{editingField ? 'Edit Field' : 'Add Field'}</h2>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Farmer <span className="required-star">*</span></label>
                  <select
                    value={formData.farmer}
                    onChange={(e) => setFormData({ ...formData, farmer: e.target.value })}
                    required
                  >
                    <option value="">Select Farmer</option>
                    {farmers.map((farmer) => (
                      <option key={farmer._id} value={farmer._id}>
                        {farmer.name} - {farmer.village}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Location <span className="required-star">*</span></label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      placeholder="Field location"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Village <span className="required-star">*</span></label>
                    <input
                      type="text"
                      value={formData.village}
                      onChange={(e) => setFormData({ ...formData, village: e.target.value })}
                      placeholder="Village name"
                      required
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Survey Number</label>
                    <input
                      type="text"
                      value={formData.surveyNumber}
                      onChange={(e) => setFormData({ ...formData, surveyNumber: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Acres *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.acres}
                      onChange={(e) => setFormData({ ...formData, acres: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Crop Type *</label>
                    <select
                      value={formData.cropType}
                      onChange={(e) => setFormData({ ...formData, cropType: e.target.value })}
                      required
                    >
                      <option value="Paddy">Paddy</option>
                      <option value="Wheat">Wheat</option>
                      <option value="Corn">Corn</option>
                      <option value="Cotton">Cotton</option>
                      <option value="Sugarcane">Sugarcane</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Rate Per Hour (₹) *</label>
                    <input
                      type="number"
                      value={formData.ratePerHour}
                      onChange={(e) => setFormData({ ...formData, ratePerHour: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="Available">Available</option>
                    <option value="Assigned">Assigned</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>

              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={handleCloseModal}>Cancel</button>
                <button type="submit" className="btn-primary">
                  {editingField ? 'Update Field' : 'Add Field'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Fields;
