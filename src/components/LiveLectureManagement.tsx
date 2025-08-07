import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { CalendarIcon, Plus, Edit, Trash2, Play, Clock, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface LiveLecture {
  id: string;
  title: string;
  description: string;
  subject_id: string;
  batch_id: string;
  live_url: string;
  scheduled_at: string;
  duration_minutes: number;
  is_live: boolean;
  is_active: boolean;
  max_participants: number;
  created_at: string;
  subjects?: { name: string };
  batches?: { name: string };
}

interface Subject {
  id: string;
  name: string;
}

interface Batch {
  id: string;
  name: string;
}

const LiveLectureManagement = () => {
  const [liveLectures, setLiveLectures] = useState<LiveLecture[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [editingLecture, setEditingLecture] = useState<LiveLecture | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    subject_id: '',
    batch_id: '',
    live_url: '',
    scheduled_at: new Date(),
    duration_minutes: 90,
    is_live: false,
    is_active: true,
    max_participants: 100,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch live lectures
      const { data: lecturesData, error: lecturesError } = await supabase
        .from('live_lectures')
        .select(`
          *,
          subjects(name),
          batches(name)
        `)
        .order('created_at', { ascending: false });

      if (lecturesError && !lecturesError.message.includes('relation "live_lectures" does not exist')) {
        throw lecturesError;
      }

      // Fetch subjects
      const { data: subjectsData, error: subjectsError } = await supabase
        .from('subjects')
        .select('*')
        .order('name');

      if (subjectsError) throw subjectsError;

      // Fetch batches
      const { data: batchesData, error: batchesError } = await supabase
        .from('batches')
        .select('*')
        .order('name');

      if (batchesError) throw batchesError;

      setLiveLectures(lecturesData || []);
      setSubjects(subjectsData || []);
      setBatches(batchesData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load live lecture data. Make sure the live_lectures table exists.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      subject_id: '',
      batch_id: '',
      live_url: '',
      scheduled_at: new Date(),
      duration_minutes: 90,
      is_live: false,
      is_active: true,
      max_participants: 100,
    });
    setEditingLecture(null);
    setIsCreating(false);
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.live_url) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    try {
      const lectureData = {
        ...formData,
        scheduled_at: formData.scheduled_at.toISOString(),
        created_by: (await supabase.auth.getUser()).data.user?.id,
      };

      if (editingLecture) {
        const { error } = await supabase
          .from('live_lectures')
          .update(lectureData)
          .eq('id', editingLecture.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Live lecture updated successfully!",
        });
      } else {
        const { error } = await supabase
          .from('live_lectures')
          .insert([lectureData]);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Live lecture created successfully!",
        });
      }

      resetForm();
      fetchData();
    } catch (error) {
      console.error('Error saving live lecture:', error);
      toast({
        title: "Error",
        description: "Failed to save live lecture. Make sure the live_lectures table exists.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (lecture: LiveLecture) => {
    setFormData({
      title: lecture.title,
      description: lecture.description || '',
      subject_id: lecture.subject_id || '',
      batch_id: lecture.batch_id || '',
      live_url: lecture.live_url,
      scheduled_at: new Date(lecture.scheduled_at),
      duration_minutes: lecture.duration_minutes,
      is_live: lecture.is_live,
      is_active: lecture.is_active,
      max_participants: lecture.max_participants || 100,
    });
    setEditingLecture(lecture);
    setIsCreating(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this live lecture?')) return;

    try {
      const { error } = await supabase
        .from('live_lectures')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Live lecture deleted successfully!",
      });

      fetchData();
    } catch (error) {
      console.error('Error deleting live lecture:', error);
      toast({
        title: "Error",
        description: "Failed to delete live lecture.",
        variant: "destructive",
      });
    }
  };

  const toggleLiveStatus = async (lecture: LiveLecture) => {
    try {
      const { error } = await supabase
        .from('live_lectures')
        .update({ is_live: !lecture.is_live })
        .eq('id', lecture.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Live lecture ${!lecture.is_live ? 'started' : 'stopped'}!`,
      });

      fetchData();
    } catch (error) {
      console.error('Error toggling live status:', error);
      toast({
        title: "Error",
        description: "Failed to update live status.",
        variant: "destructive",
      });
    }
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Live Lecture Management</h2>
          <p className="text-muted-foreground">Manage live lectures and streaming sessions</p>
        </div>
        <Button onClick={() => setIsCreating(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Live Lecture
        </Button>
      </div>

      {isCreating && (
        <Card>
          <CardHeader>
            <CardTitle>{editingLecture ? 'Edit Live Lecture' : 'Create New Live Lecture'}</CardTitle>
            <CardDescription>
              Set up a new live lecture session with streaming details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter lecture title"
                />
              </div>
              <div>
                <Label htmlFor="live_url">Live Stream URL *</Label>
                <Input
                  id="live_url"
                  value={formData.live_url}
                  onChange={(e) => setFormData({ ...formData, live_url: e.target.value })}
                  placeholder="https://youtube.com/watch?v=..."
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter lecture description"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="subject">Subject</Label>
                <Select value={formData.subject_id} onValueChange={(value) => setFormData({ ...formData, subject_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((subject) => (
                      <SelectItem key={subject.id} value={subject.id}>
                        {subject.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="batch">Batch</Label>
                <Select value={formData.batch_id} onValueChange={(value) => setFormData({ ...formData, batch_id: value })}>
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
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Scheduled Date & Time</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.scheduled_at && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.scheduled_at ? format(formData.scheduled_at, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.scheduled_at}
                      onSelect={(date) => date && setFormData({ ...formData, scheduled_at: date })}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label htmlFor="duration">Duration (minutes)</Label>
                <Input
                  id="duration"
                  type="number"
                  value={formData.duration_minutes}
                  onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) || 90 })}
                />
              </div>
              <div>
                <Label htmlFor="max_participants">Max Participants</Label>
                <Input
                  id="max_participants"
                  type="number"
                  value={formData.max_participants}
                  onChange={(e) => setFormData({ ...formData, max_participants: parseInt(e.target.value) || 100 })}
                />
              </div>
            </div>

            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_live"
                  checked={formData.is_live}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_live: checked })}
                />
                <Label htmlFor="is_live">Currently Live</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="is_active">Active</Label>
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSubmit}>
                {editingLecture ? 'Update' : 'Create'} Live Lecture
              </Button>
              <Button variant="outline" onClick={resetForm}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Live Lectures List */}
      <div className="space-y-4">
        {liveLectures.length > 0 ? (
          liveLectures.map((lecture) => (
            <Card key={lecture.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {lecture.title}
                      {lecture.is_live && (
                        <Badge variant="destructive" className="animate-pulse">
                          🔴 LIVE
                        </Badge>
                      )}
                      {!lecture.is_active && (
                        <Badge variant="secondary">INACTIVE</Badge>
                      )}
                    </CardTitle>
                    <CardDescription>{lecture.description}</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant={lecture.is_live ? "destructive" : "default"}
                      size="sm"
                      onClick={() => toggleLiveStatus(lecture)}
                    >
                      {lecture.is_live ? "Stop Live" : "Go Live"}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleEdit(lecture)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDelete(lecture.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Subject:</span> {lecture.subjects?.name || 'N/A'}
                  </div>
                  <div>
                    <span className="font-medium">Batch:</span> {lecture.batches?.name || 'N/A'}
                  </div>
                  <div>
                    <span className="font-medium">Duration:</span> {lecture.duration_minutes} min
                  </div>
                  <div>
                    <span className="font-medium">Max Participants:</span> {lecture.max_participants}
                  </div>
                </div>
                <div className="mt-2">
                  <span className="font-medium">Live URL:</span>{' '}
                  <a 
                    href={lecture.live_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline break-all"
                  >
                    {lecture.live_url}
                  </a>
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  Scheduled: {new Date(lecture.scheduled_at).toLocaleString()}
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="text-center py-8">
              <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Live Lectures</h3>
              <p className="text-muted-foreground mb-4">
                Create your first live lecture to start streaming sessions.
              </p>
              <Button onClick={() => setIsCreating(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Live Lecture
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default LiveLectureManagement;