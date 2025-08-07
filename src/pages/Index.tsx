import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Heart, User, LogOut, Shield, Play, Clock, Users } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import BatchCard from "@/components/BatchCard";
import heroBanner from "@/assets/hero-banner.jpg";
import { useToast } from "@/hooks/use-toast";

interface Batch {
  id: string;
  name: string;
  description: string;
  thumbnail_url: string;
  price: number;
  duration_weeks: number;
  is_active: boolean;
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

const Index = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("All Batches");
  const [dbBatches, setDbBatches] = useState<Batch[]>([]);
  const [liveLectures, setLiveLectures] = useState<LiveLecture[]>([]);
  const [recentContent, setRecentContent] = useState<ContentUpload[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, userRole, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchBatches();
    fetchLiveLectures();
    fetchRecentContent();
  }, []);

  const fetchBatches = async () => {
    try {
      const { data, error } = await supabase
        .from('batches')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDbBatches(data || []);
    } catch (error) {
      console.error('Error fetching batches:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLiveLectures = async () => {
    try {
      const { data, error } = await supabase
        .from('live_lectures')
        .select(`
          *,
          subjects(name),
          batches(name)
        `)
        .eq('is_active', true)
        .order('is_live', { ascending: false })
        .order('scheduled_at', { ascending: false })
        .limit(3);

      if (error && !error.message.includes('relation "live_lectures" does not exist')) {
        throw error;
      }

      setLiveLectures(data || []);
    } catch (error) {
      console.error('Error fetching live lectures:', error);
    }
  };

  const fetchRecentContent = async () => {
    try {
      const { data, error } = await supabase
        .from('content_uploads')
        .select(`
          *,
          subjects(name),
          batches(name)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(4);

      if (error) {
        console.warn('Error fetching content uploads:', error);
        return;
      }

      setRecentContent(data || []);
    } catch (error) {
      console.error('Error fetching recent content:', error);
    }
  };

  const filters = ["All Batches", "Class 9", "Class 10", "Class 11", "Class 12"];

  const batches = [
    {
      id: 1,
      title: "Commerce 11th",
      subtitle: "Commerce",
      image: heroBanner,
      tags: ["CBSE", "Enrollment Open"],
      stats: {
        lessons: "55+",
        resources: "100+", 
        support: "24/7"
      },
      isNew: false
    },
    {
      id: 2,
      title: "Aarambh 2026 ~ Class 10th",
      subtitle: "Aarambh",
      image: heroBanner,
      tags: ["CBSE", "Enrollment Open"],
      stats: {
        lessons: "55+",
        resources: "100+",
        support: "24/7"
      },
      isNew: true
    },
    {
      id: 3,
      title: "Science 11th (PCMB)",
      subtitle: "Science",
      image: heroBanner,
      tags: ["CBSE", "Enrollment Open"],
      stats: {
        lessons: "60+",
        resources: "120+",
        support: "24/7"
      },
      isNew: false
    },
    {
      id: 4,
      title: "Commerce 11th",
      subtitle: "Commerce", 
      image: heroBanner,
      tags: ["CBSE", "Enrollment Open"],
      stats: {
        lessons: "55+",
        resources: "100+",
        support: "24/7"
      },
      isNew: false
    }
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 bg-background/80 backdrop-blur-lg border-b border-border z-40">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold gradient-primary bg-clip-text text-transparent">
              🔴 PraveshCoderZ 🔴
            </h1>
            
            <div className="flex items-center gap-1 sm:gap-2">
              {user ? (
                <>
                  <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                    <User className="w-3 sm:w-4 h-3 sm:h-4" />
                    <span className="hidden md:inline truncate max-w-[100px]">Hello, {user.email}</span>
                    {userRole === 'admin' && (
                      <Badge variant="default" className="flex items-center gap-1 text-xs">
                        <Shield className="w-2 sm:w-3 h-2 sm:h-3" />
                        <span className="hidden sm:inline">Admin</span>
                      </Badge>
                    )}
                  </div>
                  {userRole === 'admin' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate('/admin')}
                      className="text-xs sm:text-sm px-2 sm:px-3"
                    >
                      <span className="hidden sm:inline">Admin Panel</span>
                      <span className="sm:hidden">Admin</span>
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={signOut}
                    className="px-2 sm:px-3"
                  >
                    <LogOut className="w-3 sm:w-4 h-3 sm:h-4" />
                  </Button>
                </>
              ) : (
                <Link to="/auth">
                  <Button variant="outline" size="sm" className="text-xs sm:text-sm px-2 sm:px-3">
                    Login
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Search Section */}
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <div className="relative mb-4 sm:mb-6">
          <Search className="absolute left-3 top-3 h-4 sm:h-5 w-4 sm:w-5 text-muted-foreground" />
          <Input
            placeholder="Search batches by class, stream or title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 sm:pl-10 bg-muted border-border rounded-full h-10 sm:h-12 text-sm sm:text-base"
          />
        </div>

        {/* Filter Buttons */}
        <div className="flex gap-2 overflow-x-auto hide-scrollbar mb-4 sm:mb-6 pb-2">
          {filters.map((filter) => (
            <Button
              key={filter}
              variant={activeFilter === filter ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveFilter(filter)}
              className="whitespace-nowrap rounded-full text-xs sm:text-sm px-3 sm:px-4"
            >
              {filter}
            </Button>
          ))}
        </div>

        {/* Live Lectures Section */}
        {liveLectures.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              <h2 className="text-lg font-semibold text-primary">Live & Upcoming Lectures</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {liveLectures.map((lecture) => (
                <Card key={lecture.id} className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-base line-clamp-2">{lecture.title}</CardTitle>
                      {lecture.is_live && (
                        <Badge variant="destructive" className="animate-pulse text-xs">
                          🔴 LIVE
                        </Badge>
                      )}
                    </div>
                    {lecture.description && (
                      <CardDescription className="text-sm line-clamp-2">
                        {lecture.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {lecture.subjects?.name || 'General'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {lecture.duration_minutes}m
                      </span>
                    </div>
                    <Button 
                      size="sm" 
                      className="w-full"
                      variant={lecture.is_live ? "default" : "outline"}
                      onClick={() => {
                        if (user) {
                          window.open(lecture.live_url, '_blank');
                          toast({
                            title: lecture.is_live ? "Joining Live Lecture" : "Opening Lecture",
                            description: `Opening ${lecture.title}`,
                          });
                        } else {
                          navigate('/auth');
                        }
                      }}
                    >
                      <Play className="w-3 h-3 mr-1" />
                      {lecture.is_live ? 'Join Live' : 'Watch'}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Loved Batches Section */}
        <div className="mb-4 sm:mb-6">
          <div className="flex items-center gap-2 mb-3 sm:mb-4">
            <Heart className="w-4 sm:w-5 h-4 sm:h-5 text-destructive fill-current" />
            <h2 className="text-base sm:text-lg font-semibold text-purple">Available Batches</h2>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Loading batches...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {/* Database Batches */}
              {dbBatches.map((batch) => (
                <BatchCard 
                  key={`db-${batch.id}`} 
                  batch={{
                    id: batch.id, // Keep original UUID
                    title: batch.name,
                    subtitle: `₹${(batch.price / 100).toFixed(2)}`,
                    image: batch.thumbnail_url,
                    tags: ["Live Classes", "Enrollment Open"],
                    stats: {
                      lessons: "50+",
                      resources: "100+",
                      support: "24/7"
                    },
                    isNew: false
                  }} 
                />
              ))}
              
              {/* Static Batches (fallback) */}
              {dbBatches.length === 0 && batches.map((batch) => (
                <BatchCard key={batch.id} batch={batch} />
              ))}
            </div>
          )}
        </div>

        {/* Recent Practice Content Section */}
        {recentContent.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-primary">Latest Study Materials</h2>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate('/practice')}
              >
                View All
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recentContent.map((content) => (
                <Card key={content.id} className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-base line-clamp-2">{content.title}</CardTitle>
                      <Badge variant={content.content_type === 'notes' ? 'secondary' : 'outline'} className="text-xs">
                        {content.content_type === 'notes' ? '📚 Notes' : '❓ Questions'}
                      </Badge>
                    </div>
                    {content.description && (
                      <CardDescription className="text-sm line-clamp-2">
                        {content.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                      <span>{content.subjects?.name || 'General'}</span>
                      <span>{content.pages_count} pages</span>
                      <span>{(content.file_size / 1024 / 1024).toFixed(1)} MB</span>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        if (user) {
                          navigate('/practice');
                        } else {
                          navigate('/auth');
                        }
                      }}
                    >
                      {content.content_type === 'notes' ? '📖 Read Notes' : '📝 View Questions'}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Practice Zone Button */}
        <div className="fixed bottom-20 sm:bottom-24 right-3 sm:right-4 z-30">
          <Button 
            variant="secondary" 
            size="sm"
            className="rounded-full shadow-lg hover:shadow-xl text-xs sm:text-sm px-3 sm:px-4"
            onClick={() => {
              if (user) {
                navigate('/practice');
              } else {
                navigate('/auth');
              }
            }}
          >
            🎯 Practice Zone
          </Button>
        </div>
      </div>

      {/* Bottom Navigation */}
      <Navigation />
    </div>
  );
};

export default Index;
