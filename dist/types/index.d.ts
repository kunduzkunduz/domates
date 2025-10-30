export interface Feature {
    name: string;
    description: string;
    tags: string[];
    scenarios: Scenario[];
    background?: Background;
    location?: Location;
}
export interface Scenario {
    name: string;
    description: string;
    tags: string[];
    steps: Step[];
    examples?: Example[];
    location?: Location;
    type: 'scenario' | 'scenario_outline';
}
export interface Background {
    steps: Step[];
    location?: Location;
}
export interface Step {
    keyword: string;
    text: string;
    argument?: DataTable | DocString;
    location?: Location;
}
export interface DataTable {
    rows: string[][];
}
export interface DocString {
    content: string;
    contentType?: string;
}
export interface Example {
    name: string;
    tags: string[];
    tableHeader: string[];
    tableBody: string[][];
    location?: Location;
}
export interface Location {
    line: number;
    column?: number;
}
export interface ParsedFeature {
    feature: Feature;
    rawContent: string;
    filePath: string;
}
export interface TestGenerationOptions {
    framework: 'playwright' | 'cypress' | 'pytest' | 'jest';
    language: 'typescript' | 'javascript' | 'python' | 'java';
    baseUrl?: string;
    selectors?: Record<string, string>;
    customPrompts?: Record<string, string>;
}
export interface GeneratedTest {
    code: string;
    filePath: string;
    framework: string;
    language: string;
    scenario: Scenario;
}
export interface DocumentationOptions {
    format: 'markdown' | 'html' | 'mdx';
    includeDiagrams: boolean;
    includeStatus: boolean;
    theme?: 'light' | 'dark';
}
export interface GeneratedDocumentation {
    content: string;
    filePath: string;
    format: string;
    feature: Feature;
}
export interface ExecutionResult {
    scenarioId: string;
    status: 'passed' | 'failed' | 'skipped' | 'pending';
    duration?: number;
    error?: string;
    notes?: string;
    executedAt: Date;
}
export interface LinearTask {
    id: string;
    title: string;
    description?: string;
    status: string;
    url: string;
    assignee?: string;
}
export interface ScenarioTaskMapping {
    scenarioId: string;
    taskId: string;
    task: LinearTask;
}
//# sourceMappingURL=index.d.ts.map