// Website audit implementation for UXAudit plugin
import { AuditResult, Settings } from './types';
import { runLighthouseAudit, runFallbackAudit } from './lighthouse';

/**
 * Analyze a website URL for UX/UI issues
 * @param url The website URL to analyze
 * @param settings Plugin settings
 * @returns Promise resolving to audit result
 */
export async function analyzeWebsite(url: string, settings: Settings): Promise<AuditResult> {
  try {
    // Try to use Lighthouse API first
    try {
      return await runLighthouseAudit(url, settings);
    } catch (error) {
      console.warn('Lighthouse API error, using fallback:', error);
      // If Lighthouse API fails, use fallback method
      return await runFallbackAudit(url, settings);
    }
  } catch (error) {
    console.error('Website analysis error:', error);
    throw new Error(`Failed to analyze website: ${error.message}`);
  }
}
