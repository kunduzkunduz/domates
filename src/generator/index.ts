import OpenAI from 'openai';
import { ParsedFeature, Scenario, TestGenerationOptions, GeneratedTest } from '../types';

export class TestGenerator {
  private openai: OpenAI;
  private defaultPrompts: Record<string, string>;

  constructor(apiKey: string) {
    this.openai = new OpenAI({ apiKey });
    this.defaultPrompts = this.initializeDefaultPrompts();
  }

  /**
   * Generate test code for a single scenario
   */
  async generateTestForScenario(
    scenario: Scenario,
    feature: ParsedFeature,
    options: TestGenerationOptions
  ): Promise<GeneratedTest> {
    const prompt = this.buildPrompt(scenario, feature, options);
    
    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: this.getSystemPrompt(options)
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 2000
      });

      const generatedCode = response.choices[0]?.message?.content || '';
      const filePath = this.generateFilePath(scenario, options);

      return {
        code: generatedCode,
        filePath,
        framework: options.framework,
        language: options.language,
        scenario
      };
    } catch (error) {
      throw new Error(`Failed to generate test for scenario "${scenario.name}": ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate tests for all scenarios in parsed features
   */
  async generateTestsForFeatures(
    parsedFeatures: ParsedFeature[],
    options: TestGenerationOptions
  ): Promise<GeneratedTest[]> {
    const tests: GeneratedTest[] = [];
    
    for (const parsedFeature of parsedFeatures) {
      for (const scenario of parsedFeature.feature.scenarios) {
        try {
          const test = await this.generateTestForScenario(scenario, parsedFeature, options);
          tests.push(test);
        } catch (error) {
          console.warn(`Skipping scenario "${scenario.name}": ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }
    }
    
    return tests;
  }

  /**
   * Build the prompt for test generation
   */
  private buildPrompt(scenario: Scenario, feature: ParsedFeature, options: TestGenerationOptions): string {
    const framework = options.framework;
    const language = options.language;
    
    let prompt = `Generate ${framework} test code in ${language} for the following Gherkin scenario:\n\n`;
    
    prompt += `Feature: ${feature.feature.name}\n`;
    if (feature.feature.description) {
      prompt += `${feature.feature.description}\n`;
    }
    
    prompt += `\nScenario: ${scenario.name}\n`;
    if (scenario.description) {
      prompt += `${scenario.description}\n`;
    }
    
    // Add background steps if they exist
    if (feature.feature.background) {
      prompt += `\nBackground:\n`;
      for (const step of feature.feature.background.steps) {
        prompt += `${step.keyword} ${step.text}\n`;
      }
    }
    
    // Add scenario steps
    prompt += `\nSteps:\n`;
    for (const step of scenario.steps) {
      prompt += `${step.keyword} ${step.text}\n`;
      
      // Add step arguments if they exist
      if (step.argument) {
        if ('rows' in step.argument) {
          prompt += `\nData Table:\n`;
          for (const row of step.argument.rows) {
            prompt += `| ${row.join(' | ')} |\n`;
          }
        } else if ('content' in step.argument) {
          prompt += `\nDoc String:\n${step.argument.content}\n`;
        }
      }
    }
    
    // Add examples if it's a scenario outline
    if (scenario.type === 'scenario_outline' && scenario.examples) {
      prompt += `\nExamples:\n`;
      for (const example of scenario.examples) {
        prompt += `\n${example.name}:\n`;
        if (example.tableHeader.length > 0) {
          prompt += `| ${example.tableHeader.join(' | ')} |\n`;
          for (const row of example.tableBody) {
            prompt += `| ${row.join(' | ')} |\n`;
          }
        }
      }
    }
    
    // Add configuration options
    if (options.baseUrl) {
      prompt += `\nBase URL: ${options.baseUrl}\n`;
    }
    
    if (options.selectors) {
      prompt += `\nCustom Selectors:\n`;
      for (const [key, value] of Object.entries(options.selectors)) {
        prompt += `${key}: ${value}\n`;
      }
    }
    
    prompt += `\n${this.getFrameworkInstructions(framework, language)}`;
    
    return prompt;
  }

  /**
   * Get system prompt based on framework and language
   */
  private getSystemPrompt(options: TestGenerationOptions): string {
    const { framework, language } = options;
    
    return `You are an expert test automation engineer specializing in ${framework} and ${language}.

Your task is to generate clean, maintainable, and robust test code that:
1. Follows best practices for ${framework}
2. Uses proper selectors and assertions
3. Handles common web interactions (clicks, fills, waits, etc.)
4. Includes proper error handling
5. Is well-structured and readable
6. Uses appropriate test data and fixtures

Generate ONLY the test code without any explanations or markdown formatting. The code should be ready to run.`;
  }

  /**
   * Get framework-specific instructions
   */
  private getFrameworkInstructions(framework: string, language: string): string {
    const instructions: Record<string, Record<string, string>> = {
      playwright: {
        typescript: `
Requirements for Playwright + TypeScript:
- Use page.goto() for navigation
- Use page.fill() for input fields
- Use page.click() for buttons and links
- Use page.locator() for element selection
- Use expect(page).toHaveURL() for URL assertions
- Use expect(page.locator()).toBeVisible() for visibility assertions
- Include proper imports: import { test, expect } from '@playwright/test'
- Use descriptive test names
- Add proper waits and assertions
- Handle async/await properly`,
        javascript: `
Requirements for Playwright + JavaScript:
- Use page.goto() for navigation
- Use page.fill() for input fields
- Use page.click() for buttons and links
- Use page.locator() for element selection
- Use expect(page).toHaveURL() for URL assertions
- Use expect(page.locator()).toBeVisible() for visibility assertions
- Include proper imports: const { test, expect } = require('@playwright/test')
- Use descriptive test names
- Add proper waits and assertions
- Handle async/await properly`
      },
      cypress: {
        typescript: `
Requirements for Cypress + TypeScript:
- Use cy.visit() for navigation
- Use cy.get() for element selection
- Use cy.type() for input fields
- Use cy.click() for buttons and links
- Use cy.url().should() for URL assertions
- Use cy.get().should('be.visible') for visibility assertions
- Include proper imports: import { cy } from 'cypress'
- Use descriptive test names
- Add proper waits and assertions
- Use data-testid attributes when possible`,
        javascript: `
Requirements for Cypress + JavaScript:
- Use cy.visit() for navigation
- Use cy.get() for element selection
- Use cy.type() for input fields
- Use cy.click() for buttons and links
- Use cy.url().should() for URL assertions
- Use cy.get().should('be.visible') for visibility assertions
- Include proper imports: const { cy } = require('cypress')
- Use descriptive test names
- Add proper waits and assertions
- Use data-testid attributes when possible`
      },
      pytest: {
        python: `
Requirements for Pytest + Python:
- Use selenium webdriver for browser automation
- Use WebDriverWait for explicit waits
- Use expected_conditions for wait conditions
- Use proper selectors (ID, class, xpath, css)
- Use assert statements for assertions
- Include proper imports: from selenium import webdriver, from selenium.webdriver.common.by import By
- Use descriptive test names
- Add proper waits and assertions
- Handle exceptions properly
- Use pytest fixtures for setup/teardown`
      },
      jest: {
        typescript: `
Requirements for Jest + TypeScript:
- Use puppeteer or playwright for browser automation
- Use proper selectors and assertions
- Use async/await properly
- Include proper imports: import puppeteer from 'puppeteer'
- Use descriptive test names
- Add proper waits and assertions
- Use Jest matchers for assertions
- Handle async operations properly`,
        javascript: `
Requirements for Jest + JavaScript:
- Use puppeteer or playwright for browser automation
- Use proper selectors and assertions
- Use async/await properly
- Include proper imports: const puppeteer = require('puppeteer')
- Use descriptive test names
- Add proper waits and assertions
- Use Jest matchers for assertions
- Handle async operations properly`
      }
    };

    return instructions[framework]?.[language] || 'Generate appropriate test code for the given framework and language.';
  }

  /**
   * Generate file path for the test
   */
  private generateFilePath(scenario: Scenario, options: TestGenerationOptions): string {
    const sanitizedName = scenario.name
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '_');
    
    const extension = this.getFileExtension(options.language);
    return `tests/${sanitizedName}.${extension}`;
  }

  /**
   * Get file extension based on language
   */
  private getFileExtension(language: string): string {
    const extensions: Record<string, string> = {
      typescript: 'ts',
      javascript: 'js',
      python: 'py',
      java: 'java'
    };
    
    return extensions[language] || 'ts';
  }

  /**
   * Initialize default prompts for different scenarios
   */
  private initializeDefaultPrompts(): Record<string, string> {
    return {
      login: 'Focus on authentication flows, form validation, and session management.',
      api: 'Focus on HTTP requests, response validation, and API contract testing.',
      ui: 'Focus on user interface interactions, element visibility, and user experience.',
      e2e: 'Focus on complete user journeys from start to finish.',
      performance: 'Focus on load times, response times, and performance metrics.'
    };
  }

  /**
   * Get custom prompt for specific scenario type
   */
  getCustomPrompt(scenarioType: string): string {
    return this.defaultPrompts[scenarioType] || '';
  }

  /**
   * Validate generated test code
   */
  validateTestCode(code: string, framework: string, language: string): boolean {
    // Basic validation - check for common patterns
    const validations: Record<string, RegExp[]> = {
      playwright: [
        /import.*@playwright\/test/,
        /test\(/,
        /expect\(/,
        /page\./
      ],
      cypress: [
        /cy\./,
        /describe\(/,
        /it\(/
      ],
      pytest: [
        /def test_/,
        /from selenium/,
        /assert/
      ],
      jest: [
        /describe\(/,
        /it\(/,
        /expect\(/
      ]
    };

    const frameworkValidations = validations[framework] || [];
    return frameworkValidations.every(pattern => pattern.test(code));
  }
}



