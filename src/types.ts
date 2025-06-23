import { SceneNode } from '@figma/plugin-typings';

// Types for UXAudit plugin
export interface Settings {
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

export interface AuditResult {
  accessibility: number;
  heuristics?: number;
  seo?: number;
  performance?: number;
  overall: number;
  issues: Issue[];
}

export interface Issue {
  type: 'accessibility' | 'seo' | 'performance' | 'heuristic';
  severity: 'error' | 'warning' | 'info';
  title: string;
  description: string;
  remediation?: string;
  node?: figma.SceneNode;
}

export interface LighthouseResult {
  categories: {
    accessibility: {
      score: number;
    };
    seo: {
      score: number;
    };
    performance: {
      score: number;
    };
    'best-practices': {
      score: number;
    };
  };
  audits: {
    [key: string]: {
      score: number | null;
      title: string;
      description: string;
      displayValue?: string;
    };
  };
}

export type Check = {
  id: string;
  evaluate: (node: figma.SceneNode) => boolean;
};

export type CheckResult = {
  passed: boolean;
  errors: Issue[];
};
