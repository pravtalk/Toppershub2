import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { RefreshCw, CheckCircle, XCircle, AlertTriangle, Database, Folder } from 'lucide-react';

const StorageDebugger = () => {
  const [checking, setChecking] = useState(false);
  const [results, setResults] = useState<any>(null);
  const { toast } = useToast();

  const runDiagnostics = async () => {
    setChecking(true);
    const diagnostics: any = {
      timestamp: new Date().toISOString(),
      user: null,
      userRole: null,
      bucketExists: false,
      bucketPublic: false,
      canList: false,
      canUpload: false,
      policies: [],
      errors: []
    };

    try {
      // Check user authentication
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) {
        diagnostics.errors.push(`Auth error: ${authError.message}`);
      } else {
        diagnostics.user = user?.email || 'authenticated';
      }

      // Check user role
      if (user) {
        const { data: roleData, error: roleError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .single();
        
        if (!roleError && roleData) {
          diagnostics.userRole = roleData.role;
        }
      }

      // Check if bucket exists and is accessible
      try {
        const { data: listData, error: listError } = await supabase.storage
          .from('content-files')
          .list('', { limit: 1 });

        if (listError) {
          diagnostics.errors.push(`Bucket list error: ${listError.message}`);
          diagnostics.bucketExists = false;
        } else {
          diagnostics.bucketExists = true;
          diagnostics.canList = true;
        }
      } catch (error: any) {
        diagnostics.errors.push(`Bucket access error: ${error.message}`);
      }

      // Test upload capability with a small test file
      if (diagnostics.bucketExists) {
        try {
          const testFile = new File(['test content'], 'test.txt', { type: 'text/plain' });
          const testPath = `test/diagnostic-${Date.now()}.txt`;

          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('content-files')
            .upload(testPath, testFile);

          if (uploadError) {
            diagnostics.errors.push(`Upload test failed: ${uploadError.message}`);
            diagnostics.canUpload = false;
          } else {
            diagnostics.canUpload = true;
            
            // Clean up test file
            await supabase.storage.from('content-files').remove([testPath]);
          }
        } catch (error: any) {
          diagnostics.errors.push(`Upload test error: ${error.message}`);
        }
      }

      // Check bucket info
      try {
        const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
        if (!bucketsError && buckets) {
          const contentBucket = buckets.find(b => b.id === 'content-files');
          if (contentBucket) {
            diagnostics.bucketPublic = contentBucket.public;
          }
        }
      } catch (error: any) {
        diagnostics.errors.push(`Bucket info error: ${error.message}`);
      }

      setResults(diagnostics);
      
      const hasErrors = diagnostics.errors.length > 0;
      toast({
        title: hasErrors ? 'Diagnostics Completed with Issues' : 'Diagnostics Completed',
        description: hasErrors ? 'Found some configuration issues' : 'All systems appear functional',
        variant: hasErrors ? 'destructive' : 'default',
      });

    } catch (error: any) {
      diagnostics.errors.push(`General error: ${error.message}`);
      setResults(diagnostics);
      
      toast({
        title: 'Diagnostics Failed',
        description: 'Failed to complete storage diagnostics',
        variant: 'destructive',
      });
    } finally {
      setChecking(false);
    }
  };

  const createBucketMigration = () => {
    const migrationContent = `-- Storage bucket creation and policies
-- Run this in your Supabase SQL editor

-- Create storage bucket for content files
INSERT INTO storage.buckets (id, name, public) 
VALUES ('content-files', 'content-files', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for content files
CREATE POLICY "Admin can upload content files" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'content-files' 
  AND auth.role() = 'authenticated' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admin can update content files" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'content-files' 
  AND auth.role() = 'authenticated' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admin can delete content files" ON storage.objects
FOR DELETE USING (
  bucket_id = 'content-files' 
  AND auth.role() = 'authenticated' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Anyone can view content files" ON storage.objects
FOR SELECT USING (bucket_id = 'content-files');`;

    navigator.clipboard.writeText(migrationContent);
    toast({
      title: 'Migration Copied',
      description: 'Storage setup SQL copied to clipboard. Run this in your Supabase SQL editor.',
    });
  };

  const getStatusIcon = (status: boolean, type: 'success' | 'error' | 'warning' = 'success') => {
    if (type === 'warning') return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
    return status ? 
      <CheckCircle className="w-4 h-4 text-green-500" /> : 
      <XCircle className="w-4 h-4 text-red-500" />;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              Storage Diagnostics
            </CardTitle>
            <CardDescription>
              Check storage configuration and troubleshoot upload issues
            </CardDescription>
          </div>
          <Button 
            onClick={runDiagnostics} 
            disabled={checking}
            size="sm"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${checking ? 'animate-spin' : ''}`} />
            {checking ? 'Checking...' : 'Run Diagnostics'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {results && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-semibold flex items-center gap-2">
                  <Folder className="w-4 h-4" />
                  Storage Status
                </h4>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center justify-between">
                    <span>Bucket Exists</span>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(results.bucketExists)}
                      <Badge variant={results.bucketExists ? 'default' : 'destructive'}>
                        {results.bucketExists ? 'Yes' : 'No'}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Can List Files</span>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(results.canList)}
                      <Badge variant={results.canList ? 'default' : 'destructive'}>
                        {results.canList ? 'Yes' : 'No'}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Can Upload</span>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(results.canUpload)}
                      <Badge variant={results.canUpload ? 'default' : 'destructive'}>
                        {results.canUpload ? 'Yes' : 'No'}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Bucket Public</span>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(results.bucketPublic, 'warning')}
                      <Badge variant={results.bucketPublic ? 'default' : 'secondary'}>
                        {results.bucketPublic ? 'Yes' : 'No'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold">User Status</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center justify-between">
                    <span>Authenticated</span>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(!!results.user)}
                      <Badge variant={results.user ? 'default' : 'destructive'}>
                        {results.user ? 'Yes' : 'No'}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>User Role</span>
                    <Badge variant={results.userRole === 'admin' ? 'default' : 'secondary'}>
                      {results.userRole || 'Unknown'}
                    </Badge>
                  </div>
                  {results.user && (
                    <div className="text-xs text-muted-foreground">
                      User: {results.user}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {results.errors.length > 0 && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-1">
                    <div className="font-semibold">Issues Found:</div>
                    {results.errors.map((error: string, index: number) => (
                      <div key={index} className="text-sm">• {error}</div>
                    ))}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {(!results.bucketExists || !results.canUpload) && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <div className="font-semibold">Storage Setup Required</div>
                    <div className="text-sm">
                      The storage bucket needs to be configured. Click the button below to copy the setup SQL.
                    </div>
                    <Button onClick={createBucketMigration} size="sm" variant="outline">
                      Copy Setup SQL
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            <div className="text-xs text-muted-foreground">
              Last checked: {new Date(results.timestamp).toLocaleString()}
            </div>
          </>
        )}

        {!results && (
          <div className="text-center py-6 text-muted-foreground">
            Click "Run Diagnostics" to check storage configuration
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StorageDebugger;