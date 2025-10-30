'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useProjectStore } from '@/store/projectStore';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function ProjectSelector() {
  const router = useRouter();
  const pathname = usePathname();
  const { projects, fetchProjects, addProject, activeProject, setActiveProject } = useProjectStore();
  const [isClient, setIsClient] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');

  useEffect(() => {
    fetchProjects();
    setIsClient(true);
  }, [fetchProjects]);
  
  const handleProjectChange = (projectId: string) => {
    router.push(`/projects/${projectId}`);
  };

  const handleCreateProject = async () => {
    if (newProjectName.trim()) {
        const newProject = await addProject(newProjectName);
        if (newProject) {
            router.push(`/projects/${newProject.id}`);
            setNewProjectName(''); // Reset
        }
    }
  };

  if (!isClient) return <div>Loading projects...</div>;

  const currentProjectId = pathname.split('/')[2];

  return (
    <div className="flex items-center gap-4">
      <Select onValueChange={handleProjectChange} value={currentProjectId}>
        <SelectTrigger className="w-[280px]">
          <SelectValue placeholder="Select a project..." />
        </SelectTrigger>
        <SelectContent>
          {projects.map(p => (
            <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      <Dialog>
        <DialogTrigger asChild>
          <Button>New Project</Button>
        </DialogTrigger>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Create New Project</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">Name</Label>
                    <Input id="name" value={newProjectName} onChange={(e) => setNewProjectName(e.target.value)} className="col-span-3"/>
                </div>
            </div>
            <Button onClick={handleCreateProject}>Create</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
