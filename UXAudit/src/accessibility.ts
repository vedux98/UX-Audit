/// <reference types="@figma/plugin-typings" />

// Accessibility analysis for UXAudit plugin
import { Issue, Settings } from './types';

/**
 * Analyze accessibility of a node's properties
 * @param node The Figma node to analyze
 * @param settings Plugin settings
 * @returns Promise resolving to accessibility issues
 */
export async function analyzeAccessibility(node: figma.SceneNode, settings: Settings): Promise<Issue[]> {
  const issues: Issue[] = [];
  
  // Skip if accessibility checks are disabled
  if (!settings.accessibilityChecks) {
    return issues;
  }
  
  try {
    // Check text contrast
    if ('fills' in node && node.fills && Array.isArray(node.fills)) {
      await checkTextContrast(node as figma.TextNode, issues);
    }
    
    // Check text size
    if (node.type === 'TEXT') {
      checkTextSize(node, issues);
    }
    
    // Check touch target size for interactive elements
    if ('reactions' in node && node.reactions && node.reactions.length > 0) {
      checkTouchTargetSize(node, issues);
    }
    
    // Recursively check children
    if ('children' in node && node.children) {
      for (const child of node.children) {
        const childIssues = await analyzeAccessibility(child, settings);
        issues.push(...childIssues);
      }
    }
    
    return issues;
  } catch (error) {
    console.error('Accessibility analysis error:', error);
    issues.push({
      type: 'accessibility',
      severity: 'error',
      title: 'Accessibility analysis error',
      description: `Error analyzing accessibility: ${error instanceof Error ? error.message : String(error)}`
    });
    return issues;
  }
}

/**
 * Check text contrast against WCAG guidelines
 * @param node The node to check
 * @param issues Array to add issues to
 */
async function checkTextContrast(node: figma.TextNode, issues: Issue[]): Promise<void> {
  // Only check text nodes
  if (node.type !== 'TEXT') return;
  
  try {
    // Get text color
    const textColor = getNodeColor(node);
    if (!textColor) return;
    
    // Get background color
    // This is simplified - in a real implementation, you would need to
    // determine the actual background by checking parent nodes
    let bgColor;
    let parent = node.parent;
    
    while (parent && !bgColor) {
      if ('fills' in parent && parent.fills && Array.isArray(parent.fills) && parent.fills.length > 0) {
        bgColor = getNodeColor(parent as figma.SceneNode);
      }
      parent = parent.parent;
    }
    
    // If no background color found, assume white
    if (!bgColor) {
      bgColor = { r: 1, g: 1, b: 1 };
    }
    
    // Calculate contrast ratio
    const contrastRatio = calculateContrastRatio(textColor, bgColor);
    
    // Check against WCAG guidelines
    const fontSize = typeof node.fontSize === 'number' ? node.fontSize : 14; // Default to 14 if mixed
    const isBold = typeof node.fontWeight === 'number' && node.fontWeight >= 700;
    
    // WCAG Level AA requires 4.5:1 for normal text, 3:1 for large text
    // Large text is defined as 18pt or 14pt bold
    const isLargeText = fontSize >= 18 || (fontSize >= 14 && isBold);
    const requiredRatio = isLargeText ? 3 : 4.5;
    
    if (contrastRatio < requiredRatio) {
      issues.push({
        type: 'accessibility',
        severity: 'warning',
        title: 'Low contrast text',
        description: `Text has ${contrastRatio.toFixed(1)}:1 contrast ratio (WCAG AA requires ${requiredRatio}:1)`,
        remediation: `Increase the contrast between text and background to at least ${requiredRatio}:1.`
      });
    }
  } catch (error) {
    console.error('Text contrast check error:', error);
  }
}

/**
 * Check text size for readability
 * @param node The text node to check
 * @param issues Array to add issues to
 */
function checkTextSize(node: figma.TextNode, issues: Issue[]): void {
  try {
    const fontSize = node.fontSize;
    
    // Check if fontSize is a number (not mixed)
    if (typeof fontSize === 'number' && fontSize < 12) {
      issues.push({
        type: 'accessibility',
        severity: 'warning',
        title: 'Small text size',
        description: `Text size is ${fontSize}px (recommended minimum is 12px)`,
        remediation: 'Increase text size to at least 12px for better readability.'
      });
    }
  } catch (error) {
    console.error('Text size check error:', error);
  }
}

/**
 * Check touch target size for interactive elements
 * @param node The node to check
 * @param issues Array to add issues to
 */
function checkTouchTargetSize(node: figma.SceneNode, issues: Issue[]): void {
  try {
    // Skip if node doesn't have width/height
    if (!('width' in node) || !('height' in node)) return;
    
    const width = node.width;
    const height = node.height;
    
    // WCAG recommends touch targets of at least 44x44px
    if (width < 44 || height < 44) {
      issues.push({
        type: 'accessibility',
        severity: 'warning',
        title: 'Small touch target',
        description: `Interactive element size is ${Math.round(width)}x${Math.round(height)}px (recommended minimum is 44x44px)`,
        remediation: 'Increase the size of interactive elements to at least 44x44px for better touch accessibility.'
      });
    }
  } catch (error) {
    console.error('Touch target check error:', error);
  }
}

/**
 * Get the color of a node from its fills
 * @param node The node to get color from
 * @returns RGB color object or null
 */
function getNodeColor(node: figma.SceneNode): {r: number, g: number, b: number} | null {
  try {
    if (!('fills' in node) || !node.fills || !Array.isArray(node.fills) || node.fills.length === 0) {
      return null;
    }
    
    // Find the first visible solid fill
    const solidFill = node.fills.find((fill: figma.Paint) => 
      fill.type === 'SOLID' && fill.visible !== false
    );
    
    if (!solidFill || solidFill.type !== 'SOLID') return null;
    
    return {
      r: solidFill.color.r,
      g: solidFill.color.g,
      b: solidFill.color.b
    };
  } catch (error) {
    console.error('Get node color error:', error);
    return null;
  }
}

/**
 * Calculate contrast ratio between two colors
 * @param color1 First color (RGB)
 * @param color2 Second color (RGB)
 * @returns Contrast ratio
 */
function calculateContrastRatio(color1: {r: number, g: number, b: number}, color2: {r: number, g: number, b: number}): number {
  // Calculate luminance for each color
  const l1 = calculateLuminance(color1);
  const l2 = calculateLuminance(color2);
  
  // Calculate contrast ratio
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Calculate relative luminance of a color
 * @param color RGB color object
 * @returns Relative luminance
 */
function calculateLuminance(color: {r: number, g: number, b: number}): number {
  // Convert RGB to sRGB
  const srgb = {
    r: convertChannel(color.r),
    g: convertChannel(color.g),
    b: convertChannel(color.b)
  };
  
  // Calculate luminance
  return 0.2126 * srgb.r + 0.7152 * srgb.g + 0.0722 * srgb.b;
}

/**
 * Convert color channel to linear value
 * @param channel Color channel value (0-1)
 * @returns Linear value
 */
function convertChannel(channel: number): number {
  return channel <= 0.03928
    ? channel / 12.92
    : Math.pow((channel + 0.055) / 1.055, 2.4);
}

function checkColorContrast(node: figma.SceneNode, issues: Issue[]): void {
  // ... existing code ...
}
