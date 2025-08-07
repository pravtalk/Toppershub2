import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Heart, User, LogOut, Shield } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import BatchCard from "@/components/BatchCard";
import heroBanner from "@/assets/hero-banner.jpg";

interface Batch {
  id: string;
  name: string;
  description: string;
  thumbnail_url: string;
  price: number;
  duration_weeks: number;
  is_active: boolean;
}

const Index = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("All Batches");
  const [dbBatches, setDbBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, userRole, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchBatches();
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
