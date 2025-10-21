import { ParsedFeature, Scenario, TestGenerationOptions, GeneratedTest } from '../types';
export declare class TestGenerator {
    private openai;
    private defaultPrompts;
    constructor(apiKey: string);
    /**
     * Generate test code for a single scenario
     */
    generateTestForScenario(scenario: Scenario, feature: ParsedFeature, options: TestGenerationOptions): Promise<GeneratedTest>;
    /**
     * Generate tests for all scenarios in parsed features
     */
    generateTestsForFeatures(parsedFeatures: ParsedFeature[], options: TestGenerationOptions): Promise<GeneratedTest[]>;
    /**
     * Build the prompt for test generation
     */
    private buildPrompt;
    /**
     * Get system prompt based on framework and language
     */
    private getSystemPrompt;
    /**
     * Get framework-specific instructions
     */
    private getFrameworkInstructions;
    /**
     * Generate file path for the test
     */
    private generateFilePath;
    /**
     * Get file extension based on language
     */
    private getFileExtension;
    /**
     * Initialize default prompts for different scenarios
     */
    private initializeDefaultPrompts;
    /**
     * Get custom prompt for specific scenario type
     */
    getCustomPrompt(scenarioType: string): string;
    /**
     * Validate generated test code
     */
    validateTestCode(code: string, framework: string, language: string): boolean;
}
//# sourceMappingURL=index.d.ts.map