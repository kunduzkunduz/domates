'use client';

import { useProjectStore } from '@/store/projectStore';
import { useEffect, useState, use } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Feature, TestRun, Scenario } from '@/lib/types';
import { ChevronDown, ChevronUp } from 'lucide-react';

export default function ReportPage({ params }: { params: Promise<{ id: string; featureId: string }> }) {
  const { id, featureId } = use(params);
  const { activeProject, setActiveProject } = useProjectStore();
  const [feature, setFeature] = useState<Feature | null>(null);
  const [selectedRun, setSelectedRun] = useState<TestRun | null>(null);
  const [environment, setEnvironment] = useState<'staging' | 'production' | 'uat'>('staging');
  const [availableRuns, setAvailableRuns] = useState<TestRun[]>([]);
  const [expandedScenarios, setExpandedScenarios] = useState<Set<string>>(new Set());
  const [statusFilter, setStatusFilter] = useState<'all' | 'passed' | 'failed' | 'skipped' | 'untested'>('all');

  const toggleScenario = (scenarioId: string) => {
    const newExpanded = new Set(expandedScenarios);
    if (newExpanded.has(scenarioId)) {
      newExpanded.delete(scenarioId);
    } else {
      newExpanded.add(scenarioId);
    }
    setExpandedScenarios(newExpanded);
  };

  useEffect(() => {
    setActiveProject(id);
  }, [id, setActiveProject]);

  useEffect(() => {
    if (activeProject) {
      const foundFeature = activeProject.features.find(f => f.id === featureId);
      if (foundFeature) {
        setFeature(foundFeature);
        
        const runs = activeProject.runs
          .filter(run => run.featureId === featureId && run.status === 'completed' && run.environment === environment)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        
        setAvailableRuns(runs);
        
        if (runs.length > 0) {
          setSelectedRun(runs[0]);
        } else {
          setSelectedRun(null);
        }
      }
    }
  }, [activeProject, featureId, environment]);

  if (!feature) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading report...</p>
        </div>
      </div>
    );
  }

  if (!selectedRun) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="container mx-auto px-6 py-12 max-w-7xl">
          <div className="mb-8">
            <h1 className="text-5xl font-bold text-slate-800 mb-4">Test Report</h1>
            <p className="text-slate-500 text-xl">{feature?.name || 'No Feature'}</p>
          </div>
          <div className="flex gap-4 flex-wrap items-center mb-8 bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center gap-2">
              <label className="text-sm font-semibold text-slate-700">Environment:</label>
              <Select value={environment} onValueChange={(value) => setEnvironment(value as 'staging' | 'production' | 'uat')}>
                <SelectTrigger className="w-32 h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="staging">Staging</SelectItem>
                  <SelectItem value="production">Production</SelectItem>
                  <SelectItem value="uat">UAT</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <p className="text-slate-600 text-lg">No completed test runs found for this feature in {environment} environment.</p>
            <p className="text-slate-500 mt-2">Run tests first to view the report.</p>
          </div>
        </div>
      </div>
    );
  }

  const { summary } = selectedRun;
  const passRate = summary.total > 0 ? ((summary.passed / summary.total) * 100).toFixed(1) : 0;

  // Filter scenarios based on status
  const filteredScenarios = statusFilter === 'all' 
    ? selectedRun.scenarios 
    : selectedRun.scenarios.filter(s => s.status === statusFilter);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container mx-auto px-6 py-12 max-w-7xl">
        {/* Simple Header */}
        <div className="mb-8">
          <h1 className="text-5xl font-bold text-slate-800 mb-4">Test Report</h1>
          <p className="text-slate-500 text-xl mb-2">{feature.name}</p>
          <p className="text-sm text-slate-400">
            Completed: {new Date(selectedRun.completedAt || selectedRun.createdAt).toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>

        {/* Controls */}
        <div className="flex gap-4 flex-wrap items-center mb-8 bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center gap-2">
            <label className="text-sm font-semibold text-slate-700">Environment:</label>
            <Select value={environment} onValueChange={(value) => setEnvironment(value as 'staging' | 'production' | 'uat')}>
              <SelectTrigger className="w-32 h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="staging">Staging</SelectItem>
                <SelectItem value="production">Production</SelectItem>
                <SelectItem value="uat">UAT</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {availableRuns.length > 0 && (
            <div className="flex items-center gap-2">
              <label className="text-sm font-sem:layout-700">Version:</label>
              <Select value={selectedRun?.id || ''} onValueChange={(value) => {
                const run = availableRuns.find(r => r.id === value);
                if (run) setSelectedRun(run);
              }}>
                <SelectTrigger className="w-40 h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableRuns.map(run => (
                    <SelectItem key={run.id} value={run.id}>
                      {run.version} ({new Date(run.createdAt).toLocaleDateString()})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Summary Stats - Clickable */}
        <div className="grid grid-cols-4 gap-6 mb-8">
          <div 
            onClick={() => setStatusFilter('all')}
            className={`text-center p-6 rounded-2xl shadow-lg cursor-pointer transition-all ${
              statusFilter === 'all' ? 'bg-blue-100 ring-4 ring-blue-300' : 'bg-blue-50 hover:bg-blue-100'
            }`}
          >
            <div className="text-4xl font-bold text-blue-600">{summary.total}</div>
            <div className="text-sm text-slate-600 mt-2">Total Scenarios</div>
          </div>
          <div 
            onClick={() => setStatusFilter('passed')}
            className={`text-center p-6 rounded-2xl shadow-lg cursor-pointer transition-all ${
              statusFilter === 'passed' ? 'bg-emerald-100 ring-4 ring-emerald-300' : 'bg-emerald-50 hover:bg-emerald-100'
            }`}
          >
            <div className="text-4xl font-bold text-emerald-600">{summary.passed}</div>
            <div className="text-sm text-slate-600 mt-2">Passed</div>
          </div>
          <div 
            onClick={() => setStatusFilter('failed')}
            className={`text-center p-6 rounded-2xl shadow-lg cursor-pointer transition-all ${
              statusFilter === 'failed' ? 'bg-rose-100 ring-4 ring-rose-300' : 'bg-rose-50 hover:bg-rose-100'
            }`}
          >
            <div className="text-4xl font-bold text-rose-600">{summary.failed}</div>
            <div className="text-sm text-slate-600 mt-2">Failed</div>
          </div>
          <div 
            onClick={() => setStatusFilter('skipped')}
            className={`text-center p-6 rounded-2xl shadow-lg cursor-pointer transition-all ${
              statusFilter === 'skipped' ? 'bg-yellow-100 ring-4 ring-yellow-300' : 'bg-yellow-50 hover:bg-yellow-100'
            }`}
          >
            <div className="text-4xl font-bold text-yellow-600">{summary.skipped}</div>
            <div className="text-sm text-slate-600 mt-2">Skipped</div>
          </div>
        </div>
        
        {/* Pass Rate & Untested */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="text-center p-6 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl text-white shadow-lg">
            <div className="text-4xl font-bold">{passRate}%</div>
            <div className="text-sm opacity-90 mt-2">Pass Rate</div>
          </div>
          <div 
            onClick={() => setStatusFilter('untested')}
            className={`text-center p-6 rounded-2xl shadow-lg cursor-pointer transition-all ${
              statusFilter === 'untested' ? 'bg-slate-600 ring-4 ring-slate-400 text-white' : 'bg-slate-500 hover:bg-slate-600 text-white'
            }`}
          >
            <div className="text-4xl font-bold">{summary.untested}</div>
            <div className="text-sm mt-2 opacity-90">Untested</div>
          </div>
        </div>

        {/* Scenario Details with Accordion */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-3xl font-bold text-slate-800 mb-6">Scenario Details</h2>
          <div className="space-y-3">
            {filteredScenarios.map((scenario, index) => {
              const isExpanded = expandedScenarios.has(scenario.id);
              const getKeywordColor = (keyword: string) => {
                const kw = keyword.toLowerCase();
                if (kw === 'given') return 'bg-[#2B81FC]';
                if (kw === 'when') return 'bg-[#FB5058]';
                if (kw === 'then') return 'bg-[#9C006D]';
                return 'bg-[#00A396]';
              };
              
              return (
                <div key={scenario.id} className="border-2 border-slate-200 rounded-xl overflow-hidden hover:border-slate-300 transition-all">
                  {/* Scenario Header - Clickable */}
                  <div 
                    onClick={() => toggleScenario(scenario.id)}
                    className="flex items-center justify-between p-4 cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {isExpanded ? <ChevronUp className="text-slate-500" /> : <ChevronDown className="text-slate-500" />}
                      <h3 className="font-bold text-lg text-slate-800">{scenario.name}</h3>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      scenario.status === 'passed' ? 'bg-emerald-100 text-emerald-700' :
                      scenario.status === 'failed' ? 'bg-rose-100 text-rose-700' :
                      scenario.status === 'skipped' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-slate-600 text-white'
                    }`}>
                      {scenario.status.toUpperCase()}
                    </span>
                  </div>
                  
                  {/* Scenario Steps - Expandable */}
                  {isExpanded && (
                    <div className="p-4 space-y-2 bg-white">
                      {scenario.steps.map((step, stepIndex) => {
                        const getStepColor = () => {
                          if (step.result === 'passed') return 'bg-emerald-50 border-emerald-200';
                          if (step.result === 'failed') return 'bg-rose-50 border-rose-200';
                          if (step.result === 'skipped') return 'bg-yellow-50 border-yellow-200';
                          return 'bg-slate-50 border-slate-200';
                        };
                        
                        return (
                          <div key={step.id} className={`flex items-start gap-3 p-3 rounded-lg border ${getStepColor()}`}>
                            <div className="flex-shrink-0">
                              <span className={`px-2 py-1 rounded text-xs font-bold text-white ${getKeywordColor(step.keyword)}`}>
                                {step.keyword.toUpperCase()}
                              </span>
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-slate-800">{step.text}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Version Comparison Chart */}
        {availableRuns.length > 1 && (
          <div className="bg-white rounded-2xl shadow-lg p-8 mt-8">
            <h2 className="text-3xl font-bold text-slate-800 mb-6">Version Comparison</h2>
            <div className="space-y-6">
              {availableRuns.map((run, index) => (
                <div key={run.id} className="border-2 border-slate-200 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-lg text-slate-800">{run.version}</h3>
                      <p className="text-xs text-slate-500">{new Date(run.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="flex gap-4 text-sm">
                      <div className="text-center">
                        <div className="font-bold text-blue-600">{run.summary.total}</div>
                        <div className="text-slate-500">Total</div>
                      </div>
                      <div className="text-center">
                        <div className="font-bold text-emerald-600">{run.summary.passed}</div>
                        <div className="text-slate-500">Passed</div>
                      </div>
                      <div className="text-center">
                        <div className="font-bold text-rose-600">{run.summary.failed}</div>
                        <div className="text-slate-500">Failed</div>
                      </div>
                      <div className="text-center">
                        <div className="font-bold text-yellow-600">{run.summary.skipped}</div>
                        <div className="text-slate-500">Skipped</div>
                      </div>
                    </div>
                  </div>
                  {/* Progress Bar */}
                  <div className="space-y-2">
                    {run.summary.total > 0 && (
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-slate-200 rounded-full h-3 overflow-hidden">
                          <div className="h-full flex">
                            <div className="bg-emerald-500" style={{ width: `${(run.summary.passed / run.summary.total) * 100}%` }}></div>
                            <div className="bg-rose-500" style={{ width: `${(run.summary.failed / run.summary.total) * 100}%` }}></div>
                            <div className="bg-yellow-500" style={{ width: `${(run.summary.skipped / run.summary.total) * 100}%` }}></div>
                          </div>
                        </div>
                        <span className="text-xs font-semibold text-slate-600">
                          {((run.summary.passed / run.summary.total) * 100).toFixed(1)}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
