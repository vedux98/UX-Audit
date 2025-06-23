// Settings management for UXAudit plugin
import { Settings } from '../types';

// Default settings
const defaultSettings: Settings = {
  accessibilityChecks: true,
  heuristicChecks: true,
  seoChecks: true,
  performanceChecks: true,
  exportFormat: 'markdown',
  includeScreenshots: true,
  includeRemediation: true,
  lighthouseApiKey: '',
  useAI: false
};

/**
 * Save settings to Figma client storage
 * @param settings Settings to save
 * @returns Promise that resolves when settings are saved
 */
export async function saveSettings(settings: Settings): Promise<void> {
  try {
    await figma.clientStorage.setAsync('uxaudit-settings', JSON.stringify(settings));
  } catch (error) {
    console.error('Error saving settings:', error);
    throw new Error(`Failed to save settings: ${error.message}`);
  }
}

/**
 * Load settings from Figma client storage
 * @returns Promise resolving to settings or null if not found
 */
export async function loadSettings(): Promise<Settings | null> {
  try {
    const settingsJson = await figma.clientStorage.getAsync('uxaudit-settings');
    
    if (!settingsJson) {
      return null;
    }
    
    return JSON.parse(settingsJson) as Settings;
  } catch (error) {
    console.error('Error loading settings:', error);
    return null;
  }
}

/**
 * Reset settings to defaults
 * @returns Promise that resolves when settings are reset
 */
export async function resetSettings(): Promise<Settings> {
  try {
    await saveSettings(defaultSettings);
    return { ...defaultSettings };
  } catch (error) {
    console.error('Error resetting settings:', error);
    throw new Error(`Failed to reset settings: ${error.message}`);
  }
}
