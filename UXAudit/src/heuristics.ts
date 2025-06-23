/// <reference types="@figma/plugin-typings" />

// Heuristic evaluation for UXAudit plugin
import { Issue, Settings } from './types';

/**
 * Analyze a node based on Nielsen's heuristics
 * @param node The Figma node to analyze
 * @param settings Plugin settings
 * @returns Promise resolving to heuristic issues
 */
export async function analyzeHeuristics(node: SceneNode, settings: Settings): Promise<Issue[]> {
  const issues: Issue[] = [];
  
  // Skip if heuristic checks are disabled
  if (!settings.heuristicChecks) {
    return issues;
  }
  
  try {
    // Check for consistency issues
    checkConsistency(node, issues);
    
    // Check for visibility of system status
    checkVisibilityOfSystemStatus(node, issues);
    
    // Check for user control and freedom
    checkUserControlAndFreedom(node, issues);
    
    // Check for error prevention
    checkErrorPrevention(node, issues);
    
    // Check for recognition over recall
    checkRecognitionOverRecall(node, issues);
    
    // Check for aesthetic and minimalist design
    checkAestheticAndMinimalistDesign(node, issues);
    
    // Recursively check children
    if ('children' in node && node.children) {
      for (const child of node.children) {
        const childIssues = await analyzeHeuristics(child, settings);
        issues.push(...childIssues);
      }
    }
    
    return issues;
  } catch (error) {
    console.error('Heuristic analysis error:', error);
    issues.push({
      type: 'heuristic',
      severity: 'error',
      title: 'Heuristic analysis error',
      description: `Error analyzing heuristics: ${error.message}`
    });
    return issues;
  }
}

/**
 * Check for consistency issues
 * @param node The node to check
 * @param issues Array to add issues to
 */
function checkConsistency(node: SceneNode, issues: Issue[]): void {
  try {
    // This is a simplified implementation
    // In a real plugin, you would analyze multiple elements and compare them
    
    // Example: Check for inconsistent spacing
    if ('children' in node && node.children && node.children.length > 2) {
      const spacings = new Set<number>();
      
      // Check horizontal spacing between elements
      if (node.type === 'FRAME' || node.type === 'GROUP' || node.type === 'COMPONENT' || node.type === 'INSTANCE') {
        const sortedByX = [...node.children].sort((a, b) => {
          if (!('x' in a) || !('x' in b)) return 0;
          return a.x - b.x;
        });
        
        for (let i = 1; i < sortedByX.length; i++) {
          const prevNode = sortedByX[i-1];
          const currNode = sortedByX[i];
          if ('x' in currNode && 'x' in prevNode && 'width' in prevNode) {
            const spacing = currNode.x - (prevNode.x + prevNode.width);
            if (spacing > 0) {
              spacings.add(Math.round(spacing));
            }
          }
        }
        
        // If there are multiple different spacings, flag as inconsistent
        if (spacings.size > 2) {
          issues.push({
            type: 'heuristic',
            severity: 'info',
            title: 'Inconsistent spacing',
            description: `Multiple different spacing values detected between elements (${Array.from(spacings).join(', ')}px)`,
            element: node.name,
            remediation: 'Use consistent spacing between elements to improve visual harmony and predictability.'
          });
        }
      }
    }
  } catch (error) {
    console.error('Consistency check error:', error);
  }
}

/**
 * Check for visibility of system status
 * @param node The node to check
 * @param issues Array to add issues to
 */
function checkVisibilityOfSystemStatus(node: SceneNode, issues: Issue[]): void {
  try {
    // Check for form elements without feedback
    if (node.name.toLowerCase().includes('form') && 'children' in node) {
      const hasInputs = node.children?.some(child => 
        child.name.toLowerCase().includes('input') || 
        child.name.toLowerCase().includes('field') ||
        child.name.toLowerCase().includes('text')
      );
      
      const hasFeedback = node.children?.some(child => 
        child.name.toLowerCase().includes('status') || 
        child.name.toLowerCase().includes('feedback') ||
        child.name.toLowerCase().includes('error') ||
        child.name.toLowerCase().includes('success')
      );
      
      if (hasInputs && !hasFeedback) {
        issues.push({
          type: 'heuristic',
          severity: 'info',
          title: 'Missing feedback mechanism',
          description: 'Form appears to lack visual feedback elements for user actions',
          element: node.name,
          remediation: 'Add visual feedback elements to indicate form status, validation results, or submission progress.'
        });
      }
    }
  } catch (error) {
    console.error('System status check error:', error);
  }
}

/**
 * Check for user control and freedom
 * @param node The node to check
 * @param issues Array to add issues to
 */
