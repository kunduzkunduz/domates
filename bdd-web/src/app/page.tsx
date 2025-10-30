'use client';

import { useEffect, useState } from 'react';
import { useProjectStore } from '@/store/projectStore';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export default function Dashboard() {
  const { projects, isLoading, fetchProjects } = useProjectStore();
  const router = useRouter();
  const [newProjectName, setNewProjectName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return;
    
    setIsCreating(true);
    try {
      const project = await useProjectStore.getState().addProject(newProjectName.trim());
      if (project) {
        setNewProjectName('');
        router.push(`/projects/${project.id}`);
      }
    } catch (error) {
      console.error('Failed to create project:', error);
    } finally {
      setIsCreating(false);
    }
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F9FAFA] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading your projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#F9FAFA] min-h-screen">
      <div className="container mx-auto px-6 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="w-16 h-16 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-lg">
            <span className="text-4xl">🍅</span>
          </div>
          <h1 className="text-4xl font-bold text-[#11235] mb-4">
            Domates
          </h1>
          <p className="text-lg text-[#1b1425] max-w-2xl mx-auto mb-8">
            Modern Behavior Driven Development tool for managing Gherkin features, 
            running manual tests, and generating living documentation
          </p>
          
          {/* Quick Stats */}
          <div className="flex justify-center gap-12 mb-12">
            <div className="text-center">
              <div className="text-2xl font-bold text-[#67568c]">{projects.length}</div>
              <div className="text-[#1b1425] text-sm">Projects</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-[#ff6e6c]">
                {projects.reduce((sum, p) => sum + p.features.length, 0)}
              </div>
              <div className="text-[#1b1425] text-sm">Features</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-[#fbdd74]">
                {projects.reduce((sum, p) => sum + p.runs.length, 0)}
              </div>
              <div className="text-[#1b1425] text-sm">Test Runs</div>
            </div>
          </div>
        </div>

        {/* Create New Project */}
        <div className="mb-16">
          <Card className="max-w-xl mx-auto bg-white shadow-sm border border-gray-200">
            <CardHeader className="text-center pb-4">
                <CardTitle className="text-xl font-semibold text-[#11235] flex items-center justify-center gap-2">
                  Create New Project
                </CardTitle>
                <CardDescription className="text-[#1b1425]">
                  Start a new BDD project to organize your features and tests
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="Project name..."
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ff6e6c] focus:border-transparent text-sm"
                  onKeyPress={(e) => e.key === 'Enter' && handleCreateProject()}
                />
                <Button 
                  onClick={handleCreateProject}
                  disabled={isCreating || !newProjectName.trim()}
                  className="px-6 py-3 bg-[#ff6e6c] hover:bg-[#e55a58] text-[#11235] text-sm font-medium shadow-sm"
                >
                  {isCreating ? 'Creating...' : 'Create'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Projects Grid */}
        {projects.length === 0 ? (
          <Card className="text-center py-16 max-w-xl mx-auto bg-white shadow-sm border border-gray-200">
            <CardContent>
              <div className="bg-[#e8f4f8] p-6 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
              </div>
              <h3 className="text-xl font-semibold text-[#11235] mb-3">No projects yet</h3>
              <p className="text-[#1b1425] mb-8 max-w-md mx-auto text-sm">
                Create your first project to start managing BDD tests and generating living documentation
              </p>
              <Button 
                onClick={() => setNewProjectName('My First Project')}
                className="px-6 py-3 bg-[#ff6e6c] hover:bg-[#e55a58] text-[#11235] text-sm font-medium shadow-sm"
              >
                Create Your First Project
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div>
            <h2 className="text-2xl font-semibold text-[#11235] mb-8 text-center">Your Projects</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <Card key={project.id} className="hover:shadow-md transition-all duration-200 hover:-translate-y-1 border border-gray-200 bg-white">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center shadow-sm">
                        <span className="text-lg">🍅</span>
                      </div>
                      <Badge variant="secondary" className="text-xs bg-[#F3F4F4] text-[#1b1425]">
                        {project.features.length} features
                      </Badge>
                    </div>
                    <CardTitle className="text-lg font-semibold text-[#11235] truncate">
                      {project.name}
                    </CardTitle>
                    <CardDescription className="text-[#1b1425] text-sm">
                      {project.description || 'No description provided'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-[#1b1425]">Features</span>
                        <span className="font-medium text-[#ff6e6c]">{project.features.length}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-[#1b1425]">Test Runs</span>
                        <span className="font-medium text-[#fbdd74]">{project.runs.length}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-[#1b1425]">Created</span>
                        <span className="text-[#1b1425]">{new Date().toLocaleDateString()}</span>
                      </div>
                    </div>
                    
                    <Button 
                      className="w-full bg-[#ff6e6c] hover:bg-[#e55a58] text-[#11235] text-sm font-medium shadow-sm"
                      asChild
                    >
                      <Link href={`/projects/${project.id}`}>
                        Open Project
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Features Section */}
        <div className="mt-20 text-center">
            <h2 className="text-xl font-semibold text-[#11235] mb-8">Why Choose Domates?</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="bg-[#67568c] p-4 rounded-full w-12 h-12 mx-auto mb-4 flex items-center justify-center">
                </div>
                <h3 className="font-semibold text-[#11235] mb-2">Gherkin Support</h3>
                <p className="text-[#1b1425] text-sm">Upload and parse .feature files written in Gherkin syntax</p>
              </div>
              <div className="text-center">
                <div className="bg-[#ff6e6c] p-4 rounded-full w-12 h-12 mx-auto mb-4 flex items-center justify-center">
                </div>
                <h3 className="font-semibold text-[#11235] mb-2">Manual Testing</h3>
                <p className="text-[#1b1425] text-sm">Run tests step-by-step with pass/fail/skip options</p>
              </div>
              <div className="text-center">
                <div className="bg-[#e8f4f8] p-4 rounded-full w-12 h-12 mx-auto mb-4 flex items-center justify-center">
                </div>
                <h3 className="font-semibold text-[#11235] mb-2">Living Docs</h3>
                <p className="text-[#1b1425] text-sm">Auto-generate beautiful documentation from test results</p>
              </div>
            </div>
        </div>
      </div>
    </div>
  );
}