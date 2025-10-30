// Core data structures for the application

export interface Step {
  id: string;
  keyword: string; // Given, When, Then, And
  text: string;
  result: 'passed' | 'failed' | 'untested' | 'skipped';
  note?: string; // Optional note for the step result
  attachments?: StepAttachment[]; // Optional attachments (images, videos, documents)
}

export interface StepAttachment {
  id: string;
  name: string;
  type: 'image' | 'video' | 'document' | 'other';
  url: string; // Data URL or file path
  uploadedAt: string; // ISO string
}

export interface Scenario {
  id: string;
  name: string;
  steps: Step[];
  status: 'passed' | 'failed' | 'untested' | 'skipped';
  tags: string[];
}

export interface Feature {
  id: string;
  name: string;
  description: string;
  tags: string[];
  scenarios: Scenario[];
  sourceFile: {
    name: string;
    content: string;
    hash: string;
  };
}

export interface TestRun {
  id: string;
  featureId: string;
  createdAt: string; // ISO string
  environment: 'staging' | 'production' | 'uat'; // Updated environments
  version: string; // Version name (e.g., v1.0.0, v2.1.0)
  scenarios: Scenario[]; // Holds the state of each scenario during the run
  summary: {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
    untested: number;
  };
  status: 'in_progress' | 'completed' | 'paused'; // Run status
  completedAt?: string; // ISO string - when run was completed
  isLocked: boolean; // New: prevents editing completed runs
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  features: Feature[];
  runs: TestRun[];
}