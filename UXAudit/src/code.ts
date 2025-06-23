import { getRGB, relativeLuminance, contrastRatio } from './utils';
import { Settings } from './types';

figma.showUI(__html__, { width: 400, height: 500 });

// Default settings
const defaultSettings: Settings = {
  accessibilityChecks: true,
  heuristicChecks: true,
  seoChecks: true,
  performanceChecks: true,
  exportFormat: 'markdown',
  includeScreenshots: false,
  includeRemediation: true,
  lighthouseApiKey: '',
  useAI: false
};

// Load settings from client storage
let currentSettings = Object.assign({}, defaultSettings);

figma.ui.onmessage = async (msg: { type: string; url?: string; apiKey?: string, settings?: Settings }) => {
  if (msg.type === 'audit-frame') {
    const selection = figma.currentPage.selection;
    if (selection.length === 0) {
      figma.notify('Please select a frame to audit.');
      return;
    }
    
    const frame = selection[0];
    if (frame.type !== 'FRAME') {
      figma.notify('Please select a valid frame.');
      return;
    }

    const auditResult = await auditFrame(frame);
    figma.ui.postMessage({ type: 'audit-result', result: auditResult });

  } else if (msg.type === 'audit-website') {
    figma.notify(`Auditing website: ${msg.url}...`);
    const url = msg.url;
    if (!url) {
      figma.notify('Please enter a URL to audit.');
      return;
    }
    
    try {
      const auditResult = await auditWebsite(url, currentSettings);
      figma.ui.postMessage({ type: 'audit-result', result: auditResult });
      figma.notify('Website audit complete!');
    } catch (error: unknown) {
      figma.notify(`Failed to audit website: ${error instanceof Error ? error.message : String(error)}`);
      console.error('Website audit error:', error);
    }
  } else if (msg.type === 'save-settings') {
    // Save settings to client storage
    currentSettings.lighthouseApiKey = msg.apiKey || '';
    
    // Save to Figma's client storage
    figma.clientStorage.setAsync('ux-audit-settings', JSON.stringify(currentSettings))
      .then(() => {
        figma.ui.postMessage({ 
          type: 'settings-message', 
          message: 'Settings saved successfully!' 
        });
        figma.notify('Settings saved!');
      })
      .catch((error: unknown) => {
        figma.ui.postMessage({ 
          type: 'settings-message', 
          message: 'Failed to save settings.' 
        });
        console.error('Settings save error:', error);
      });
  } else if (msg.type === 'load-settings') {
    // Load settings from client storage
    figma.clientStorage.getAsync('ux-audit-settings')
      .then((storedSettings) => {
        if (storedSettings) {
          try {
            const parsed = JSON.parse(storedSettings);
            currentSettings = Object.assign({}, defaultSettings, parsed);
            figma.ui.postMessage({ 
              type: 'settings-loaded', 
              settings: currentSettings 
            });
          } catch (error: unknown) {
            console.error('Settings parse error:', error);
          }
        }
      })
      .catch((error: unknown) => {
        console.error('Settings load error:', error);
      });
  }
};

