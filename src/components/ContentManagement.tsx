import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Upload, FileText, HelpCircle, Download, Eye, Trash2, Plus, Search } from 'lucide-react';

interface ContentUpload {
  id: string;
  title: string;
  description: string;
  content_type: 'notes' | 'questions';
  file_name: string;
  file_url: string;
  file_size: number;
  pages_count: number;
  download_count: number;
  is_active: boolean;
  created_at: string;
  subject_id: string;
  batch_id: string;
  subjects?: { name: string };
  batches?: { name: string };
}

interface Batch {
  id: string;
  name: string;
}

interface Subject {
  id: string;
  name: string;
  batch_id: string;
}

const ContentManagement = () => {
  const [uploads, setUploads] = useState<ContentUpload[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContentType, setSelectedContentType] = useState<'all' | 'notes' | 'questions'>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    content_type: 'notes' as 'notes' | 'questions',
    batch_id: '',
    subject_id: '',
    file: null as File | null
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch batches
      const { data: batchesData, error: batchesError } = await supabase
        .from('batches')
        .select('id, name')
        .eq('is_active', true)
        .order('name');

      if (batchesError) throw batchesError;
      setBatches(batchesData || []);

      // Fetch subjects
      const { data: subjectsData, error: subjectsError } = await supabase
        .from('subjects')
        .select('id, name, batch_id')
        .order('name');

      if (subjectsError) throw subjectsError;
      setSubjects(subjectsData || []);

      // Fetch content uploads
      const { data: uploadsData, error: uploadsError } = await supabase
        .from('content_uploads')
        .select(`
          *,
          subjects(name),
          batches(name)
        `)
        .order('created_at', { ascending: false });

      if (uploadsError) throw uploadsError;
      setUploads(uploadsData || []);

    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load content data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.file || !formData.title || !formData.batch_id) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields and select a file',
        variant: 'destructive',
      });
      return;
    }

    try {
      setUploading(true);

      // Upload file to Supabase Storage
      const fileExt = formData.file.name.split('.').pop();
      const fileName = `${Date.now()}-${formData.file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const filePath = `${formData.content_type}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('content-files')
        .upload(filePath, formData.file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('content-files')
        .getPublicUrl(filePath);

      // Save file metadata to database
      const { error: dbError } = await supabase
        .from('content_uploads')
        .insert([
          {
            title: formData.title,
            description: formData.description,
            content_type: formData.content_type,
            file_name: formData.file.name,
            file_url: urlData.publicUrl,
            file_size: formData.file.size,
            batch_id: formData.batch_id,
            subject_id: formData.subject_id || null,
            created_by: (await supabase.auth.getUser()).data.user?.id
          }
        ]);

      if (dbError) throw dbError;

      toast({
        title: 'Success',
        description: 'File uploaded successfully',
      });

      // Reset form and refresh data
      setFormData({
        title: '',
        description: '',
        content_type: 'notes',
        batch_id: '',
        subject_id: '',
        file: null
      });
      setIsDialogOpen(false);
      fetchData();

    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: 'Error',
        description: 'Failed to upload file',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('content_uploads')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Content deleted successfully',
      });

      fetchData();
    } catch (error) {
      console.error('Error deleting content:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete content',
        variant: 'destructive',
      });
    }
  };

  const filteredUploads = uploads.filter(upload => {
    const matchesSearch = upload.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         upload.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (upload.subjects as any)?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = selectedContentType === 'all' || upload.content_type === selectedContentType;
    
    return matchesSearch && matchesType;
  });

  const filteredSubjects = subjects.filter(subject => subject.batch_id === formData.batch_id);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Upload Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Content Management</h2>
          <p className="text-muted-foreground">Upload and manage notes and question papers</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Upload Content
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Upload New Content</DialogTitle>
              <DialogDescription>
                Upload notes or question papers for students to access
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleFileUpload} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Enter content title"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="content_type">Content Type *</Label>
                  <Select
                    value={formData.content_type}
                    onValueChange={(value: 'notes' | 'questions') => 
                      setFormData({ ...formData, content_type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="notes">📝 Notes</SelectItem>
                      <SelectItem value="questions">❓ Questions</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter content description"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="batch">Batch *</Label>
                  <Select
                    value={formData.batch_id}
                    onValueChange={(value) => setFormData({ ...formData, batch_id: value, subject_id: '' })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select batch" />
                    </SelectTrigger>
                    <SelectContent>
                      {batches.map((batch) => (
                        <SelectItem key={batch.id} value={batch.id}>
                          {batch.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject">Subject (Optional)</Label>
                  <Select
                    value={formData.subject_id}
                    onValueChange={(value) => setFormData({ ...formData, subject_id: value })}
                    disabled={!formData.batch_id}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredSubjects.map((subject) => (
                        <SelectItem key={subject.id} value={subject.id}>
                          {subject.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="file">File *</Label>
                <Input
                  id="file"
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => setFormData({ ...formData, file: e.target.files?.[0] || null })}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Supported formats: PDF, DOC, DOCX (Max size: 10MB)
                </p>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={uploading}>
                  {uploading ? 'Uploading...' : 'Upload'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search content..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedContentType} onValueChange={(value: 'all' | 'notes' | 'questions') => setSelectedContentType(value)}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Content</SelectItem>
            <SelectItem value="notes">📝 Notes Only</SelectItem>
            <SelectItem value="questions">❓ Questions Only</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Content List */}
      <div className="grid gap-4">
        {filteredUploads.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No content found</h3>
              <p className="text-muted-foreground text-center">
                {searchQuery || selectedContentType !== 'all' 
                  ? 'Try adjusting your search or filters'
                  : 'Upload your first content to get started'
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredUploads.map((upload) => (
            <Card key={upload.id}>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                    upload.content_type === 'notes' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'
                  }`}>
                    {upload.content_type === 'notes' ? <FileText className="h-6 w-6" /> : <HelpCircle className="h-6 w-6" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-lg truncate">{upload.title}</h3>
                      <div className="flex items-center gap-2 ml-4">
                        <Badge variant={upload.content_type === 'notes' ? 'default' : 'secondary'}>
                          {upload.content_type === 'notes' ? '📝 Notes' : '❓ Questions'}
                        </Badge>
                        <Badge variant="outline" className={upload.is_active ? 'text-green-600' : 'text-red-600'}>
                          {upload.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </div>

                    {upload.description && (
                      <p className="text-muted-foreground mb-3 line-clamp-2">{upload.description}</p>
                    )}

                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
                      <span>📚 {(upload.batches as any)?.name}</span>
                      {(upload.subjects as any)?.name && (
                        <span>📖 {(upload.subjects as any).name}</span>
                      )}
                      <span>📄 {formatFileSize(upload.file_size)}</span>
                      <span>⬇️ {upload.download_count} downloads</span>
                      <span>📅 {new Date(upload.created_at).toLocaleDateString()}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" asChild>
                        <a href={upload.file_url} target="_blank" rel="noopener noreferrer">
                          <Eye className="h-4 w-4 mr-1" />
                          Preview
                        </a>
                      </Button>
                      <Button size="sm" variant="outline" asChild>
                        <a href={upload.file_url} download>
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </a>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(upload.id)}
                        className="text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default ContentManagement;