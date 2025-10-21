import { ParsedFeature, DocumentationOptions, GeneratedDocumentation, ExecutionResult, ScenarioTaskMapping } from '../types';
import { marked } from 'marked';

export class DocumentationGenerator {
  private executionResults: Map<string, ExecutionResult> = new Map();
  private taskMappings: Map<string, ScenarioTaskMapping> = new Map();

  /**
   * Generate documentation for a single feature
   */
  async generateDocumentation(
    parsedFeature: ParsedFeature,
    options: DocumentationOptions
  ): Promise<GeneratedDocumentation> {
    let content: string;
    let filePath: string;

    switch (options.format) {
      case 'markdown':
        content = this.generateMarkdownDocumentation(parsedFeature, options);
        filePath = this.generateMarkdownFilePath(parsedFeature);
        break;
      case 'html':
        content = this.generateHtmlDocumentation(parsedFeature, options);
        filePath = this.generateHtmlFilePath(parsedFeature);
        break;
      case 'mdx':
        content = this.generateMdxDocumentation(parsedFeature, options);
        filePath = this.generateMdxFilePath(parsedFeature);
        break;
      default:
        throw new Error(`Unsupported documentation format: ${options.format}`);
    }

    return {
      content,
      filePath,
      format: options.format,
      feature: parsedFeature.feature
    };
  }

