// Export functionality for UXAudit plugin
import { AuditResult, Settings } from '../types';

/**
 * Export audit report in the specified format
 * @param result Audit result to export
 * @param format Export format (markdown, pdf, html)
 * @param name Name of the audited frame or website
 * @param settings Plugin settings
 * @returns Promise that resolves when export is complete
 */
export async function exportReport(result: AuditResult, format: string, name: string, settings: Settings): Promise<void> {
  try {
    switch (format) {
      case 'markdown':
        return await exportMarkdown(result, name, settings);
      case 'pdf':
        return await exportPdf(result, name, settings);
      case 'html':
        return await exportHtml(result, name, settings);
      default:
        return await exportMarkdown(result, name, settings);
    }
  } catch (error) {
    console.error('Export error:', error);
    throw new Error(`Failed to export report: ${error.message}`);
  }
}

/**
 * Export audit report as Markdown
 * @param result Audit result to export
 * @param name Name of the audited frame or website
 * @param settings Plugin settings
 * @returns Promise that resolves when export is complete
 */
async function exportMarkdown(result: AuditResult, name: string, settings: Settings): Promise<void> {
  try {
    // Generate markdown content
    let markdown = `# UX Audit Report: ${name}\n\n`;
    markdown += `*Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}*\n\n`;
    
    // Add summary
    markdown += `## Summary\n\n`;
    markdown += `| Category | Score |\n`;
    markdown += `| -------- | ----- |\n`;
    markdown += `| Accessibility | ${result.accessibility}/100 |\n`;
    
    if (result.heuristics !== undefined) {
      markdown += `| Heuristics | ${result.heuristics}/100 |\n`;
    }
    
    if (result.seo !== undefined) {
      markdown += `| SEO | ${result.seo}/100 |\n`;
    }
    
    if (result.performance !== undefined) {
      markdown += `| Performance | ${result.performance}/100 |\n`;
    }
    
    markdown += `| **Overall** | **${result.overall}/100** |\n\n`;
    
    // Add issues
    markdown += `## Issues Found (${result.issues.length})\n\n`;
    
    // Group issues by type
    const issuesByType: {[key: string]: typeof result.issues} = {};
    
    result.issues.forEach(issue => {
      if (!issuesByType[issue.type]) {
        issuesByType[issue.type] = [];
      }
      issuesByType[issue.type].push(issue);
    });
    
    // Add issues by type
    Object.entries(issuesByType).forEach(([type, issues]) => {
      markdown += `### ${capitalizeFirstLetter(type)} Issues (${issues.length})\n\n`;
      
      issues.forEach(issue => {
        const severityIcon = getSeverityIcon(issue.severity);
        markdown += `#### ${severityIcon} ${issue.title}\n\n`;
        markdown += `${issue.description}\n\n`;
        
        if (issue.element) {
          markdown += `**Element:** ${issue.element}\n\n`;
        }
        
        if (settings.includeRemediation && issue.remediation) {
          markdown += `**Remediation:** ${issue.remediation}\n\n`;
        }
        
        markdown += `---\n\n`;
      });
    });
    
    // Create a Blob with the markdown content
    const blob = new Blob([markdown], { type: 'text/markdown' });
    
    // Create a download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `uxaudit-${sanitizeFilename(name)}.md`;
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Markdown export error:', error);
    throw new Error(`Failed to export markdown: ${error.message}`);
  }
}

/**
 * Export audit report as PDF
 * @param result Audit result to export
 * @param name Name of the audited frame or website
 * @param settings Plugin settings
 * @returns Promise that resolves when export is complete
 */
async function exportPdf(result: AuditResult, name: string, settings: Settings): Promise<void> {
  // For the MVP, we'll use a simplified approach by generating HTML and converting it to PDF
  // In a real implementation, you would use a proper PDF generation library
  
  try {
    // For now, we'll just show a message that this feature is coming soon
    alert('PDF export will be available in a future update. Exporting as Markdown instead.');
    return await exportMarkdown(result, name, settings);
  } catch (error) {
    console.error('PDF export error:', error);
    throw new Error(`Failed to export PDF: ${error.message}`);
  }
}

/**
 * Export audit report as HTML
 * @param result Audit result to export
 * @param name Name of the audited frame or website
 * @param settings Plugin settings
 * @returns Promise that resolves when export is complete
 */
