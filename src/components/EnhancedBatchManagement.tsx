import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Plus, Book, PlayCircle, Users, Calendar, Edit, Trash2, FileText, Upload } from 'lucide-react';

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
  batch_type: 'lecture' | 'book';
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

interface BookItem {
  id: string;
  batch_id: string;
  title: string;
  description: string;
  pdf_url: string;
  order_index: number;
  is_free: boolean;
}

const EnhancedBatchManagement = () => {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [subjects, setSubjects] = useState<{ [key: string]: Subject[] }>({});
  const [lectures, setLectures] = useState<{ [key: string]: Lecture[] }>({});
  const [books, setBooks] = useState<{ [key: string]: BookItem[] }>({});
  const [selectedBatch, setSelectedBatch] = useState<string | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [isCreateBatchOpen, setIsCreateBatchOpen] = useState(false);
  const [isCreateSubjectOpen, setIsCreateSubjectOpen] = useState(false);
  const [isCreateLectureOpen, setIsCreateLectureOpen] = useState(false);
  const [isCreateBookOpen, setIsCreateBookOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const [batchForm, setBatchForm] = useState({
    name: '',
    description: '',
    thumbnail_url: '',
    price: '',
    duration_weeks: '',
    start_date: '',
    end_date: '',
    batch_type: 'lecture' as 'lecture' | 'book'
  });

  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [batchToDelete, setBatchToDelete] = useState<string | null>(null);
  const [editingSubject, setEditingSubject] = useState<{ batchId: string; subjectId: string; name: string } | null>(null);
  const [subjectToDelete, setSubjectToDelete] = useState<{ batchId: string; subjectId: string; name: string } | null>(null);
  const [editingLecture, setEditingLecture] = useState<{ subjectId: string; lectureId: string; title: string; video_url: string } | null>(null);

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

  const [bookForm, setBookForm] = useState({
    title: '',
    description: '',
    pdf_url: '',
    is_free: false
  });

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      // Fetch batches
      const { data: batchesData, error: batchesError } = await supabase
        .from('batches')
        .select('*')
        .order('created_at', { ascending: false });

      if (batchesError) throw batchesError;
      setBatches((batchesData || []) as Batch[]);

      // Fetch subjects for lecture-based batches
      const { data: subjectsData, error: subjectsError } = await supabase
        .from('subjects')
        .select('*')
        .order('order_index');

      if (subjectsError) throw subjectsError;

      const groupedSubjects: { [key: string]: Subject[] } = {};
      subjectsData?.forEach(subject => {
        if (!groupedSubjects[subject.batch_id]) {
          groupedSubjects[subject.batch_id] = [];
        }
        groupedSubjects[subject.batch_id].push(subject);
      });
      setSubjects(groupedSubjects);

      // Fetch lectures
      const { data: lecturesData, error: lecturesError } = await supabase
        .from('lectures')
        .select('*')
        .order('order_index');

      if (lecturesError) throw lecturesError;

      const groupedLectures: { [key: string]: Lecture[] } = {};
      lecturesData?.forEach(lecture => {
        if (!groupedLectures[lecture.subject_id]) {
          groupedLectures[lecture.subject_id] = [];
        }
        groupedLectures[lecture.subject_id].push(lecture);
      });
      setLectures(groupedLectures);

      // Fetch books for book-based batches
      const { data: booksData, error: booksError } = await supabase
        .from('books')
        .select('*')
        .order('order_index');

      if (booksError) throw booksError;

      const groupedBooks: { [key: string]: BookItem[] } = {};
      booksData?.forEach(book => {
        if (!groupedBooks[book.batch_id]) {
          groupedBooks[book.batch_id] = [];
        }
        groupedBooks[book.batch_id].push(book);
      });
      setBooks(groupedBooks);

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

  const uploadFile = async (file: File, bucket: string): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random()}.${fileExt}`;
    const filePath = fileName;

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, file);

    if (uploadError) {
      throw uploadError;
    }

    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const createBatch = async () => {
    try {
      setUploading(true);
      let thumbnailUrl = batchForm.thumbnail_url;

      if (thumbnailFile) {
        thumbnailUrl = await uploadFile(thumbnailFile, 'batch-thumbnails');
      }

      const { data, error } = await supabase
        .from('batches')
        .insert([{
          name: batchForm.name,
          description: batchForm.description,
          thumbnail_url: thumbnailUrl,
          price: batchForm.price ? Math.round(parseFloat(batchForm.price) * 100) : 0,
          duration_weeks: batchForm.duration_weeks ? parseInt(batchForm.duration_weeks) : null,
          start_date: batchForm.start_date || null,
          end_date: batchForm.end_date || null,
          batch_type: batchForm.batch_type
        }])
        .select();

      if (error) throw error;

      setBatches([data[0] as Batch, ...batches]);
      setIsCreateBatchOpen(false);
      setBatchForm({
        name: '',
        description: '',
        thumbnail_url: '',
        price: '',
        duration_weeks: '',
        start_date: '',
        end_date: '',
        batch_type: 'lecture'
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

  const createBook = async () => {
    if (!selectedBatch) return;

    try {
      setUploading(true);

      // Validate PDF source
      if (!pdfFile && !bookForm.pdf_url) {
        toast({ title: 'PDF required', description: 'Please upload a PDF or provide a PDF URL', variant: 'destructive' });
        setUploading(false);
        return;
      }
      if (pdfFile && pdfFile.type !== 'application/pdf') {
        toast({ title: 'Invalid file type', description: 'Only PDF files are allowed', variant: 'destructive' });
        setUploading(false);
        return;
      }
      if (!pdfFile && bookForm.pdf_url && !bookForm.pdf_url.toLowerCase().endsWith('.pdf')) {
        toast({ title: 'Invalid URL', description: 'The URL must point to a .pdf file', variant: 'destructive' });
        setUploading(false);
        return;
      }

      let pdfUrl = bookForm.pdf_url;

      if (pdfFile) {
        pdfUrl = await uploadFile(pdfFile, 'book-pdfs');
      }

      const order_index = books[selectedBatch]?.length || 0;
      const { data, error } = await supabase
        .from('books')
        .insert([{
          batch_id: selectedBatch,
          title: bookForm.title,
          description: bookForm.description,
          pdf_url: pdfUrl,
          order_index,
          is_free: bookForm.is_free
        }])
        .select();

      if (error) throw error;

      setBooks({
        ...books,
        [selectedBatch]: [...(books[selectedBatch] || []), data[0]]
      });

      setIsCreateBookOpen(false);
      setBookForm({
        title: '',
        description: '',
        pdf_url: '',
        is_free: false
      });
      setPdfFile(null);

      toast({
        title: 'Success',
        description: 'Book added successfully',
      });
    } catch (error) {
      console.error('Error creating book:', error);
      toast({
        title: 'Error',
        description: 'Failed to add book',
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

  const updateLecture = async () => {
    if (!editingLecture) return;
    try {
      const { error } = await supabase
        .from('lectures')
        .update({ title: editingLecture.title, video_url: editingLecture.video_url })
        .eq('id', editingLecture.lectureId);

      if (error) throw error;

      // Update local state
      setLectures(prev => ({
        ...prev,
        [editingLecture.subjectId]: prev[editingLecture.subjectId].map(l =>
          l.id === editingLecture.lectureId ? { ...l, title: editingLecture.title, video_url: editingLecture.video_url } : l
        )
      }));

      setEditingLecture(null);
      toast({ title: 'Success', description: 'Lecture updated successfully' });
    } catch (error) {
      console.error('Error updating lecture:', error);
      toast({ title: 'Error', description: 'Failed to update lecture', variant: 'destructive' });
    }
  };

  const deleteBatch = async () => {
    if (!batchToDelete) return;
    
    try {
      const batchToRemove = batches.find(b => b.id === batchToDelete);
      
      if (batchToRemove?.batch_type === 'lecture') {
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
      } else {
        // Delete related books
        const { error: booksError } = await supabase
          .from('books')
          .delete()
          .eq('batch_id', batchToDelete);
        
        if (booksError) throw booksError;
      }
      
      // Delete the batch
      const { error } = await supabase
        .from('batches')
        .delete()
        .eq('id', batchToDelete);

      if (error) throw error;

      // Update local state
      setBatches(batches.filter(batch => batch.id !== batchToDelete));
      
      // Clean up state
      const newSubjects = { ...subjects };
      delete newSubjects[batchToDelete];
      setSubjects(newSubjects);
      
      const newBooks = { ...books };
      delete newBooks[batchToDelete];
      setBooks(newBooks);

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
                <Label htmlFor="batch_type">Batch Type</Label>
                <Select
                  value={batchForm.batch_type}
                  onValueChange={(value: 'lecture' | 'book') => 
                    setBatchForm({ ...batchForm, batch_type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select batch type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lecture">Lecture-based (Subjects & Videos)</SelectItem>
                    <SelectItem value="book">Book-based (PDF Books)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
                  {batch.batch_type === 'book' ? (
                    <Book className="h-12 w-12 text-muted-foreground" />
                  ) : (
                    <PlayCircle className="h-12 w-12 text-muted-foreground" />
                  )}
                </div>
              )}
            </div>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">{batch.name}</CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant={batch.batch_type === 'book' ? 'default' : 'secondary'}>
                    {batch.batch_type === 'book' ? 'Books' : 'Lectures'}
                  </Badge>
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
              
              {/* Content Section - Books or Subjects */}
              {batch.batch_type === 'book' ? (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <h4 className="font-semibold text-sm flex items-center gap-1">
                      <FileText className="h-4 w-4" />
                      Books ({books[batch.id]?.length || 0})
                    </h4>
                    <Dialog open={isCreateBookOpen && selectedBatch === batch.id} onOpenChange={(open) => {
                      setIsCreateBookOpen(open);
                      if (open) setSelectedBatch(batch.id);
                    }}>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" onClick={() => setSelectedBatch(batch.id)}>
                          <Plus className="h-3 w-3" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>Add Book</DialogTitle>
                          <DialogDescription>Add a new book to {batch.name}</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="book_title">Book Title</Label>
                            <Input
                              id="book_title"
                              value={bookForm.title}
                              onChange={(e) => setBookForm({ ...bookForm, title: e.target.value })}
                              placeholder="Enter book title"
                            />
                          </div>
                          <div>
                            <Label htmlFor="book_description">Description</Label>
                            <Textarea
                              id="book_description"
                              value={bookForm.description}
                              onChange={(e) => setBookForm({ ...bookForm, description: e.target.value })}
                              placeholder="Book description"
                            />
                          </div>
                          <div>
                            <Label htmlFor="pdf_file">Upload PDF</Label>
                            <div className="space-y-2">
                              <Input
                                id="pdf_file"
                                type="file"
                                accept="application/pdf"
                                onChange={(e) => {
                                  const f = e.target.files?.[0] || null;
                                  if (f && f.type !== 'application/pdf') {
                                    toast({
                                      title: 'Invalid file type',
                                      description: 'Please upload a PDF file (.pdf) only',
                                      variant: 'destructive',
                                    });
                                    e.currentTarget.value = '';
                                    setPdfFile(null);
                                    return;
                                  }
                                  setPdfFile(f);
                                }}
                                className="cursor-pointer"
                              />
                              <div className="text-xs text-muted-foreground">Or provide URL below:</div>
                              <Input
                                id="pdf_url"
                                value={bookForm.pdf_url}
                                onChange={(e) => setBookForm({ ...bookForm, pdf_url: e.target.value })}
                                placeholder="https://example.com/book.pdf"
                              />
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id="book_is_free"
                              checked={bookForm.is_free}
                              onChange={(e) => setBookForm({ ...bookForm, is_free: e.target.checked })}
                            />
                            <Label htmlFor="book_is_free">Free Preview</Label>
                          </div>
                          <Button onClick={createBook} className="w-full" disabled={uploading}>
                            {uploading ? 'Adding...' : 'Add Book'}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                  
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {books[batch.id]?.map((book) => (
                      <div key={book.id} className="p-2 bg-muted rounded-lg">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2 flex-1">
                            <FileText className="h-3 w-3" />
                            <span className="font-medium text-sm">{book.title}</span>
                            {book.is_free && <Badge variant="secondary" className="text-xs">Free</Badge>}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => book.pdf_url && window.open(book.pdf_url, '_blank')}
                            className="h-5 w-5 p-0"
                          >
                            <Upload className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                     ))}
                  </div>
                </div>
              ) : (
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
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">
                              {lectures[subject.id]?.length || 0} lectures
                            </span>
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
                              <div className="flex items-center gap-2">
                                <span className="text-muted-foreground">
                                  {lecture.duration_minutes}min
                                </span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-5 w-5 p-0"
                                  onClick={() => setEditingLecture({ subjectId: subject.id, lectureId: lecture.id, title: lecture.title, video_url: lecture.video_url || '' })}
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
              Are you sure you want to delete this batch? This action cannot be undone and will also delete all associated content.
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

      {/* Edit Lecture Dialog */}
      <Dialog open={!!editingLecture} onOpenChange={(open) => !open && setEditingLecture(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Lecture</DialogTitle>
            <DialogDescription>Update lecture title and video link</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit_lecture_title">Title</Label>
              <Input
                id="edit_lecture_title"
                value={editingLecture?.title || ''}
                onChange={(e) => setEditingLecture(prev => prev ? { ...prev, title: e.target.value } : prev)}
                placeholder="Enter lecture title"
              />
            </div>
            <div>
              <Label htmlFor="edit_video_url">Video URL</Label>
              <Input
                id="edit_video_url"
                value={editingLecture?.video_url || ''}
                onChange={(e) => setEditingLecture(prev => prev ? { ...prev, video_url: e.target.value } : prev)}
                placeholder="https://youtube.com/watch?v=..."
              />
            </div>
            <Button onClick={updateLecture} className="w-full">Save Changes</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EnhancedBatchManagement;
