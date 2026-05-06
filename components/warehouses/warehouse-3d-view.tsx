import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

// Autodesk Forge Viewer
declare global {
  interface Window {
    Autodesk: any;
  }
}

const AUTODESK_CLIENT_ID = '3loPjTBw4hGqMVj4XZJTSy3kuVbONTuVhPQwbSYsOCrwaxqv';
const AUTODESK_CLIENT_SECRET = 'taPWAROCTMsjz0vufk7fAHtLhKGEcxLXUvG7GZ3sQPPp9YKQhSgO13F0GcHlAHN7';

export function Warehouse3DView() {
  const [loading, setLoading] = useState(false);
  const viewerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load Autodesk Forge Viewer
    const loadForgeViewer = async () => {
      try {
        // Load the Forge Viewer scripts
        const script1 = document.createElement('script');
        script1.src = 'https://developer.api.autodesk.com/modelderivative/v2/viewers/7.*/viewer3D.min.js';
        script1.async = true;
        document.head.appendChild(script1);

        const script2 = document.createElement('link');
        script2.rel = 'stylesheet';
        script2.href = 'https://developer.api.autodesk.com/modelderivative/v2/viewers/7.*/style.css';
        document.head.appendChild(script2);

        // Initialize viewer when scripts are loaded
        script1.onload = () => {
          if (containerRef.current) {
            viewerRef.current = new window.Autodesk.Viewing.GuiViewer3D(containerRef.current);
            viewerRef.current.start();
          }
        };
      } catch (error) {
        console.error('Error loading Forge Viewer:', error);
        toast.error('Failed to load 3D viewer');
      }
    };

    loadForgeViewer();
  }, []);

  const getAccessToken = async () => {
    try {
      const response = await fetch('https://developer.api.autodesk.com/authentication/v1/authenticate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: AUTODESK_CLIENT_ID,
          client_secret: AUTODESK_CLIENT_SECRET,
          grant_type: 'client_credentials',
          scope: 'data:read data:write data:create bucket:create bucket:read',
        }),
      });

      if (!response.ok) throw new Error('Failed to get access token');
      
      const data = await response.json();
      return data.access_token;
    } catch (error) {
      console.error('Error getting access token:', error);
      toast.error('Failed to authenticate with Autodesk');
      return null;
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const token = await getAccessToken();
      if (!token) throw new Error('No access token available');

      // Create a bucket
      const bucketKey = `warehouse_${Date.now()}`;
      await fetch('https://developer.api.autodesk.com/oss/v2/buckets', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bucketKey,
          policyKey: 'transient',
        }),
      });

      // Upload file
      await fetch(`https://developer.api.autodesk.com/oss/v2/buckets/${bucketKey}/objects/${file.name}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/octet-stream',
        },
        body: file,
      });

      // Start translation
      const translateResponse = await fetch('https://developer.api.autodesk.com/modelderivative/v2/designdata/job', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: {
            urn: Buffer.from(`${bucketKey}:${file.name}`).toString('base64'),
          },
          output: {
            formats: [
              {
                type: 'svf',
                views: ['2d', '3d'],
              },
            ],
          },
        }),
      });

      if (!translateResponse.ok) throw new Error('Failed to start translation');

      const jobId = await translateResponse.json();
      const modelUrn = await pollTranslationStatus(token, jobId.urn);
      
      // Load the model in the viewer
      if (viewerRef.current) {
        const options = {
          env: 'AutodeskProduction',
          accessToken: token,
        };
        
        window.Autodesk.Viewing.Initializer(options, () => {
          viewerRef.current.loadModel(modelUrn, options);
        });
      }

      toast.success('3D model loaded successfully');
    } catch (error) {
      console.error('Error processing file:', error);
      toast.error('Failed to process file');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full h-[600px] relative">
      <div className="absolute top-4 right-4 z-10 space-y-4">
        <div className="bg-white p-4 rounded-lg shadow-lg">
          <h3 className="text-lg font-semibold mb-4">Upload Model</h3>
          
          <div className="space-y-4">
            <div>
              <Label>Upload File</Label>
              <Input
                type="file"
                accept=".dwg,.dxf,.rvt,.ifc"
                onChange={handleFileUpload}
                disabled={loading}
                className="mt-1"
              />
            </div>

            {loading && (
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                <p className="mt-2 text-sm text-gray-600">Processing file...</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
}

async function pollTranslationStatus(token: string, urn: string): Promise<string> {
  const maxAttempts = 30;
  const interval = 2000; // 2 seconds

  for (let i = 0; i < maxAttempts; i++) {
    const response = await fetch(`https://developer.api.autodesk.com/modelderivative/v2/designdata/${urn}/manifest`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) throw new Error('Failed to check translation status');

    const manifest = await response.json();
    if (manifest.status === 'success') {
      return manifest.derivatives[0].children[0].urn;
    }

    if (manifest.status === 'failed') {
      throw new Error('Translation failed');
    }

    await new Promise(resolve => setTimeout(resolve, interval));
  }

  throw new Error('Translation timeout');
} 