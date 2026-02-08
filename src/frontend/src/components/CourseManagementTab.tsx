import { useState } from 'react';
import { useGetAllCoursesWithModules, useCreateCourse } from '../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Eye, Coins, Plus, AlertCircle, RefreshCw, ChevronDown, ChevronRight } from 'lucide-react';
import { type CourseWithModules, type CourseModuleWithQuestions } from '../backend';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

export default function CourseManagementTab() {
  const { data: courses, isLoading: loadingCourses, error: coursesError, refetch: refetchCourses } = useGetAllCoursesWithModules();
  const createCourse = useCreateCourse();

  const [previewCourse, setPreviewCourse] = useState<CourseWithModules | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());

  const [createForm, setCreateForm] = useState({
    title: '',
    description: '',
    category: '',
    initialModules: [] as CourseModuleWithQuestions[],
  });

  const [createFormErrors, setCreateFormErrors] = useState({
    title: '',
    description: '',
    category: '',
  });

  const toggleModuleExpanded = (key: string) => {
    setExpandedModules(prev => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  const validateCreateForm = (): boolean => {
    const errors = {
      title: '',
      description: '',
      category: '',
    };

    if (!createForm.title.trim()) {
      errors.title = 'Course title is required';
    }

    if (!createForm.description.trim()) {
      errors.description = 'Course description is required';
    }

    if (!createForm.category.trim()) {
      errors.category = 'Course category is required';
    }

    setCreateFormErrors(errors);
    return !errors.title && !errors.description && !errors.category;
  };

  const handleOpenCreateDialog = () => {
    setCreateForm({
      title: '',
      description: '',
      category: '',
      initialModules: [],
    });
    setCreateFormErrors({
      title: '',
      description: '',
      category: '',
    });
    setShowCreateDialog(true);
  };

  const handleCloseCreateDialog = () => {
    setShowCreateDialog(false);
    setCreateForm({
      title: '',
      description: '',
      category: '',
      initialModules: [],
    });
    setCreateFormErrors({
      title: '',
      description: '',
      category: '',
    });
  };

  const handleCreateCourse = async () => {
    if (!validateCreateForm()) {
      return;
    }

    try {
      await createCourse.mutateAsync({
        title: createForm.title,
        description: createForm.description,
        category: createForm.category,
        initialModules: createForm.initialModules.length > 0 ? createForm.initialModules : null,
      });

      handleCloseCreateDialog();
      await refetchCourses();
    } catch (error) {
      console.error('Failed to create course:', error);
    }
  };

  // Error state
  if (coursesError) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-[#6A5ACD]" />
            <CardTitle>Course Management</CardTitle>
          </div>
          <CardDescription>
            Manage course content with module-based organization. Each course supports up to 33 questions across all modules.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <div>
                <p className="font-semibold">Failed to load courses</p>
                <p className="text-sm mt-1">
                  {coursesError instanceof Error ? coursesError.message : 'An unknown error occurred'}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => refetchCourses()}
                className="ml-4"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-[#6A5ACD]" />
                <CardTitle>Course Management</CardTitle>
              </div>
              <CardDescription className="mt-2">
                View existing courses and create new ones. Each course supports up to 33 questions across all modules.
              </CardDescription>
            </div>
            <Button
              onClick={handleOpenCreateDialog}
              className="bg-[#6A5ACD] hover:bg-[#5a4abd] text-white shadow-md hover:shadow-lg transition-all"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add New Course
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loadingCourses ? (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#6A5ACD] border-t-transparent" />
              <p className="text-lg font-medium text-foreground">Loading courses...</p>
              <p className="text-sm text-muted-foreground">Retrieving course data from backend</p>
            </div>
          ) : courses && courses.length > 0 ? (
            <div className="space-y-4">
              {courses.map((course) => (
                <Card key={course.id.toString()} className="border-2">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 flex-1">
                        <CardTitle className="text-lg">{course.title}</CardTitle>
                        <CardDescription>{course.description}</CardDescription>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setPreviewCourse(course)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 text-sm">
                      <Badge variant="secondary">{course.category}</Badge>
                      <div className="flex items-center gap-1">
                        <Coins className="h-4 w-4 text-[#EFBF04]" />
                        <span className="font-medium">{course.reward.toString()} EPC</span>
                      </div>
                      <span className="text-muted-foreground">
                        {course.modules.length} module{course.modules.length !== 1 ? 's' : ''}
                      </span>
                      <Badge variant={course.availableToAll ? 'default' : 'outline'}>
                        {course.availableToAll ? 'Available to All' : 'Restricted'}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 space-y-4">
              <div className="flex justify-center">
                <div className="rounded-full bg-[#6A5ACD]/10 p-6">
                  <BookOpen className="h-12 w-12 text-[#6A5ACD]" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">No Courses Yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Create your first course to start building educational content.
                </p>
                <Button
                  onClick={handleOpenCreateDialog}
                  className="bg-[#6A5ACD] hover:bg-[#5a4abd]"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Course
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Course Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Course</DialogTitle>
            <DialogDescription>
              Add a new course to the learning platform. You can add modules and content after creation.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Course Title *</Label>
              <Input
                id="title"
                placeholder="Enter course title..."
                value={createForm.title}
                onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                className={createFormErrors.title ? 'border-destructive' : ''}
              />
              {createFormErrors.title && (
                <p className="text-sm text-destructive">{createFormErrors.title}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Course Description *</Label>
              <Textarea
                id="description"
                placeholder="Enter course description..."
                value={createForm.description}
                onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                rows={3}
                className={createFormErrors.description ? 'border-destructive' : ''}
              />
              {createFormErrors.description && (
                <p className="text-sm text-destructive">{createFormErrors.description}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Input
                id="category"
                placeholder="e.g., Web3, AI, Trust Law..."
                value={createForm.category}
                onChange={(e) => setCreateForm({ ...createForm, category: e.target.value })}
                className={createFormErrors.category ? 'border-destructive' : ''}
              />
              {createFormErrors.category && (
                <p className="text-sm text-destructive">{createFormErrors.category}</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseCreateDialog}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateCourse}
              disabled={createCourse.isPending}
              className="bg-[#6A5ACD] hover:bg-[#5a4abd]"
            >
              {createCourse.isPending ? 'Creating...' : 'Create Course'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Course Dialog */}
      {previewCourse && (
        <Dialog open={!!previewCourse} onOpenChange={() => setPreviewCourse(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>{previewCourse.title}</DialogTitle>
              <DialogDescription>{previewCourse.description}</DialogDescription>
            </DialogHeader>

            <ScrollArea className="max-h-[60vh] pr-4">
              <div className="space-y-4">
                <div className="flex items-center gap-4 text-sm">
                  <Badge variant="secondary">{previewCourse.category}</Badge>
                  <div className="flex items-center gap-1">
                    <Coins className="h-4 w-4 text-[#EFBF04]" />
                    <span className="font-medium">{previewCourse.reward.toString()} EPC</span>
                  </div>
                  <Badge variant={previewCourse.availableToAll ? 'default' : 'outline'}>
                    {previewCourse.availableToAll ? 'Available to All' : 'Restricted'}
                  </Badge>
                </div>

                <div className="space-y-3">
                  <h3 className="font-semibold text-lg">Modules ({previewCourse.modules.length})</h3>
                  {previewCourse.modules.map((module, idx) => (
                    <Collapsible
                      key={module.id.toString()}
                      open={expandedModules.has(`preview-${idx}`)}
                      onOpenChange={() => toggleModuleExpanded(`preview-${idx}`)}
                    >
                      <Card>
                        <CollapsibleTrigger asChild>
                          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                {expandedModules.has(`preview-${idx}`) ? (
                                  <ChevronDown className="h-4 w-4" />
                                ) : (
                                  <ChevronRight className="h-4 w-4" />
                                )}
                                <CardTitle className="text-base">{module.title}</CardTitle>
                              </div>
                              <Badge variant="outline">{module.questions.length} questions</Badge>
                            </div>
                            <CardDescription>{module.description}</CardDescription>
                          </CardHeader>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <CardContent className="space-y-4">
                            {module.content.tell && (
                              <div>
                                <h4 className="font-medium text-sm mb-2">Tell (Learning Content)</h4>
                                <p className="text-sm text-muted-foreground">{module.content.tell}</p>
                              </div>
                            )}
                            {module.content.show && (
                              <div>
                                <h4 className="font-medium text-sm mb-2">Show (Video URL)</h4>
                                <p className="text-sm text-muted-foreground break-all">{module.content.show}</p>
                              </div>
                            )}
                            {module.questions.length > 0 && (
                              <div>
                                <h4 className="font-medium text-sm mb-2">Questions</h4>
                                <div className="space-y-2">
                                  {module.questions.map((q, qIdx) => (
                                    <div key={qIdx} className="text-sm">
                                      <p className="font-medium">{qIdx + 1}. {q.question}</p>
                                      <ul className="ml-4 mt-1 space-y-1">
                                        {q.options.map((opt, oIdx) => (
                                          <li key={oIdx} className={Number(q.correctAnswer) === oIdx ? 'text-green-600 font-medium' : 'text-muted-foreground'}>
                                            {opt} {Number(q.correctAnswer) === oIdx && '✓'}
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </CollapsibleContent>
                      </Card>
                    </Collapsible>
                  ))}
                </div>
              </div>
            </ScrollArea>

            <DialogFooter>
              <Button variant="outline" onClick={() => setPreviewCourse(null)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
