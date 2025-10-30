'use client';
import { useState } from 'react';
import { useProjectStore } from '@/store/projectStore';
import { TestRun } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export function TestRunHistory({ featureId, environment }: { featureId: string; environment?: string }) {
  const { activeProject } = useProjectStore();
  const [selectedRun, setSelectedRun] = useState<TestRun | null>(null);

  if (!activeProject) return null;

  const feature = activeProject.features.find(f => f.id === featureId);
  if (!feature) return null;

  // Get all runs for this feature, filter by environment if provided, only show completed runs
  let runs = activeProject.runs
    .filter(run => run.featureId === featureId)
    .filter(run => !environment || run.environment === environment)
    .filter(run => run.status === 'completed') // Only show completed runs
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Group runs by environment and version, but only show the latest run for each combination
  const groupedRuns = runs.reduce((acc, run) => {
    const key = `${run.environment}-${run.version}`;
    if (!acc[key] || new Date(run.createdAt) > new Date(acc[key].createdAt)) {
      acc[key] = run;
    }
    return acc;
  }, {} as Record<string, TestRun>);

  // Convert to array and sort by creation date
  const latestRuns = Object.values(groupedRuns)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 10); // Only show last 10 runs

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'in_progress': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'paused': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getEnvironmentColor = (env: string) => {
    switch (env) {
      case 'production': return 'bg-red-100 text-red-800';
      case 'staging': return 'bg-orange-100 text-orange-800';
      case 'uat': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getEnvironmentIcon = (env: string) => {
    switch (env) {
      case 'production': return '🚀';
      case 'staging': return '🧪';
      case 'uat': return '👥';
      default: return '🔧';
    }
  };

  return (
    <Card className="shadow-lg border border-gray-200">
      <CardHeader className="bg-white rounded-t-lg border-b border-gray-200 py-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-[#11235]">
            Test Run History
            {environment && (
              <span className="ml-2 text-sm font-normal text-gray-600">
                ({environment.toUpperCase()})
              </span>
            )}
          </CardTitle>
        </div>
      </CardHeader>
      
      <CardContent className="p-4">
        {latestRuns.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">📝</div>
            <p>No completed test runs found for this environment.</p>
            <p className="text-sm mt-2">Complete a test run to see it in history.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {latestRuns.map((run) => (
              <div
                key={run.id}
                className={`border rounded-lg p-4 transition-all duration-200 hover:shadow-md ${
                  selectedRun?.id === run.id 
                    ? 'border-[#67568c] bg-[#F9FAFA]' 
                    : 'border-gray-200 bg-[#F9FAFA]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">{getEnvironmentIcon(run.environment)}</div>
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge className={getEnvironmentColor(run.environment)}>
                          {run.environment.toUpperCase()}
                        </Badge>
                        <span className="font-medium text-gray-900">v{run.version}</span>
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(run.createdAt).toLocaleDateString()} at {new Date(run.createdAt).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {/* Summary Stats */}
                    <div className="flex gap-2 text-sm">
                      <span className="text-green-600 font-medium">{run.summary.passed}</span>
                      <span className="text-gray-400">•</span>
                      <span className="text-red-600 font-medium">{run.summary.failed}</span>
                      <span className="text-gray-400">•</span>
                      <span className="text-yellow-600 font-medium">{run.summary.skipped}</span>
                    </div>
                    
                    <Badge className={getStatusColor(run.status || 'untested')}>
                      {(run.status || 'untested').replace('_', ' ').toUpperCase()}
                    </Badge>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedRun(selectedRun?.id === run.id ? null : run)}
                      className="text-xs"
                    >
                      {selectedRun?.id === run.id ? 'Hide' : 'Details'}
                    </Button>
                  </div>
                </div>
                
                {selectedRun?.id === run.id && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="grid grid-cols-4 gap-3 mb-3">
                      <div className="text-center bg-white rounded-lg p-2 border border-[#9C006D]">
                        <div className="text-lg font-semibold text-slate-900">{run.summary.total}</div>
                        <div className="text-xs text-slate-700 font-semibold">Total</div>
                      </div>
                      <div className="text-center bg-white rounded-lg p-2 border border-green-200">
                        <div className="text-lg font-semibold text-green-800">{run.summary.passed}</div>
                        <div className="text-xs text-green-700 font-semibold">Passed</div>
                      </div>
                      <div className="text-center bg-white rounded-lg p-2 border border-red-200">
                        <div className="text-lg font-semibold text-red-800">{run.summary.failed}</div>
                        <div className="text-xs text-red-700 font-semibold">Failed</div>
                      </div>
                      <div className="text-center bg-white rounded-lg p-2 border border-yellow-200">
                        <div className="text-lg font-semibold text-yellow-800">{run.summary.skipped}</div>
                        <div className="text-xs text-yellow-700 font-semibold">Skipped</div>
                      </div>
                    </div>
                    
                    <div className="text-xs text-slate-700 font-medium">
                      Created: {new Date(run.createdAt).toLocaleString()}
                      {run.completedAt && (
                        <span> • Completed: {new Date(run.completedAt).toLocaleString()}</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}