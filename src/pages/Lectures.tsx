import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Play, FileText, Search, Download, Eye, HelpCircle, ArrowLeft } from "lucide-react";
import Navigation from "@/components/Navigation";
import VideoPlayer from "@/components/VideoPlayer";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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

const Lectures = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [contentUploads, setContentUploads] = useState<ContentUpload[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLecture, setSelectedLecture] = useState<any>(null);
  const { toast } = useToast();

  const lectures = [
    {
      id: 1,
      title: "Chemical Reactions L1",
      subject: "Chemistry",
      thumbnail: "/placeholder.svg",
      duration: "45 min",
      views: "2.3k",
      difficulty: "Beginner",
      videoUrl: "https://sample-videos.com/zip/10/mp4/SampleVideo_720x480_1mb.mp4",
      qualityOptions: {
        "720p": "https://sample-videos.com/zip/10/mp4/SampleVideo_720x480_1mb.mp4",
        "480p": "https://sample-videos.com/zip/10/mp4/SampleVideo_480x360_1mb.mp4", 
        "360p": "https://sample-videos.com/zip/10/mp4/SampleVideo_360x240_1mb.mp4"
      }
    },
    {
      id: 2,
      title: "Chemical Reactions L2",
      subject: "Chemistry", 
      thumbnail: "/placeholder.svg",
      duration: "50 min",
      views: "1.8k",
      difficulty: "Intermediate",
      videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
    },
    {
      id: 3,
      title: "Chemical Reactions L3",
      subject: "Chemistry",
      thumbnail: "/placeholder.svg", 
      duration: "55 min",
      views: "1.5k",
      difficulty: "Advanced",
      videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
      qualityOptions: {
        "720p": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
        "480p": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
        "360p": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
      }
    }
  ];

  useEffect(() => {
    fetchContentUploads();
  }, []);

  const fetchContentUploads = async () => {
    try {
      const { data, error } = await supabase
        .from('content_uploads')
        .select(`
          *,
          subjects(name),
          batches(name)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setContentUploads(data || []);
    } catch (error) {
      console.error('Error fetching content uploads:', error);
      toast({
        title: 'Error',
        description: 'Failed to load content',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (uploadId: string, fileUrl: string) => {
    try {
      // Increment download count
      await supabase
        .from('content_uploads')
        .update({ download_count: contentUploads.find(u => u.id === uploadId)?.download_count + 1 })
        .eq('id', uploadId);

      // Open download link
      window.open(fileUrl, '_blank');
      
      // Refresh data to show updated download count
      fetchContentUploads();
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

  // Filter content by search query and type
  const filteredNotes = contentUploads.filter(upload => 
    upload.content_type === 'notes' &&
    (upload.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
     upload.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
     (upload.subjects as any)?.name?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredQuestions = contentUploads.filter(upload => 
    upload.content_type === 'questions' &&
    (upload.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
     upload.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
     (upload.subjects as any)?.name?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // If a lecture is selected, show the video player
  if (selectedLecture) {
    return (
      <div className="min-h-screen bg-background pb-20">
        {/* Header */}
        <div className="sticky top-0 bg-background/80 backdrop-blur-lg border-b border-border z-50">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedLecture(null)}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Lectures
              </Button>
              <h1 className="text-2xl font-bold gradient-primary bg-clip-text text-transparent">
                {selectedLecture.title}
              </h1>
            </div>
          </div>
        </div>

        {/* Video Player */}
        <div className="container mx-auto px-4 py-6">
          <VideoPlayer
            videoUrl={selectedLecture.videoUrl}
            title={selectedLecture.title}
            description={`${selectedLecture.subject} • ${selectedLecture.difficulty} • ${selectedLecture.duration}`}
            qualityOptions={selectedLecture.qualityOptions}
            hasNext={true}
            hasPrevious={true}
            onNext={() => {
              const currentIndex = lectures.findIndex(l => l.id === selectedLecture.id);
              const nextLecture = lectures[currentIndex + 1];
              if (nextLecture) setSelectedLecture(nextLecture);
            }}
            onPrevious={() => {
              const currentIndex = lectures.findIndex(l => l.id === selectedLecture.id);
              const previousLecture = lectures[currentIndex - 1];
              if (previousLecture) setSelectedLecture(previousLecture);
            }}
          />
        </div>

        {/* Bottom Navigation */}
        <Navigation />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 bg-background/80 backdrop-blur-lg border-b border-border z-50">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold gradient-primary bg-clip-text text-transparent">
            PraveshCoderZ
          </h1>
        </div>
      </div>

      {/* Search Section */}
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-md mx-auto mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search lectures and notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-muted border-border"
            />
          </div>
        </div>

        {/* Tabs for Videos, Notes, and Questions */}
        <Tabs defaultValue="videos" className="w-full">
          <TabsList className="grid w-full max-w-lg mx-auto grid-cols-3 mb-6">
            <TabsTrigger value="videos" className="flex items-center gap-2">
              <Play className="w-4 h-4" />
              Videos
            </TabsTrigger>
            <TabsTrigger value="notes" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Notes
            </TabsTrigger>
            <TabsTrigger value="questions" className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4" />
              Questions
            </TabsTrigger>
          </TabsList>

          <TabsContent value="videos">
            <div className="space-y-4">
              {lectures.map((lecture) => (
                <div
                  key={lecture.id}
                  className="gradient-card rounded-xl p-6 border border-border hover:border-primary/50 transition-all duration-300"
                >
                  <div className="flex items-start gap-4">
                    {/* Thumbnail */}
                    <div className="w-32 h-20 bg-muted rounded-lg flex items-center justify-center relative overflow-hidden">
                      <Play className="w-8 h-8 text-primary" />
                      <div className="absolute bottom-1 right-1 bg-black/70 text-white text-xs px-1 rounded">
                        {lecture.duration}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-lg">{lecture.title}</h3>
                        <Badge variant="outline" className="text-xs">
                          NEW
                        </Badge>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                        <span>🔥 Powered by @PraveshCoderZ</span>
                        <span>{lecture.views} views</span>
                      </div>

                      <Badge 
                        variant="secondary"
                        className={lecture.difficulty === "Advanced" ? "bg-destructive text-destructive-foreground" : 
                                  lecture.difficulty === "Intermediate" ? "bg-warning text-black" : "bg-success text-white"}
                      >
                        {lecture.difficulty}
                      </Badge>

                      <div className="mt-4">
                        <Button 
                          variant="study" 
                          size="default" 
                          className="w-full sm:w-auto"
                          onClick={() => setSelectedLecture(lecture)}
                        >
                          <Play className="w-4 h-4 mr-2" />
                          Play Lecture
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="notes">
            <div className="space-y-4">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : filteredNotes.length === 0 ? (
                <div className="text-center py-16">
                  <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-xl font-semibold mb-2">No notes found</h3>
                  <p className="text-muted-foreground">
                    {searchQuery ? 'Try adjusting your search query' : 'No notes have been uploaded yet'}
                  </p>
                </div>
              ) : (
                filteredNotes.map((note) => (
                  <div
                    key={note.id}
                    className="gradient-card rounded-xl p-6 border border-border hover:border-primary/50 transition-all duration-300"
                  >
                    <div className="flex items-start gap-4">
                      {/* Note Icon */}
                      <div className="w-16 h-16 bg-info rounded-lg flex items-center justify-center">
                        <FileText className="w-8 h-8 text-white" />
                      </div>

                      {/* Content */}
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-2">{note.title}</h3>
                        
                        {note.description && (
                          <p className="text-muted-foreground mb-3 line-clamp-2">{note.description}</p>
                        )}
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                          {(note.subjects as any)?.name && (
                            <span>📖 {(note.subjects as any).name}</span>
                          )}
                          <span>📄 {formatFileSize(note.file_size)}</span>
                          <span>⬇️ {note.download_count} downloads</span>
                          <span>📅 {new Date(note.created_at).toLocaleDateString()}</span>
                        </div>

                        <div className="flex gap-2">
                          <Button 
                            variant="study" 
                            size="default"
                            onClick={() => handleDownload(note.id, note.file_url)}
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Download PDF
                          </Button>
                          <Button variant="outline" size="default" asChild>
                            <a href={note.file_url} target="_blank" rel="noopener noreferrer">
                              <Eye className="w-4 h-4 mr-2" />
                              Preview
                            </a>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="questions">
            <div className="space-y-4">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : filteredQuestions.length === 0 ? (
                <div className="text-center py-16">
                  <HelpCircle className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-xl font-semibold mb-2">No question papers found</h3>
                  <p className="text-muted-foreground">
                    {searchQuery ? 'Try adjusting your search query' : 'No question papers have been uploaded yet'}
                  </p>
                </div>
              ) : (
                filteredQuestions.map((question) => (
                  <div
                    key={question.id}
                    className="gradient-card rounded-xl p-6 border border-border hover:border-primary/50 transition-all duration-300"
                  >
                    <div className="flex items-start gap-4">
                      {/* Question Icon */}
                      <div className="w-16 h-16 bg-warning rounded-lg flex items-center justify-center">
                        <HelpCircle className="w-8 h-8 text-white" />
                      </div>

                      {/* Content */}
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-2">{question.title}</h3>
                        
                        {question.description && (
                          <p className="text-muted-foreground mb-3 line-clamp-2">{question.description}</p>
                        )}
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                          {(question.subjects as any)?.name && (
                            <span>📖 {(question.subjects as any).name}</span>
                          )}
                          <span>📄 {formatFileSize(question.file_size)}</span>
                          <span>⬇️ {question.download_count} downloads</span>
                          <span>📅 {new Date(question.created_at).toLocaleDateString()}</span>
                        </div>

                        <div className="flex gap-2">
                          <Button 
                            variant="study" 
                            size="default"
                            onClick={() => handleDownload(question.id, question.file_url)}
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Download PDF
                          </Button>
                          <Button variant="outline" size="default" asChild>
                            <a href={question.file_url} target="_blank" rel="noopener noreferrer">
                              <Eye className="w-4 h-4 mr-2" />
                              Preview
                            </a>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Bottom Navigation */}
      <Navigation />
    </div>
  );
};

export default Lectures;