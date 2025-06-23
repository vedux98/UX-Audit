// UI TypeScript file for UXAudit plugin
// This file handles all UI interactions and state management

interface AuditResult {
  accessibility: number;
  heuristics?: number;
  seo?: number;
  performance?: number;
  overall: number;
  issues: Issue[];
}

interface Issue {
  type: 'accessibility' | 'heuristic' | 'seo' | 'performance';
  severity: 'error' | 'warning' | 'info';
  title: string;
  description: string;
}

interface Settings {
  accessibilityChecks: boolean;
  heuristicChecks: boolean;
  seoChecks: boolean;
  performanceChecks: boolean;
  exportFormat: 'markdown' | 'pdf' | 'html';
  includeScreenshots: boolean;
  includeRemediation: boolean;
  lighthouseApiKey: string;
  useAI: boolean;
}

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

// Current settings (initialized with defaults)
let currentSettings: Settings = { ...defaultSettings };

// Current active view
let activeView: 'frame-audit' | 'website-audit' | 'settings' = 'frame-audit';

// DOM Elements
document.addEventListener('DOMContentLoaded', () => {
  // Tab navigation
  const tabFrameAudit = document.getElementById('tab-frame-audit') as HTMLElement;
  const tabWebsiteAudit = document.getElementById('tab-website-audit') as HTMLElement;
  const tabSettings = document.getElementById('tab-settings') as HTMLElement;
  
  // Views
  const viewFrameAudit = document.getElementById('view-frame-audit') as HTMLElement;
  const viewWebsiteAudit = document.getElementById('view-website-audit') as HTMLElement;
  const viewSettings = document.getElementById('view-settings') as HTMLElement;
  
  // Frame audit elements
  const frameAuditEmpty = document.getElementById('frame-audit-empty') as HTMLElement;
  const frameAuditLoading = document.getElementById('frame-audit-loading') as HTMLElement;
  const frameAuditResults = document.getElementById('frame-audit-results') as HTMLElement;
  const btnRunFrameAudit = document.getElementById('btn-run-frame-audit') as HTMLButtonElement;
  const btnRerunFrameAudit = document.getElementById('btn-rerun-frame-audit') as HTMLButtonElement;
  const btnExportFrameReport = document.getElementById('btn-export-frame-report') as HTMLButtonElement;
  
  // Website audit elements
  const websiteUrlInput = document.getElementById('website-url-input') as HTMLInputElement;
  const btnRunWebsiteAudit = document.getElementById('btn-run-website-audit') as HTMLButtonElement;
  const websiteAuditLoading = document.getElementById('website-audit-loading') as HTMLElement;
  const websiteAuditResults = document.getElementById('website-audit-results') as HTMLElement;
  const btnViewFullReport = document.getElementById('btn-view-full-report') as HTMLButtonElement;
  const btnExportWebsiteReport = document.getElementById('btn-export-website-report') as HTMLButtonElement;
  
  // Settings elements
  const settingA11yChecks = document.getElementById('setting-a11y-checks') as HTMLInputElement;
  const settingHeuristicChecks = document.getElementById('setting-heuristic-checks') as HTMLInputElement;
  const settingSeoChecks = document.getElementById('setting-seo-checks') as HTMLInputElement;
  const settingPerfChecks = document.getElementById('setting-perf-checks') as HTMLInputElement;
  const settingExportFormat = document.getElementById('setting-export-format') as HTMLSelectElement;
  const settingIncludeScreenshots = document.getElementById('setting-include-screenshots') as HTMLInputElement;
  const settingIncludeRemediation = document.getElementById('setting-include-remediation') as HTMLInputElement;
  const settingLighthouseApiKey = document.getElementById('setting-lighthouse-api-key') as HTMLInputElement;
  const settingUseAI = document.getElementById('setting-use-ai') as HTMLInputElement;
  const btnResetSettings = document.getElementById('btn-reset-settings') as HTMLButtonElement;
  const btnSaveSettings = document.getElementById('btn-save-settings') as HTMLButtonElement;
  
  // Tab click handlers
  tabFrameAudit.addEventListener('click', () => switchView('frame-audit'));
  tabWebsiteAudit.addEventListener('click', () => switchView('website-audit'));
  tabSettings.addEventListener('click', () => switchView('settings'));
  
  // Frame audit button handlers
  btnRunFrameAudit.addEventListener('click', runFrameAudit);
  btnRerunFrameAudit.addEventListener('click', runFrameAudit);
  btnExportFrameReport.addEventListener('click', exportFrameReport);
  
  // Website audit button handlers
  btnRunWebsiteAudit.addEventListener('click', runWebsiteAudit);
  btnViewFullReport.addEventListener('click', viewFullReport);
  btnExportWebsiteReport.addEventListener('click', exportWebsiteReport);
  
  // Settings button handlers
  btnResetSettings.addEventListener('click', resetSettings);
  btnSaveSettings.addEventListener('click', saveSettings);
  
  // Initialize UI
  loadSettings();
  switchView('frame-audit');
  
  // Listen for messages from the plugin code
  window.onmessage = (event) => {
    const message = event.data.pluginMessage;
    
    if (!message) return;
    
    switch (message.type) {
      case 'frame-audit-result':
        displayFrameAuditResult(message.result);
        break;
      case 'website-audit-result':
        displayWebsiteAuditResult(message.result);
        break;
      case 'export-complete':
        // Show export success notification
        break;
      case 'error':
        showError(message.error);
        break;
    }
  };
  
  // Initialize settings UI
  function loadSettings() {
    // Try to load settings from storage
    parent.postMessage({ pluginMessage: { type: 'get-settings' } }, '*');
    
    // Meanwhile, set UI to default settings
    settingA11yChecks.checked = currentSettings.accessibilityChecks;
    settingHeuristicChecks.checked = currentSettings.heuristicChecks;
    settingSeoChecks.checked = currentSettings.seoChecks;
    settingPerfChecks.checked = currentSettings.performanceChecks;
    settingExportFormat.value = currentSettings.exportFormat;
    settingIncludeScreenshots.checked = currentSettings.includeScreenshots;
    settingIncludeRemediation.checked = currentSettings.includeRemediation;
    settingLighthouseApiKey.value = currentSettings.lighthouseApiKey;
    settingUseAI.checked = currentSettings.useAI;
  }
  
  // Switch between views
  function switchView(view: 'frame-audit' | 'website-audit' | 'settings') {
    // Update active view
    activeView = view;
    
    // Update tab classes
    tabFrameAudit.classList.toggle('active', view === 'frame-audit');
    tabWebsiteAudit.classList.toggle('active', view === 'website-audit');
    tabSettings.classList.toggle('active', view === 'settings');
    
    // Update view visibility
    viewFrameAudit.classList.toggle('active', view === 'frame-audit');
    viewWebsiteAudit.classList.toggle('active', view === 'website-audit');
    viewSettings.classList.toggle('active', view === 'settings');
    
    // If switching to frame audit, check if a frame is selected
    if (view === 'frame-audit') {
      parent.postMessage({ pluginMessage: { type: 'check-selection' } }, '*');
    }
  }
  
  // Run frame audit
  function runFrameAudit() {
    // Show loading state
    frameAuditEmpty.style.display = 'none';
    frameAuditLoading.style.display = 'block';
    frameAuditResults.style.display = 'none';
    
    // Request frame audit
    parent.postMessage({ 
      pluginMessage: { 
        type: 'run-frame-audit',
        settings: currentSettings
      } 
    }, '*');
  }
  
  // Display frame audit results
  function displayFrameAuditResult(result: AuditResult) {
    // Hide loading state
    frameAuditLoading.style.display = 'none';
    frameAuditResults.style.display = 'block';
    
    // Update scores
    const frameA11yScore = document.getElementById('frame-a11y-score') as HTMLElement;
    const frameHeuristicScore = document.getElementById('frame-heuristic-score') as HTMLElement;
    const frameOverallScore = document.getElementById('frame-overall-score') as HTMLElement;
    const frameProgressFill = document.getElementById('frame-progress-fill') as HTMLElement;
    const frameIssuesCount = document.getElementById('frame-issues-count') as HTMLElement;
    const frameIssuesList = document.getElementById('frame-issues-list') as HTMLElement;
    
    // Set scores with appropriate color classes
    frameA11yScore.textContent = `${result.accessibility}/100`;
    frameA11yScore.className = 'score-value ' + getScoreClass(result.accessibility);
    
    frameHeuristicScore.textContent = `${result.heuristics || 0}/100`;
    frameHeuristicScore.className = 'score-value ' + getScoreClass(result.heuristics || 0);
    
    frameOverallScore.textContent = `${result.overall}/100`;
    frameOverallScore.className = 'score-value ' + getScoreClass(result.overall);
    
    // Set progress bar
    frameProgressFill.style.width = `${result.overall}%`;
    
    // Set issues count
    frameIssuesCount.textContent = result.issues.length.toString();
    
    // Clear previous issues
    frameIssuesList.innerHTML = '';
    
    // Add issues
    result.issues.forEach(issue => {
      const issueElement = document.createElement('div');
      issueElement.className = 'issue';
      
      const iconMap = {
        'error': '⚠️',
        'warning': '⚠️',
        'info': 'ℹ️'
      };
      
      issueElement.innerHTML = `
        <div class="issue-icon">${iconMap[issue.severity]}</div>
        <div class="issue-content">
          <div class="issue-title">${issue.title}</div>
          <div class="issue-description">${issue.description}</div>
          <div>
            <span class="tag ${issue.type}">${issue.type}</span>
          </div>
        </div>
      `;
      
      frameIssuesList.appendChild(issueElement);
    });
  }
  
  // Run website audit
  function runWebsiteAudit() {
    const url = websiteUrlInput.value.trim();
    
    if (!url) {
      alert('Please enter a valid URL');
      return;
    }
    
    // Show loading state
    websiteAuditLoading.style.display = 'block';
    websiteAuditResults.style.display = 'none';
    
    // Request website audit
    parent.postMessage({ 
      pluginMessage: { 
        type: 'run-website-audit',
        url: url,
        settings: currentSettings
      } 
    }, '*');
  }
  
  // Display website audit results
  function displayWebsiteAuditResult(result: AuditResult) {
    // Hide loading state
    websiteAuditLoading.style.display = 'none';
    websiteAuditResults.style.display = 'block';
    
    // Update scores
    const websiteA11yScore = document.getElementById('website-a11y-score') as HTMLElement;
    const websiteSeoScore = document.getElementById('website-seo-score') as HTMLElement;
    const websitePerfScore = document.getElementById('website-perf-score') as HTMLElement;
    const websiteOverallScore = document.getElementById('website-overall-score') as HTMLElement;
    const websiteProgressFill = document.getElementById('website-progress-fill') as HTMLElement;
    const websiteIssuesCount = document.getElementById('website-issues-count') as HTMLElement;
    const websiteIssuesList = document.getElementById('website-issues-list') as HTMLElement;
    
    // Set scores with appropriate color classes
    websiteA11yScore.textContent = `${result.accessibility}/100`;
    websiteA11yScore.className = 'score-value ' + getScoreClass(result.accessibility);
    
    websiteSeoScore.textContent = `${result.seo || 0}/100`;
    websiteSeoScore.className = 'score-value ' + getScoreClass(result.seo || 0);
    
    websitePerfScore.textContent = `${result.performance || 0}/100`;
    websitePerfScore.className = 'score-value ' + getScoreClass(result.performance || 0);
    
    websiteOverallScore.textContent = `${result.overall}/100`;
    websiteOverallScore.className = 'score-value ' + getScoreClass(result.overall);
    
    // Set progress bar
    websiteProgressFill.style.width = `${result.overall}%`;
    
    // Set issues count
    websiteIssuesCount.textContent = result.issues.length.toString();
    
    // Clear previous issues
    websiteIssuesList.innerHTML = '';
    
    // Add issues
    result.issues.forEach(issue => {
      const issueElement = document.createElement('div');
      issueElement.className = 'issue';
      
      const iconMap = {
        'error': '⚠️',
        'warning': '⚠️',
        'info': 'ℹ️'
      };
      
      issueElement.innerHTML = `
        <div class="issue-icon">${iconMap[issue.severity]}</div>
        <div class="issue-content">
          <div class="issue-title">${issue.title}</div>
          <div class="issue-description">${issue.description}</div>
          <div>
            <span class="tag ${issue.type}">${issue.type}</span>
          </div>
        </div>
      `;
      
      websiteIssuesList.appendChild(issueElement);
    });
  }
  
  // View full report
  function viewFullReport() {
    const url = websiteUrlInput.value.trim();
    
    if (!url) return;
    
    // Open Lighthouse report in new tab
    window.open(`https://pagespeed.web.dev/report?url=${encodeURIComponent(url)}`, '_blank');
  }
  
  // Export frame report
  function exportFrameReport() {
    parent.postMessage({ 
      pluginMessage: { 
        type: 'export-frame-report',
        format: currentSettings.exportFormat
      } 
    }, '*');
  }
  
  // Export website report
  function exportWebsiteReport() {
    const url = websiteUrlInput.value.trim();
    
    if (!url) return;
    
    parent.postMessage({ 
      pluginMessage: { 
        type: 'export-website-report',
        url: url,
        format: currentSettings.exportFormat
      } 
    }, '*');
  }
  
  // Reset settings
  function resetSettings() {
    currentSettings = { ...defaultSettings };
    
    // Update UI
    settingA11yChecks.checked = currentSettings.accessibilityChecks;
    settingHeuristicChecks.checked = currentSettings.heuristicChecks;
    settingSeoChecks.checked = currentSettings.seoChecks;
    settingPerfChecks.checked = currentSettings.performanceChecks;
    settingExportFormat.value = currentSettings.exportFormat;
    settingIncludeScreenshots.checked = currentSettings.includeScreenshots;
    settingIncludeRemediation.checked = currentSettings.includeRemediation;
    settingLighthouseApiKey.value = currentSettings.lighthouseApiKey;
    settingUseAI.checked = currentSettings.useAI;
  }
  
  // Save settings
  function saveSettings() {
    // Update settings from UI
    currentSettings = {
      accessibilityChecks: settingA11yChecks.checked,
      heuristicChecks: settingHeuristicChecks.checked,
      seoChecks: settingSeoChecks.checked,
      performanceChecks: settingPerfChecks.checked,
      exportFormat: settingExportFormat.value as 'markdown' | 'pdf' | 'html',
      includeScreenshots: settingIncludeScreenshots.checked,
      includeRemediation: settingIncludeRemediation.checked,
      lighthouseApiKey: settingLighthouseApiKey.value,
      useAI: settingUseAI.checked
    };
    
    // Save settings
    parent.postMessage({ 
      pluginMessage: { 
        type: 'save-settings',
        settings: currentSettings
      } 
    }, '*');
    
    // Show confirmation
    alert('Settings saved successfully');
  }
  
  // Helper function to get score class
  function getScoreClass(score: number): string {
    if (score >= 90) return 'good';
    if (score >= 70) return 'warning';
    return 'error';
  }
  
  // Show error
  function showError(error: string) {
    // Hide loading states
    frameAuditLoading.style.display = 'none';
    websiteAuditLoading.style.display = 'none';
    
    // Show error
    alert(`Error: ${error}`);
  }
});
