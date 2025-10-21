"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startServer = startServer;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const glob_1 = require("glob");
const fs_extra_1 = require("fs-extra");
const path_1 = require("path");
const parser_1 = require("../parser");
const generator_1 = require("../generator");
const docs_1 = require("../docs");
async function startServer(port = 3000, host = 'localhost') {
    const app = (0, express_1.default)();
    // Middleware
    app.use((0, cors_1.default)());
    app.use(express_1.default.json());
    app.use(express_1.default.static('public'));
    // API Routes
    /**
     * Get all features
     */
    app.get('/api/features', async (req, res) => {
        try {
            const featureFiles = await (0, glob_1.glob)('features/**/*.feature');
            const parser = new parser_1.FeatureParser();
            const parsedFeatures = await parser.parseFeatureFiles(featureFiles);
            res.json({
                success: true,
                data: parsedFeatures.map(pf => ({
                    name: pf.feature.name,
                    description: pf.feature.description,
                    tags: pf.feature.tags,
                    scenarioCount: pf.feature.scenarios.length,
                    filePath: pf.filePath,
                    scenarios: pf.feature.scenarios.map(s => ({
                        name: s.name,
                        description: s.description,
                        tags: s.tags,
                        steps: s.steps.length,
                        type: s.type,
                        location: s.location
                    }))
                }))
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    });
    /**
     * Get specific feature details
     */
    app.get('/api/features/:featureName', async (req, res) => {
        try {
            const { featureName } = req.params;
            const featureFiles = await (0, glob_1.glob)('features/**/*.feature');
            const parser = new parser_1.FeatureParser();
            const parsedFeatures = await parser.parseFeatureFiles(featureFiles);
            const feature = parsedFeatures.find(pf => pf.feature.name.toLowerCase().replace(/\s+/g, '-') === featureName.toLowerCase());
            if (!feature) {
                return res.status(404).json({
                    success: false,
                    error: 'Feature not found'
                });
            }
            res.json({
                success: true,
                data: feature
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    });
    /**
     * Generate tests for features
     */
    app.post('/api/generate/tests', async (req, res) => {
        try {
            const { featureFiles = ['features/**/*.feature'], framework = 'playwright', language = 'typescript', baseUrl, outputDir = 'tests' } = req.body;
            if (!process.env.OPENAI_API_KEY) {
                return res.status(400).json({
                    success: false,
                    error: 'OpenAI API key not configured'
                });
            }
            const files = await (0, glob_1.glob)(Array.isArray(featureFiles) ? featureFiles.join(',') : featureFiles);
            const parser = new parser_1.FeatureParser();
            const parsedFeatures = await parser.parseFeatureFiles(files);
            const testOptions = {
                framework: framework,
                language: language,
                baseUrl
            };
            const testGenerator = new generator_1.TestGenerator(process.env.OPENAI_API_KEY);
            const generatedTests = await testGenerator.generateTestsForFeatures(parsedFeatures, testOptions);
            // Write test files
            const writtenFiles = [];
            for (const test of generatedTests) {
                const outputPath = (0, path_1.resolve)(outputDir, test.filePath);
                (0, fs_extra_1.ensureDirSync)((0, path_1.dirname)(outputPath));
                (0, fs_extra_1.writeFileSync)(outputPath, test.code);
                writtenFiles.push(outputPath);
            }
            res.json({
                success: true,
                data: {
                    generatedTests: generatedTests.length,
                    writtenFiles,
                    tests: generatedTests.map(t => ({
                        filePath: t.filePath,
                        framework: t.framework,
                        language: t.language,
                        scenarioName: t.scenario.name
                    }))
                }
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    });
    /**
     * Generate documentation for features
     */
    app.post('/api/generate/docs', async (req, res) => {
        try {
            const { featureFiles = ['features/**/*.feature'], format = 'markdown', includeDiagrams = false, includeStatus = false, theme = 'light', outputDir = 'docs' } = req.body;
            const files = await (0, glob_1.glob)(Array.isArray(featureFiles) ? featureFiles.join(',') : featureFiles);
            const parser = new parser_1.FeatureParser();
            const parsedFeatures = await parser.parseFeatureFiles(files);
            const docOptions = {
                format: format,
                includeDiagrams,
                includeStatus,
                theme: theme
            };
            const docGenerator = new docs_1.DocumentationGenerator();
            const generatedDocs = await docGenerator.generateDocumentationForFeatures(parsedFeatures, docOptions);
            // Write documentation files
            const writtenFiles = [];
            for (const doc of generatedDocs) {
                const outputPath = (0, path_1.resolve)(outputDir, doc.filePath);
                (0, fs_extra_1.ensureDirSync)((0, path_1.dirname)(outputPath));
                (0, fs_extra_1.writeFileSync)(outputPath, doc.content);
                writtenFiles.push(outputPath);
            }
            res.json({
                success: true,
                data: {
                    generatedDocs: generatedDocs.length,
                    writtenFiles,
                    docs: generatedDocs.map(d => ({
                        filePath: d.filePath,
                        format: d.format,
                        featureName: d.feature.name
                    }))
                }
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    });
    /**
     * Parse feature files
     */
    app.post('/api/parse', async (req, res) => {
        try {
            const { featureFiles = ['features/**/*.feature'] } = req.body;
            const files = await (0, glob_1.glob)(Array.isArray(featureFiles) ? featureFiles.join(',') : featureFiles);
            const parser = new parser_1.FeatureParser();
            const parsedFeatures = await parser.parseFeatureFiles(files);
            res.json({
                success: true,
                data: parsedFeatures
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    });
    /**
     * Get execution results
     */
    app.get('/api/execution-results', async (req, res) => {
        try {
            // In a real implementation, this would read from a database
            // For now, return empty results
            res.json({
                success: true,
                data: []
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    });
    /**
     * Update execution results
     */
    app.post('/api/execution-results', async (req, res) => {
        try {
            const { results } = req.body;
            // In a real implementation, this would save to a database
            // For now, just return success
            res.json({
                success: true,
                data: { updated: results.length }
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    });
    /**
     * Health check
     */
    app.get('/api/health', (req, res) => {
        res.json({
            success: true,
            data: {
                status: 'healthy',
                timestamp: new Date().toISOString(),
                version: '1.0.0'
            }
        });
    });
    // Serve static files for the frontend
    app.get('*', (req, res) => {
        res.sendFile((0, path_1.resolve)(__dirname, '../../public/index.html'));
    });
    // Start server
    app.listen(port, host, () => {
        console.log(`🚀 BDD AI Assistant server running on http://${host}:${port}`);
    });
    return app;
}
//# sourceMappingURL=index.js.map