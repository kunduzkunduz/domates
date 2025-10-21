import { ParsedFeature, Feature, Scenario } from '../types';
export declare class FeatureParser {
    private parser;
    constructor();
    /**
     * Parse a single .feature file into structured data
     */
    parseFeatureFile(filePath: string): Promise<ParsedFeature>;
    /**
     * Parse multiple .feature files
     */
    parseFeatureFiles(filePaths: string[]): Promise<ParsedFeature[]>;
    /**
     * Transform Gherkin AST feature into our Feature interface
     */
    private transformGherkinFeature;
    /**
     * Transform a regular scenario
     */
    private transformScenario;
    /**
     * Transform a scenario outline (with examples)
     */
    private transformScenarioOutline;
    /**
     * Transform background
     */
    private transformBackground;
    /**
     * Transform a step
     */
    private transformStep;
    /**
     * Transform example table
     */
    private transformExample;
    /**
     * Transform location information
     */
    private transformLocation;
    /**
     * Extract all scenarios from parsed features (flattened)
     */
    extractAllScenarios(parsedFeatures: ParsedFeature[]): Array<{
        scenario: Scenario;
        feature: Feature;
        filePath: string;
    }>;
    /**
     * Find scenarios by tag
     */
    findScenariosByTag(parsedFeatures: ParsedFeature[], tag: string): Array<{
        scenario: Scenario;
        feature: Feature;
        filePath: string;
    }>;
}
//# sourceMappingURL=index.d.ts.map