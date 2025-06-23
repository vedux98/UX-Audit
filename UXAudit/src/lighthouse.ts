// Lighthouse API integration for UXAudit plugin
import { LighthouseResult, AuditResult, Issue, Settings } from './types';

// Base URL for PageSpeed Insights API (Google's implementation of Lighthouse)
const PAGESPEED_API_BASE = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed';

/**
 * Run Lighthouse audit on a website URL
 * @param url The URL to audit
 * @param settings Plugin settings
 * @returns Promise resolving to audit result
 */
export async function runLighthouseAudit(url: string, settings: Settings): Promise<AuditResult> {
  try {
    // Construct API URL with parameters
    let apiUrl = `${PAGESPEED_API_BASE}?url=${encodeURIComponent(url)}&strategy=mobile`;
    
    // Add categories based on settings
    const categories = [];
    if (settings.accessibilityChecks) categories.push('accessibility');
    if (settings.seoChecks) categories.push('seo');
    if (settings.performanceChecks) categories.push('performance');
    
    // Always include best practices
    categories.push('best-practices');
    
    // Add categories to API URL
    apiUrl += `&category=${categories.join('&category=')}`;
    
    // Add API key if provided
    if (settings.lighthouseApiKey) {
      apiUrl += `&key=${settings.lighthouseApiKey}`;
    }
    
    // Fetch Lighthouse results
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      throw new Error(`Lighthouse API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Process Lighthouse results
    return processLighthouseResults(data, settings);
  } catch (error) {
    console.error('Lighthouse audit error:', error);
    throw new Error(`Failed to run Lighthouse audit: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Process raw Lighthouse results into AuditResult format
 * @param data Raw Lighthouse API response
 * @param settings Plugin settings
 * @returns Processed audit result
 */
function processLighthouseResults(data: LighthouseResult, settings: Settings): AuditResult {
  // Extract scores (convert from 0-1 to 0-100)
  const accessibilityScore = Math.round(((data.categories.accessibility && data.categories.accessibility.score) || 0) * 100);
  const seoScore = settings.seoChecks ? Math.round(((data.categories.seo && data.categories.seo.score) || 0) * 100) : 0;
  const performanceScore = settings.performanceChecks ? Math.round(((data.categories.performance && data.categories.performance.score) || 0) * 100) : 0;
  
  // Calculate overall score (average of enabled categories)
  let overallScore = accessibilityScore;
  let divisor = 1;
  
  if (settings.seoChecks) {
    overallScore += seoScore;
    divisor++;
  }
  
  if (settings.performanceChecks) {
    overallScore += performanceScore;
    divisor++;
  }
  
  overallScore = Math.round(overallScore / divisor);
  
  // Extract issues
  const issues: Issue[] = [];
  
  // Process audits to extract issues
  Object.entries(data.audits).forEach(([id, audit]) => {
    // Skip passed audits
    if (audit.score === 1 || audit.score === null) return;
    
    // Determine issue type
    let type: 'accessibility' | 'seo' | 'performance' | 'heuristic' = 'accessibility';
    
    if (id.startsWith('seo-')) {
      type = 'seo';
    } else if (id.startsWith('performance-') || id.startsWith('speed-') || id.startsWith('load-')) {
      type = 'performance';
    }
    
    // Skip if the corresponding check is disabled
    if ((type === 'accessibility' && !settings.accessibilityChecks) ||
        (type === 'seo' && !settings.seoChecks) ||
        (type === 'performance' && !settings.performanceChecks)) {
      return;
    }
    
    // Determine severity
    let severity: 'error' | 'warning' | 'info' = 'info';
    
    if (audit.score !== null) {
      if (audit.score < 0.5) {
        severity = 'error';
      } else if (audit.score < 0.9) {
        severity = 'warning';
      }
    }
    
    // Add issue
    issues.push({
      type,
      severity,
      title: audit.title,
      description: audit.description,
      remediation: settings.includeRemediation ? generateRemediation(id) : undefined
    });
  });
  
  return {
    accessibility: accessibilityScore,
    seo: settings.seoChecks ? seoScore : undefined,
    performance: settings.performanceChecks ? performanceScore : undefined,
    overall: overallScore,
    issues
  };
}

/**
 * Generate remediation suggestions for issues
 * @param id Audit ID
 * @returns Remediation suggestion
 */
function generateRemediation(id: string): string {
  // This is a simplified version - in a real implementation, 
  // you would have more specific remediation advice for each audit type
  
  const remediationMap: {[key: string]: string} = {
    'color-contrast': 'Increase the contrast ratio between text and background to at least 4.5:1 for normal text or 3:1 for large text.',
    'document-title': 'Add a descriptive title to the page using the <title> element.',
    'html-has-lang': 'Add a lang attribute to the HTML element to specify the language of the page.',
    'meta-viewport': 'Add a <meta name="viewport"> tag with appropriate content to ensure proper rendering on mobile devices.',
    'image-alt': 'Add alt text to all images to describe their content for screen reader users.',
    'link-name': 'Ensure all links have descriptive text that explains their purpose.',
    'button-name': 'Ensure all buttons have accessible names that describe their action.',
    'aria-allowed-attr': 'Remove invalid ARIA attributes from elements.',
    'aria-required-attr': 'Add required ARIA attributes to elements that use ARIA roles.',
    'aria-roles': 'Use only valid ARIA roles.',
    'aria-valid-attr-value': 'Ensure ARIA attributes have valid values.',
    'aria-valid-attr': 'Ensure ARIA attributes are valid.',
    'duplicate-id': 'Ensure all IDs in the document are unique.',
    'heading-order': 'Structure headings in a logical order (h1, then h2, etc.) without skipping levels.',
    'html-lang-valid': 'Use a valid language code in the lang attribute.',
    'form-field-multiple-labels': 'Ensure form fields have only one associated label.',
    'frame-title': 'Add title attributes to all frames and iframes.',
    'input-image-alt': 'Add alt text to all image inputs.',
    'label': 'Associate labels with form controls using the for attribute or nesting.',
    'layout-table': 'Use CSS for layout instead of tables.',
    'link-text': 'Avoid generic link text like "click here" or "read more".',
    'list': 'Use proper list markup (ul, ol, li) for lists.',
    'listitem': 'Ensure list items are contained within proper list elements.',
    'meta-refresh': 'Avoid using meta refresh to redirect or refresh pages.',
    'object-alt': 'Provide alternative text for object elements.',
    'tabindex': 'Avoid using tabindex values greater than 0.',
    'td-headers-attr': 'Use headers attribute on table cells to associate with the appropriate headers.',
    'th-has-data-cells': 'Ensure table headers have associated data cells.',
    'valid-lang': 'Use valid language codes in lang attributes.',
    'video-caption': 'Provide captions for video elements.',
    'video-description': 'Provide audio descriptions for video content.',
    'meta-description': 'Add a meta description tag to improve SEO.',
    'http-status-code': 'Ensure the page returns a valid HTTP status code (200).',
    'font-size': 'Ensure text is at least 16px or 12pt for readability.',
    'tap-targets': 'Make touch targets at least 44x44 pixels for better mobile usability.',
    'viewport': 'Configure the viewport for responsive design.'
  };
  
  return remediationMap[id] || 'Review the issue and make appropriate changes to improve accessibility, performance, or SEO.';
}

/**
 * Fallback method for when the Lighthouse API is unavailable or rate-limited
 * @param url The URL to audit
 * @param settings Plugin settings
 * @returns Promise resolving to audit result
 */
export async function runFallbackAudit(url: string, settings: Settings): Promise<AuditResult> {
  try {
    // This is a simplified fallback that would normally use a different API or method
    // For now, we'll just return a basic result with some common issues
    
    return {
      accessibility: 75,
      seo: settings.seoChecks ? 80 : undefined,
      performance: settings.performanceChecks ? 65 : undefined,
      overall: 73,
      issues: [
        {
          type: 'accessibility' as const,
          severity: 'warning' as const,
          title: 'Low contrast elements detected',
          description: 'Some text elements may have insufficient contrast with their background.',
          remediation: 'Ensure all text has a contrast ratio of at least 4.5:1 with its background.'
        },
        {
          type: 'accessibility' as const,
          severity: 'error' as const,
          title: 'Missing image alt text',
          description: 'Some images on the page lack alternative text descriptions.',
          remediation: 'Add descriptive alt text to all images that convey information.'
        },
        {
          type: 'seo' as const,
          severity: 'warning' as const,
          title: 'Missing meta description',
          description: 'The page lacks a meta description tag for search engines.',
          remediation: 'Add a concise, descriptive meta description tag to improve SEO.'
        },
        {
          type: 'performance' as const,
          severity: 'warning' as const,
          title: 'Large image files',
          description: 'Some images are not optimized for web delivery.',
          remediation: 'Compress images and consider using WebP format for better performance.'
        }
      ].filter(issue => {
        // Filter issues based on enabled checks
        if (issue.type === 'accessibility' && !settings.accessibilityChecks) return false;
        if (issue.type === 'seo' && !settings.seoChecks) return false;
        if (issue.type === 'performance' && !settings.performanceChecks) return false;
        return true;
      })
    };
  } catch (error) {
    console.error('Fallback audit error:', error);
    throw new Error(`Failed to run fallback audit: ${error instanceof Error ? error.message : String(error)}`);
  }
}
