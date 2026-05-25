// frontend/src/components/ProfileModal.js
import React, { useState, useEffect } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import { FaUser, FaSpinner, FaSave, FaEdit } from 'react-icons/fa';
import { toast } from 'sonner';
import '../styles/Setting.css';

const ProfileModal = ({ isOpen, onClose, user, onUpdateProfile, getUserInitials, getUserRole }) => {
  const [editMode, setEditMode] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', bio: '' });

  // Sync user values dynamically whenever modal opens
  useEffect(() => {
    if (isOpen && user) {
      setFormData({
        name: user.name || user.username || '',
        email: user.email || '',
        bio: user.bio || 'Student at HolistiLearn'
      });
    }
  }, [isOpen, user]);

  const handleUpdateProfile = async () => {
    setUpdating(true);
    try {
      await onUpdateProfile(formData);
      setEditMode(false);
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <Modal 
      show={isOpen} 
      onHide={onClose}
      centered
      backdrop="static"
      className="hl-custom-modal-container"
      contentClassName="hl-profile-modal"
    >
      <Modal.Header className="hl-modal-header">
        <Modal.Title className="hl-modal-title">
          <FaUser className="me-2 text-warning" /> My Profile
        </Modal.Title>
        <button type="button" className="hl-modal-close-btn" onClick={onClose} aria-label="Close">×</button>
      </Modal.Header>

      <Modal.Body className="hl-modal-body">
        <div className="hl-profile-avatar-section text-center mb-4">
          <div className="hl-profile-avatar-large mx-auto">
            <span>{getUserInitials()}</span>
          </div>
          <h5 className="mt-3 mb-1 text-white">{user?.name || user?.username || 'User'}</h5>
          <span className="hl-profile-role-badge">{getUserRole()}</span>
        </div>

        {!editMode ? (
          <div className="hl-profile-info-view">
            <div className="hl-info-card">
              <label>Full Name</label>
              <p>{user?.name || user?.username || 'Not set'}</p>
            </div>
            <div className="hl-info-card">
              <label>Email Address</label>
              <p>{user?.email || 'Not set'}</p>
            </div>
            <div className="hl-info-card">
              <label>Bio</label>
              <p>{user?.bio || 'Student at HolistiLearn'}</p>
            </div>
            <div className="hl-info-card">
              <label>Member Since</label>
              <p>{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Recently'}</p>
            </div>
          </div>
        ) : (
          <div className="hl-profile-info-edit">
            <Form.Group className="mb-3">
              <Form.Label className="hl-input-label">Full Name</Form.Label>
              <Form.Control 
                type="text" 
                className="hl-input-field"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="hl-input-label">Email Address</Form.Label>
              <Form.Control 
                type="email" 
                className="hl-input-field hl-input-disabled"
                value={formData.email}
                disabled
              />
              <Form.Text className="text-muted small">Account registration identities cannot be modified.</Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label className="hl-input-label">Bio</Form.Label>
              <Form.Control 
                as="textarea" 
                rows={3}
                className="hl-input-field"
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              />
            </Form.Group>
          </div>
        )}
      </Modal.Body>

      <Modal.Footer className="hl-modal-footer">
        {!editMode ? (
          <>
            <Button className="hl-btn hl-btn-secondary" onClick={onClose}>Close</Button>
            <Button className="hl-btn hl-btn-warning" onClick={() => setEditMode(true)}>
              <FaEdit className="me-2" /> Edit Profile
            </Button>
          </>
        ) : (
          <>
            <Button className="hl-btn hl-btn-secondary" onClick={() => setEditMode(false)}>Cancel</Button>
            <Button className="hl-btn hl-btn-success" onClick={handleUpdateProfile} disabled={updating}>
              {updating ? <FaSpinner className="hl-spinner me-2" /> : <FaSave className="me-2" />} Save Changes
            </Button>
          </>
        )}
      </Modal.Footer>
    </Modal>
  );
};

export default ProfileModal;