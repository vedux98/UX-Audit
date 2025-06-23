// Frame audit implementation for UXAudit plugin
import { AuditResult, Issue, Settings } from './types';
import { analyzeAccessibility } from './accessibility';
import { analyzeHeuristics } from './heuristics';

/**
 * Analyze a Figma frame for UX/UI issues
 * @param node The Figma node to analyze
 * @param settings Plugin settings
 * @returns Promise resolving to audit result
 */
export async function analyzeFrame(node: SceneNode, settings: Settings): Promise<AuditResult> {
  try {
    // Collect issues from different analysis methods
    const accessibilityIssues = await analyzeAccessibility(node, settings);
    const heuristicIssues = await analyzeHeuristics(node, settings);
    
    // Combine all issues
    const allIssues: Issue[] = [
      ...accessibilityIssues,
      ...heuristicIssues
    ];
    
    // Calculate scores
    const accessibilityScore = calculateAccessibilityScore(accessibilityIssues);
    const heuristicsScore = calculateHeuristicsScore(heuristicIssues);
    
    // Calculate overall score (weighted average)
    let overallScore = accessibilityScore;
    let divisor = 1;
    
    if (settings.heuristicChecks) {
      overallScore += heuristicsScore;
      divisor++;
    }
    
    overallScore = Math.round(overallScore / divisor);
    
    return {
      accessibility: accessibilityScore,
      heuristics: settings.heuristicChecks ? heuristicsScore : undefined,
      overall: overallScore,
      issues: allIssues
    };
  } catch (error) {
    console.error('Frame analysis error:', error);
    throw new Error(`Failed to analyze frame: ${error.message}`);
  }
}

/**
 * Calculate accessibility score based on issues
 * @param issues Accessibility issues
 * @returns Score from 0-100
 */
function calculateAccessibilityScore(issues: Issue[]): number {
  // Base score of 100
  let score = 100;
  
  // Deduct points for each issue based on severity
  issues.forEach(issue => {
    if (issue.type === 'accessibility') {
      switch (issue.severity) {
        case 'error':
          score -= 15;
          break;
        case 'warning':
          score -= 8;
          break;
        case 'info':
          score -= 3;
          break;
      }
    }
  });
  
  // Ensure score is between 0-100
  return Math.max(0, Math.min(100, score));
}

/**
 * Calculate heuristics score based on issues
 * @param issues Heuristic issues
 * @returns Score from 0-100
 */
function calculateHeuristicsScore(issues: Issue[]): number {
  // Base score of 100
  let score = 100;
  
  // Deduct points for each issue based on severity
  issues.forEach(issue => {
    if (issue.type === 'heuristic') {
      switch (issue.severity) {
        case 'error':
          score -= 12;
          break;
        case 'warning':
          score -= 7;
          break;
        case 'info':
          score -= 3;
          break;
      }
    }
  });
  
  // Ensure score is between 0-100
  return Math.max(0, Math.min(100, score));
}
