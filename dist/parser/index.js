"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeatureParser = void 0;
const gherkin_1 = require("@cucumber/gherkin");
const fs_1 = require("fs");
const path_1 = require("path");
class FeatureParser {
    parser;
    constructor() {
        const tokenMatcher = new gherkin_1.GherkinClassicTokenMatcher('en');
        const astBuilder = new gherkin_1.AstBuilder();
        this.parser = new gherkin_1.Parser(astBuilder, tokenMatcher);
    }
    /**
     * Parse a single .feature file into structured data
     */
    async parseFeatureFile(filePath) {
        try {
            const content = (0, fs_1.readFileSync)(filePath, 'utf-8');
            const gherkinDocument = this.parser.parse(content);
            if (!gherkinDocument.feature) {
                throw new Error(`No feature found in file: ${filePath}`);
            }
            const feature = this.transformGherkinFeature(gherkinDocument.feature);
            return {
                feature,
                rawContent: content,
                filePath: (0, path_1.resolve)(filePath)
            };
        }
        catch (error) {
            throw new Error(`Failed to parse feature file ${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    /**
     * Parse multiple .feature files
     */
    async parseFeatureFiles(filePaths) {
        const results = [];
        for (const filePath of filePaths) {
            try {
                const parsed = await this.parseFeatureFile(filePath);
                results.push(parsed);
            }
            catch (error) {
                console.warn(`Skipping file ${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        }
        return results;
    }
    /**
     * Transform Gherkin AST feature into our Feature interface
     */
    transformGherkinFeature(gherkinFeature) {
        const feature = {
            name: gherkinFeature.name || 'Untitled Feature',
            description: gherkinFeature.description || '',
            tags: gherkinFeature.tags?.map((tag) => tag.name) || [],
            scenarios: [],
            location: this.transformLocation(gherkinFeature.location)
        };
        // Handle background
        if (gherkinFeature.children) {
            const backgroundChild = gherkinFeature.children.find((child) => child.background);
            if (backgroundChild?.background) {
                feature.background = this.transformBackground(backgroundChild.background);
            }
            // Handle scenarios and scenario outlines
            const scenarioChildren = gherkinFeature.children.filter((child) => child.scenario || child.scenarioOutline);
            for (const child of scenarioChildren) {
                if (child.scenario) {
                    feature.scenarios.push(this.transformScenario(child.scenario));
                }
                else if (child.scenarioOutline) {
                    feature.scenarios.push(this.transformScenarioOutline(child.scenarioOutline));
                }
            }
        }
        return feature;
    }
    /**
     * Transform a regular scenario
     */
    transformScenario(gherkinScenario) {
        return {
            name: gherkinScenario.name || 'Untitled Scenario',
            description: gherkinScenario.description || '',
            tags: gherkinScenario.tags?.map((tag) => tag.name) || [],
            steps: gherkinScenario.steps?.map((step) => this.transformStep(step)) || [],
            type: 'scenario',
            location: this.transformLocation(gherkinScenario.location)
        };
    }
    /**
     * Transform a scenario outline (with examples)
     */
    transformScenarioOutline(gherkinScenarioOutline) {
        const scenario = {
            name: gherkinScenarioOutline.name || 'Untitled Scenario Outline',
            description: gherkinScenarioOutline.description || '',
            tags: gherkinScenarioOutline.tags?.map((tag) => tag.name) || [],
            steps: gherkinScenarioOutline.steps?.map((step) => this.transformStep(step)) || [],
            type: 'scenario_outline',
            location: this.transformLocation(gherkinScenarioOutline.location)
        };
        // Handle examples
        if (gherkinScenarioOutline.examples) {
            scenario.examples = gherkinScenarioOutline.examples.map((example) => this.transformExample(example));
        }
        return scenario;
    }
    /**
     * Transform background
     */
    transformBackground(gherkinBackground) {
        return {
            steps: gherkinBackground.steps?.map((step) => this.transformStep(step)) || [],
            location: this.transformLocation(gherkinBackground.location)
        };
    }
    /**
     * Transform a step
     */
    transformStep(gherkinStep) {
        const step = {
            keyword: gherkinStep.keyword || '',
            text: gherkinStep.text || '',
            location: this.transformLocation(gherkinStep.location)
        };
        // Handle step arguments (data tables, doc strings)
        if (gherkinStep.argument) {
            if (gherkinStep.argument.dataTable) {
                step.argument = {
                    rows: gherkinStep.argument.dataTable.rows?.map((row) => row.cells?.map((cell) => cell.value) || []) || []
                };
            }
            else if (gherkinStep.argument.docString) {
                step.argument = {
                    content: gherkinStep.argument.docString.content || '',
                    contentType: gherkinStep.argument.docString.contentType
                };
            }
        }
        return step;
    }
    /**
     * Transform example table
     */
    transformExample(gherkinExample) {
        return {
            name: gherkinExample.name || 'Example',
            tags: gherkinExample.tags?.map((tag) => tag.name) || [],
            tableHeader: gherkinExample.tableHeader?.cells?.map((cell) => cell.value) || [],
            tableBody: gherkinExample.tableBody?.map((row) => row.cells?.map((cell) => cell.value) || []) || [],
            location: this.transformLocation(gherkinExample.location)
        };
    }
    /**
     * Transform location information
     */
    transformLocation(gherkinLocation) {
        if (!gherkinLocation)
            return undefined;
        return {
            line: gherkinLocation.line || 0,
            column: gherkinLocation.column
        };
    }
    /**
     * Extract all scenarios from parsed features (flattened)
     */
    extractAllScenarios(parsedFeatures) {
        const scenarios = [];
        for (const parsedFeature of parsedFeatures) {
            for (const scenario of parsedFeature.feature.scenarios) {
                scenarios.push({
                    scenario,
                    feature: parsedFeature.feature,
                    filePath: parsedFeature.filePath
                });
            }
        }
        return scenarios;
    }
    /**
     * Find scenarios by tag
     */
    findScenariosByTag(parsedFeatures, tag) {
        const allScenarios = this.extractAllScenarios(parsedFeatures);
        return allScenarios.filter(({ scenario }) => scenario.tags.some(scenarioTag => scenarioTag.includes(tag)));
    }
}
exports.FeatureParser = FeatureParser;
//# sourceMappingURL=index.js.map