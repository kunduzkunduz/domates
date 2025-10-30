import { v4 as uuidv4 } from 'uuid';
import { Feature, Scenario, Step } from './types';
import { createHash } from './hash';

export const parseFeatureFile = (fileName: string, fileContent: string): Feature => {
  const lines = fileContent.split('\n');
  const feature: Feature = {
    id: uuidv4(),
    name: '',
    description: '',
    tags: [],
    scenarios: [],
    sourceFile: {
      name: fileName,
      content: fileContent,
      hash: createHash(fileContent),
    },
  };

  let currentScenario: Scenario | null = null;
  let inScenario = false;
  const descriptionLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (!line || line.startsWith('#')) continue;

    // Parse Feature
    if (line.startsWith('Feature:')) {
      feature.name = line.replace('Feature:', '').trim();
      i++;
      
      // Parse description
      while (i < lines.length && !lines[i].trim().startsWith('Scenario')) {
        const descLine = lines[i].trim();
        if (descLine) {
          descriptionLines.push(descLine);
        }
        i++;
      }
      feature.description = descriptionLines.join(' ');
      i--; // Back one step
      continue;
    }

    // Parse Scenario
    if (line.startsWith('Scenario:')) {
      if (currentScenario) {
        feature.scenarios.push(currentScenario);
      }
      
      currentScenario = {
        id: uuidv4(),
        name: line.replace('Scenario:', '').trim(),
        steps: [],
        status: 'untested',
        tags: [],
      };
      
      inScenario = true;
      continue;
    }

    // Parse Steps
    if (inScenario && currentScenario) {
      const stepKeywords = ['Given', 'When', 'Then', 'And', 'But'];
      const isStep = stepKeywords.some(keyword => line.startsWith(keyword + ' '));
      
      if (isStep) {
        let keyword = '';
        let text = '';
        
        for (const stepKeyword of stepKeywords) {
          if (line.startsWith(stepKeyword + ' ')) {
            keyword = stepKeyword;
            text = line.substring(stepKeyword.length + 1).trim();
            break;
          }
        }

        const step: Step = {
          id: uuidv4(),
          keyword,
          text,
          result: 'untested',
        };

        currentScenario.steps.push(step);
      }
    }
  }

  // Add the last scenario
  if (currentScenario) {
    feature.scenarios.push(currentScenario);
  }

  return feature;
};