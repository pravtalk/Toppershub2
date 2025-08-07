import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, FileText, HelpCircle, Download, Eye, ArrowLeft, BookOpen, Target } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import Navigation from "@/components/Navigation";

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
  created_at: string;
  subjects?: { name: string };
  batches?: { name: string };
}

interface Batch {
  id: string;
  name: string;
}

const PracticeZone = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [contentUploads, setContentUploads] = useState<ContentUpload[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBatch, setSelectedBatch] = useState<string>("all");
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchData();
  }, [user, navigate]);

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

      // Fetch content uploads
      const { data: uploadsData, error: uploadsError } = await supabase
        .from('content_uploads')
        .select(`
          *,
          subjects(name),
          batches(name)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (uploadsError) throw uploadsError;
      setContentUploads(uploadsData || []);

    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load practice content',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (uploadId: string, fileUrl: string) => {
    try {
      // Increment download count
      const currentUpload = contentUploads.find(u => u.id === uploadId);
      if (currentUpload) {
        await supabase
          .from('content_uploads')
          .update({ download_count: currentUpload.download_count + 1 })
          .eq('id', uploadId);

        // Update local state
        setContentUploads(prev => 
          prev.map(upload => 
            upload.id === uploadId 
              ? { ...upload, download_count: upload.download_count + 1 }
              : upload
          )
        );
      }

      // Open download link
      window.open(fileUrl, '_blank');
      
    } catch (error) {
      console.error('Error updating download count:', error);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Filter content by search query, batch, and type
  const filterContent = (type: 'notes' | 'questions') => {
    return contentUploads.filter(upload => {
      const matchesType = upload.content_type === type;
      const matchesSearch = upload.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           upload.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           (upload.subjects as any)?.name?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesBatch = selectedBatch === 'all' || upload.batch_id === selectedBatch;
      
      return matchesType && matchesSearch && matchesBatch;
    });
  };

  const filteredNotes = filterContent('notes');
  const filteredQuestions = filterContent('questions');

  const renderContentList = (items: ContentUpload[], emptyMessage: string, icon: React.ReactNode) => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      );
    }

    if (items.length === 0) {
      return (
        <div className="text-center py-16">
          <div className="flex justify-center mb-4">
            {icon}
          </div>
          <h3 className="text-xl font-semibold mb-2">No content found</h3>
          <p className="text-muted-foreground">
            {searchQuery || selectedBatch !== 'all'
              ? 'Try adjusting your search or filters'
              : emptyMessage
            }
          </p>
        </div>
      );
    }

    return (
      <div className="grid gap-4">
        {items.map((item) => (
          <Card key={item.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                  item.content_type === 'notes' 
                    ? 'bg-blue-100 text-blue-600' 
                    : 'bg-purple-100 text-purple-600'
                }`}>
                  {item.content_type === 'notes' 
                    ? <FileText className="h-6 w-6" /> 
                    : <HelpCircle className="h-6 w-6" />
                  }
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-lg truncate pr-4">{item.title}</h3>
                    <Badge variant={item.content_type === 'notes' ? 'default' : 'secondary'}>
                      {item.content_type === 'notes' ? '📝 Notes' : '❓ Questions'}
                    </Badge>
                  </div>

                  {item.description && (
                    <p className="text-muted-foreground mb-3 line-clamp-2">{item.description}</p>
                  )}

                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
                    <span>📚 {(item.batches as any)?.name}</span>
                    {(item.subjects as any)?.name && (
                      <span>📖 {(item.subjects as any).name}</span>
                    )}
                    <span>📄 {formatFileSize(item.file_size)}</span>
                    <span>⬇️ {item.download_count} downloads</span>
                    <span>📅 {new Date(item.created_at).toLocaleDateString()}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button 
                      size="sm" 
                      onClick={() => handleDownload(item.id, item.file_url)}
                      className="flex items-center gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Download
                    </Button>
                    <Button size="sm" variant="outline" asChild>
                      <a href={item.file_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                        <Eye className="h-4 w-4" />
                        Preview
                      </a>
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 bg-background/80 backdrop-blur-lg border-b border-border z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Button>
            <div className="flex items-center gap-2">
              <Target className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold gradient-primary bg-clip-text text-transparent">
                Practice Zone
              </h1>
            </div>
          </div>
          <p className="text-muted-foreground mt-2">
            Access notes and practice questions to boost your preparation
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Search and Filter Section */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search notes and questions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={selectedBatch} onValueChange={setSelectedBatch}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filter by batch" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Batches</SelectItem>
              {batches.map((batch) => (
                <SelectItem key={batch.id} value={batch.id}>
                  {batch.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Content Tabs */}
        <Tabs defaultValue="notes" className="w-full">
          <TabsList className="grid w-full max-w-lg mx-auto grid-cols-2 mb-6">
            <TabsTrigger value="notes" className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Study Notes
              {filteredNotes.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {filteredNotes.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="questions" className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4" />
              Practice Questions
              {filteredQuestions.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {filteredQuestions.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="notes">
            {renderContentList(
              filteredNotes,
              'No study notes have been uploaded yet',
              <BookOpen className="h-16 w-16 text-muted-foreground" />
            )}
          </TabsContent>

          <TabsContent value="questions">
            {renderContentList(
              filteredQuestions,
              'No practice questions have been uploaded yet',
              <HelpCircle className="h-16 w-16 text-muted-foreground" />
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Bottom Navigation */}
      <Navigation />
    </div>
  );
};

export default PracticeZone;