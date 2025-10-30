#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { glob } from 'glob';
import { writeFileSync, ensureDirSync } from 'fs-extra';
import { resolve, dirname } from 'path';
import { FeatureParser } from '../parser';
import { TestGenerator } from '../generator';
import { DocumentationGenerator } from '../docs';
import { TestGenerationOptions, DocumentationOptions } from '../types';
import { config } from 'dotenv';

// Load environment variables
config();

const program = new Command();

program
  .name('bdd-ai')
  .description('BDD AI Assistant - Generate tests and documentation from Gherkin features')
  .version('1.0.0');

program
  .command('generate')
  .description('Generate tests and documentation from feature files')
  .option('-f, --from <path>', 'Path to feature files (glob pattern)', 'features/**/*.feature')
  .option('-t, --tests', 'Generate test files', true)
  .option('-d, --docs', 'Generate documentation', true)
  .option('--framework <framework>', 'Test framework (playwright, cypress, pytest, jest)', 'playwright')
  .option('--language <language>', 'Programming language (typescript, javascript, python, java)', 'typescript')
  .option('--format <format>', 'Documentation format (markdown, html, mdx)', 'markdown')
  .option('--base-url <url>', 'Base URL for tests')
  .option('--output-tests <path>', 'Output directory for test files', 'tests')
  .option('--output-docs <path>', 'Output directory for documentation', 'docs')
  .option('--include-diagrams', 'Include Mermaid diagrams in documentation', false)
  .option('--include-status', 'Include execution status in documentation', false)
  .option('--theme <theme>', 'Documentation theme (light, dark)', 'light')
  .action(async (options) => {
    const spinner = ora('Initializing BDD AI Assistant...').start();
    
    try {
      // Validate OpenAI API key
      if (!process.env.OPENAI_API_KEY) {
        spinner.fail('OpenAI API key not found. Please set OPENAI_API_KEY environment variable.');
        process.exit(1);
      }

      spinner.text = 'Finding feature files...';
      
      // Find feature files
      const featureFiles = await glob(options.from);
      if (featureFiles.length === 0) {
        spinner.fail(`No feature files found matching pattern: ${options.from}`);
        process.exit(1);
      }

      spinner.text = `Found ${featureFiles.length} feature file(s)`;

      // Parse feature files
      spinner.text = 'Parsing feature files...';
      const parser = new FeatureParser();
      const parsedFeatures = await parser.parseFeatureFiles(featureFiles);
      
      if (parsedFeatures.length === 0) {
        spinner.fail('No valid feature files found');
        process.exit(1);
      }

      spinner.text = `Parsed ${parsedFeatures.length} feature(s)`;

      // Declare variables for summary
      let generatedTests: any[] = [];
      let generatedDocs: any[] = [];

      // Generate tests
      if (options.tests) {
        spinner.text = 'Generating test files...';
        
        const testOptions: TestGenerationOptions = {
          framework: options.framework as any,
          language: options.language as any,
          baseUrl: options.baseUrl
        };

        const testGenerator = new TestGenerator(process.env.OPENAI_API_KEY);
        generatedTests = await testGenerator.generateTestsForFeatures(parsedFeatures, testOptions);

        // Write test files
        for (const test of generatedTests) {
          const outputPath = resolve(options.outputTests, test.filePath);
          ensureDirSync(dirname(outputPath));
          writeFileSync(outputPath, test.code);
        }

        spinner.text = `Generated ${generatedTests.length} test file(s)`;
      }

      // Generate documentation
      if (options.docs) {
        spinner.text = 'Generating documentation...';
        
        const docOptions: DocumentationOptions = {
          format: options.format as any,
          includeDiagrams: options.includeDiagrams,
          includeStatus: options.includeStatus,
          theme: options.theme as any
        };

        const docGenerator = new DocumentationGenerator();
        generatedDocs = await docGenerator.generateDocumentationForFeatures(parsedFeatures, docOptions);

        // Write documentation files
        for (const doc of generatedDocs) {
          const outputPath = resolve(options.outputDocs, doc.filePath);
          ensureDirSync(dirname(outputPath));
          writeFileSync(outputPath, doc.content);
        }

        spinner.text = `Generated ${generatedDocs.length} documentation file(s)`;
      }

      spinner.succeed('Generation completed successfully!');
      
      // Summary
      console.log('\n' + chalk.green('📊 Summary:'));
      console.log(chalk.blue(`  Features processed: ${parsedFeatures.length}`));
      if (options.tests) {
        console.log(chalk.blue(`  Test files generated: ${generatedTests?.length || 0}`));
        console.log(chalk.gray(`  Output directory: ${options.outputTests}`));
      }
      if (options.docs) {
        console.log(chalk.blue(`  Documentation files generated: ${generatedDocs?.length || 0}`));
        console.log(chalk.gray(`  Output directory: ${options.outputDocs}`));
      }

    } catch (error) {
      spinner.fail(`Generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      process.exit(1);
    }
  });

program
  .command('parse')
  .description('Parse feature files and display structure')
  .option('-f, --from <path>', 'Path to feature files (glob pattern)', 'features/**/*.feature')
  .option('--json', 'Output as JSON')
  .action(async (options) => {
    const spinner = ora('Parsing feature files...').start();
    
    try {
      const featureFiles = await glob(options.from);
      if (featureFiles.length === 0) {
        spinner.fail(`No feature files found matching pattern: ${options.from}`);
        process.exit(1);
      }

      const parser = new FeatureParser();
      const parsedFeatures = await parser.parseFeatureFiles(featureFiles);
      
      spinner.succeed(`Parsed ${parsedFeatures.length} feature(s)`);

      if (options.json) {
        console.log(JSON.stringify(parsedFeatures, null, 2));
      } else {
        // Display structured output
        for (const parsedFeature of parsedFeatures) {
          console.log(chalk.green(`\n📁 Feature: ${parsedFeature.feature.name}`));
          console.log(chalk.gray(`   File: ${parsedFeature.filePath}`));
          console.log(chalk.gray(`   Description: ${parsedFeature.feature.description || 'No description'}`));
          
          if (parsedFeature.feature.tags.length > 0) {
            console.log(chalk.gray(`   Tags: ${parsedFeature.feature.tags.join(', ')}`));
          }

          console.log(chalk.blue(`\n   Scenarios (${parsedFeature.feature.scenarios.length}):`));
          for (const scenario of parsedFeature.feature.scenarios) {
            console.log(chalk.yellow(`     • ${scenario.name}`));
            console.log(chalk.gray(`       Type: ${scenario.type}`));
            console.log(chalk.gray(`       Steps: ${scenario.steps.length}`));
            
            if (scenario.tags.length > 0) {
              console.log(chalk.gray(`       Tags: ${scenario.tags.join(', ')}`));
            }
          }
        }
      }

    } catch (error) {
      spinner.fail(`Parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      process.exit(1);
    }
  });

program
  .command('validate')
  .description('Validate feature files for syntax errors')
  .option('-f, --from <path>', 'Path to feature files (glob pattern)', 'features/**/*.feature')
  .action(async (options) => {
    const spinner = ora('Validating feature files...').start();
    
    try {
      const featureFiles = await glob(options.from);
      if (featureFiles.length === 0) {
        spinner.fail(`No feature files found matching pattern: ${options.from}`);
        process.exit(1);
      }

      const parser = new FeatureParser();
      const results: Array<{ file: string; valid: boolean; error?: string }> = [];
      
      for (const file of featureFiles) {
        try {
          await parser.parseFeatureFile(file);
          results.push({ file, valid: true });
        } catch (error) {
          results.push({ 
            file, 
            valid: false, 
            error: error instanceof Error ? error.message : 'Unknown error' 
          });
        }
      }

      const validCount = results.filter(r => r.valid).length;
      const invalidCount = results.filter(r => !r.valid).length;

      if (invalidCount === 0) {
        spinner.succeed(`All ${validCount} feature files are valid!`);
      } else {
        spinner.warn(`${validCount} valid, ${invalidCount} invalid feature files`);
        
        console.log(chalk.red('\n❌ Invalid files:'));
        for (const result of results.filter(r => !r.valid)) {
          console.log(chalk.red(`  ${result.file}: ${result.error}`));
        }
        
        if (validCount > 0) {
          console.log(chalk.green('\n✅ Valid files:'));
          for (const result of results.filter(r => r.valid)) {
            console.log(chalk.green(`  ${result.file}`));
          }
        }
        
        process.exit(1);
      }

    } catch (error) {
      spinner.fail(`Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      process.exit(1);
    }
  });

program
  .command('server')
  .description('Start the BDD AI Assistant web server')
  .option('-p, --port <port>', 'Port to run the server on', '3000')
  .option('--host <host>', 'Host to bind the server to', 'localhost')
  .action(async (options) => {
    const spinner = ora('Starting BDD AI Assistant server...').start();
    
    try {
      // Import server module dynamically
      const { startServer } = await import('../server');
      await startServer(parseInt(options.port), options.host);
      
      spinner.succeed(`Server started on http://${options.host}:${options.port}`);
      console.log(chalk.blue('\n🌐 Web interface available at:'));
      console.log(chalk.blue(`   http://${options.host}:${options.port}`));
      console.log(chalk.gray('\nPress Ctrl+C to stop the server'));
      
    } catch (error) {
      spinner.fail(`Failed to start server: ${error instanceof Error ? error.message : 'Unknown error'}`);
      process.exit(1);
    }
  });

// Error handling
program.on('command:*', () => {
  console.error(chalk.red(`Invalid command: ${program.args.join(' ')}`));
  console.log(chalk.gray('See --help for available commands'));
  process.exit(1);
});

program.parse();



