// Contrast calculation utilities for UXAudit plugin
import { Issue } from '../types';

/**
 * Check contrast ratio between two colors
 * @param color1 First color in RGB format (0-1)
 * @param color2 Second color in RGB format (0-1)
 * @returns Contrast ratio
 */
export function calculateContrastRatio(
  color1: { r: number; g: number; b: number },
  color2: { r: number; g: number; b: number }
): number {
  // Calculate luminance for each color
  const l1 = calculateRelativeLuminance(color1);
  const l2 = calculateRelativeLuminance(color2);
  
  // Calculate contrast ratio
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Calculate relative luminance of a color
 * @param color Color in RGB format (0-1)
 * @returns Relative luminance
 */
export function calculateRelativeLuminance(color: { r: number; g: number; b: number }): number {
  // Convert RGB to linear values
  const r = convertToLinear(color.r);
  const g = convertToLinear(color.g);
  const b = convertToLinear(color.b);
  
  // Calculate luminance using the formula from WCAG 2.0
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Convert RGB channel to linear value
 * @param channel RGB channel value (0-1)
 * @returns Linear value
 */
function convertToLinear(channel: number): number {
  // Apply the formula from WCAG 2.0
  return channel <= 0.03928
    ? channel / 12.92
    : Math.pow((channel + 0.055) / 1.055, 2.4);
}

/**
 * Check if a color combination meets WCAG contrast requirements
 * @param foreground Foreground color in RGB format (0-1)
 * @param background Background color in RGB format (0-1)
 * @param fontSize Font size in pixels
 * @param isBold Whether the font is bold
 * @returns Object with contrast ratio and compliance information
 */
export function checkWCAGCompliance(
  foreground: { r: number; g: number; b: number },
  background: { r: number; g: number; b: number },
  fontSize: number,
  isBold: boolean
): { 
  ratio: number; 
  isLargeText: boolean;
  passesAA: boolean; 
  passesAAA: boolean;
  requiredRatio: number;
} {
  // Calculate contrast ratio
  const ratio = calculateContrastRatio(foreground, background);
  
  // Determine if text is "large" according to WCAG
  // Large text is defined as 18pt (24px) or 14pt (18.67px) bold
  const isLargeText = fontSize >= 24 || (fontSize >= 18.67 && isBold);
  
  // WCAG 2.0 level AA requires a contrast ratio of at least 4.5:1 for normal text
  // and 3:1 for large text
  const requiredRatioAA = isLargeText ? 3 : 4.5;
  
  // WCAG 2.0 level AAA requires a contrast ratio of at least 7:1 for normal text
  // and 4.5:1 for large text
  const requiredRatioAAA = isLargeText ? 4.5 : 7;
  
  return {
    ratio,
    isLargeText,
    passesAA: ratio >= requiredRatioAA,
    passesAAA: ratio >= requiredRatioAAA,
    requiredRatio: requiredRatioAA
  };
}

/**
 * Generate contrast-related issues based on WCAG compliance check
 * @param element Element name or description
 * @param compliance WCAG compliance check result
 * @returns Issue object if contrast is insufficient, null otherwise
 */
export function generateContrastIssue(
  element: string,
  compliance: ReturnType<typeof checkWCAGCompliance>
): Issue | null {
  if (!compliance.passesAA) {
    return {
      type: 'accessibility',
      severity: 'warning',
      title: 'Insufficient color contrast',
      description: `${element} has a contrast ratio of ${compliance.ratio.toFixed(1)}:1 (WCAG AA requires ${compliance.requiredRatio}:1)`,
      element,
      remediation: `Increase the contrast between the text and background colors to at least ${compliance.requiredRatio}:1 to meet WCAG AA standards.`
    };
  }
  
  if (!compliance.passesAAA) {
    return {
      type: 'accessibility',
      severity: 'info',
      title: 'Color contrast could be improved',
      description: `${element} has a contrast ratio of ${compliance.ratio.toFixed(1)}:1 (WCAG AAA requires ${compliance.isLargeText ? 4.5 : 7}:1)`,
      element,
      remediation: `Consider increasing the contrast between the text and background colors to at least ${compliance.isLargeText ? 4.5 : 7}:1 to meet WCAG AAA standards.`
    };
  }
  
  return null;
}
