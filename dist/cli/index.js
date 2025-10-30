#!/usr/bin/env node
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const ora_1 = __importDefault(require("ora"));
const glob_1 = require("glob");
const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
const parser_1 = require("../parser");
const generator_1 = require("../generator");
const docs_1 = require("../docs");
const dotenv_1 = require("dotenv");
// Load environment variables
(0, dotenv_1.config)();
const program = new commander_1.Command();
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
    const spinner = (0, ora_1.default)('Initializing BDD AI Assistant...').start();
    try {
        // Validate OpenAI API key
        if (!process.env.OPENAI_API_KEY) {
            spinner.fail('OpenAI API key not found. Please set OPENAI_API_KEY environment variable.');
            process.exit(1);
        }
        spinner.text = 'Finding feature files...';
        // Find feature files
        const featureFiles = await (0, glob_1.glob)(options.from);
        if (featureFiles.length === 0) {
            spinner.fail(`No feature files found matching pattern: ${options.from}`);
            process.exit(1);
        }
        spinner.text = `Found ${featureFiles.length} feature file(s)`;
        // Parse feature files
        spinner.text = 'Parsing feature files...';
        const parser = new parser_1.FeatureParser();
        const parsedFeatures = await parser.parseFeatureFiles(featureFiles);
        if (parsedFeatures.length === 0) {
            spinner.fail('No valid feature files found');
            process.exit(1);
        }
        spinner.text = `Parsed ${parsedFeatures.length} feature(s)`;
        // Declare variables for summary
        let generatedTests = [];
        let generatedDocs = [];
        // Generate tests
        if (options.tests) {
            spinner.text = 'Generating test files...';
            const testOptions = {
                framework: options.framework,
                language: options.language,
                baseUrl: options.baseUrl
            };
            const testGenerator = new generator_1.TestGenerator(process.env.OPENAI_API_KEY);
            generatedTests = await testGenerator.generateTestsForFeatures(parsedFeatures, testOptions);
            // Write test files
            for (const test of generatedTests) {
                const outputPath = (0, path_1.resolve)(options.outputTests, test.filePath);
                (0, fs_extra_1.ensureDirSync)((0, path_1.dirname)(outputPath));
                (0, fs_extra_1.writeFileSync)(outputPath, test.code);
            }
            spinner.text = `Generated ${generatedTests.length} test file(s)`;
        }
        // Generate documentation
        if (options.docs) {
            spinner.text = 'Generating documentation...';
            const docOptions = {
                format: options.format,
                includeDiagrams: options.includeDiagrams,
                includeStatus: options.includeStatus,
                theme: options.theme
            };
            const docGenerator = new docs_1.DocumentationGenerator();
            generatedDocs = await docGenerator.generateDocumentationForFeatures(parsedFeatures, docOptions);
            // Write documentation files
            for (const doc of generatedDocs) {
                const outputPath = (0, path_1.resolve)(options.outputDocs, doc.filePath);
                (0, fs_extra_1.ensureDirSync)((0, path_1.dirname)(outputPath));
                (0, fs_extra_1.writeFileSync)(outputPath, doc.content);
            }
            spinner.text = `Generated ${generatedDocs.length} documentation file(s)`;
        }
        spinner.succeed('Generation completed successfully!');
        // Summary
        console.log('\n' + chalk_1.default.green('📊 Summary:'));
        console.log(chalk_1.default.blue(`  Features processed: ${parsedFeatures.length}`));
        if (options.tests) {
            console.log(chalk_1.default.blue(`  Test files generated: ${generatedTests?.length || 0}`));
            console.log(chalk_1.default.gray(`  Output directory: ${options.outputTests}`));
        }
        if (options.docs) {
            console.log(chalk_1.default.blue(`  Documentation files generated: ${generatedDocs?.length || 0}`));
            console.log(chalk_1.default.gray(`  Output directory: ${options.outputDocs}`));
        }
    }
    catch (error) {
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
    const spinner = (0, ora_1.default)('Parsing feature files...').start();
    try {
        const featureFiles = await (0, glob_1.glob)(options.from);
        if (featureFiles.length === 0) {
            spinner.fail(`No feature files found matching pattern: ${options.from}`);
            process.exit(1);
        }
        const parser = new parser_1.FeatureParser();
        const parsedFeatures = await parser.parseFeatureFiles(featureFiles);
        spinner.succeed(`Parsed ${parsedFeatures.length} feature(s)`);
        if (options.json) {
            console.log(JSON.stringify(parsedFeatures, null, 2));
        }
        else {
            // Display structured output
            for (const parsedFeature of parsedFeatures) {
                console.log(chalk_1.default.green(`\n📁 Feature: ${parsedFeature.feature.name}`));
                console.log(chalk_1.default.gray(`   File: ${parsedFeature.filePath}`));
                console.log(chalk_1.default.gray(`   Description: ${parsedFeature.feature.description || 'No description'}`));
                if (parsedFeature.feature.tags.length > 0) {
                    console.log(chalk_1.default.gray(`   Tags: ${parsedFeature.feature.tags.join(', ')}`));
                }
                console.log(chalk_1.default.blue(`\n   Scenarios (${parsedFeature.feature.scenarios.length}):`));
                for (const scenario of parsedFeature.feature.scenarios) {
                    console.log(chalk_1.default.yellow(`     • ${scenario.name}`));
                    console.log(chalk_1.default.gray(`       Type: ${scenario.type}`));
                    console.log(chalk_1.default.gray(`       Steps: ${scenario.steps.length}`));
                    if (scenario.tags.length > 0) {
                        console.log(chalk_1.default.gray(`       Tags: ${scenario.tags.join(', ')}`));
                    }
                }
            }
        }
    }
    catch (error) {
        spinner.fail(`Parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        process.exit(1);
    }
});
program
    .command('validate')
    .description('Validate feature files for syntax errors')
    .option('-f, --from <path>', 'Path to feature files (glob pattern)', 'features/**/*.feature')
    .action(async (options) => {
    const spinner = (0, ora_1.default)('Validating feature files...').start();
    try {
        const featureFiles = await (0, glob_1.glob)(options.from);
        if (featureFiles.length === 0) {
            spinner.fail(`No feature files found matching pattern: ${options.from}`);
            process.exit(1);
        }
        const parser = new parser_1.FeatureParser();
        const results = [];
        for (const file of featureFiles) {
            try {
                await parser.parseFeatureFile(file);
                results.push({ file, valid: true });
            }
            catch (error) {
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
        }
        else {
            spinner.warn(`${validCount} valid, ${invalidCount} invalid feature files`);
            console.log(chalk_1.default.red('\n❌ Invalid files:'));
            for (const result of results.filter(r => !r.valid)) {
                console.log(chalk_1.default.red(`  ${result.file}: ${result.error}`));
            }
            if (validCount > 0) {
                console.log(chalk_1.default.green('\n✅ Valid files:'));
                for (const result of results.filter(r => r.valid)) {
                    console.log(chalk_1.default.green(`  ${result.file}`));
                }
            }
            process.exit(1);
        }
    }
    catch (error) {
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
    const spinner = (0, ora_1.default)('Starting BDD AI Assistant server...').start();
    try {
        // Import server module dynamically
        const { startServer } = await Promise.resolve().then(() => __importStar(require('../server')));
        await startServer(parseInt(options.port), options.host);
        spinner.succeed(`Server started on http://${options.host}:${options.port}`);
        console.log(chalk_1.default.blue('\n🌐 Web interface available at:'));
        console.log(chalk_1.default.blue(`   http://${options.host}:${options.port}`));
        console.log(chalk_1.default.gray('\nPress Ctrl+C to stop the server'));
    }
    catch (error) {
        spinner.fail(`Failed to start server: ${error instanceof Error ? error.message : 'Unknown error'}`);
        process.exit(1);
    }
});
// Error handling
program.on('command:*', () => {
    console.error(chalk_1.default.red(`Invalid command: ${program.args.join(' ')}`));
    console.log(chalk_1.default.gray('See --help for available commands'));
    process.exit(1);
});
program.parse();
//# sourceMappingURL=index.js.map