

// frontend/src/pages/admin/Settings.jsx
import React, { useState, useEffect } from 'react';
import { 
  Shield, Bell, Database, Mail, Globe, Lock, Moon, Sun,
  Save, RefreshCw, AlertTriangle, CheckCircle, XCircle,
  UserCheck, FileQuestion, School, Users, Zap, Eye, EyeOff
} from 'lucide-react';
import { getSystemSettings, updateSystemSettings } from '../../api/adminApi';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { toast } from 'sonner';
import '../../styles/admin/AdminSettings.css';

const Settings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState({
    // General Settings
    siteName: 'HolistiLearn',
    siteDescription: 'AI-Powered Learning Platform',
    contactEmail: 'admin@holistilearn.com',
    
    // AI Settings
    aiQuizLimit: 10,
    aiTemperature: 0.7,
    aiMaxTokens: 2000,
    enableAIGeneration: true,
    
    // Platform Limits
    maxClassSize: 100,
    maxQuizAttempts: 3,
    quizTimeLimit: 60,
    maxFileSize: 10,
    
    // Security Settings
    requireEmailVerification: true,
    enableTwoFactor: false,
    sessionTimeout: 30,
    passwordMinLength: 6,
    
    // Notification Settings
    emailNotifications: true,
    pushNotifications: true,
    desktopNotifications: true,
    
    // Feature Toggles
    enableChat: true,
    enableLiveClasses: true,
    enableLearningPaths: true,
    enableAchievements: true,
    
    // Appearance
    theme: 'dark',
    primaryColor: '#F5C45E',
    
    // Maintenance
    maintenanceMode: false,
    maintenanceMessage: 'We are currently performing maintenance. Please check back soon.'
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const response = await getSystemSettings();
      if (response.success) {
        setSettings(prev => ({ ...prev, ...response.settings }));
      }
    } catch (error) {
      console.error('Fetch settings error:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await updateSystemSettings(settings);
      if (response.success) {
        toast.success('Settings saved successfully');
      } else {
        toast.error(response.message || 'Failed to save settings');
      }
    } catch (error) {
      console.error('Save settings error:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset all settings to default?')) {
      window.location.reload();
    }
  };

  const tabs = [
    { id: 'general', label: 'General', icon: Globe },
    { id: 'ai', label: 'AI Settings', icon: Zap },
    { id: 'limits', label: 'Platform Limits', icon: Shield },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'features', label: 'Features', icon: FileQuestion },
    { id: 'appearance', label: 'Appearance', icon: Sun },
    { id: 'maintenance', label: 'Maintenance', icon: Database }
  ];

  if (loading) return <LoadingSpinner text="Loading settings..." />;

  return (
    <div className="admin-settings-page">
      <div className="admin-settings-header">
        <h2>System Settings</h2>
        <p>Configure platform settings and manage system preferences</p>
      </div>

      <div className="admin-settings-container">
        <div className="admin-settings-sidebar">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`admin-settings-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <tab.icon size={18} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="admin-settings-content">
          {/* General Settings */}
          {activeTab === 'general' && (
            <div className="admin-settings-section">
              <h3>General Settings</h3>
              <div className="admin-settings-form">
                <div className="admin-form-group">
                  <label>Site Name</label>
                  <input
                    type="text"
                    value={settings.siteName}
                    onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                  />
                </div>
                <div className="admin-form-group">
                  <label>Site Description</label>
                  <textarea
                    value={settings.siteDescription}
                    onChange={(e) => setSettings({ ...settings, siteDescription: e.target.value })}
                    rows="3"
                  />
                </div>
                <div className="admin-form-group">
                  <label>Contact Email</label>
                  <input
                    type="email"
                    value={settings.contactEmail}
                    onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                  />
                </div>
              </div>
            </div>
          )}

          {/* AI Settings */}
          {activeTab === 'ai' && (
            <div className="admin-settings-section">
              <h3>AI Configuration</h3>
              <div className="admin-settings-form">
                <div className="admin-form-group">
                  <label>Max Quiz Questions per Generation</label>
                  <input
                    type="number"
                    value={settings.aiQuizLimit}
                    onChange={(e) => setSettings({ ...settings, aiQuizLimit: parseInt(e.target.value) })}
                    min="5"
                    max="50"
                  />
                </div>
                <div className="admin-form-group">
                  <label>AI Temperature (Creativity)</label>
                  <div className="admin-range-container">
                    <input
                      type="range"
                      value={settings.aiTemperature}
                      onChange={(e) => setSettings({ ...settings, aiTemperature: parseFloat(e.target.value) })}
                      min="0"
                      max="1"
                      step="0.1"
                    />
                    <span className="admin-range-value">{settings.aiTemperature}</span>
                  </div>
                </div>
                <div className="admin-form-group">
                  <label>Max Tokens per Request</label>
                  <select
                    value={settings.aiMaxTokens}
                    onChange={(e) => setSettings({ ...settings, aiMaxTokens: parseInt(e.target.value) })}
                  >
                    <option value="1000">1,000 tokens</option>
                    <option value="2000">2,000 tokens</option>
                    <option value="4000">4,000 tokens</option>
                    <option value="8000">8,000 tokens</option>
                  </select>
                </div>
                <div className="admin-form-group admin-toggle-group">
                  <label>Enable AI Generation</label>
                  <button
                    className={`admin-toggle-switch ${settings.enableAIGeneration ? 'active' : ''}`}
                    onClick={() => setSettings({ ...settings, enableAIGeneration: !settings.enableAIGeneration })}
                  >
                    {settings.enableAIGeneration ? <CheckCircle size={16} /> : <XCircle size={16} />}
                    {settings.enableAIGeneration ? 'Enabled' : 'Disabled'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Platform Limits */}
          {activeTab === 'limits' && (
            <div className="admin-settings-section">
              <h3>Platform Limits</h3>
              <div className="admin-settings-form">
                <div className="admin-form-group">
                  <label>Maximum Students per Class</label>
                  <input
                    type="number"
                    value={settings.maxClassSize}
                    onChange={(e) => setSettings({ ...settings, maxClassSize: parseInt(e.target.value) })}
                    min="10"
                    max="500"
                  />
                </div>
                <div className="admin-form-group">
                  <label>Maximum Quiz Attempts per Student</label>
                  <input
                    type="number"
                    value={settings.maxQuizAttempts}
                    onChange={(e) => setSettings({ ...settings, maxQuizAttempts: parseInt(e.target.value) })}
                    min="1"
                    max="10"
                  />
                </div>
                <div className="admin-form-group">
                  <label>Default Quiz Time Limit (minutes)</label>
                  <input
                    type="number"
                    value={settings.quizTimeLimit}
                    onChange={(e) => setSettings({ ...settings, quizTimeLimit: parseInt(e.target.value) })}
                    min="5"
                    max="180"
                  />
                </div>
                <div className="admin-form-group">
                  <label>Max File Upload Size (MB)</label>
                  <input
                    type="number"
                    value={settings.maxFileSize}
                    onChange={(e) => setSettings({ ...settings, maxFileSize: parseInt(e.target.value) })}
                    min="1"
                    max="100"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Security Settings */}
          {activeTab === 'security' && (
            <div className="admin-settings-section">
              <h3>Security Settings</h3>
              <div className="admin-settings-form">
                <div className="admin-form-group admin-toggle-group">
                  <label>Require Email Verification</label>
                  <button
                    className={`admin-toggle-switch ${settings.requireEmailVerification ? 'active' : ''}`}
                    onClick={() => setSettings({ ...settings, requireEmailVerification: !settings.requireEmailVerification })}
                  >
                    {settings.requireEmailVerification ? <CheckCircle size={16} /> : <XCircle size={16} />}
                    {settings.requireEmailVerification ? 'Enabled' : 'Disabled'}
                  </button>
                </div>
                <div className="admin-form-group admin-toggle-group">
                  <label>Enable Two-Factor Authentication</label>
                  <button
                    className={`admin-toggle-switch ${settings.enableTwoFactor ? 'active' : ''}`}
                    onClick={() => setSettings({ ...settings, enableTwoFactor: !settings.enableTwoFactor })}
                  >
                    {settings.enableTwoFactor ? <CheckCircle size={16} /> : <XCircle size={16} />}
                    {settings.enableTwoFactor ? 'Enabled' : 'Disabled'}
                  </button>
                </div>
                <div className="admin-form-group">
                  <label>Session Timeout (minutes)</label>
                  <input
                    type="number"
                    value={settings.sessionTimeout}
                    onChange={(e) => setSettings({ ...settings, sessionTimeout: parseInt(e.target.value) })}
                    min="5"
                    max="120"
                  />
                </div>
                <div className="admin-form-group">
                  <label>Minimum Password Length</label>
                  <input
                    type="number"
                    value={settings.passwordMinLength}
                    onChange={(e) => setSettings({ ...settings, passwordMinLength: parseInt(e.target.value) })}
                    min="6"
                    max="20"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Notification Settings */}
          {activeTab === 'notifications' && (
            <div className="admin-settings-section">
              <h3>Notification Settings</h3>
              <div className="admin-settings-form">
                <div className="admin-form-group admin-toggle-group">
                  <label>Email Notifications</label>
                  <button
                    className={`admin-toggle-switch ${settings.emailNotifications ? 'active' : ''}`}
                    onClick={() => setSettings({ ...settings, emailNotifications: !settings.emailNotifications })}
                  >
                    {settings.emailNotifications ? <CheckCircle size={16} /> : <XCircle size={16} />}
                    {settings.emailNotifications ? 'Enabled' : 'Disabled'}
                  </button>
                </div>
                <div className="admin-form-group admin-toggle-group">
                  <label>Push Notifications</label>
                  <button
                    className={`admin-toggle-switch ${settings.pushNotifications ? 'active' : ''}`}
                    onClick={() => setSettings({ ...settings, pushNotifications: !settings.pushNotifications })}
                  >
                    {settings.pushNotifications ? <CheckCircle size={16} /> : <XCircle size={16} />}
                    {settings.pushNotifications ? 'Enabled' : 'Disabled'}
                  </button>
                </div>
                <div className="admin-form-group admin-toggle-group">
                  <label>Desktop Notifications</label>
                  <button
                    className={`admin-toggle-switch ${settings.desktopNotifications ? 'active' : ''}`}
                    onClick={() => setSettings({ ...settings, desktopNotifications: !settings.desktopNotifications })}
                  >
                    {settings.desktopNotifications ? <CheckCircle size={16} /> : <XCircle size={16} />}
                    {settings.desktopNotifications ? 'Enabled' : 'Disabled'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Feature Toggles */}
          {activeTab === 'features' && (
            <div className="admin-settings-section">
              <h3>Feature Toggles</h3>
              <div className="admin-settings-form">
                <div className="admin-form-group admin-toggle-group">
                  <label>Enable Chat System</label>
                  <button
                    className={`admin-toggle-switch ${settings.enableChat ? 'active' : ''}`}
                    onClick={() => setSettings({ ...settings, enableChat: !settings.enableChat })}
                  >
                    {settings.enableChat ? <CheckCircle size={16} /> : <XCircle size={16} />}
                    {settings.enableChat ? 'Enabled' : 'Disabled'}
                  </button>
                </div>
                <div className="admin-form-group admin-toggle-group">
                  <label>Enable Live Classes</label>
                  <button
                    className={`admin-toggle-switch ${settings.enableLiveClasses ? 'active' : ''}`}
                    onClick={() => setSettings({ ...settings, enableLiveClasses: !settings.enableLiveClasses })}
                  >
                    {settings.enableLiveClasses ? <CheckCircle size={16} /> : <XCircle size={16} />}
                    {settings.enableLiveClasses ? 'Enabled' : 'Disabled'}
                  </button>
                </div>
                <div className="admin-form-group admin-toggle-group">
                  <label>Enable Learning Paths</label>
                  <button
                    className={`admin-toggle-switch ${settings.enableLearningPaths ? 'active' : ''}`}
                    onClick={() => setSettings({ ...settings, enableLearningPaths: !settings.enableLearningPaths })}
                  >
                    {settings.enableLearningPaths ? <CheckCircle size={16} /> : <XCircle size={16} />}
                    {settings.enableLearningPaths ? 'Enabled' : 'Disabled'}
                  </button>
                </div>
                <div className="admin-form-group admin-toggle-group">
                  <label>Enable Achievements</label>
                  <button
                    className={`admin-toggle-switch ${settings.enableAchievements ? 'active' : ''}`}
                    onClick={() => setSettings({ ...settings, enableAchievements: !settings.enableAchievements })}
                  >
                    {settings.enableAchievements ? <CheckCircle size={16} /> : <XCircle size={16} />}
                    {settings.enableAchievements ? 'Enabled' : 'Disabled'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Appearance Settings */}
          {activeTab === 'appearance' && (
            <div className="admin-settings-section">
              <h3>Appearance Settings</h3>
              <div className="admin-settings-form">
                <div className="admin-form-group">
                  <label>Theme</label>
                  <div className="admin-theme-selector">
                    <button
                      className={`admin-theme-option ${settings.theme === 'light' ? 'active' : ''}`}
                      onClick={() => setSettings({ ...settings, theme: 'light' })}
                    >
                      <Sun size={20} />
                      <span>Light</span>
                    </button>
                    <button
                      className={`admin-theme-option ${settings.theme === 'dark' ? 'active' : ''}`}
                      onClick={() => setSettings({ ...settings, theme: 'dark' })}
                    >
                      <Moon size={20} />
                      <span>Dark</span>
                    </button>
                  </div>
                </div>
                <div className="admin-form-group">
                  <label>Primary Color</label>
                  <div className="admin-color-picker">
                    <input
                      type="color"
                      value={settings.primaryColor}
                      onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                    />
                    <span>{settings.primaryColor}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Maintenance Mode */}
          {activeTab === 'maintenance' && (
            <div className="admin-settings-section">
              <h3>Maintenance Mode</h3>
              <div className="admin-settings-form">
                <div className="admin-form-group admin-toggle-group admin-warning-group">
                  <label>Enable Maintenance Mode</label>
                  <button
                    className={`admin-toggle-switch ${settings.maintenanceMode ? 'active warning' : ''}`}
                    onClick={() => setSettings({ ...settings, maintenanceMode: !settings.maintenanceMode })}
                  >
                    {settings.maintenanceMode ? <AlertTriangle size={16} /> : <CheckCircle size={16} />}
                    {settings.maintenanceMode ? 'Active' : 'Inactive'}
                  </button>
                </div>
                {settings.maintenanceMode && (
                  <div className="admin-form-group">
                    <label>Maintenance Message</label>
                    <textarea
                      value={settings.maintenanceMessage}
                      onChange={(e) => setSettings({ ...settings, maintenanceMessage: e.target.value })}
                      rows="3"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="admin-settings-actions">
            <button className="admin-btn-secondary" onClick={handleReset}>
              <RefreshCw size={16} />
              Reset to Default
            </button>
            <button className="admin-btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? <RefreshCw size={16} className="admin-spinning" /> : <Save size={16} />}
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;