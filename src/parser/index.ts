import { Parser, AstBuilder, GherkinClassicTokenMatcher } from '@cucumber/gherkin';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { ParsedFeature, Feature, Scenario, Step, Background, Example, Location } from '../types';

export class FeatureParser {
  private parser: Parser<Feature>;

  constructor() {
    const tokenMatcher = new GherkinClassicTokenMatcher('en');
    const astBuilder = new AstBuilder(() => Math.random().toString(36).substr(2, 9));
    this.parser = new Parser(astBuilder, tokenMatcher);
  }

  /**
   * Parse a single .feature file into structured data
   */
  async parseFeatureFile(filePath: string): Promise<ParsedFeature> {
    try {
      const content = readFileSync(filePath, 'utf-8');
      const gherkinDocument = this.parser.parse(content);
      
      if (!gherkinDocument.feature) {
        throw new Error(`No feature found in file: ${filePath}`);
      }

      const feature = this.transformGherkinFeature(gherkinDocument.feature);
      
      return {
        feature,
        rawContent: content,
        filePath: resolve(filePath)
      };
    } catch (error) {
      throw new Error(`Failed to parse feature file ${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Parse multiple .feature files
   */
  async parseFeatureFiles(filePaths: string[]): Promise<ParsedFeature[]> {
    const results: ParsedFeature[] = [];
    
    for (const filePath of filePaths) {
      try {
        const parsed = await this.parseFeatureFile(filePath);
        results.push(parsed);
      } catch (error) {
        console.warn(`Skipping file ${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
    
    return results;
  }

  /**
   * Transform Gherkin AST feature into our Feature interface
   */
  private transformGherkinFeature(gherkinFeature: any): Feature {
    const feature: Feature = {
      name: gherkinFeature.name || 'Untitled Feature',
      description: gherkinFeature.description || '',
      tags: gherkinFeature.tags?.map((tag: any) => tag.name) || [],
      scenarios: [],
      location: this.transformLocation(gherkinFeature.location)
    };

    // Handle background
    if (gherkinFeature.children) {
      const backgroundChild = gherkinFeature.children.find((child: any) => child.background);
      if (backgroundChild?.background) {
        feature.background = this.transformBackground(backgroundChild.background);
      }

      // Handle scenarios and scenario outlines
      const scenarioChildren = gherkinFeature.children.filter((child: any) => 
        child.scenario || child.scenarioOutline
      );

      for (const child of scenarioChildren) {
        if (child.scenario) {
          feature.scenarios.push(this.transformScenario(child.scenario));
        } else if (child.scenarioOutline) {
          feature.scenarios.push(this.transformScenarioOutline(child.scenarioOutline));
        }
      }
    }

    return feature;
  }

  /**
   * Transform a regular scenario
   */
  private transformScenario(gherkinScenario: any): Scenario {
    return {
      name: gherkinScenario.name || 'Untitled Scenario',
      description: gherkinScenario.description || '',
      tags: gherkinScenario.tags?.map((tag: any) => tag.name) || [],
      steps: gherkinScenario.steps?.map((step: any) => this.transformStep(step)) || [],
      type: 'scenario',
      location: this.transformLocation(gherkinScenario.location)
    };
  }

  /**
   * Transform a scenario outline (with examples)
   */
  private transformScenarioOutline(gherkinScenarioOutline: any): Scenario {
    const scenario: Scenario = {
      name: gherkinScenarioOutline.name || 'Untitled Scenario Outline',
      description: gherkinScenarioOutline.description || '',
      tags: gherkinScenarioOutline.tags?.map((tag: any) => tag.name) || [],
      steps: gherkinScenarioOutline.steps?.map((step: any) => this.transformStep(step)) || [],
      type: 'scenario_outline',
      location: this.transformLocation(gherkinScenarioOutline.location)
    };

    // Handle examples
    if (gherkinScenarioOutline.examples) {
      scenario.examples = gherkinScenarioOutline.examples.map((example: any) => 
        this.transformExample(example)
      );
    }

    return scenario;
  }

  /**
   * Transform background
   */
  private transformBackground(gherkinBackground: any): Background {
    return {
      steps: gherkinBackground.steps?.map((step: any) => this.transformStep(step)) || [],
      location: this.transformLocation(gherkinBackground.location)
    };
  }

  /**
   * Transform a step
   */
  private transformStep(gherkinStep: any): Step {
    const step: Step = {
      keyword: gherkinStep.keyword || '',
      text: gherkinStep.text || '',
      location: this.transformLocation(gherkinStep.location)
    };

    // Handle step arguments (data tables, doc strings)
    if (gherkinStep.argument) {
      if (gherkinStep.argument.dataTable) {
        step.argument = {
          rows: gherkinStep.argument.dataTable.rows?.map((row: any) => 
            row.cells?.map((cell: any) => cell.value) || []
          ) || []
        };
      } else if (gherkinStep.argument.docString) {
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
  private transformExample(gherkinExample: any): Example {
    return {
      name: gherkinExample.name || 'Example',
      tags: gherkinExample.tags?.map((tag: any) => tag.name) || [],
      tableHeader: gherkinExample.tableHeader?.cells?.map((cell: any) => cell.value) || [],
      tableBody: gherkinExample.tableBody?.map((row: any) => 
        row.cells?.map((cell: any) => cell.value) || []
      ) || [],
      location: this.transformLocation(gherkinExample.location)
    };
  }

  /**
   * Transform location information
   */
  private transformLocation(gherkinLocation: any): Location | undefined {
    if (!gherkinLocation) return undefined;
    
    return {
      line: gherkinLocation.line || 0,
      column: gherkinLocation.column
    };
  }

  /**
   * Extract all scenarios from parsed features (flattened)
   */
  extractAllScenarios(parsedFeatures: ParsedFeature[]): Array<{ scenario: Scenario; feature: Feature; filePath: string }> {
    const scenarios: Array<{ scenario: Scenario; feature: Feature; filePath: string }> = [];
    
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
  findScenariosByTag(parsedFeatures: ParsedFeature[], tag: string): Array<{ scenario: Scenario; feature: Feature; filePath: string }> {
    const allScenarios = this.extractAllScenarios(parsedFeatures);
    return allScenarios.filter(({ scenario }) => 
      scenario.tags.some(scenarioTag => scenarioTag.includes(tag))
    );
  }
}



