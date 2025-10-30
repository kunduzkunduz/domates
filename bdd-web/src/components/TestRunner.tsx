'use client';
import { useState, useEffect } from 'react';
import { useProjectStore } from '@/store/projectStore';
import { getProjectById } from '@/lib/storage';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Feature, TestRun, Scenario, Step } from '@/lib/types';
import { TestRunHistory } from './TestRunHistory';
import { VersionComparison } from './VersionComparison';

const calculateScenarioStatus = (scenario: Scenario): 'passed' | 'failed' | 'untested' | 'skipped' => {
  const hasFailed = scenario.steps.some(step => step.result === 'failed');
  const hasUntested = scenario.steps.some(step => step.result === 'untested');
  const hasPassed = scenario.steps.some(step => step.result === 'passed');
  const hasSkipped = scenario.steps.some(step => step.result === 'skipped');

  if (hasFailed) return 'failed';
  if (hasUntested) return 'untested';
  if (hasPassed && !hasSkipped) return 'passed';
  if (hasSkipped && !hasPassed) return 'skipped';
  if (hasPassed && hasSkipped) return 'passed';
  
  return 'untested';
};

export function TestRunner({ projectId, featureId }: { projectId: string; featureId: string }) {
  const { activeProject, getOrCreateTestRun, completeTestRun, updateRunInProject } = useProjectStore();
  const [currentRun, setCurrentRun] = useState<TestRun | null>(null);
  const [environment, setEnvironment] = useState<'staging' | 'production' | 'uat'>('staging');
  const [version, setVersion] = useState('');
  const [selectedScenarios, setSelectedScenarios] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'test' | 'history' | 'comparison'>('test');
  const [currentScenarioIndex, setCurrentScenarioIndex] = useState(0);

  const feature = activeProject?.features.find(f => f.id === featureId);

  useEffect(() => {
    if (activeProject && version) {
      // Find existing run for current environment and version
      const existingRun = activeProject.runs.find(run => 
        run.featureId === featureId && 
        run.environment === environment && 
        run.version === version
      );
      
      if (existingRun) {
        console.log('Found existing run:', existingRun.id, 'status:', existingRun.status);
        setCurrentRun(existingRun);
      } else {
        console.log('No existing run found for:', { featureId, environment, version });
        setCurrentRun(null);
      }
    } else if (activeProject && !version) {
      // No version specified, no run should be active
      setCurrentRun(null);
    }
  }, [activeProject, featureId, environment, version]);

  const handleEnvironmentChange = (newEnvironment: 'staging' | 'production' | 'uat') => {
    setEnvironment(newEnvironment);
    // Reset version when environment changes
    setVersion('');
  };

  const handleVersionChange = (newVersion: string) => {
    // Only allow version change if no active run or run is completed
    if (!currentRun || currentRun.status === 'completed') {
      setVersion(newVersion);
    }
  };

  const handleCompleteRun = async () => {
    if (!currentRun || !activeProject) return;

    try {
      console.log('Completing run:', currentRun.id);
      await completeTestRun(activeProject.id, currentRun.id);
      
      // Refresh current run if it exists
      const updatedProject = await getProjectById(activeProject.id);
      if (updatedProject) {
        const updatedRun = updatedProject.runs.find(run => run.id === currentRun.id);
        if (updatedRun) {
          console.log('Updated run after completion:', updatedRun);
          setCurrentRun(updatedRun);
        }
      }
    } catch (error) {
      console.error('Error completing run:', error);
      alert('Error completing run');
    }
  };

  const handleResetAllTests = async () => {
    if (!activeProject || !currentRun) return;
    
    try {
      // Reset only the current run's tests to untested
      const updatedRun = { ...currentRun };
      updatedRun.scenarios.forEach(scenario => {
        scenario.status = 'untested';
        scenario.steps.forEach(step => {
          step.result = 'untested';
        });
      });
      
      // Recalculate summary
      updatedRun.summary = {
        total: updatedRun.scenarios.length,
        passed: 0,
        failed: 0,
        skipped: 0,
        untested: updatedRun.scenarios.length
      };
      
    setCurrentRun(updatedRun);
      await updateRunInProject(activeProject.id, updatedRun);
    } catch (error) {
      console.error('Error resetting tests:', error);
      alert('Error resetting tests');
    }
  };


  const handleBulkAction = async (action: 'pass' | 'fail' | 'skip') => {
    if (!currentRun || selectedScenarios.length === 0 || !activeProject) return;

    const updatedRun = { ...currentRun };
    const statusMap = {
      'pass': 'passed' as const,
      'fail': 'failed' as const,
      'skip': 'skipped' as const
    };

    selectedScenarios.forEach(scenarioId => {
      const scenario = updatedRun.scenarios.find(s => s.id === scenarioId);
      if (scenario) {
        scenario.status = statusMap[action];
        scenario.steps.forEach(step => {
          step.result = statusMap[action];
        });
      }
    });

    // Recalculate summary
    updatedRun.summary = {
      total: updatedRun.scenarios.length,
      passed: updatedRun.scenarios.filter(s => s.status === 'passed').length,
      failed: updatedRun.scenarios.filter(s => s.status === 'failed').length,
      skipped: updatedRun.scenarios.filter(s => s.status === 'skipped').length,
      untested: updatedRun.scenarios.filter(s => s.status === 'untested').length,
    };

    setCurrentRun(updatedRun);
    setSelectedScenarios([]);
    await updateRunInProject(activeProject.id, updatedRun);
  };

  const handleScenarioAction = async (scenarioId: string, status: 'passed' | 'failed' | 'skipped') => {
    if (!currentRun || !activeProject) return;

    const updatedRun = { ...currentRun };
    const scenario = updatedRun.scenarios.find(s => s.id === scenarioId);
    if (scenario) {
      scenario.status = status;
      scenario.steps.forEach(step => {
        step.result = status;
      });
    }

    // Recalculate summary
    updatedRun.summary = {
      total: updatedRun.scenarios.length,
      passed: updatedRun.scenarios.filter(s => s.status === 'passed').length,
      failed: updatedRun.scenarios.filter(s => s.status === 'failed').length,
      skipped: updatedRun.scenarios.filter(s => s.status === 'skipped').length,
      untested: updatedRun.scenarios.filter(s => s.status === 'untested').length,
    };

    setCurrentRun(updatedRun);
    await updateRunInProject(activeProject.id, updatedRun);
  };

  const handleStepResult = async (stepId: string, result: 'passed' | 'failed' | 'skipped') => {
    if (!currentRun || !activeProject) return;

    const updatedRun = { ...currentRun };
    updatedRun.scenarios.forEach(scenario => {
      const step = scenario.steps.find(s => s.id === stepId);
      if (step) {
        step.result = result;
      }
      // Recalculate scenario status
      scenario.status = calculateScenarioStatus(scenario);
    });

    // Recalculate summary
    updatedRun.summary = {
      total: updatedRun.scenarios.length,
      passed: updatedRun.scenarios.filter(s => s.status === 'passed').length,
      failed: updatedRun.scenarios.filter(s => s.status === 'failed').length,
      skipped: updatedRun.scenarios.filter(s => s.status === 'skipped').length,
      untested: updatedRun.scenarios.filter(s => s.status === 'untested').length,
    };

    setCurrentRun(updatedRun);
    await updateRunInProject(activeProject.id, updatedRun);
  };

  if (!feature) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading feature...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Modern Header */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8 mb-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center shadow-lg">
                <span className="text-3xl">🍅</span>
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                  {feature.name}
                </h1>
                <p className="text-slate-600 text-lg mt-1">{feature.description}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-500 font-medium">Current Run</p>
              <div className="flex items-center gap-2 mt-1">
                <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  environment === 'staging' ? 'bg-[#FB5058] text-white' :
                  environment === 'production' ? 'bg-[#2B81FC] text-white' :
                  'bg-[#FABE00] text-white'
                }`}>
                  {environment.toUpperCase()}
                </div>
                <span className="text-2xl font-bold text-slate-800">{version}</span>
              </div>
            </div>
          </div>

          {/* Modern Controls Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Environment */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                Environment
              </Label>
              <Select value={environment} onValueChange={handleEnvironmentChange}>
                <SelectTrigger className="h-12 bg-white/50 border-slate-200 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="staging">Staging</SelectItem>
                  <SelectItem value="production">Production</SelectItem>
                  <SelectItem value="uat">UAT</SelectItem>
                </SelectContent>
              </Select>
                </div>

            {/* Existing Versions */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                Existing Versions
              </Label>
              <Select 
                value="" 
                onValueChange={(value) => {
                  if (value && value !== "none") {
                    // Find the run with this version
                    const run = activeProject?.runs.find(r => 
                      r.featureId === featureId && 
                      r.environment === environment && 
                      r.version === value
                    );
                    if (run) {
                      setCurrentRun(run);
                      setVersion(''); // Keep new version input empty
                    }
                  }
                }}
              >
                <SelectTrigger className="h-12 bg-white/50 border-slate-200 rounded-xl">
                  <SelectValue placeholder="Select existing version" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="none">None</SelectItem>
                  {activeProject?.runs
                    .filter(run => run.featureId === featureId && run.environment === environment)
                    .map(run => (
                      <SelectItem key={run.id} value={run.version}>
                        {run.version} ({run.status === 'completed' ? 'Completed' : 'In Progress'})
                      </SelectItem>
                    ))
                  }
                </SelectContent>
              </Select>
                  </div>
                  
            {/* New Version */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                New Version
              </Label>
              <div className="space-y-3">
                <Input
                  placeholder="Enter new version name (e.g., v2.0.0, v1.0.4)"
                  value={version}
                  onChange={(e) => setVersion(e.target.value)}
                  className="h-12 bg-white/50 border-slate-200 rounded-xl"
                  disabled={!!(currentRun && currentRun.status === 'in_progress')}
                />
                
                {(!currentRun || currentRun.status !== 'in_progress') && (
                  <Button
                    onClick={() => {
                      if (!version.trim()) {
                        alert('Please enter a version name');
                        return;
                      }
                      
                      const existingRun = activeProject?.runs.find(run => 
                        run.featureId === featureId && 
                        run.environment === environment && 
                        run.version === version
                      );
                      
                      if (existingRun) {
                        alert('This version already exists. Please enter a different version name.');
                        return;
                      }
                      
                      getOrCreateTestRun(activeProject!.id, featureId, environment, version).then(run => {
                        if (run) {
                          setCurrentRun(run);
                        }
                      });
                    }}
                    className={`h-12 text-white font-semibold rounded-xl shadow-lg ${
                      environment === 'staging' ? 'bg-[#FB5058] hover:bg-[#FB5058]' :
                      environment === 'production' ? 'bg-[#2B81FC] hover:bg-[#2B81FC]' :
                      'bg-[#FABE00] hover:bg-[#FABE00]'
                    }`}
                  >
                    Start Run
                  </Button>
                )}
              </div>
        </div>
                </div>

          {/* Existing Versions Display */}
          {activeProject?.runs && activeProject.runs.filter(run => run.featureId === featureId && run.environment === environment).length > 0 && (
            <div className="bg-slate-50/50 rounded-xl p-4 border border-slate-200">
              <p className="text-sm font-semibold text-slate-600 mb-3 flex items-center gap-2">
                Existing versions in {environment}:
              </p>
              <div className="flex flex-wrap gap-2">
                {activeProject?.runs
                  ?.filter(run => run.featureId === featureId && run.environment === environment)
                  .map(run => (
                    <span 
                      key={run.id}
                      className={`text-sm px-3 py-2 rounded-lg font-medium ${
                        run.status === 'completed' 
                          ? 'bg-green-100 text-green-800 border border-green-200' 
                          : 'bg-blue-100 text-blue-800 border border-blue-200'
                      }`}
                    >
                      {run.status === 'completed' ? 'Completed' : 'In Progress'} {run.version}
                        </span>
                  ))
                }
                          </div>
                        </div>
                      )}
                      
          {/* Action Buttons */}
          <div className="flex items-center justify-between mt-6 pt-6 border-t border-slate-200">
            <div className="flex gap-3">
              <Button 
                onClick={handleResetAllTests}
                variant="outline"
                className="border-red-200 text-red-600 hover:bg-red-50 rounded-xl px-6 py-2"
              >
                Reset Tests
              </Button>
            </div>
            
            <div className="flex items-center gap-3">
              {currentRun?.status === 'in_progress' && (
                <Button 
                  onClick={handleCompleteRun} 
                  className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold rounded-xl px-6 py-2 shadow-lg"
                >
                  Finish Run
                </Button>
              )}
              {currentRun?.status === 'completed' && (
                <div className="flex items-center gap-3 px-4 py-3 bg-green-100 text-green-800 rounded-xl border border-green-200">
                  <div>
                    <p className="font-semibold">Completed</p>
                    <p className="text-xs">
                      {currentRun.completedAt ? new Date(currentRun.completedAt).toLocaleDateString() : ''}
                    </p>
                  </div>
                </div>
                      )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6 mb-8">
          <div className="flex space-x-1 bg-slate-100 rounded-xl p-1">
            <button
              onClick={() => setActiveTab('test')}
              className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
                activeTab === 'test'
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              Test Run
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
                activeTab === 'history'
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              Test Run History
            </button>
            <button
              onClick={() => setActiveTab('comparison')}
              className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all ${
                activeTab === 'comparison'
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              Version Comparison
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'test' && (
          <div className="space-y-6">
            {currentRun ? (
              <>
                {/* Scenario Navigation */}
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6">
                  <div className="flex items-center justify-between">
                    {/* Left Arrow */}
                    <button
                      onClick={() => {
                        if (currentScenarioIndex > 0) {
                          setCurrentScenarioIndex(currentScenarioIndex - 1);
                          const element = document.getElementById(`scenario-${currentRun.scenarios[currentScenarioIndex - 1].id}`);
                          if (element) {
                            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                          }
                        }
                      }}
                      disabled={currentScenarioIndex === 0}
                      className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      ←
                    </button>

                    {/* Scenario Info */}
                    <div className="text-center">
                      <h3 className="text-lg font-semibold text-slate-800">
                        {currentRun.scenarios[currentScenarioIndex]?.name || 'No Scenario'}
                      </h3>
                      <p className="text-sm text-slate-600">
                        Scenario {currentScenarioIndex + 1} of {currentRun.scenarios.length}
                      </p>
                    </div>

                    {/* Right Arrow */}
                    <button
                      onClick={() => {
                        if (currentScenarioIndex < currentRun.scenarios.length - 1) {
                          setCurrentScenarioIndex(currentScenarioIndex + 1);
                          const element = document.getElementById(`scenario-${currentRun.scenarios[currentScenarioIndex + 1].id}`);
                          if (element) {
                            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                          }
                        }
                      }}
                      disabled={currentScenarioIndex === currentRun.scenarios.length - 1}
                      className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      →
                    </button>
                  </div>

                  {/* Scenario Numbers */}
                  <div className="flex justify-center gap-2 mt-4">
                    {currentRun.scenarios.map((scenario, index) => (
                      <button
                        key={scenario.id}
                        onClick={() => {
                          setCurrentScenarioIndex(index);
                          const element = document.getElementById(`scenario-${scenario.id}`);
                          if (element) {
                            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                          }
                        }}
                        className={`w-8 h-8 rounded-lg text-sm font-medium transition-all ${
                          index === currentScenarioIndex
                            ? scenario.status === 'passed' 
                              ? 'bg-green-500 text-white'
                              : scenario.status === 'failed'
                              ? 'bg-red-500 text-white'
                              : scenario.status === 'skipped'
                              ? 'bg-yellow-500 text-white'
                              : 'bg-blue-500 text-white'
                            : scenario.status === 'passed'
                            ? 'bg-green-100 text-green-800 border border-green-200 hover:bg-green-200' 
                            : scenario.status === 'failed'
                            ? 'bg-red-100 text-red-800 border border-red-200 hover:bg-red-200' 
                            : scenario.status === 'skipped'
                            ? 'bg-yellow-100 text-yellow-800 border border-yellow-200 hover:bg-yellow-200'
                            : 'bg-slate-100 text-slate-800 border border-slate-200 hover:bg-slate-200'
                        }`}
                      >
                        {index + 1}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Modern Bulk Actions */}
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent flex items-center gap-3">
                      Bulk Actions
                    </h3>
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={selectedScenarios.length === currentRun.scenarios.length}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedScenarios(currentRun.scenarios.map(s => s.id));
                          } else {
                            setSelectedScenarios([]);
                          }
                        }}
                        className="w-5 h-5 rounded-lg border-2 border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm font-semibold text-slate-600">Select All</span>
              </div>
        </div>

                  <div className="flex gap-4">
                    <Button
                      onClick={() => handleBulkAction('pass')}
                      className="flex-1 h-12 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={selectedScenarios.length === 0}
                    >
                      Pass Selected ({selectedScenarios.length})
                    </Button>
                    <Button
                      onClick={() => handleBulkAction('fail')}
                      className="flex-1 h-12 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={selectedScenarios.length === 0}
                    >
                      Fail Selected ({selectedScenarios.length})
                    </Button>
                    <Button
                      onClick={() => handleBulkAction('skip')}
                      className="flex-1 h-12 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white font-semibold rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={selectedScenarios.length === 0}
                    >
                      Skip Selected ({selectedScenarios.length})
                    </Button>
                  </div>
                </div>

                {/* Modern Scenarios */}
                <div className="space-y-6">
                  {currentRun.scenarios.map((scenario, scenarioIndex) => {
                    // Only show the current scenario
                    if (scenarioIndex !== currentScenarioIndex) return null;
                    
                    return (
                      <Card key={scenario.id} id={`scenario-${scenario.id}`} className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 overflow-hidden">
                        <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200 py-6">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <input
                                type="checkbox"
                                checked={selectedScenarios.includes(scenario.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedScenarios([...selectedScenarios, scenario.id]);
                                  } else {
                                    setSelectedScenarios(selectedScenarios.filter(id => id !== scenario.id));
                                  }
                                }}
                                className="w-5 h-5 rounded-lg border-2 border-slate-300 text-blue-600 focus:ring-blue-500"
                              />
                              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shadow-lg ${
                                scenario.status === 'passed' 
                                  ? 'bg-gradient-to-br from-green-400 to-green-600' 
                                  : scenario.status === 'failed' 
                                  ? 'bg-gradient-to-br from-red-400 to-red-600' 
                                  : scenario.status === 'skipped'
                                  ? 'bg-gradient-to-br from-yellow-400 to-yellow-600'
                                  : 'bg-gradient-to-br from-slate-400 to-slate-600'
                              }`}>
                                <span className="text-white text-sm font-bold">
                                  {scenarioIndex + 1}
                                </span>
                              </div>
                              <div className="flex items-center gap-3 flex-1">
                                <CardTitle className="text-xl font-bold text-slate-800">{scenario.name}</CardTitle>
                                <div className={`px-4 py-2 rounded-xl font-semibold text-sm ${
                                  scenario.status === 'passed' 
                                    ? 'bg-green-100 text-green-800 border border-green-200' 
                                    : scenario.status === 'failed' 
                                    ? 'bg-red-100 text-red-800 border border-red-200' 
                                    : scenario.status === 'skipped'
                                    ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                                    : 'bg-slate-600 text-white border border-slate-600'
                                }`}>
                                  {scenario.status.toUpperCase()}
                                </div>
                          </div>
                    </div>
                    
                            <div className="flex items-center gap-2">
                          <Button
                                      onClick={() => handleScenarioAction(scenario.id, 'passed')}
                                      className="bg-green-500 hover:bg-green-500 text-white rounded-xl px-4 py-2 shadow-lg"
                                      disabled={currentRun?.status === 'completed'}
                          >
                            Pass
                          </Button>
                          <Button
                                      onClick={() => handleScenarioAction(scenario.id, 'failed')}
                                      className="bg-red-500 hover:bg-red-500 text-white rounded-xl px-4 py-2 shadow-lg"
                                      disabled={currentRun?.status === 'completed'}
                          >
                            Fail
                          </Button>
                          <Button
                                      onClick={() => handleScenarioAction(scenario.id, 'skipped')}
                                      className="bg-yellow-500 hover:bg-yellow-500 text-white rounded-xl px-4 py-2 shadow-lg"
                                      disabled={currentRun?.status === 'completed'}
                                    >
                                      Skip
                          </Button>
                        </div>
                          </div>
                        </CardHeader>
                        <CardContent className="p-6">
                      <div className="space-y-4">
                            {scenario.steps.map((step, stepIndex) => (
                              <div key={step.id} className={`flex items-center justify-between p-4 rounded-xl border ${
                                step.result === 'passed' 
                                  ? 'bg-green-50 border-green-200' 
                                  : step.result === 'failed' 
                                  ? 'bg-red-50 border-red-200' 
                                  : step.result === 'skipped'
                                  ? 'bg-yellow-50 border-yellow-200'
                                  : 'bg-slate-50 border-slate-200'
                              }`}>
                                <div className="flex items-center gap-4">
                                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold ${
                                    step.result === 'passed' 
                                      ? 'bg-green-500 text-white' 
                                      : step.result === 'failed' 
                                      ? 'bg-red-500 text-white' 
                                      : step.result === 'skipped'
                                      ? 'bg-yellow-500 text-white'
                                      : 'bg-slate-300 text-slate-600'
                                  }`}>
                                    {stepIndex + 1}
                                  </div>
                        <div className="flex items-center gap-2">
                                    <span className={`px-3 py-1 rounded-lg text-xs font-bold text-white ${
                                      step.keyword.toLowerCase() === 'given' ? 'bg-[#2B81FC]' :
                                      step.keyword.toLowerCase() === 'when' ? 'bg-[#FB5058]' :
                                      step.keyword.toLowerCase() === 'then' ? 'bg-[#9C006D]' :
                                      'bg-[#00A396]'
                                    }`}>
                                      {step.keyword.toUpperCase()}
                                    </span>
                                    <p className="font-semibold text-slate-800">{step.text}</p>
                        </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                                    onClick={() => handleStepResult(step.id, 'passed')}
                                    className={step.result === 'passed' ? 'bg-green-500 hover:bg-green-500 text-white' : 'border border-slate-300 hover:border-slate-300 bg-white hover:bg-white text-slate-700'}
                                    disabled={currentRun?.status === 'completed'}
                                  >
                                    Pass
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={() => handleStepResult(step.id, 'failed')}
                                    className={step.result === 'failed' ? 'bg-red-500 hover:bg-red-500 text-white' : 'border border-slate-300 hover:border-slate-300 bg-white hover:bg-white text-slate-700'}
                                    disabled={currentRun?.status === 'completed'}
                                  >
                                    Fail
                          </Button>
                          <Button
                            size="sm"
                                    onClick={() => handleStepResult(step.id, 'skipped')}
                                    className={step.result === 'skipped' ? 'bg-yellow-500 hover:bg-yellow-500 text-white' : 'border border-slate-300 hover:border-slate-300 bg-white hover:bg-white text-slate-700'}
                                    disabled={currentRun?.status === 'completed'}
                                  >
                                    Skip
                          </Button>
                        </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
                    );
                  })}
                </div>
              </>
            ) : (
              /* No Run State - Show Start Run Interface */
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8 text-center">
                <div className="mb-6">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg mx-auto mb-4 ${
                    environment === 'staging' ? 'bg-gradient-to-br from-[#FB5058] to-[#FB5058]' :
                    environment === 'production' ? 'bg-gradient-to-br from-[#2B81FC] to-[#2B81FC]' :
                    'bg-gradient-to-br from-[#FABE00] to-[#FABE00]'
                  }`}>
                    <span className="text-3xl">🚀</span>
                  </div>
                  <h3 className="text-2xl font-bold text-slate-800 mb-2">Start New Test Run</h3>
                  <p className="text-slate-600">Enter a version name to begin testing</p>
                </div>
                
                <div className="max-w-md mx-auto">
                  <Input
                    placeholder="Enter new version name (e.g., v2.0.0, v1.0.4)"
                    value={version}
                    onChange={(e) => setVersion(e.target.value)}
                    className="h-12 bg-white/50 border-slate-200 rounded-xl mb-4"
                  />
                  
                  <Button 
                    onClick={() => {
                      if (!version.trim()) {
                        alert('Please enter a version name');
                        return;
                      }
                      
                      const existingRun = activeProject?.runs.find(run => 
                        run.featureId === featureId && 
                        run.environment === environment && 
                        run.version === version
                      );
                      
                      if (existingRun) {
                        alert('This version already exists. Please enter a different version name.');
                        return;
                      }
                      
                      getOrCreateTestRun(activeProject!.id, featureId, environment, version).then(run => {
                        if (run) {
                          setCurrentRun(run);
                        }
                      });
                    }}
                    className={`h-12 text-white font-semibold rounded-xl shadow-lg w-full ${
                      environment === 'staging' ? 'bg-[#FB5058]' :
                      environment === 'production' ? 'bg-[#2B81FC]' :
                      'bg-[#FABE00]'
                    }`}
                  >
                    Start Run
                  </Button>
                </div>
              </div>
            )}
            </div>
        )}

        {activeTab === 'history' && (
          <TestRunHistory featureId={featureId} environment={environment} />
        )}

        {activeTab === 'comparison' && (
          <VersionComparison featureId={featureId} environment={environment} />
        )}
      </div>
    </div>
  );
}
