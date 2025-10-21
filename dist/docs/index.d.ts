import { ParsedFeature, DocumentationOptions, GeneratedDocumentation, ExecutionResult, ScenarioTaskMapping } from '../types';
export declare class DocumentationGenerator {
    private executionResults;
    private taskMappings;
    /**
     * Generate documentation for a single feature
     */
    generateDocumentation(parsedFeature: ParsedFeature, options: DocumentationOptions): Promise<GeneratedDocumentation>;
    /**
     * Generate documentation for multiple features
     */
    generateDocumentationForFeatures(parsedFeatures: ParsedFeature[], options: DocumentationOptions): Promise<GeneratedDocumentation[]>;
    /**
     * Generate Markdown documentation
     */
    private generateMarkdownDocumentation;
    /**
     * Generate HTML documentation
     */
    private generateHtmlDocumentation;
    /**
     * Generate MDX documentation
     */
    private generateMdxDocumentation;
    /**
     * Generate Mermaid diagram for feature flow
     */
    private generateMermaidDiagram;
    /**
     * Generate file paths
     */
    private generateMarkdownFilePath;
    private generateHtmlFilePath;
    private generateMdxFilePath;
    /**
     * Get scenario status from execution results
     */
    private getScenarioStatus;
    /**
     * Get status emoji
     */
    private getStatusEmoji;
    /**
     * Generate unique scenario ID
     */
    private getScenarioId;
    /**
     * Set execution results for scenarios
     */
    setExecutionResults(results: ExecutionResult[]): void;
    /**
     * Set task mappings for scenarios
     */
    setTaskMappings(mappings: ScenarioTaskMapping[]): void;
}
//# sourceMappingURL=index.d.ts.map