  /**
   * Generate documentation for multiple features
   */
  async generateDocumentationForFeatures(
    parsedFeatures: ParsedFeature[],
    options: DocumentationOptions
  ): Promise<GeneratedDocumentation[]> {
    const docs: GeneratedDocumentation[] = [];
    
    for (const parsedFeature of parsedFeatures) {
      try {
        const doc = await this.generateDocumentation(parsedFeature, options);
        docs.push(doc);
      } catch (error) {
        console.warn(`Failed to generate documentation for feature "${parsedFeature.feature.name}": ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
    
    return docs;
  }

  /**
   * Generate Markdown documentation
   */
  private generateMarkdownDocumentation(parsedFeature: ParsedFeature, options: DocumentationOptions): string {
    const { feature } = parsedFeature;
    let content = '';

    // Feature header
    content += `# 🧪 Feature: ${feature.name}\n\n`;
    
    if (feature.description) {
      content += `${feature.description}\n\n`;
    }

    // Tags
    if (feature.tags.length > 0) {
      content += `**Tags:** ${feature.tags.map(tag => `\`${tag}\``).join(' ')}\n\n`;
    }

    // Background
    if (feature.background) {
      content += `## Background\n\n`;
      for (const step of feature.background.steps) {
        content += `- **${step.keyword}:** ${step.text}\n`;
      }
      content += '\n';
    }

    // Scenarios
    content += `## Scenarios\n\n`;
    
    for (const scenario of feature.scenarios) {
      const status = this.getScenarioStatus(scenario);
      const statusEmoji = this.getStatusEmoji(status);
      
      content += `### ${statusEmoji} ${scenario.name}\n\n`;
      
      if (scenario.description) {
        content += `${scenario.description}\n\n`;
      }

      // Scenario tags
      if (scenario.tags.length > 0) {
        content += `**Tags:** ${scenario.tags.map(tag => `\`${tag}\``).join(' ')}\n\n`;
      }

      // Steps
      content += `**Steps:**\n\n`;
      for (const step of scenario.steps) {
        content += `- **${step.keyword}** ${step.text}\n`;
        
        // Add step arguments
        if (step.argument) {
          if ('rows' in step.argument) {
            content += `\n  **Data Table:**\n`;
            content += `  \`\`\`\n`;
            for (const row of step.argument.rows) {
              content += `  | ${row.join(' | ')} |\n`;
            }
            content += `  \`\`\`\n\n`;
          } else if ('content' in step.argument) {
            content += `\n  **Doc String:**\n`;
            content += `  \`\`\`\n`;
            content += `  ${step.argument.content}\n`;
            content += `  \`\`\`\n\n`;
          }
        }
      }

      // Examples for scenario outlines
      if (scenario.type === 'scenario_outline' && scenario.examples) {
        content += `\n**Examples:**\n\n`;
        for (const example of scenario.examples) {
          content += `#### ${example.name}\n\n`;
          if (example.tableHeader.length > 0) {
            content += `| ${example.tableHeader.join(' | ')} |\n`;
            content += `| ${example.tableHeader.map(() => '---').join(' | ')} |\n`;
            for (const row of example.tableBody) {
              content += `| ${row.join(' | ')} |\n`;
            }
            content += '\n';
          }
        }
      }

      // Execution status
      if (options.includeStatus) {
        const result = this.executionResults.get(this.getScenarioId(scenario));
        if (result) {
          content += `**Last Execution:** ${result.status} (${result.executedAt.toISOString()})\n`;
          if (result.duration) {
            content += `**Duration:** ${result.duration}ms\n`;
          }
          if (result.error) {
            content += `**Error:** ${result.error}\n`;
          }
          if (result.notes) {
            content += `**Notes:** ${result.notes}\n`;
          }
          content += '\n';
        }
      }

      // Linked task
      const taskMapping = this.taskMappings.get(this.getScenarioId(scenario));
      if (taskMapping) {
        content += `**Linked Task:** [${taskMapping.task.title}](${taskMapping.task.url})\n\n`;
      }

      content += '---\n\n';
    }

    // Generate Mermaid diagram if requested
    if (options.includeDiagrams) {
      content += `## Feature Flow Diagram\n\n`;
      content += `\`\`\`mermaid\n`;
      content += this.generateMermaidDiagram(feature);
      content += `\n\`\`\`\n\n`;
    }

    // Metadata
    content += `## Metadata\n\n`;
    content += `- **File:** \`${parsedFeature.filePath}\`\n`;
    content += `- **Generated:** ${new Date().toISOString()}\n`;
    content += `- **Total Scenarios:** ${feature.scenarios.length}\n`;
    
    const passedScenarios = feature.scenarios.filter(s => 
      this.executionResults.get(this.getScenarioId(s))?.status === 'passed'
    ).length;
    content += `- **Passed Scenarios:** ${passedScenarios}\n`;

    return content;
  }

  /**
   * Generate HTML documentation
   */
  private generateHtmlDocumentation(parsedFeature: ParsedFeature, options: DocumentationOptions): string {
    const markdownContent = this.generateMarkdownDocumentation(parsedFeature, options);
    const htmlContent = marked(markdownContent);
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Feature: ${parsedFeature.feature.name}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            color: ${options.theme === 'dark' ? '#e0e0e0' : '#333'};
            background-color: ${options.theme === 'dark' ? '#1a1a1a' : '#fff'};
        }
        h1 { color: ${options.theme === 'dark' ? '#4CAF50' : '#2E7D32'}; }
        h2 { color: ${options.theme === 'dark' ? '#2196F3' : '#1976D2'}; }
        h3 { color: ${options.theme === 'dark' ? '#FF9800' : '#F57C00'}; }
        code { 
            background-color: ${options.theme === 'dark' ? '#333' : '#f5f5f5'}; 
            padding: 2px 4px; 
            border-radius: 3px; 
        }
        pre { 
            background-color: ${options.theme === 'dark' ? '#333' : '#f5f5f5'}; 
            padding: 15px; 
            border-radius: 5px; 
            overflow-x: auto; 
        }
        table { 
            border-collapse: collapse; 
            width: 100%; 
            margin: 10px 0; 
        }
        th, td { 
            border: 1px solid ${options.theme === 'dark' ? '#555' : '#ddd'}; 
            padding: 8px; 
            text-align: left; 
        }
        th { 
            background-color: ${options.theme === 'dark' ? '#333' : '#f2f2f2'}; 
        }
        .status-passed { color: #4CAF50; }
        .status-failed { color: #F44336; }
        .status-skipped { color: #FF9800; }
        .status-pending { color: #9E9E9E; }
    </style>
</head>
<body>
    ${htmlContent}
</body>
</html>`;
  }

  /**
   * Generate MDX documentation
   */
  private generateMdxDocumentation(parsedFeature: ParsedFeature, options: DocumentationOptions): string {
    const { feature } = parsedFeature;
    let content = '';

    content += `import { useState } from 'react';\n`;
    content += `import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';\n`;
    content += `import { Badge } from '@/components/ui/badge';\n`;
    content += `import { CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';\n\n`;

    content += `# Feature: ${feature.name}\n\n`;
    
    if (feature.description) {
      content += `${feature.description}\n\n`;
    }

    // Tags
    if (feature.tags.length > 0) {
      content += `<div className="flex gap-2 mb-4">\n`;
      for (const tag of feature.tags) {
        content += `  <Badge variant="secondary">${tag}</Badge>\n`;
      }
      content += `</div>\n\n`;
    }

    // Scenarios
    for (const scenario of feature.scenarios) {
      const status = this.getScenarioStatus(scenario);
      
      content += `<Card className="mb-4">\n`;
      content += `  <CardHeader>\n`;
      content += `    <CardTitle className="flex items-center gap-2">\n`;
      content += `      {getStatusIcon('${status}')} ${scenario.name}\n`;
      content += `    </CardTitle>\n`;
      content += `  </CardHeader>\n`;
      content += `  <CardContent>\n`;
      
      if (scenario.description) {
        content += `    <p className="text-gray-600 mb-4">${scenario.description}</p>\n`;
      }

      // Steps
      content += `    <div className="space-y-2">\n`;
      for (const step of scenario.steps) {
        content += `      <div className="flex items-start gap-2">\n`;
        content += `        <Badge variant="outline">${step.keyword}</Badge>\n`;
        content += `        <span>${step.text}</span>\n`;
        content += `      </div>\n`;
      }
      content += `    </div>\n`;
      
      content += `  </CardContent>\n`;
      content += `</Card>\n\n`;
    }

    // Helper function for status icons
    content += `function getStatusIcon(status: string) {\n`;
    content += `  switch (status) {\n`;
    content += `    case 'passed': return <CheckCircle className="w-5 h-5 text-green-500" />;\n`;
    content += `    case 'failed': return <XCircle className="w-5 h-5 text-red-500" />;\n`;
    content += `    case 'skipped': return <Clock className="w-5 h-5 text-yellow-500" />;\n`;
    content += `    case 'pending': return <AlertCircle className="w-5 h-5 text-gray-500" />;\n`;
    content += `    default: return <AlertCircle className="w-5 h-5 text-gray-500" />;\n`;
    content += `  }\n`;
    content += `}\n`;

    return content;
  }

  /**
   * Generate Mermaid diagram for feature flow
   */
  private generateMermaidDiagram(feature: any): string {
    let diagram = 'graph TD\n';
    
    // Add background steps
    if (feature.background) {
      diagram += '    Start([Start]) --> Background\n';
      diagram += '    Background --> Scenarios\n';
      
      for (let i = 0; i < feature.background.steps.length; i++) {
        const step = feature.background.steps[i];
        const stepId = `bg_${i}`;
        diagram += `    Background --> ${stepId}["${step.keyword} ${step.text}"]\n`;
        if (i < feature.background.steps.length - 1) {
          diagram += `    ${stepId} --> bg_${i + 1}\n`;
        } else {
          diagram += `    ${stepId} --> Scenarios\n`;
        }
      }
    } else {
      diagram += '    Start([Start]) --> Scenarios\n';
    }

    // Add scenarios
    for (let i = 0; i < feature.scenarios.length; i++) {
      const scenario = feature.scenarios[i];
      const scenarioId = `scenario_${i}`;
      diagram += `    Scenarios --> ${scenarioId}["${scenario.name}"]\n`;
      
      for (let j = 0; j < scenario.steps.length; j++) {
        const step = scenario.steps[j];
        const stepId = `${scenarioId}_step_${j}`;
        diagram += `    ${scenarioId} --> ${stepId}["${step.keyword} ${step.text}"]\n`;
        
        if (j < scenario.steps.length - 1) {
          diagram += `    ${stepId} --> ${scenarioId}_step_${j + 1}\n`;
        } else {
          diagram += `    ${stepId} --> End${i}([End])\n`;
        }
      }
    }

    return diagram;
  }

  /**
   * Generate file paths
   */
  private generateMarkdownFilePath(parsedFeature: ParsedFeature): string {
    const sanitizedName = parsedFeature.feature.name
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '_');
    return `docs/${sanitizedName}.md`;
  }

  private generateHtmlFilePath(parsedFeature: ParsedFeature): string {
    const sanitizedName = parsedFeature.feature.name
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '_');
    return `docs/${sanitizedName}.html`;
  }

  private generateMdxFilePath(parsedFeature: ParsedFeature): string {
    const sanitizedName = parsedFeature.feature.name
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '_');
    return `docs/${sanitizedName}.mdx`;
  }

  /**
   * Get scenario status from execution results
   */
  private getScenarioStatus(scenario: any): string {
    const scenarioId = this.getScenarioId(scenario);
    const result = this.executionResults.get(scenarioId);
    return result?.status || 'pending';
  }

  /**
   * Get status emoji
   */
  private getStatusEmoji(status: string): string {
    const emojis: Record<string, string> = {
      passed: '✅',
      failed: '❌',
      skipped: '⏭️',
      pending: '⏳'
    };
    return emojis[status] || '⏳';
  }

  /**
   * Generate unique scenario ID
   */
  private getScenarioId(scenario: any): string {
    return `${scenario.name}_${scenario.location?.line || 0}`;
  }

  /**
   * Set execution results for scenarios
   */
  setExecutionResults(results: ExecutionResult[]): void {
    this.executionResults.clear();
    for (const result of results) {
      this.executionResults.set(result.scenarioId, result);
    }
  }

  /**
   * Set task mappings for scenarios
   */
  setTaskMappings(mappings: ScenarioTaskMapping[]): void {
    this.taskMappings.clear();
    for (const mapping of mappings) {
      this.taskMappings.set(mapping.scenarioId, mapping);
    }
  }
}



