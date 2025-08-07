import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Play, FileText, Search } from "lucide-react";
import Navigation from "@/components/Navigation";

const Lectures = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const lectures = [
    {
      id: 1,
      title: "Chemical Reactions L1",
      subject: "Chemistry",
      thumbnail: "/placeholder.svg",
      duration: "45 min",
      views: "2.3k",
      difficulty: "Beginner"
    },
    {
      id: 2,
      title: "Chemical Reactions L2",
      subject: "Chemistry", 
      thumbnail: "/placeholder.svg",
      duration: "50 min",
      views: "1.8k",
      difficulty: "Intermediate"
    },
    {
      id: 3,
      title: "Chemical Reactions L3",
      subject: "Chemistry",
      thumbnail: "/placeholder.svg", 
      duration: "55 min",
      views: "1.5k",
      difficulty: "Advanced"
    }
  ];

  const notes = [
    {
      id: 1,
      title: "Chemical Reactions - Complete Notes",
      subject: "Chemistry",
      pages: "24 pages",
      downloads: "5.2k"
    },
    {
      id: 2,
      title: "Organic Chemistry Basics",
      subject: "Chemistry",
      pages: "18 pages", 
      downloads: "3.8k"
    }
  ];

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

        {/* Tabs for Videos and Notes */}
        <Tabs defaultValue="videos" className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-6">
            <TabsTrigger value="videos" className="flex items-center gap-2">
              <Play className="w-4 h-4" />
              Videos
            </TabsTrigger>
            <TabsTrigger value="notes" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Notes
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
                        <Button variant="study" size="default" className="w-full sm:w-auto">
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
              {notes.map((note) => (
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
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                        <span>{note.pages}</span>
                        <span>{note.downloads} downloads</span>
                      </div>

                      <div className="flex gap-2">
                        <Button variant="study" size="default">
                          Download PDF
                        </Button>
                        <Button variant="outline" size="default">
                          Preview
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
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