import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Plus, Book, PlayCircle, Users, Calendar, Edit, Trash2 } from 'lucide-react';

interface Batch {
  id: string;
  name: string;
  description: string;
  thumbnail_url: string;
  price: number;
  duration_weeks: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
}

interface Subject {
  id: string;
  batch_id: string;
  name: string;
  description: string;
  order_index: number;
}

interface Lecture {
  id: string;
  subject_id: string;
  title: string;
  description: string;
  video_url: string;
  duration_minutes: number;
  order_index: number;
  is_free: boolean;
}

const BatchManagement = () => {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [subjects, setSubjects] = useState<{ [key: string]: Subject[] }>({});
  const [lectures, setLectures] = useState<{ [key: string]: Lecture[] }>({});
  const [selectedBatch, setSelectedBatch] = useState<string | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [isCreateBatchOpen, setIsCreateBatchOpen] = useState(false);
  const [isCreateSubjectOpen, setIsCreateSubjectOpen] = useState(false);
  const [isCreateLectureOpen, setIsCreateLectureOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const [batchForm, setBatchForm] = useState({
    name: '',
    description: '',
    thumbnail_url: '',
    price: '',
    duration_weeks: '',
    start_date: '',
    end_date: ''
  });

  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [batchToDelete, setBatchToDelete] = useState<string | null>(null);
  const [editingSubject, setEditingSubject] = useState<{ batchId: string; subjectId: string; name: string } | null>(null);
  const [subjectToDelete, setSubjectToDelete] = useState<{ batchId: string; subjectId: string; name: string } | null>(null);

  const [subjectForm, setSubjectForm] = useState({
    name: '',
    description: ''
  });

  const [lectureForm, setLectureForm] = useState({
    title: '',
    description: '',
    video_url: '',
    duration_minutes: '',
    is_free: false
  });

  useEffect(() => {
    fetchBatches();
  }, []);

  const fetchBatches = async () => {
    try {
      const { data, error } = await supabase
        .from('batches')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBatches(data || []);

      // Fetch subjects for all batches
      const { data: subjectsData, error: subjectsError } = await supabase
        .from('subjects')
        .select('*')
        .order('order_index');

      if (subjectsError) throw subjectsError;

      // Group subjects by batch_id
      const groupedSubjects: { [key: string]: Subject[] } = {};
      subjectsData?.forEach(subject => {
        if (!groupedSubjects[subject.batch_id]) {
          groupedSubjects[subject.batch_id] = [];
        }
        groupedSubjects[subject.batch_id].push(subject);
      });
      setSubjects(groupedSubjects);

      // Fetch lectures for all subjects
      const { data: lecturesData, error: lecturesError } = await supabase
        .from('lectures')
        .select('*')
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

    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load batch data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const uploadThumbnail = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random()}.${fileExt}`;
    const filePath = fileName;

    const { error: uploadError } = await supabase.storage
      .from('batch-thumbnails')
      .upload(filePath, file);

    if (uploadError) {
      throw uploadError;
    }

    const { data } = supabase.storage
      .from('batch-thumbnails')
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const createBatch = async () => {
    try {
      setUploading(true);
      let thumbnailUrl = batchForm.thumbnail_url;

      // Upload thumbnail file if selected
      if (thumbnailFile) {
        thumbnailUrl = await uploadThumbnail(thumbnailFile);
      }

      const { data, error } = await supabase
        .from('batches')
        .insert([{
          name: batchForm.name,
          description: batchForm.description,
          thumbnail_url: thumbnailUrl,
          price: parseInt(batchForm.price) * 100, // Convert to cents
          duration_weeks: parseInt(batchForm.duration_weeks),
          start_date: batchForm.start_date,
          end_date: batchForm.end_date
        }])
        .select();

      if (error) throw error;

      setBatches([data[0], ...batches]);
      setIsCreateBatchOpen(false);
      setBatchForm({
        name: '',
        description: '',
        thumbnail_url: '',
        price: '',
        duration_weeks: '',
        start_date: '',
        end_date: ''
      });
      setThumbnailFile(null);

      toast({
        title: 'Success',
        description: 'Batch created successfully',
      });
    } catch (error) {
      console.error('Error creating batch:', error);
      toast({
        title: 'Error',
        description: 'Failed to create batch',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const createSubject = async () => {
    if (!selectedBatch) return;

    try {
      const order_index = subjects[selectedBatch]?.length || 0;
      const { data, error } = await supabase
        .from('subjects')
        .insert([{
          batch_id: selectedBatch,
          name: subjectForm.name,
          description: subjectForm.description,
          order_index
        }])
        .select();

      if (error) throw error;

      setSubjects({
        ...subjects,
        [selectedBatch]: [...(subjects[selectedBatch] || []), data[0]]
      });

      setIsCreateSubjectOpen(false);
      setSubjectForm({ name: '', description: '' });

      toast({
        title: 'Success',
        description: 'Subject created successfully',
      });
    } catch (error) {
      console.error('Error creating subject:', error);
      toast({
        title: 'Error',
        description: 'Failed to create subject',
        variant: 'destructive',
      });
    }
  };

  const createLecture = async () => {
    if (!selectedSubject) return;

    try {
      const order_index = lectures[selectedSubject]?.length || 0;
      const { data, error } = await supabase
        .from('lectures')
        .insert([{
          subject_id: selectedSubject,
          title: lectureForm.title,
          description: lectureForm.description,
          video_url: lectureForm.video_url,
          duration_minutes: parseInt(lectureForm.duration_minutes),
          order_index,
          is_free: lectureForm.is_free
        }])
        .select();

      if (error) throw error;

      setLectures({
        ...lectures,
        [selectedSubject]: [...(lectures[selectedSubject] || []), data[0]]
      });

      setIsCreateLectureOpen(false);
      setLectureForm({
        title: '',
        description: '',
        video_url: '',
        duration_minutes: '',
        is_free: false
      });

      toast({
        title: 'Success',
        description: 'Lecture created successfully',
      });
    } catch (error) {
      console.error('Error creating lecture:', error);
      toast({
        title: 'Error',
        description: 'Failed to create lecture',
        variant: 'destructive',
      });
    }
  };

  const deleteBatch = async () => {
    if (!batchToDelete) return;
    
    try {
      // Delete related lectures first
      const subjectsToDelete = subjects[batchToDelete] || [];
      for (const subject of subjectsToDelete) {
        const { error: lecturesError } = await supabase
          .from('lectures')
          .delete()
          .eq('subject_id', subject.id);
        
        if (lecturesError) throw lecturesError;
      }
      
      // Delete related subjects
      const { error: subjectsError } = await supabase
        .from('subjects')
        .delete()
        .eq('batch_id', batchToDelete);
      
      if (subjectsError) throw subjectsError;
      
      // Delete the batch
      const { error } = await supabase
        .from('batches')
        .delete()
        .eq('id', batchToDelete);

      if (error) throw error;

      // Update local state
      setBatches(batches.filter(batch => batch.id !== batchToDelete));
      
      // Clean up subjects and lectures state
      const newSubjects = { ...subjects };
      delete newSubjects[batchToDelete];
      setSubjects(newSubjects);
      
      const newLectures = { ...lectures };
      subjectsToDelete.forEach(subject => {
        delete newLectures[subject.id];
      });
      setLectures(newLectures);

      setIsDeleteDialogOpen(false);
      setBatchToDelete(null);

      toast({
        title: 'Success',
        description: 'Batch deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting batch:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete batch',
        variant: 'destructive',
      });
    }
  };

  const updateSubjectName = async () => {
    if (!editingSubject) return;
    
    try {
      const { error } = await supabase
        .from('subjects')
        .update({ name: editingSubject.name })
        .eq('id', editingSubject.subjectId);

      if (error) throw error;

      // Update local state
      setSubjects(prev => ({
        ...prev,
        [editingSubject.batchId]: prev[editingSubject.batchId].map(subject =>
          subject.id === editingSubject.subjectId 
            ? { ...subject, name: editingSubject.name }
            : subject
        )
      }));

      setEditingSubject(null);

      toast({
        title: 'Success',
        description: 'Subject name updated successfully',
      });
    } catch (error) {
      console.error('Error updating subject:', error);
      toast({
        title: 'Error',
        description: 'Failed to update subject name',
        variant: 'destructive',
      });
    }
  };

  const deleteSubject = async () => {
    if (!subjectToDelete) return;
    
    try {
      // Delete related lectures first
      const subjectLectures = lectures[subjectToDelete.subjectId] || [];
      if (subjectLectures.length > 0) {
        const { error: lecturesError } = await supabase
          .from('lectures')
          .delete()
          .eq('subject_id', subjectToDelete.subjectId);
        
        if (lecturesError) throw lecturesError;
      }
      
      // Delete the subject
      const { error } = await supabase
        .from('subjects')
        .delete()
        .eq('id', subjectToDelete.subjectId);

      if (error) throw error;

      // Update local state
      setSubjects(prev => ({
        ...prev,
        [subjectToDelete.batchId]: prev[subjectToDelete.batchId].filter(
          subject => subject.id !== subjectToDelete.subjectId
        )
      }));
      
      // Clean up lectures state
      const newLectures = { ...lectures };
      delete newLectures[subjectToDelete.subjectId];
      setLectures(newLectures);

      setSubjectToDelete(null);

      toast({
        title: 'Success',
        description: 'Subject deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting subject:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete subject',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return <div className="text-center">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Create Batch Button */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Batch Management</h2>
        <Dialog open={isCreateBatchOpen} onOpenChange={setIsCreateBatchOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Create Batch
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Batch</DialogTitle>
              <DialogDescription>Add a new batch to your course catalog</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Batch Name</Label>
                <Input
                  id="name"
                  value={batchForm.name}
                  onChange={(e) => setBatchForm({ ...batchForm, name: e.target.value })}
                  placeholder="Enter batch name"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={batchForm.description}
                  onChange={(e) => setBatchForm({ ...batchForm, description: e.target.value })}
                  placeholder="Batch description"
                />
              </div>
              <div>
                <Label htmlFor="thumbnail">Thumbnail</Label>
                <div className="space-y-2">
                  <Input
                    id="thumbnail_file"
                    type="file"
                    accept="image/*"
                    onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)}
                    className="cursor-pointer"
                  />
                  <div className="text-xs text-muted-foreground">Or provide URL below:</div>
                  <Input
                    id="thumbnail_url"
                    value={batchForm.thumbnail_url}
                    onChange={(e) => setBatchForm({ ...batchForm, thumbnail_url: e.target.value })}
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="price">Price (₹)</Label>
                  <Input
                    id="price"
                    type="number"
                    value={batchForm.price}
                    onChange={(e) => setBatchForm({ ...batchForm, price: e.target.value })}
                    placeholder="999"
                  />
                </div>
                <div>
                  <Label htmlFor="duration">Duration (weeks)</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={batchForm.duration_weeks}
                    onChange={(e) => setBatchForm({ ...batchForm, duration_weeks: e.target.value })}
                    placeholder="12"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start_date">Start Date</Label>
                  <Input
                    id="start_date"
                    type="date"
                    value={batchForm.start_date}
                    onChange={(e) => setBatchForm({ ...batchForm, start_date: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="end_date">End Date</Label>
                  <Input
                    id="end_date"
                    type="date"
                    value={batchForm.end_date}
                    onChange={(e) => setBatchForm({ ...batchForm, end_date: e.target.value })}
                  />
                </div>
              </div>
              <Button 
                onClick={createBatch} 
                className="w-full"
                disabled={uploading}
              >
                {uploading ? 'Creating...' : 'Create Batch'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Batches List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {batches.map((batch) => (
          <Card key={batch.id} className="overflow-hidden">
            <div className="aspect-video bg-muted relative">
              {batch.thumbnail_url ? (
                <img
                  src={batch.thumbnail_url}
                  alt={batch.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Book className="h-12 w-12 text-muted-foreground" />
                </div>
              )}
            </div>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">{batch.name}</CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant={batch.is_active ? 'default' : 'secondary'}>
                    {batch.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setBatchToDelete(batch.id);
                      setIsDeleteDialogOpen(true);
                    }}
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <CardDescription className="text-sm line-clamp-2">
                {batch.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>₹{(batch.price / 100).toFixed(2)}</span>
                <span>{batch.duration_weeks} weeks</span>
              </div>
              
              <Separator />
              
              {/* Subjects Section */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <h4 className="font-semibold text-sm flex items-center gap-1">
                    <Book className="h-4 w-4" />
                    Subjects ({subjects[batch.id]?.length || 0})
                  </h4>
                  <Dialog open={isCreateSubjectOpen && selectedBatch === batch.id} onOpenChange={(open) => {
                    setIsCreateSubjectOpen(open);
                    if (open) setSelectedBatch(batch.id);
                  }}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" onClick={() => setSelectedBatch(batch.id)}>
                        <Plus className="h-3 w-3" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <DialogHeader>
                        <DialogTitle>Add Subject</DialogTitle>
                        <DialogDescription>Add a new subject to {batch.name}</DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="subject_name">Subject Name</Label>
                          <Input
                            id="subject_name"
                            value={subjectForm.name}
                            onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })}
                            placeholder="Enter subject name"
                          />
                        </div>
                        <div>
                          <Label htmlFor="subject_description">Description</Label>
                          <Textarea
                            id="subject_description"
                            value={subjectForm.description}
                            onChange={(e) => setSubjectForm({ ...subjectForm, description: e.target.value })}
                            placeholder="Subject description"
                          />
                        </div>
                        <Button onClick={createSubject} className="w-full">
                          Add Subject
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
                
                 <div className="space-y-1 max-h-32 overflow-y-auto">
                   {subjects[batch.id]?.map((subject) => (
                     <div key={subject.id} className="p-2 bg-muted rounded-lg">
                       <div className="flex justify-between items-center">
                         <div className="flex items-center gap-2 flex-1">
                           <span className="font-medium text-sm">{subject.name}</span>
                           <Button
                             variant="ghost"
                             size="sm"
                             onClick={() => setEditingSubject({
                               batchId: batch.id,
                               subjectId: subject.id,
                               name: subject.name
                             })}
                             className="h-5 w-5 p-0"
                           >
                             <Edit className="h-3 w-3" />
                           </Button>
                         </div>
                         <div className="flex items-center gap-2">
                           <span className="text-xs text-muted-foreground">
                             {lectures[subject.id]?.length || 0} lectures
                           </span>
                           <Button
                             variant="ghost"
                             size="sm"
                             onClick={() => setSubjectToDelete({
                               batchId: batch.id,
                               subjectId: subject.id,
                               name: subject.name
                             })}
                             className="h-5 w-5 p-0 text-destructive hover:text-destructive"
                           >
                             <Trash2 className="h-3 w-3" />
                           </Button>
                          <Dialog open={isCreateLectureOpen && selectedSubject === subject.id} onOpenChange={(open) => {
                            setIsCreateLectureOpen(open);
                            if (open) setSelectedSubject(subject.id);
                          }}>
                            <DialogTrigger asChild>
                              <Button variant="ghost" size="sm" onClick={() => setSelectedSubject(subject.id)}>
                                <Plus className="h-3 w-3" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>Add Lecture</DialogTitle>
                                <DialogDescription>Add a new lecture to {subject.name}</DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <Label htmlFor="lecture_title">Lecture Title</Label>
                                  <Input
                                    id="lecture_title"
                                    value={lectureForm.title}
                                    onChange={(e) => setLectureForm({ ...lectureForm, title: e.target.value })}
                                    placeholder="Enter lecture title"
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="lecture_description">Description</Label>
                                  <Textarea
                                    id="lecture_description"
                                    value={lectureForm.description}
                                    onChange={(e) => setLectureForm({ ...lectureForm, description: e.target.value })}
                                    placeholder="Lecture description"
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="video_url">Video URL</Label>
                                  <Input
                                    id="video_url"
                                    value={lectureForm.video_url}
                                    onChange={(e) => setLectureForm({ ...lectureForm, video_url: e.target.value })}
                                    placeholder="https://youtube.com/watch?v=..."
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="duration">Duration (minutes)</Label>
                                  <Input
                                    id="duration"
                                    type="number"
                                    value={lectureForm.duration_minutes}
                                    onChange={(e) => setLectureForm({ ...lectureForm, duration_minutes: e.target.value })}
                                    placeholder="45"
                                  />
                                </div>
                                <div className="flex items-center space-x-2">
                                  <input
                                    type="checkbox"
                                    id="is_free"
                                    checked={lectureForm.is_free}
                                    onChange={(e) => setLectureForm({ ...lectureForm, is_free: e.target.checked })}
                                  />
                                  <Label htmlFor="is_free">Free Preview</Label>
                                </div>
                                <Button onClick={createLecture} className="w-full">
                                  Add Lecture
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>
                      
                      {/* Lectures List */}
                      <div className="mt-2 space-y-1">
                        {lectures[subject.id]?.map((lecture) => (
                          <div key={lecture.id} className="flex justify-between items-center p-1 text-xs">
                            <div className="flex items-center gap-1">
                              <PlayCircle className="h-3 w-3" />
                              <span>{lecture.title}</span>
                              {lecture.is_free && <Badge variant="secondary" className="text-xs">Free</Badge>}
                            </div>
                            <span className="text-muted-foreground">
                              {lecture.duration_minutes}min
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Batch</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this batch? This action cannot be undone and will also delete all subjects and lectures associated with this batch.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 mt-6">
            <Button
              variant="outline"
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setBatchToDelete(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="outline"
              onClick={deleteBatch}
              className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Subject Name Dialog */}
      <Dialog open={!!editingSubject} onOpenChange={() => setEditingSubject(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Subject Name</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              value={editingSubject?.name || ''}
              onChange={(e) => setEditingSubject(prev => 
                prev ? { ...prev, name: e.target.value } : null
              )}
              placeholder="Subject name"
            />
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setEditingSubject(null)}
              >
                Cancel
              </Button>
              <Button onClick={updateSubjectName}>
                Update
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Subject Confirmation Dialog */}
      <Dialog open={!!subjectToDelete} onOpenChange={() => setSubjectToDelete(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Subject</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{subjectToDelete?.name}"? This action cannot be undone and will also delete all lectures in this subject.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 mt-6">
            <Button
              variant="outline"
              onClick={() => setSubjectToDelete(null)}
            >
              Cancel
            </Button>
            <Button
              variant="outline"
              onClick={deleteSubject}
              className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BatchManagement;