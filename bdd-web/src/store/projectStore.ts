'use client';

import { create } from 'zustand';
import {
  getProjects,
  saveProject,
  getProjectById,
  deleteProject as deleteProjectFromDb,
} from '@/lib/storage';
import { Project, Feature, TestRun } from '@/lib/types';

type ProjectState = {
  projects: Project[];
  activeProject: Project | null;
  isLoading: boolean;
  fetchProjects: () => Promise<void>;
  setActiveProject: (projectId: string) => Promise<void>;
  addProject: (projectName: string) => Promise<Project | undefined>;
  deleteProject: (projectId: string) => Promise<void>;
  addFeatureToProject: (projectId: string, feature: Feature) => Promise<void>;
  updateRunInProject: (projectId: string, run: TestRun) => Promise<void>;
  getOrCreateTestRun: (projectId: string, featureId: string, environment: string, version: string) => Promise<TestRun>;
  completeTestRun: (projectId: string, runId: string) => Promise<void>;
  resetAllTests: (projectId: string, featureId: string) => Promise<void>;
  resetAllVersions: (projectId: string) => Promise<void>;
};

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  activeProject: null,
  isLoading: true,
  
  fetchProjects: async () => {
    set({ isLoading: true });
    const projects = await getProjects();
    set({ projects, isLoading: false });
  },

  setActiveProject: async (projectId: string) => {
    const project = await getProjectById(projectId);
    set({ activeProject: project || null });
  },
  
  addProject: async (projectName) => {
    try {
        const newProject: Project = { 
          id: crypto.randomUUID(), 
          name: projectName, 
          features: [], 
          runs: [] 
        };
        await saveProject(newProject);
        set((state) => ({ projects: [...state.projects, newProject] }));
        return newProject;
    } catch (e) {
        console.error('Failed to create project:', e);
        return undefined;
    }
  },

  deleteProject: async (projectId: string) => {
    await deleteProjectFromDb(projectId);
    set((state) => ({
        projects: state.projects.filter(p => p.id !== projectId),
        activeProject: state.activeProject?.id === projectId ? null : state.activeProject
    }));
  },

  addFeatureToProject: async (projectId: string, newFeature: Feature) => {
    const project = await getProjectById(projectId);
    if (!project) return;

    const existingFeatureIndex = project.features.findIndex(f => f.name === newFeature.name);
    if (existingFeatureIndex !== -1) {
        // Feature exists, check hash
        if (project.features[existingFeatureIndex].sourceFile.hash === newFeature.sourceFile.hash) {
            return;
        }
        // Update existing feature
        project.features[existingFeatureIndex] = newFeature;
        // Mark old runs as outdated (or remove them)
        project.runs = project.runs.filter(r => r.featureId !== project.features[existingFeatureIndex].id);
    } else {
        // Add new feature
        project.features.push(newFeature);
    }
    
    // Don't create initial test run - let user create it manually

    await saveProject(project);
    set({ activeProject: { ...project } });
    await get().fetchProjects(); // Refresh project list
  },

  updateRunInProject: async (projectId, updatedRun) => {
    const project = await getProjectById(projectId);
    if (!project) return;

    const runIndex = project.runs.findIndex(r => r.id === updatedRun.id);
    if (runIndex !== -1) {
        project.runs[runIndex] = updatedRun;
    } else {
        project.runs.push(updatedRun);
    }

    await saveProject(project);
    set({ activeProject: { ...project } });
  },

  getOrCreateTestRun: async (projectId, featureId, environment, version) => {
    const project = await getProjectById(projectId);
    if (!project) throw new Error('Project not found');

    const feature = project.features.find(f => f.id === featureId);
    if (!feature) throw new Error('Feature not found');

    // Look for existing in-progress run with same environment and version
    let existingRun = project.runs.find(r => 
      r.featureId === featureId && 
      r.environment === environment && 
      r.version === version && 
      r.status === 'in_progress'
    );

    if (existingRun) {
      return existingRun;
    }

    // Create new test run
    const newRun: TestRun = {
      id: crypto.randomUUID(),
      featureId: featureId,
      createdAt: new Date().toISOString(),
      environment: environment as any,
      version: version,
      scenarios: feature.scenarios.map(scenario => ({
        ...scenario,
        status: 'untested' as const,
        steps: scenario.steps.map(step => ({
          ...step,
          result: 'untested' as const
        }))
      })),
      summary: {
        total: feature.scenarios.length,
        passed: 0,
        failed: 0,
        skipped: 0,
        untested: feature.scenarios.length
      },
      status: 'in_progress',
      isLocked: false
    };

    project.runs.push(newRun);
    await saveProject(project);
    set({ activeProject: { ...project } });
    
    return newRun;
  },

  completeTestRun: async (projectId, runId) => {
    console.log('Store: Completing test run', { projectId, runId });
    
    const project = await getProjectById(projectId);
    if (!project) {
      console.error('Project not found:', projectId);
      return;
    }

    console.log('Found project:', project.name);
    console.log('Project runs:', project.runs.length);

    const runIndex = project.runs.findIndex(r => r.id === runId);
    console.log('Run index:', runIndex);
    
    if (runIndex !== -1) {
      console.log('Updating run at index:', runIndex);
      project.runs[runIndex] = {
        ...project.runs[runIndex],
        status: 'completed',
        completedAt: new Date().toISOString(),
        isLocked: true
      };
      console.log('Updated run:', project.runs[runIndex]);
    } else {
      console.error('Run not found:', runId);
    }

    await saveProject(project);
    set({ activeProject: { ...project } });
    console.log('Test run completed and saved');
  },

  resetAllTests: async (projectId, featureId) => {
    const project = await getProjectById(projectId);
    if (!project) return;

    // Reset all runs for this feature to untested state
    project.runs = project.runs.map(run => {
      if (run.featureId === featureId) {
        return {
          ...run,
          scenarios: run.scenarios.map(scenario => ({
            ...scenario,
            status: 'untested' as const,
            steps: scenario.steps.map(step => ({
              ...step,
              result: 'untested' as const
            }))
          })),
          summary: {
            total: run.scenarios.length,
            passed: 0,
            failed: 0,
            skipped: 0,
            untested: run.scenarios.length
          },
          status: 'in_progress' as const,
          isLocked: false
        };
      }
      return run;
    });
    
    await saveProject(project);
    set({ activeProject: { ...project } });
  },

  resetAllVersions: async (projectId) => {
    const project = await getProjectById(projectId);
    if (!project) return;

    // Delete all runs (remove versions completely)
    project.runs = [];
    
    await saveProject(project);
    set({ activeProject: { ...project } });
  }
}));