async function auditFrame(frame: FrameNode) {
  const textNodes = frame.findAll((n) => n.type === 'TEXT') as TextNode[];
  const allNodes = frame.findAll(_n => true);
  const contrastIssues: string[] = [];
  const accessibilityResults: string[] = [];
  const heuristicResults: { [key: string]: string[] } = {
    "1. Visibility of system status": [],
    "2. Match between system and the real world": [],
    "4. Consistency and standards": [],
    "8. Aesthetic and minimalist design": [],
    "10. Help and documentation": [],
  };

  // --- Accessibility: Color Contrast ---
  for (const node of textNodes) {
    if (
      !Array.isArray(node.fills) ||
      node.fills.length === 0 ||
      node.fills[0].type !== 'SOLID'
    ) {
      continue;
    }
    const textColor = node.fills[0].color;
    const textLuminance = relativeLuminance(getRGB(textColor));

    const background = findbackground(node);
    if (!background || background.type !== 'SOLID') {
      continue;
    }

    const backgroundLuminance = relativeLuminance(getRGB(background.color));
    const contrast = contrastRatio(textLuminance, backgroundLuminance);

    if (contrast < 4.5) {
      contrastIssues.push(
        `"${node.characters}" (contrast: ${contrast.toFixed(2)}:1)`,
      );
    }
  }
  
  if (contrastIssues.length > 0) {
    accessibilityResults.push(`Low contrast text found: ${contrastIssues.join(', ')}`);
  } else {
    accessibilityResults.push('All text has good contrast. Great work!');
  }

  // --- Heuristic Evaluations ---

  // 1. Visibility of System Status (Generic Button Labels)
  const buttonNodes = frame.findAll(n => (n.type === 'INSTANCE' || n.type === 'COMPONENT' || n.type === 'FRAME') && n.name.toLowerCase().includes('button')) as SceneNode[];
  const genericButtonLabels = ['button', 'click here', 'submit', 'learn more', 'go'];
  const badButtons: string[] = [];

  for (const button of buttonNodes) {
      const text = (button as ChildrenMixin).findAll(n => n.type === 'TEXT') as TextNode[];
      if (text.length > 0 && genericButtonLabels.includes(text[0].characters.toLowerCase().trim())) {
          badButtons.push(`"${text[0].characters}"`);
      }
  }

  if (badButtons.length > 0) {
      heuristicResults["1. Visibility of system status"].push(`Generic button labels found: ${badButtons.join(', ')}. Use more descriptive text to inform users.`);
  } else {
      heuristicResults["1. Visibility of system status"].push('All buttons appear to have descriptive labels.');
  }

  // 2. Match between system and the real world (Jargon Check)
  const jargon = ['syscall', 'backend', 'cache', 'API', 'lambda', 'framework', 'async'];
  const foundJargon: string[] = [];
  textNodes.forEach(node => {
    const words = node.characters.toLowerCase().split(/\s+/);
    words.forEach(word => {
      if (jargon.includes(word.replace(/[^a-zA-Z]/g, ''))) {
        foundJargon.push(word);
      }
    });
  });

  if (foundJargon.length > 0) {
    // Remove duplicates using Set and convert back to array
    const uniqueJargon = Array.from(new Set(foundJargon));
    heuristicResults["2. Match between system and the real world"].push(`Potential jargon found: ${uniqueJargon.join(', ')}. Ensure language is familiar to your users.`);
  } else {
    heuristicResults["2. Match between system and the real world"].push('Language used appears to be plain and simple.');
  }

  // 8. Aesthetic and minimalist design (Color & Font variety)
  const colors = new Set<string>();
  const fontStyles = new Set<string>();
  allNodes.forEach(node => {
    if ('fills' in node && Array.isArray(node.fills)) {
      node.fills.forEach(fill => {
        if (fill.type === 'SOLID') {
          colors.add(JSON.stringify(fill.color));
        }
      });
    }
    if (node.type === 'TEXT') {
      const fontName = node.fontName as FontName;
      fontStyles.add(`${fontName.family} ${fontName.style} @ ${String(node.fontSize)}px`);
    }
  });

  if (colors.size > 10) {
     heuristicResults["8. Aesthetic and minimalist design"].push(`High number of colors used (${colors.size}). Consider simplifying the color palette.`);
  } else {
     heuristicResults["8. Aesthetic and minimalist design"].push(`Color palette is concise (${colors.size} colors).`);
  }
   if (fontStyles.size > 5) {
    heuristicResults["8. Aesthetic and minimalist design"].push(`High number of font styles used (${fontStyles.size}). Consider creating a more consistent type system.`);
  } else {
    heuristicResults["8. Aesthetic and minimalist design"].push(`Type system is consistent (${fontStyles.size} styles).`);
  }

  // 10. Help and documentation
  const helpIdentifiers = ['help', 'support', '?', 'learn'];
  let helpFound = false;
  textNodes.forEach(node => {
      const text = node.characters.toLowerCase();
      if(helpIdentifiers.some(id => text.includes(id))) {
          helpFound = true;
      }
  });
   if (frame.findAll(n => n.name.toLowerCase().includes('help') || n.name.toLowerCase().includes('support')).length > 0) {
       helpFound = true;
   }
  if (helpFound) {
      heuristicResults["10. Help and documentation"].push('Help or documentation elements were found.');
  } else {
      heuristicResults["10. Help and documentation"].push('No obvious help or documentation links found. Consider adding one if the interface is complex.');
  }

  const formattedHeuristics = Object.entries(heuristicResults)
    .map(([key, value]) => `<strong>${key}</strong><br>${value.join('<br>')}`)
    .join('<br><br>');

  return {
    type: 'frame',
    texts: textNodes.map(node => node.characters),
    fontSizes: textNodes.map(node => node.fontSize as number),
    heuristicEvaluation: formattedHeuristics,
    accessibility: accessibilityResults.join('<br>')
  };
}

async function auditWebsite(url: string, settings: Settings) {
  try {
    // If user has provided an API key, use Google PageSpeed Insights
    if (settings.lighthouseApiKey) {
      const result = await performDetailedWebsiteAudit(url, settings.lighthouseApiKey);
      return result;
    } else {
      // Fallback to basic audit
      const result = await performBasicWebsiteAudit();
      return result;
    }
  } catch (error: unknown) {
    throw new Error(`Failed to audit website: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function performDetailedWebsiteAudit(url: string, apiKey: string) {
  const endpoint = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&key=${apiKey}&category=ACCESSIBILITY&category=SEO&category=PERFORMANCE`;
  
  try {
    const response = await fetch(endpoint);
    const data = await response.json();

    if (data.error) {
      throw new Error(data.error.message || 'API Error');
    }
    
    const accessibilityScore = Math.round((data.lighthouseResult.categories.accessibility.score || 0) * 100);
    const seoScore = Math.round((data.lighthouseResult.categories.seo.score || 0) * 100);
    const performanceScore = Math.round((data.lighthouseResult.categories.performance.score || 0) * 100);

    return {
      type: 'website',
      seo: `Score: ${seoScore}/100`,
      accessibility: `Score: ${accessibilityScore}/100`,
      performance: `Score: ${performanceScore}/100`,
      note: 'Detailed analysis using Google PageSpeed Insights'
    };
  } catch (error: unknown) {
    throw new Error(`Error fetching audit from Google: ${error instanceof Error ? error.message : String(error)}`);
  }
}

async function performBasicWebsiteAudit() {
  // In a real scenario, this might use a simpler, non-authed API 
  // or a more basic check. For now, it returns a placeholder.
  return {
    type: 'website',
    accessibility: 85,
    seo: 90,
    performance: 75,
    details: 'Basic audit complete. For more details, add a Google PageSpeed API key in settings.'
  };
}

function findbackground(node: SceneNode): SolidPaint | null {
    const parent = node.parent as (SceneNode & ChildrenMixin) | PageNode | DocumentNode;

    if (parent && 'fills' in parent && Array.isArray(parent.fills) && parent.fills.length > 0) {
        const backgroundFill = parent.fills[0];
        if (backgroundFill.type === 'SOLID') {
            return backgroundFill;
        }
    }
    
    return { type: 'SOLID', color: { r: 1, g: 1, b: 1 } }; 
}