'use client';

import { useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useProjectStore } from '@/store/projectStore';

export default function NewRunPage({ params }: { params: Promise<{ id: string; featureId: string }> }) {
  const { id, featureId } = use(params);
  const { setActiveProject, activeProject } = useProjectStore();
  const router = useRouter();

  useEffect(() => {
    setActiveProject(id);
  }, [id, setActiveProject]);

  useEffect(() => {
    if (activeProject) {
      // Generate a unique run ID
      const runId = `run-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      // Redirect to the test runner with a special flag for new runs
      router.replace(`/projects/${id}/run/${runId}?new=true&featureId=${featureId}`);
    }
  }, [activeProject, id, featureId, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
        <p className="text-gray-600 text-lg">Preparing test runner...</p>
      </div>
    </div>
  );
}

