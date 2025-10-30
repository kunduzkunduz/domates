import { Feature, TestRun, Scenario, Step } from './types';

const getStatusIcon = (status: 'passed' | 'failed' | 'untested' | 'skipped') => {
  switch (status) {
    case 'passed': return '✅';
    case 'failed': return '❌';
    case 'skipped': return '⏭️';
    case 'untested': return '⚪️';
    default: return '⚪️';
  }
};

export const generateMarkdownDoc = (feature: Feature, run?: TestRun): string => {
  let markdown = `# 🧪 ${feature.name}\n\n`;
  if (feature.description) {
    markdown += `> ${feature.description}\n\n`;
  }

  const scenariosToRender = run ? run.scenarios : feature.scenarios;

  scenariosToRender.forEach((scenario: Scenario, index: number) => {
    const scenarioStatusIcon = getStatusIcon(scenario.status);
    markdown += `## ${scenarioStatusIcon} ${scenario.name}\n\n`;

    scenario.steps.forEach((step: Step) => {
      const stepStatusIcon = getStatusIcon(step.result);
      const keyword = step.keyword.toUpperCase();
      markdown += `**${keyword}** ${step.text} ${stepStatusIcon}\n\n`;
    });

    // Add separator between scenarios (except for the last one)
    if (index < scenariosToRender.length - 1) {
      markdown += `---\n\n`;
    }
  });
  
  if (run) {
    markdown += `\n---\n\n*Last updated: ${new Date(run.createdAt).toLocaleString()}*\n`;
  }

  return markdown;
};