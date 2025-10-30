'use client';

import { DocsViewer } from '@/components/DocsViewer';
import { useProjectStore } from '@/store/projectStore';
import { useEffect, use } from 'react';

export default function DocsPage({ params }: { params: Promise<{ id: string; featureId: string }> }) {
  const { id: projectId, featureId } = use(params);
  const { setActiveProject } = useProjectStore();
  
  useEffect(() => {
    setActiveProject(projectId);
  }, [projectId, setActiveProject]);

  return <DocsViewer projectId={projectId} featureId={featureId} />;
}


