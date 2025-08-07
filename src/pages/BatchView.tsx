import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import VideoPlayer from '@/components/VideoPlayer';
import Navigation from '@/components/Navigation';
import { ArrowLeft, Play, BookOpen, Clock, Users, Star } from 'lucide-react';

interface Batch {
  id: string;
  name: string;
  description: string;
  thumbnail_url: string;
  price: number;
  duration_weeks: number;
  is_active: boolean;
}

interface Subject {
  id: string;
  name: string;
  description: string;
  order_index: number;
}

interface Lecture {
  id: string;
  title: string;
  description: string;
  video_url: string;
  duration_minutes: number;
  is_free: boolean;
  order_index: number;
}

const BatchView = () => {
  const { batchId } = useParams<{ batchId: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  
  const [batch, setBatch] = useState<Batch | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [lectures, setLectures] = useState<{ [key: string]: Lecture[] }>({});
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [selectedLecture, setSelectedLecture] = useState<Lecture | null>(null);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);

  // Redirect to auth if user is not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
      return;
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (batchId && user) {
      fetchBatchData();
      checkEnrollment();
    }
  }, [batchId, user]);

  const fetchBatchData = async () => {
    try {
      // Fetch batch details
      const { data: batchData, error: batchError } = await supabase
        .from('batches')
        .select('*')
        .eq('id', batchId)
        .single();

      if (batchError) throw batchError;
      setBatch(batchData);

      // Fetch subjects
      const { data: subjectsData, error: subjectsError } = await supabase
        .from('subjects')
        .select('*')
        .eq('batch_id', batchId)
        .order('order_index');

      if (subjectsError) throw subjectsError;
      setSubjects(subjectsData || []);

      // Fetch lectures for all subjects
      if (subjectsData && subjectsData.length > 0) {
        const { data: lecturesData, error: lecturesError } = await supabase
          .from('lectures')
          .select('*')
          .in('subject_id', subjectsData.map(s => s.id))
          .order('order_index');

        if (lecturesError) throw lecturesError;

        // Group lectures by subject_id
        const groupedLectures: { [key: string]: Lecture[] } = {};
        lecturesData?.forEach(lecture => {
          if (!groupedLectures[lecture.subject_id]) {
            groupedLectures[lecture.subject_id] = [];
          }
          groupedLectures[lecture.subject_id].push(lecture);
        });
        setLectures(groupedLectures);
      }
    } catch (error) {
      console.error('Error fetching batch data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load batch data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const checkEnrollment = async () => {
    if (!user || !batchId) return;

    try {
      const { data, error } = await supabase
        .from('user_batches')
        .select('id')
        .eq('user_id', user.id)
        .eq('batch_id', batchId)
        .single();

      if (!error && data) {
        setIsEnrolled(true);
      }
    } catch (error) {
      // User not enrolled, which is fine
    }
  };

  const handleEnrollment = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }

    setEnrolling(true);
    try {
      const { error } = await supabase
        .from('user_batches')
        .insert([{
          user_id: user.id,
          batch_id: batchId
        }]);

      if (error) throw error;

      setIsEnrolled(true);
      toast({
        title: 'Success',
        description: 'Successfully enrolled in the batch!',
      });
    } catch (error) {
      console.error('Error enrolling:', error);
      toast({
        title: 'Error',
        description: 'Failed to enroll in batch',
        variant: 'destructive',
      });
    } finally {
      setEnrolling(false);
    }
  };

  const playLecture = (lecture: Lecture) => {
    if (!isEnrolled && !lecture.is_free) {
      toast({
        title: 'Enrollment Required',
        description: 'Please enroll in the batch to access this lecture',
        variant: 'destructive',
      });
      return;
    }
    setSelectedLecture(lecture);
  };

  // Show loading while checking auth or fetching data
  if (authLoading || loading || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!batch) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Batch not found</h2>
          <Button onClick={() => navigate('/')}>Go Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 bg-background/80 backdrop-blur-lg border-b border-border z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/')}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-xl font-bold gradient-primary bg-clip-text text-transparent">
              {batch.name}
            </h1>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {selectedLecture ? (
          // Video Player View
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedLecture(null);
                  // Don't reset selectedSubject to stay in lectures view
                }}
              >
                ← Back to Lectures
              </Button>
            </div>
            
            <VideoPlayer 
              videoUrl={selectedLecture.video_url}
              title={selectedLecture.title}
              description={selectedLecture.description}
            />
          </div>
        ) : selectedSubject ? (
          // Lectures View for Selected Subject
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                onClick={() => setSelectedSubject(null)}
              >
                ← Back to Subjects
              </Button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  {selectedSubject.name}
                </CardTitle>
                <CardDescription>{selectedSubject.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {lectures[selectedSubject.id]?.length ? (
                    lectures[selectedSubject.id].map((lecture) => (
                      <div
                        key={lecture.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                        onClick={() => playLecture(lecture)}
                      >
                        <div className="flex items-center gap-3">
                          <Play className="h-4 w-4 text-primary" />
                          <div>
                            <div className="font-medium">{lecture.title}</div>
                            <div className="text-sm text-muted-foreground">
                              {lecture.duration_minutes} min
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {lecture.is_free && (
                            <Badge variant="secondary">Free</Badge>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={!isEnrolled && !lecture.is_free}
                          >
                            {!isEnrolled && !lecture.is_free ? 'Enroll to Watch' : 'Play'}
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No lectures available for this subject yet.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          // Default View - Batch Info and Subjects List
          <div className="space-y-6">
            {/* Batch Info */}
            <Card className="overflow-hidden">
              <div className="aspect-video bg-muted relative">
                {batch.thumbnail_url ? (
                  <img
                    src={batch.thumbnail_url}
                    alt={batch.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <BookOpen className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
              </div>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-2xl">{batch.name}</CardTitle>
                    <CardDescription className="mt-2">
                      {batch.description}
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary">
                      ₹{(batch.price / 100).toFixed(2)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {batch.duration_weeks} weeks
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm">{batch.duration_weeks} weeks</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span className="text-sm">Live Classes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4" />
                    <span className="text-sm">Expert Faculty</span>
                  </div>
                </div>
                
                {!isEnrolled ? (
                  <Button
                    onClick={handleEnrollment}
                    disabled={enrolling}
                    className="w-full"
                  >
                    {enrolling ? 'Enrolling...' : `Enroll Now - ₹${(batch.price / 100).toFixed(2)}`}
                  </Button>
                ) : (
                  <Badge variant="default" className="w-full justify-center py-2">
                    ✅ Enrolled
                  </Badge>
                )}
              </CardContent>
            </Card>

            {/* Subjects List */}
            <div className="space-y-4">
              <h2 className="text-xl font-bold">Course Subjects</h2>
              
              {subjects.map((subject) => (
                <Card 
                  key={subject.id} 
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => setSelectedSubject(subject)}
                >
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-5 w-5" />
                        {subject.name}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{lectures[subject.id]?.length || 0} lectures</span>
                        <ArrowLeft className="h-4 w-4 rotate-180" />
                      </div>
                    </CardTitle>
                    <CardDescription>{subject.description}</CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>

      <Navigation />
    </div>
  );
};

export default BatchView;