// frontend/src/services/settingsService.js
class settingsService {
  constructor() {
    this.settings = {
      notifications: {
        email: true,
        push: true,
        weeklyReport: true,
        sound: true,
        desktop: false
      },
      learning: {
        dailyGoal: 60,
        preferredDifficulty: 'intermediate',
        learningStyle: 'balanced'
      },
      privacy: {
        publicProfile: true,
        showOnLeaderboard: true
      },
      appearance: {
        theme: 'dark'
      }
    };
    this.listeners = new Map();
  }

  loadSettings() {
    const saved = localStorage.getItem('user_settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        this.settings = { ...this.settings, ...parsed };
      } catch (e) {
        console.error('Error loading settings:', e);
      }
    }
    this.notifyListeners('settings-loaded', this.settings);
    return this.settings;
  }

  saveSettings() {
    localStorage.setItem('user_settings', JSON.stringify(this.settings));
    this.notifyListeners('settings-changed', this.settings);
  }

  updateSetting(category, key, value) {
    if (this.settings[category] && this.settings[category][key] !== undefined) {
      this.settings[category][key] = value;
      this.saveSettings();
      this.applySetting(category, key, value);
      return true;
    }
    return false;
  }

  applySetting(category, key, value) {
    switch (category) {
      case 'appearance':
        if (key === 'theme') {
          this.applyTheme(value);
        }
        break;
      case 'notifications':
        if (key === 'sound') {
          this.applySoundSetting(value);
        }
        if (key === 'desktop') {
          this.applyDesktopNotificationSetting(value);
        }
        break;
    }
  }

  applyTheme(theme) {
    if (theme === 'dark') {
      document.body.classList.add('dark-theme');
      document.body.classList.remove('light-theme');
    } else if (theme === 'light') {
      document.body.classList.add('light-theme');
      document.body.classList.remove('dark-theme');
    } else if (theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        document.body.classList.add('dark-theme');
        document.body.classList.remove('light-theme');
      } else {
        document.body.classList.add('light-theme');
        document.body.classList.remove('dark-theme');
      }
    }
  }

  applySoundSetting(enabled) {
    // This will be used by notification service
    localStorage.setItem('notif_sound', enabled);
    if (window.notificationService) {
      window.notificationService.soundEnabled = enabled;
    }
  }

  applyDesktopNotificationSetting(enabled) {
    localStorage.setItem('notif_desktop', enabled);
    if (window.notificationService) {
      window.notificationService.desktopEnabled = enabled;
      if (enabled) {
        window.notificationService.requestDesktopPermission();
      }
    }
  }

  getSetting(category, key) {
    return this.settings[category]?.[key];
  }

  getAllSettings() {
    return this.settings;
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
    return () => this.off(event, callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index !== -1) callbacks.splice(index, 1);
    }
  }

  notifyListeners(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(cb => cb(data));
    }
  }
}

export default new settingsService();