function checkUserControlAndFreedom(node: SceneNode, issues: Issue[]): void {
  try {
    // Check for modal/dialog without close button
    if ((node.name.toLowerCase().includes('modal') || 
         node.name.toLowerCase().includes('dialog') || 
         node.name.toLowerCase().includes('popup')) && 
        'children' in node) {
      
      const hasCloseButton = node.children?.some(child => 
        child.name.toLowerCase().includes('close') || 
        child.name.toLowerCase().includes('cancel') ||
        child.name.toLowerCase().includes('dismiss') ||
        child.name.toLowerCase().includes('×') ||
        child.name.toLowerCase().includes('x')
      );
      
      if (!hasCloseButton) {
        issues.push({
          type: 'heuristic',
          severity: 'warning',
          title: 'Missing close option',
          description: 'Modal/dialog appears to lack a visible close or cancel option',
          element: node.name,
          remediation: 'Add a clearly visible close button to allow users to exit the modal/dialog easily.'
        });
      }
    }
  } catch (error) {
    console.error('User control check error:', error);
  }
}

/**
 * Check for error prevention
 * @param node The node to check
 * @param issues Array to add issues to
 */
function checkErrorPrevention(node: SceneNode, issues: Issue[]): void {
  try {
    // Check for destructive actions without confirmation
    if ((node.name.toLowerCase().includes('delete') || 
         node.name.toLowerCase().includes('remove') || 
         node.name.toLowerCase().includes('destroy')) && 
        node.type === 'INSTANCE' || node.type === 'COMPONENT') {
      
      // Check if parent or siblings contain confirmation elements
      let hasConfirmation = false;
      
      if (node.parent && 'children' in node.parent) {
        hasConfirmation = node.parent.children.some(child => 
          child !== node && (
            child.name.toLowerCase().includes('confirm') || 
            child.name.toLowerCase().includes('verification') ||
            child.name.toLowerCase().includes('are you sure')
          )
        );
      }
      
      if (!hasConfirmation) {
        issues.push({
          type: 'heuristic',
          severity: 'warning',
          title: 'Destructive action without confirmation',
          description: 'Delete/remove action appears to lack confirmation step',
          element: node.name,
          remediation: 'Add a confirmation step before executing destructive actions to prevent accidental data loss.'
        });
      }
    }
  } catch (error) {
    console.error('Error prevention check error:', error);
  }
}

/**
 * Check for recognition over recall
 * @param node The node to check
 * @param issues Array to add issues to
 */
function checkRecognitionOverRecall(node: SceneNode, issues: Issue[]): void {
  try {
    // Check for input fields without labels
    if ((node.name.toLowerCase().includes('input') || 
         node.name.toLowerCase().includes('field') || 
         node.name.toLowerCase().includes('textbox')) && 
        node.type === 'INSTANCE' || node.type === 'COMPONENT' || node.type === 'RECTANGLE') {
      
      // Check if there's a label nearby
      let hasLabel = false;
      
      if (node.parent && 'children' in node.parent) {
        hasLabel = node.parent.children.some(child => 
          child !== node && (
            child.type === 'TEXT' || 
            child.name.toLowerCase().includes('label')
          )
        );
      }
      
      if (!hasLabel) {
        issues.push({
          type: 'heuristic',
          severity: 'warning',
          title: 'Missing input label',
          description: 'Input field appears to lack a visible label',
          element: node.name,
          remediation: 'Add clear, visible labels to all input fields to help users understand what information is required.'
        });
      }
    }
  } catch (error) {
    console.error('Recognition check error:', error);
  }
}

/**
 * Check for aesthetic and minimalist design
 * @param node The node to check
 * @param issues Array to add issues to
 */
function checkAestheticAndMinimalistDesign(node: SceneNode, issues: Issue[]): void {
  try {
    // Check for text-heavy interfaces
    if (node.type === 'FRAME' || node.type === 'GROUP' || node.type === 'COMPONENT' || node.type === 'INSTANCE') {
      if ('children' in node && node.children) {
        const textNodes = node.children.filter(child => child.type === 'TEXT');
        
        // Count total characters in all text nodes
        let totalCharacters = 0;
        textNodes.forEach(textNode => {
          if (textNode.type === 'TEXT' && textNode.characters) {
            totalCharacters += textNode.characters.length;
          }
        });
        
        // If there are many text nodes with lots of text, flag as potentially cluttered
        if (textNodes.length > 5 && totalCharacters > 500) {
          issues.push({
            type: 'heuristic',
            severity: 'info',
            title: 'Text-heavy interface',
            description: `Interface contains ${textNodes.length} text elements with approximately ${totalCharacters} characters`,
            element: node.name,
            remediation: 'Consider simplifying the interface by reducing text content or breaking it into multiple screens/sections.'
          });
        }
      }
    }
  } catch (error) {
    console.error('Aesthetic design check error:', error);
  }
}
