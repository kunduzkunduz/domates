'use client';
import { useState, useEffect } from 'react';
import { useProjectStore } from '@/store/projectStore';
import { TestRun, Scenario } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

export function VersionComparison({ featureId, environment }: { featureId: string; environment: string }) {
  const { activeProject } = useProjectStore();
  const [selectedVersion1, setSelectedVersion1] = useState<string | null>(null);
  const [selectedVersion2, setSelectedVersion2] = useState<string | null>(null);

  useEffect(() => {
    if (activeProject) {
      const runs = activeProject.runs
        .filter(run => run.featureId === featureId && run.environment === environment && run.status === 'completed')
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      if (runs.length > 0) {
        setSelectedVersion1(runs[0].version);
        if (runs.length > 1) {
          setSelectedVersion2(runs[1].version);
        }
      }
    }
  }, [activeProject, featureId, environment]);

  if (!activeProject) return null;

  const feature = activeProject.features.find(f => f.id === featureId);
  if (!feature) return null;

  // Get completed runs for this feature and environment only
  const runs = activeProject.runs
    .filter(run => run.featureId === featureId && run.environment === environment && run.status === 'completed')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const run1 = runs.find(r => r.version === selectedVersion1);
  const run2 = runs.find(r => r.version === selectedVersion2);

  if (runs.length < 2) {
    return (
      <Card className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20">
        <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200 py-6">
          <CardTitle className="text-xl font-bold text-slate-800">Version Comparison</CardTitle>
        </CardHeader>
        <CardContent className="p-6 text-center text-slate-600">
          <p className="text-lg mb-2">Not enough versions to compare</p>
          <p className="text-sm">You need at least 2 completed versions in {environment} environment to compare.</p>
        </CardContent>
      </Card>
    );
  }

  const getScenarioStatus = (run: TestRun | undefined, scenarioId: string) => {
    return run?.scenarios.find(s => s.id === scenarioId)?.status || 'untested';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'passed': return 'bg-green-500';
      case 'failed': return 'bg-red-500';
      case 'skipped': return 'bg-yellow-500';
      default: return 'bg-slate-400';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'passed': return 'PASSED';
      case 'failed': return 'FAILED';
      case 'skipped': return 'SKIPPED';
      default: return 'UNTESTED';
    }
  };

  const getChangeIndicator = (status1: string, status2: string) => {
    if (status1 === status2) return null;
    
    if (status1 === 'failed' && status2 === 'passed') return '↗️ Improved';
    if (status1 === 'passed' && status2 === 'failed') return '↘️ Regressed';
    if (status1 === 'untested' && status2 !== 'untested') return '🆕 Newly Tested';
    if (status1 !== 'untested' && status2 === 'untested') return '🔄 Untested Now';
    
    return '🔄 Changed';
  };

  return (
    <Card className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20">
      <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200 py-6">
        <CardTitle className="text-xl font-bold text-slate-800">Version Comparison - {environment.toUpperCase()}</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {/* Version Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Version 1 (Older)</label>
            <Select value={selectedVersion1 || ''} onValueChange={setSelectedVersion1}>
              <SelectTrigger className="h-12 bg-white/50 border-slate-200 rounded-xl">
                <SelectValue placeholder="Select version" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {runs.map(run => (
                  <SelectItem key={run.id} value={run.version}>
                    {run.version} ({new Date(run.createdAt).toLocaleDateString()})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Version 2 (Newer)</label>
            <Select value={selectedVersion2 || ''} onValueChange={setSelectedVersion2}>
              <SelectTrigger className="h-12 bg-white/50 border-slate-200 rounded-xl">
                <SelectValue placeholder="Select version" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {runs.map(run => (
                  <SelectItem key={run.id} value={run.version}>
                    {run.version} ({new Date(run.createdAt).toLocaleDateString()})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Summary Cards */}
        {run1 && run2 && (
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
              <h3 className="font-semibold text-slate-800 mb-2">Version {run1.version}</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span>Passed: {run1.summary.passed}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span>Failed: {run1.summary.failed}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <span>Skipped: {run1.summary.skipped}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-slate-400"></div>
                  <span>Untested: {run1.summary.untested}</span>
                </div>
              </div>
            </div>
            
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
              <h3 className="font-semibold text-slate-800 mb-2">Version {run2.version}</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span>Passed: {run2.summary.passed}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span>Failed: {run2.summary.failed}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <span>Skipped: {run2.summary.skipped}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-slate-400"></div>
                  <span>Untested: {run2.summary.untested}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Scenario Comparison Table */}
        {run1 && run2 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Scenario Status Comparison</h3>
            
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 font-semibold text-slate-700">Scenario</th>
                    <th className="text-center py-3 px-4 font-semibold text-slate-700">Version {run1.version}</th>
                    <th className="text-center py-3 px-4 font-semibold text-slate-700">Version {run2.version}</th>
                    <th className="text-center py-3 px-4 font-semibold text-slate-700">Change</th>
                  </tr>
                </thead>
                <tbody>
                  {run1.scenarios.map(scenario1 => {
                    const scenario2 = run2.scenarios.find(s => s.id === scenario1.id);
                    const status1 = scenario1.status;
                    const status2 = scenario2?.status || 'untested';
                    const change = getChangeIndicator(status1, status2);

                    return (
                      <tr key={scenario1.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="py-3 px-4">
                          <div className="font-medium text-slate-800">{scenario1.name}</div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <div className={`w-4 h-4 rounded-full ${getStatusColor(status1)}`}></div>
                            <span className="text-sm font-medium">{getStatusText(status1)}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <div className={`w-4 h-4 rounded-full ${getStatusColor(status2)}`}></div>
                            <span className="text-sm font-medium">{getStatusText(status2)}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          {change && (
                            <Badge variant="outline" className="text-xs">
                              {change}
                            </Badge>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}