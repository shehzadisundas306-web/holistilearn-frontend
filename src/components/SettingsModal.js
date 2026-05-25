// frontend/src/components/SettingsModal.js
import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Tab, Tabs } from 'react-bootstrap';
import { FaBell, FaBook, FaLock, FaPalette, FaSave, FaSun, FaMoon, FaLaptop, FaCog, FaSpinner } from 'react-icons/fa';
import { toast } from 'sonner';
import settingsService from '../services/settingsService';

const SettingsModal = ({ isOpen, onClose }) => {
  const [settings, setSettings] = useState(settingsService.getAllSettings());
  const [activeTab, setActiveTab] = useState('notifications');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSettings(settingsService.getAllSettings());
    }
  }, [isOpen]);

  useEffect(() => {
    const unsubscribe = settingsService.on('settings-changed', (newSettings) => {
      setSettings(newSettings);
    });
    return () => unsubscribe();
  }, []);

  const updateSetting = (category, key, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: { ...prev[category], [key]: value }
    }));
    settingsService.updateSetting(category, key, value);
    toast.success(`${getSettingLabel(category, key)} updated`, { duration: 1500 });
  };

  const getSettingLabel = (category, key) => {
    const labels = {
      notifications: { email: 'Email notifications', push: 'Push notifications', weeklyReport: 'Weekly reports', sound: 'Sound effects', desktop: 'Desktop notifications' },
      learning: { dailyGoal: 'Daily study goal', preferredDifficulty: 'Difficulty level', learningStyle: 'Learning style' },
      privacy: { publicProfile: 'Public profile', showOnLeaderboard: 'Leaderboard visibility' }
    };
    return labels[category]?.[key] || key;
  };

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      toast.success('All configurations committed successfully! 🎉');
      onClose();
    } catch (error) {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal 
      show={isOpen} 
      onHide={onClose}
      centered
      size="lg"
      backdrop="static"
      className="hl-custom-modal-container"
      contentClassName="hl-settings-modal"
    >
      <Modal.Header className="hl-modal-header">
        <Modal.Title className="hl-modal-title">
          <FaCog className="me-2 text-warning hl-gear-spin" /> Control Workspace
        </Modal.Title>
        <button type="button" className="hl-modal-close-btn" onClick={onClose}>×</button>
      </Modal.Header>

      <Modal.Body className="hl-modal-body p-0">
        <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className="hl-tabs-nav" fill>
          <Tab eventKey="notifications" title={<span><FaBell className="me-2" />Alerts</span>}>
            <div className="hl-tab-card-body p-4">
              <div className="hl-setting-card">
                <div className="hl-setting-text">
                  <h6>Email Transmissions</h6>
                  <p>Get essential updates detailing assignment variations and grading indices.</p>
                </div>
                <Form.Check type="switch" id="email-sw" checked={settings.notifications?.email} onChange={(e) => updateSetting('notifications', 'email', e.target.checked)} className="hl-toggle-switch" />
              </div>
              <div className="hl-setting-card">
                <div className="hl-setting-text">
                  <h6>Real-Time Push Streams</h6>
                  <p>Receive immediate alerts regarding live classroom sessions.</p>
                </div>
                <Form.Check type="switch" id="push-sw" checked={settings.notifications?.push} onChange={(e) => updateSetting('notifications', 'push', e.target.checked)} className="hl-toggle-switch" />
              </div>
              <div className="hl-setting-card">
                <div className="hl-setting-text">
                  <h6>Acoustic Feedback Alerts</h6>
                  <p>Enable unique chimes for application state changes.</p>
                </div>
                <Form.Check type="switch" id="sound-sw" checked={settings.notifications?.sound} onChange={(e) => updateSetting('notifications', 'sound', e.target.checked)} className="hl-toggle-switch" />
              </div>
            </div>
          </Tab>

          <Tab eventKey="learning" title={<span><FaBook className="me-2" />Learning</span>}>
            <div className="hl-tab-card-body p-4">
              <div className="hl-select-group mb-4">
                <label className="hl-input-label">Daily Development Threshold</label>
                <Form.Select value={settings.learning?.dailyGoal} onChange={(e) => updateSetting('learning', 'dailyGoal', parseInt(e.target.value))} className="hl-dropdown-control">
                  <option value="30">30 Minutes</option>
                  <option value="60">1 Hour</option>
                  <option value="120">2 Hours</option>
                </Form.Select>
              </div>
              <div className="hl-select-group">
                <label className="hl-input-label">Primary UI Architecture Focus</label>
                <Form.Select value={settings.learning?.learningStyle} onChange={(e) => updateSetting('learning', 'learningStyle', e.target.value)} className="hl-dropdown-control">
                  <option value="visual">Visual - High Resolution Diagrams</option>
                  <option value="kinesthetic">Practical - Continuous Source Sandbox</option>
                </Form.Select>
              </div>
            </div>
          </Tab>

          <Tab eventKey="privacy" title={<span><FaLock className="me-2" />Privacy</span>}>
            <div className="hl-tab-card-body p-4">
              <div className="hl-setting-card">
                <div className="hl-setting-text">
                  <h6>Public Visibility Index</h6>
                  <p>Expose profile statistics to authorized academic personnel.</p>
                </div>
                <Form.Check type="switch" id="privacy-sw" checked={settings.privacy?.publicProfile} onChange={(e) => updateSetting('privacy', 'publicProfile', e.target.checked)} className="hl-toggle-switch" />
              </div>
            </div>
          </Tab>

        </Tabs>
      </Modal.Body>

      <Modal.Footer className="hl-modal-footer">
        <Button className="hl-btn hl-btn-secondary" onClick={onClose}>Close</Button>
        <Button className="hl-btn hl-btn-warning" onClick={handleSaveAll} disabled={saving}>
          {saving ? <FaSpinner className="hl-spinner me-2" /> : <FaSave className="me-2" />} Save Changes
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default SettingsModal;