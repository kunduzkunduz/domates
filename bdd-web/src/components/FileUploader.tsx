'use client';

import { useState } from 'react';
import { useProjectStore } from '@/store/projectStore';
import { parseFeatureFile } from '@/lib/parser';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function FileUploader() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { activeProject, addFeatureToProject } = useProjectStore();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      handleUpload(selectedFile);
    }
  };

  const handleUpload = async (fileToUpload: File) => {
    if (!fileToUpload || !activeProject) {
      alert("Please select a file and a project first.");
      return;
    }

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      const content = e.target?.result as string;
      try {
        const parsedFeature = parseFeatureFile(fileToUpload.name, content);
        await addFeatureToProject(activeProject.id, parsedFeature);
        alert(`Feature "${parsedFeature.name}" uploaded and parsed successfully!`);
        setFile(null); // Reset file input
        // Reset the input element
        const input = document.querySelector('input[type="file"]') as HTMLInputElement;
        if (input) input.value = '';
      } catch (error) {
        alert("Failed to parse .feature file. Please check its format.");
        console.error(error);
      } finally {
        setIsUploading(false);
      }
    };
    reader.readAsText(fileToUpload);
  };

  if (!activeProject) return null;

  return (
    <div className="flex items-center gap-4">
      <label className="flex-1 cursor-pointer">
        <input
          type="file"
          accept=".feature"
          onChange={handleFileChange}
          disabled={isUploading}
          className="hidden"
        />
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-[#ff6e6c] hover:bg-[#ff6e6c] hover:bg-opacity-10 transition-all duration-200">
          <div className="bg-[#e8f4f8] p-3 rounded-full w-12 h-12 mx-auto mb-3 flex items-center justify-center">
          </div>
          <p className="text-[#11235] font-medium mb-1 text-sm">
            {isUploading ? 'Uploading...' : 'Click to upload .feature file'}
          </p>
          <p className="text-xs text-[#1b1425]">Supports Gherkin syntax (.feature files)</p>
        </div>
      </label>
      {isUploading && (
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#ff6e6c]"></div>
      )}
    </div>
  );
}


