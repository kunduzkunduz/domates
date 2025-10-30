'use client';

import { useEffect, use } from 'react';
import { useProjectStore } from '@/store/projectStore';
import { FileUploader } from '@/components/FileUploader';
import { FeatureList } from '@/components/FeatureList';
import { Button } from '@/components/ui/button';
import { saveAs } from 'file-saver';
import { useRouter } from 'next/navigation';

export default function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { activeProject, setActiveProject, deleteProject } = useProjectStore();
  const router = useRouter();

  useEffect(() => {
    setActiveProject(id);
  }, [id, setActiveProject]);

  const handleExport = () => {
    if (!activeProject) return;
    const blob = new Blob([JSON.stringify(activeProject, null, 2)], {
      type: 'application/json',
    });
    saveAs(blob, `${activeProject.name.replace(/\s+/g, '_')}_bdd_project.json`);
    alert("Project exported!");
  };
  
  const handleDelete = () => {
      if(window.confirm(`Are you sure you want to delete project "${activeProject?.name}"?`)){
          deleteProject(id);
          router.push('/');
      }
  }

  if (!activeProject) {
    return <div>Loading project...</div>;
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto px-6 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-2xl font-semibold text-[#11235] mb-1">{activeProject.name}</h2>
              <p className="text-[#1b1425] text-sm">Manage your BDD features and test runs</p>
            </div>
            <div className="flex gap-3">
                <Button 
                  onClick={handleExport} 
                  className="px-4 py-2 bg-[#ff6e6c] hover:bg-[#e55a58] text-[#11235] text-sm font-medium"
                >
                  Export
                </Button>
                <Button 
                  onClick={handleDelete} 
                  className="px-4 py-2 bg-[#67568c] hover:bg-[#5a4a7a] text-white text-sm font-medium"
                >
                  Delete
                </Button>
            </div>
          </div>
          
          <div className="space-y-6">
            <div className="bg-[#F9FAFA] rounded-lg p-4 border border-gray-200">
              <h3 className="text-lg font-semibold text-[#11235] mb-3">
                Upload Feature File
              </h3>
              <p className="text-[#1b1425] mb-4 text-sm">Upload a .feature file written in Gherkin syntax to get started</p>
              <FileUploader />
            </div>
            
            <div className="bg-white rounded-lg border border-gray-200">
              <FeatureList />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}