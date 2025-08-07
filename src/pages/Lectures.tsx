import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Play, Search, ArrowLeft } from "lucide-react";
import Navigation from "@/components/Navigation";
import VideoPlayer from "@/components/VideoPlayer";

const Lectures = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLecture, setSelectedLecture] = useState<any>(null);

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

        {/* Video Lectures Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Video Lectures</h2>
            <p className="text-sm text-muted-foreground">
              Watch comprehensive lectures to learn concepts
            </p>
          </div>
        </div>

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

          {/* Practice Zone CTA */}
          <div className="mt-8 p-6 bg-gradient-to-r from-primary/10 to-purple/10 rounded-xl border border-primary/20">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Looking for Study Notes & Practice Questions?</h3>
              <p className="text-muted-foreground mb-4">
                Access comprehensive study materials and practice questions in our dedicated Practice Zone
              </p>
              <Button 
                variant="default" 
                onClick={() => window.location.href = '/practice'}
                className="flex items-center gap-2"
              >
                🎯 Go to Practice Zone
              </Button>
            </div>
          </div>
      </div>

      {/* Bottom Navigation */}
      <Navigation />
    </div>
  );
};

export default Lectures;