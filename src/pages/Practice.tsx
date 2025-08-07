import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Play, FileText, Download, Search, Eye, Clock, BookOpen, HelpCircle } from "lucide-react";
import Navigation from "@/components/Navigation";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

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

interface Lecture {
  id: string;
  title: string;
  description: string;
  video_url: string;
  duration_minutes: number;
  is_free: boolean;
  subjects?: { name: string };
  batches?: { name: string };
}

interface LiveLecture {
  id: string;
  title: string;
  description: string;
  live_url: string;
  scheduled_at: string;
  duration_minutes: number;
  is_live: boolean;
  subjects?: { name: string };
  batches?: { name: string };
}

const Practice = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [contentUploads, setContentUploads] = useState<ContentUpload[]>([]);
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [liveLectures, setLiveLectures] = useState<LiveLecture[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      // Fetch content uploads (notes and questions)
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

      // Fetch lectures
      const { data: lecturesData, error: lecturesError } = await supabase
        .from('lectures')
        .select(`
          *,
          subjects(name),
          batches(name)
        `)
        .order('created_at', { ascending: false });

      if (lecturesError) throw lecturesError;

      // Fetch live lectures
      const { data: liveLecturesData, error: liveLecturesError } = await supabase
        .from('live_lectures')
        .select(`
          *,
          subjects(name),
          batches(name)
        `)
        .eq('is_active', true)
        .order('scheduled_at', { ascending: false });

      if (liveLecturesError) {
        console.warn('Live lectures table might not exist yet:', liveLecturesError);
        setLiveLectures([]);
      } else {
        setLiveLectures(liveLecturesData || []);
      }

      setContentUploads(uploadsData || []);
      setLectures(lecturesData || []);
    } catch (error) {
      console.error('Error fetching content:', error);
      toast({
        title: "Error",
        description: "Failed to load practice content",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (content: ContentUpload) => {
    try {
      // Increment download count
      await supabase
        .from('content_uploads')
        .update({ download_count: content.download_count + 1 })
        .eq('id', content.id);

      // Open file URL
      window.open(content.file_url, '_blank');
      
      toast({
        title: "Download Started",
        description: `Downloading ${content.title}`,
      });
    } catch (error) {
      console.error('Error downloading file:', error);
      toast({
        title: "Download Failed",
        description: "Failed to download file",
        variant: "destructive",
      });
    }
  };

  const filteredContent = contentUploads.filter(content =>
    content.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    content.subjects?.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredLectures = lectures.filter(lecture =>
    lecture.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lecture.subjects?.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredLiveLectures = liveLectures.filter(live =>
    live.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    live.subjects?.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background pb-20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading practice content...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 bg-background/80 backdrop-blur-lg border-b border-border z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold gradient-primary bg-clip-text text-transparent">
              Practice Zone
            </h1>
            <Badge variant="outline" className="gradient-accent text-accent-foreground">
              FREE ACCESS
            </Badge>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search lectures, notes, and questions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-background/50"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-6">
        <Tabs defaultValue="lectures" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="lectures" className="text-xs sm:text-sm">
              <Play className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">Lectures</span>
            </TabsTrigger>
            <TabsTrigger value="live" className="text-xs sm:text-sm">
              <Clock className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">Live</span>
            </TabsTrigger>
            <TabsTrigger value="notes" className="text-xs sm:text-sm">
              <BookOpen className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">Notes</span>
            </TabsTrigger>
            <TabsTrigger value="questions" className="text-xs sm:text-sm">
              <HelpCircle className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">Questions</span>
            </TabsTrigger>
          </TabsList>

          {/* Live Lectures */}
          <TabsContent value="live" className="space-y-4">
            {filteredLiveLectures.length > 0 ? (
              filteredLiveLectures.map((live) => (
                <Card key={live.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{live.title}</CardTitle>
                        <CardDescription>{live.description}</CardDescription>
                      </div>
                      {live.is_live && (
                        <Badge variant="destructive" className="animate-pulse">
                          🔴 LIVE
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>📚 {live.subjects?.name || 'General'}</span>
                        <span>⏱️ {live.duration_minutes} min</span>
                        {live.scheduled_at && (
                          <span>📅 {new Date(live.scheduled_at).toLocaleString()}</span>
                        )}
                      </div>
                    </div>
                    <Button 
                      variant={live.is_live ? "default" : "outline"} 
                      className="w-full"
                      onClick={() => window.open(live.live_url, '_blank')}
                    >
                      <Play className="w-4 h-4 mr-2" />
                      {live.is_live ? 'Join Live' : 'Watch Recording'}
                    </Button>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-8">
                <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Live Lectures</h3>
                <p className="text-muted-foreground">No live lectures scheduled at the moment.</p>
              </div>
            )}
          </TabsContent>

          {/* Recorded Lectures */}
          <TabsContent value="lectures" className="space-y-4">
            {filteredLectures.length > 0 ? (
              filteredLectures.map((lecture) => (
                <Card key={lecture.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{lecture.title}</CardTitle>
                        <CardDescription>{lecture.description}</CardDescription>
                      </div>
                      {lecture.is_free && (
                        <Badge variant="secondary">FREE</Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>📚 {lecture.subjects?.name || 'General'}</span>
                        <span>⏱️ {lecture.duration_minutes} min</span>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => window.open(lecture.video_url, '_blank')}
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Watch Lecture
                    </Button>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-8">
                <Play className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Lectures Available</h3>
                <p className="text-muted-foreground">No recorded lectures available yet.</p>
              </div>
            )}
          </TabsContent>

          {/* Notes */}
          <TabsContent value="notes" className="space-y-4">
            {filteredContent.filter(c => c.content_type === 'notes').length > 0 ? (
              filteredContent.filter(c => c.content_type === 'notes').map((content) => (
                <Card key={content.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg">{content.title}</CardTitle>
                    <CardDescription>{content.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>📚 {content.subjects?.name || 'General'}</span>
                        <span>📄 {content.pages_count} pages</span>
                        <span>📥 {content.download_count} downloads</span>
                      </div>
                      <Badge variant="outline">
                        {(content.file_size / 1024 / 1024).toFixed(1)} MB
                      </Badge>
                    </div>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => handleDownload(content)}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download Notes
                    </Button>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Notes Available</h3>
                <p className="text-muted-foreground">No study notes uploaded yet.</p>
              </div>
            )}
          </TabsContent>

          {/* Questions */}
          <TabsContent value="questions" className="space-y-4">
            {filteredContent.filter(c => c.content_type === 'questions').length > 0 ? (
              filteredContent.filter(c => c.content_type === 'questions').map((content) => (
                <Card key={content.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg">{content.title}</CardTitle>
                    <CardDescription>{content.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>📚 {content.subjects?.name || 'General'}</span>
                        <span>📄 {content.pages_count} pages</span>
                        <span>📥 {content.download_count} downloads</span>
                      </div>
                      <Badge variant="outline">
                        {(content.file_size / 1024 / 1024).toFixed(1)} MB
                      </Badge>
                    </div>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => handleDownload(content)}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download Questions
                    </Button>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-8">
                <HelpCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Question Papers</h3>
                <p className="text-muted-foreground">No question papers uploaded yet.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Bottom Navigation */}
      <Navigation />
    </div>
  );
};

export default Practice;