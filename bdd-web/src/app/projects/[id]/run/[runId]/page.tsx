'use client';

import { TestRunner } from '@/components/TestRunner';
import { useProjectStore } from '@/store/projectStore';
import { useEffect, use } from 'react';
import { useSearchParams } from 'next/navigation';

export default function RunPage({ params }: { params: Promise<{ id: string; runId: string }> }) {
  const { id: projectId, runId } = use(params);
  const { setActiveProject, activeProject } = useProjectStore();
  const searchParams = useSearchParams();

  useEffect(() => {
    setActiveProject(projectId);
  }, [projectId, setActiveProject]);

  // Get featureId from search params if it's a new run, otherwise find from existing run
  const featureIdParam = searchParams?.get('featureId');
  const isNew = searchParams?.get('new') === 'true';

  let featureId: string | undefined;
  
  if (isNew && featureIdParam) {
    // For new runs, use the featureId from search params
    featureId = featureIdParam;
  } else {
    // For existing runs, find the feature that contains this run
    const run = activeProject?.runs.find(r => r.id === runId);
    featureId = run?.featureId;
  }

  if (!featureId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading run...</p>
        </div>
      </div>
    );
  }

  return <TestRunner projectId={projectId} featureId={featureId} />;
}