async function exportHtml(result: AuditResult, name: string, settings: Settings): Promise<void> {
  try {
    // Generate HTML content
    let html = `<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>UX Audit Report: ${name}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }
        h1 {
            border-bottom: 1px solid #eee;
            padding-bottom: 10px;
        }
        .meta {
            color: #666;
            font-style: italic;
            margin-bottom: 20px;
        }
        table {
            border-collapse: collapse;
            width: 100%;
            margin: 20px 0;
        }
        th, td {
            text-align: left;
            padding: 8px;
            border-bottom: 1px solid #ddd;
        }
        th {
            background-color: #f2f2f2;
        }
        .score {
            font-weight: bold;
        }
        .good {
            color: #14AE5C;
        }
        .warning {
            color: #FF9800;
        }
        .error {
            color: #F24822;
        }
        .issue {
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 1px solid #eee;
        }
        .issue-title {
            font-weight: bold;
            margin-bottom: 10px;
        }
        .issue-description {
            margin-bottom: 10px;
        }
        .issue-meta {
            font-size: 0.9em;
            color: #666;
        }
        .issue-remediation {
            background-color: #f8f8f8;
            padding: 10px;
            border-left: 3px solid #18A0FB;
            margin-top: 10px;
        }
        .tag {
            display: inline-block;
            padding: 3px 8px;
            border-radius: 12px;
            font-size: 0.8em;
            margin-right: 5px;
        }
        .tag.accessibility {
            background-color: #E3F5FF;
            color: #18A0FB;
        }
        .tag.heuristic {
            background-color: #FFF3E3;
            color: #FF9800;
        }
        .tag.seo {
            background-color: #E3FFE9;
            color: #14AE5C;
        }
        .tag.performance {
            background-color: #F5E3FF;
            color: #9C27B0;
        }
    </style>
</head>
<body>
    <h1>UX Audit Report: ${name}</h1>
    <div class="meta">Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</div>
    
    <h2>Summary</h2>
    <table>
        <tr>
            <th>Category</th>
            <th>Score</th>
        </tr>
        <tr>
            <td>Accessibility</td>
            <td class="score ${getScoreClass(result.accessibility)}">${result.accessibility}/100</td>
        </tr>`;
    
    if (result.heuristics !== undefined) {
      html += `
        <tr>
            <td>Heuristics</td>
            <td class="score ${getScoreClass(result.heuristics)}">${result.heuristics}/100</td>
        </tr>`;
    }
    
    if (result.seo !== undefined) {
      html += `
        <tr>
            <td>SEO</td>
            <td class="score ${getScoreClass(result.seo)}">${result.seo}/100</td>
        </tr>`;
    }
    
    if (result.performance !== undefined) {
      html += `
        <tr>
            <td>Performance</td>
            <td class="score ${getScoreClass(result.performance)}">${result.performance}/100</td>
        </tr>`;
    }
    
    html += `
        <tr>
            <td><strong>Overall</strong></td>
            <td class="score ${getScoreClass(result.overall)}"><strong>${result.overall}/100</strong></td>
        </tr>
    </table>
    
    <h2>Issues Found (${result.issues.length})</h2>`;
    
    // Group issues by type
    const issuesByType: {[key: string]: typeof result.issues} = {};
    
    result.issues.forEach(issue => {
      if (!issuesByType[issue.type]) {
        issuesByType[issue.type] = [];
      }
      issuesByType[issue.type].push(issue);
    });
    
    // Add issues by type
    Object.entries(issuesByType).forEach(([type, issues]) => {
      html += `
    <h3>${capitalizeFirstLetter(type)} Issues (${issues.length})</h3>`;
      
      issues.forEach(issue => {
        const severityIcon = getSeverityIcon(issue.severity);
        html += `
    <div class="issue">
        <div class="issue-title">${severityIcon} ${issue.title}</div>
        <div class="issue-description">${issue.description}</div>
        <div class="issue-meta">
            <span class="tag ${issue.type}">${issue.type}</span>
            <span class="tag ${issue.severity}">${issue.severity}</span>
            ${issue.element ? `<br>Element: ${issue.element}` : ''}
        </div>`;
        
        if (settings.includeRemediation && issue.remediation) {
          html += `
        <div class="issue-remediation">
            <strong>Remediation:</strong> ${issue.remediation}
        </div>`;
        }
        
        html += `
    </div>`;
      });
    });
    
    html += `
</body>
</html>`;
    
    // Create a Blob with the HTML content
    const blob = new Blob([html], { type: 'text/html' });
    
    // Create a download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `uxaudit-${sanitizeFilename(name)}.html`;
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('HTML export error:', error);
    throw new Error(`Failed to export HTML: ${error.message}`);
  }
}

/**
 * Get severity icon for issues
 * @param severity Issue severity
 * @returns Icon string
 */
function getSeverityIcon(severity: string): string {
  switch (severity) {
    case 'error':
      return '⚠️';
    case 'warning':
      return '⚠️';
    case 'info':
      return 'ℹ️';
    default:
      return '';
  }
}

/**
 * Get score class based on score value
 * @param score Score value
 * @returns CSS class name
 */
function getScoreClass(score: number): string {
  if (score >= 90) return 'good';
  if (score >= 70) return 'warning';
  return 'error';
}

/**
 * Capitalize first letter of a string
 * @param str String to capitalize
 * @returns Capitalized string
 */
function capitalizeFirstLetter(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Sanitize a string for use as a filename
 * @param name String to sanitize
 * @returns Sanitized string
 */
function sanitizeFilename(name: string): string {
  return name
    .replace(/[^a-z0-9]/gi, '-')
    .replace(/-+/g, '-')
    .toLowerCase();
}
