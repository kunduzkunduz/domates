'use client';

import Link from 'next/link';
import { useProjectStore } from '@/store/projectStore';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';

export function FeatureList() {
  const { activeProject } = useProjectStore();

  if (!activeProject || activeProject.features.length === 0) {
    return (
      <div className="p-6 text-center">
        <div className="bg-[#e8f4f8] p-4 rounded-full w-12 h-12 mx-auto mb-4 flex items-center justify-center">
        </div>
        <h3 className="text-lg font-semibold text-[#11235] mb-2">No features uploaded yet</h3>
        <p className="text-[#1b1425] text-sm">Upload a `.feature` file to begin testing</p>
      </div>
    );
  }
  
  const getRunForFeature = (featureId: string) => {
      // Find the most recent run for a given feature
      return activeProject.runs
        .filter(run => run.featureId === featureId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
  }

  return (
    <div className="p-6">
      <h3 className="text-lg font-semibold text-[#11235] mb-4">Features</h3>
      <div className="space-y-3">
        {activeProject.features.map(feature => {
            const latestRun = getRunForFeature(feature.id);
            return (
              <div key={feature.id} className="flex items-center justify-between p-4 bg-[#F9FAFA] rounded-lg border border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-[#ff6e6c] rounded-lg flex items-center justify-center">
                  </div>
                  <div>
                    <h4 className="font-semibold text-[#11235] text-sm">{feature.name}</h4>
                    <p className="text-xs text-[#1b1425]">{feature.scenarios.length} scenarios</p>
                  </div>
                </div>
                <div className="flex gap-2">
                    {latestRun ? (
                      <Link href={`/projects/${activeProject.id}/run/${latestRun.id}`}>
                        <Button size="sm" variant="outline" className="text-xs text-[#FB5058] hover:text-[#FB5058] border-[#FB5058] hover:bg-[#FB5058]/10">
                          Run Test
                        </Button>
                      </Link>
                    ) : (
                      <Link href={`/projects/${activeProject.id}/new-run/${feature.id}`}>
                        <Button size="sm" variant="outline" className="text-xs text-[#FB5058] hover:text-[#FB5058] border-[#FB5058] hover:bg-[#FB5058]/10">
                          Run Test
                        </Button>
                      </Link>
                    )}
                    <Link href={`/projects/${activeProject.id}/docs/${feature.id}`}>
                      <Button size="sm" variant="outline" className="text-xs text-[#FF8001] hover:text-[#FF8001] border-[#FF8001] hover:bg-[#FF8001]/10">
                        View Docs
                      </Button>
                    </Link>
                    {latestRun && (
                      <Link href={`/projects/${activeProject.id}/report/${feature.id}`}>
                        <Button size="sm" variant="outline" className="text-xs text-[#205EB8] hover:text-[#205EB8] border-[#205EB8] hover:bg-[#205EB8]/10">
                          Report
                        </Button>
                      </Link>
                    )}
                </div>
              </div>
            );
        })}
      </div>
    </div>
  );
}
