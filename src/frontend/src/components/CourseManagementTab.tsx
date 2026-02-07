import { useState } from 'react';
import { useGetAllCoursesWithModules, useUpdateCourseWithModules, useCreateCourse } from '../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { BookOpen, Edit, Eye, Save, X, Coins, Plus, Trash2, Video, ChevronDown, ChevronRight, GripVertical, AlertCircle, RefreshCw } from 'lucide-react';
import { MemberType, type CourseWithModules, type CourseModuleWithQuestions, type QuizQuestion } from '../backend';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

const MEMBER_TYPE_OPTIONS: { value: MemberType; label: string }[] = [
  { value: MemberType.superAdmin, label: 'Super Admin' },
  { value: MemberType.admin, label: 'Admin' },
  { value: MemberType.member, label: 'Member' },
  { value: MemberType.partner, label: 'Partner' },
  { value: MemberType.business, label: 'Business' },
  { value: MemberType.ambassador, label: 'Ambassador' },
  { value: MemberType.trustee, label: 'Trustee' },
  { value: MemberType.beneficiary, label: 'Beneficiary' },
  { value: MemberType.citizen, label: 'Citizen' },
];

interface QuizQuestionForm {
  question: string;
  options: string[];
  correctAnswer: number;
}

interface ModuleForm {
  id: bigint;
  title: string;
  description: string;
  tellContent: string;
  showContent: string;
  questions: QuizQuestionForm[];
}

export default function CourseManagementTab() {
  const { data: courses, isLoading: loadingCourses, error: coursesError, refetch: refetchCourses, isFetched } = useGetAllCoursesWithModules();
  const updateCourse = useUpdateCourseWithModules();
  const createCourse = useCreateCourse();

  const [editingCourse, setEditingCourse] = useState<bigint | null>(null);
  const [previewCourse, setPreviewCourse] = useState<CourseWithModules | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [editForm, setEditForm] = useState<{
    title: string;
    description: string;
    category: string;
    modules: ModuleForm[];
    reward: string;
    availableToAll: boolean;
    assignedMemberTypes: MemberType[];
  }>({
    title: '',
    description: '',
    category: '',
    modules: [],
    reward: '5',
    availableToAll: false,
    assignedMemberTypes: [],
  });

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

  const handleEditCourse = (course: CourseWithModules) => {
    setEditingCourse(course.id);
    
    const modules: ModuleForm[] = course.modules.map(m => ({
      id: m.id,
      title: m.title,
      description: m.description,
      tellContent: m.content.tell,
      showContent: m.content.show || '',
      questions: m.questions.map(q => ({
        question: q.question,
        options: [...q.options],
        correctAnswer: Number(q.correctAnswer),
      })),
    }));

    setEditForm({
      title: course.title,
      description: course.description,
      category: course.category,
      modules,
      reward: course.reward.toString(),
      availableToAll: course.availableToAll,
      assignedMemberTypes: course.assignedMemberTypes,
    });

    // Expand all modules when editing
    const moduleKeys = modules.map((_, idx) => `edit-${idx}`);
    setExpandedModules(new Set(moduleKeys));
  };

  const handleCancelEdit = () => {
    setEditingCourse(null);
    setExpandedModules(new Set());
    setEditForm({
      title: '',
      description: '',
      category: '',
      modules: [],
      reward: '5',
      availableToAll: false,
      assignedMemberTypes: [],
    });
  };

  const getTotalQuestions = () => {
    return editForm.modules.reduce((sum, module) => sum + module.questions.length, 0);
  };

  const handleSaveCourse = async (courseId: bigint) => {
    const rewardValue = parseInt(editForm.reward);
    
    if (rewardValue < 1 || rewardValue > 100) {
      return;
    }

    const totalQuestions = getTotalQuestions();
    if (totalQuestions > 33) {
      return;
    }

    const modules: CourseModuleWithQuestions[] = editForm.modules.map(m => ({
      id: m.id,
      title: m.title,
      description: m.description,
      content: {
        tell: m.tellContent,
        show: m.showContent || undefined,
        doStep: undefined,
      },
      questions: m.questions.map(q => ({
        question: q.question,
        options: q.options,
        correctAnswer: BigInt(q.correctAnswer),
      })),
    }));

    await updateCourse.mutateAsync({
      courseId,
      title: editForm.title,
      description: editForm.description,
      category: editForm.category,
      modules,
      reward: BigInt(rewardValue),
      availableToAll: editForm.availableToAll,
      assignedMemberTypes: editForm.assignedMemberTypes,
    });

    handleCancelEdit();
  };

  const handleMemberTypeToggle = (memberType: MemberType) => {
    setEditForm((prev) => {
      const isSelected = prev.assignedMemberTypes.includes(memberType);
      return {
        ...prev,
        assignedMemberTypes: isSelected
          ? prev.assignedMemberTypes.filter((mt) => mt !== memberType)
          : [...prev.assignedMemberTypes, memberType],
      };
    });
  };

  const handleAddModule = () => {
    const newModuleId = BigInt(editForm.modules.length);
    setEditForm((prev) => ({
      ...prev,
      modules: [
        ...prev.modules,
        {
          id: newModuleId,
          title: `Module ${prev.modules.length + 1}`,
          description: '',
          tellContent: '',
          showContent: '',
          questions: [],
        },
      ],
    }));
    setExpandedModules(prev => new Set([...prev, `edit-${editForm.modules.length}`]));
  };

  const handleRemoveModule = (moduleIndex: number) => {
    setEditForm((prev) => ({
      ...prev,
      modules: prev.modules.filter((_, i) => i !== moduleIndex),
    }));
  };

  const handleUpdateModule = (moduleIndex: number, field: keyof ModuleForm, value: any) => {
    setEditForm((prev) => ({
      ...prev,
      modules: prev.modules.map((m, i) =>
        i === moduleIndex ? { ...m, [field]: value } : m
      ),
    }));
  };

  const handleAddQuestionToModule = (moduleIndex: number) => {
    const totalQuestions = getTotalQuestions();
    if (totalQuestions >= 33) {
      return;
    }

    setEditForm((prev) => ({
      ...prev,
      modules: prev.modules.map((m, i) =>
        i === moduleIndex
          ? {
              ...m,
              questions: [
                ...m.questions,
                {
                  question: '',
                  options: ['', '', ''],
                  correctAnswer: 0,
                },
              ],
            }
          : m
      ),
    }));
  };

  const handleRemoveQuestionFromModule = (moduleIndex: number, questionIndex: number) => {
    setEditForm((prev) => ({
      ...prev,
      modules: prev.modules.map((m, i) =>
        i === moduleIndex
          ? {
              ...m,
              questions: m.questions.filter((_, qi) => qi !== questionIndex),
            }
          : m
      ),
    }));
  };

  const handleUpdateQuestion = (moduleIndex: number, questionIndex: number, field: keyof QuizQuestionForm, value: any) => {
    setEditForm((prev) => ({
      ...prev,
      modules: prev.modules.map((m, i) =>
        i === moduleIndex
          ? {
              ...m,
              questions: m.questions.map((q, qi) =>
                qi === questionIndex ? { ...q, [field]: value } : q
              ),
            }
          : m
      ),
    }));
  };

  const handleUpdateQuizOption = (moduleIndex: number, questionIndex: number, optionIndex: number, value: string) => {
    setEditForm((prev) => ({
      ...prev,
      modules: prev.modules.map((m, i) =>
        i === moduleIndex
          ? {
              ...m,
              questions: m.questions.map((q, qi) =>
                qi === questionIndex
                  ? {
                      ...q,
                      options: q.options.map((opt, oi) => (oi === optionIndex ? value : opt)),
                    }
                  : q
              ),
            }
          : m
      ),
    }));
  };

  const handleAddQuizOption = (moduleIndex: number, questionIndex: number) => {
    setEditForm((prev) => ({
      ...prev,
      modules: prev.modules.map((m, i) =>
        i === moduleIndex
          ? {
              ...m,
              questions: m.questions.map((q, qi) =>
                qi === questionIndex ? { ...q, options: [...q.options, ''] } : q
              ),
            }
          : m
      ),
    }));
  };

  const handleRemoveQuizOption = (moduleIndex: number, questionIndex: number, optionIndex: number) => {
    setEditForm((prev) => ({
      ...prev,
      modules: prev.modules.map((m, i) =>
        i === moduleIndex
          ? {
              ...m,
              questions: m.questions.map((q, qi) => {
                if (qi === questionIndex) {
                  const newOptions = q.options.filter((_, oi) => oi !== optionIndex);
                  let newCorrectAnswer = q.correctAnswer;
                  if (q.correctAnswer === optionIndex) {
                    newCorrectAnswer = 0;
                  } else if (q.correctAnswer > optionIndex) {
                    newCorrectAnswer = q.correctAnswer - 1;
                  }
                  return { ...q, options: newOptions, correctAnswer: newCorrectAnswer };
                }
                return q;
              }),
            }
          : m
      ),
    }));
  };

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

  const getMemberTypeLabel = (memberType: MemberType): string => {
    const option = MEMBER_TYPE_OPTIONS.find((opt) => opt.value === memberType);
    return option?.label || memberType;
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
      // Automatically refresh the course list
      await refetchCourses();
    } catch (error) {
      console.error('Failed to create course:', error);
    }
  };

  const totalQuestions = getTotalQuestions();
  const isOverLimit = totalQuestions > 33;

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
                Manage course content with module-based organization. Each course supports up to 33 questions across all modules.
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
                        {editingCourse === course.id ? (
                          <Input
                            value={editForm.title}
                            onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                            className="font-semibold text-lg"
                            placeholder="Course title"
                          />
                        ) : (
                          <CardTitle className="text-lg">{course.title}</CardTitle>
                        )}
                        {editingCourse === course.id ? (
                          <Textarea
                            value={editForm.description}
                            onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                            className="text-sm"
                            rows={2}
                            placeholder="Course description"
                          />
                        ) : (
                          <CardDescription>{course.description}</CardDescription>
                        )}
                      </div>
                      <div className="flex gap-2 ml-4">
                        {editingCourse === course.id ? (
                          <>
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handleSaveCourse(course.id)}
                              disabled={updateCourse.isPending || isOverLimit}
                              className="bg-[#6A5ACD] hover:bg-[#5a4abd]"
                            >
                              <Save className="h-4 w-4 mr-2" />
                              {updateCourse.isPending ? 'Saving...' : 'Save'}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={handleCancelEdit}
                            >
                              <X className="h-4 w-4 mr-2" />
                              Cancel
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditCourse(course)}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setPreviewCourse(course)}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Preview
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {editingCourse === course.id ? (
                      <>
                        <div className="space-y-2">
                          <Label>Category</Label>
                          <Input
                            value={editForm.category}
                            onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                            placeholder="e.g., Blockchain, Education"
                          />
                        </div>

                        <Separator />

                        {/* Question Counter */}
                        <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/50">
                          <div className="flex items-center gap-2">
                            <Badge variant={isOverLimit ? "destructive" : "outline"} className="text-sm">
                              {totalQuestions} / 33 Questions
                            </Badge>
                            {isOverLimit && (
                              <span className="text-sm text-destructive">Exceeds maximum limit</span>
                            )}
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleAddModule}
                            className="text-[#6A5ACD] border-[#6A5ACD]/20 hover:bg-[#6A5ACD]/10"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Module
                          </Button>
                        </div>

                        {/* Modules */}
                        <div className="space-y-3">
                          {editForm.modules.map((module, mIndex) => (
                            <Card key={mIndex} className="border-[#6A5ACD]/30">
                              <Collapsible
                                open={expandedModules.has(`edit-${mIndex}`)}
                                onOpenChange={() => toggleModuleExpanded(`edit-${mIndex}`)}
                              >
                                <CardHeader className="pb-3">
                                  <div className="flex items-center justify-between">
                                    <CollapsibleTrigger asChild>
                                      <Button variant="ghost" size="sm" className="p-0 hover:bg-transparent">
                                        <div className="flex items-center gap-2">
                                          {expandedModules.has(`edit-${mIndex}`) ? (
                                            <ChevronDown className="h-4 w-4 text-[#6A5ACD]" />
                                          ) : (
                                            <ChevronRight className="h-4 w-4 text-[#6A5ACD]" />
                                          )}
                                          <GripVertical className="h-4 w-4 text-muted-foreground" />
                                          <span className="font-semibold text-[#6A5ACD]">
                                            {module.title}
                                          </span>
                                          <Badge variant="outline" className="ml-2">
                                            {module.questions.length} {module.questions.length === 1 ? 'Question' : 'Questions'}
                                          </Badge>
                                        </div>
                                      </Button>
                                    </CollapsibleTrigger>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => handleRemoveModule(mIndex)}
                                      className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </CardHeader>
                                <CollapsibleContent>
                                  <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                      <Label className="text-sm">Module Title</Label>
                                      <Input
                                        value={module.title}
                                        onChange={(e) => handleUpdateModule(mIndex, 'title', e.target.value)}
                                        placeholder="Module title"
                                      />
                                    </div>

                                    <div className="space-y-2">
                                      <Label className="text-sm">Module Description</Label>
                                      <Textarea
                                        value={module.description}
                                        onChange={(e) => handleUpdateModule(mIndex, 'description', e.target.value)}
                                        placeholder="Module description"
                                        rows={2}
                                      />
                                    </div>

                                    <Separator />

                                    {/* Tell Section */}
                                    <div className="space-y-2">
                                      <div className="flex items-center gap-2">
                                        <div className="h-6 w-6 rounded-full bg-[#6A5ACD]/10 flex items-center justify-center">
                                          <span className="text-xs font-semibold text-[#6A5ACD]">T</span>
                                        </div>
                                        <Label className="text-sm font-semibold">Tell Section</Label>
                                      </div>
                                      <Textarea
                                        value={module.tellContent}
                                        onChange={(e) => handleUpdateModule(mIndex, 'tellContent', e.target.value)}
                                        rows={4}
                                        placeholder="Educational text content..."
                                        className="font-mono text-sm"
                                      />
                                    </div>

                                    {/* Show Section */}
                                    <div className="space-y-2">
                                      <div className="flex items-center gap-2">
                                        <div className="h-6 w-6 rounded-full bg-[#EFBF04]/10 flex items-center justify-center">
                                          <span className="text-xs font-semibold text-[#EFBF04]">S</span>
                                        </div>
                                        <Label className="text-sm font-semibold">Show Section (Video URL)</Label>
                                      </div>
                                      <div className="flex gap-2">
                                        <Input
                                          value={module.showContent}
                                          onChange={(e) => handleUpdateModule(mIndex, 'showContent', e.target.value)}
                                          placeholder="https://www.youtube.com/watch?v=..."
                                          className="flex-1"
                                        />
                                        {module.showContent && (
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => window.open(module.showContent, '_blank')}
                                          >
                                            <Video className="h-4 w-4" />
                                          </Button>
                                        )}
                                      </div>
                                    </div>

                                    <Separator />

                                    {/* Do Section - Questions */}
                                    <div className="space-y-3">
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                          <div className="h-6 w-6 rounded-full bg-accent/10 flex items-center justify-center">
                                            <span className="text-xs font-semibold text-accent-foreground">D</span>
                                          </div>
                                          <Label className="text-sm font-semibold">Do Section - Quiz Questions</Label>
                                        </div>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => handleAddQuestionToModule(mIndex)}
                                          disabled={totalQuestions >= 33}
                                          className="text-[#6A5ACD] border-[#6A5ACD]/20 hover:bg-[#6A5ACD]/10"
                                        >
                                          <Plus className="h-4 w-4 mr-2" />
                                          Add Question
                                        </Button>
                                      </div>

                                      {module.questions.length === 0 ? (
                                        <Alert>
                                          <AlertDescription>
                                            No questions yet. Click "Add Question" to create quiz content.
                                          </AlertDescription>
                                        </Alert>
                                      ) : (
                                        <div className="space-y-3">
                                          {module.questions.map((quiz, qIndex) => (
                                            <Card key={qIndex} className="border-[#6A5ACD]/20">
                                              <CardHeader className="pb-3">
                                                <div className="flex items-start justify-between">
                                                  <Label className="text-sm font-medium">Question {qIndex + 1}</Label>
                                                  <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => handleRemoveQuestionFromModule(mIndex, qIndex)}
                                                    className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                                                  >
                                                    <Trash2 className="h-4 w-4" />
                                                  </Button>
                                                </div>
                                              </CardHeader>
                                              <CardContent className="space-y-3">
                                                <Textarea
                                                  value={quiz.question}
                                                  onChange={(e) =>
                                                    handleUpdateQuestion(mIndex, qIndex, 'question', e.target.value)
                                                  }
                                                  placeholder="Enter your quiz question..."
                                                  rows={2}
                                                />

                                                <div className="space-y-2">
                                                  <div className="flex items-center justify-between">
                                                    <Label className="text-xs text-muted-foreground">Answer Options</Label>
                                                    <Button
                                                      size="sm"
                                                      variant="ghost"
                                                      onClick={() => handleAddQuizOption(mIndex, qIndex)}
                                                      className="h-6 text-xs"
                                                    >
                                                      <Plus className="h-3 w-3 mr-1" />
                                                      Add Option
                                                    </Button>
                                                  </div>
                                                  {quiz.options.map((option, oIndex) => (
                                                    <div key={oIndex} className="flex items-center gap-2">
                                                      <Checkbox
                                                        checked={quiz.correctAnswer === oIndex}
                                                        onCheckedChange={(checked) => {
                                                          if (checked) {
                                                            handleUpdateQuestion(mIndex, qIndex, 'correctAnswer', oIndex);
                                                          }
                                                        }}
                                                        className="data-[state=checked]:bg-[#6A5ACD] data-[state=checked]:border-[#6A5ACD]"
                                                      />
                                                      <Input
                                                        value={option}
                                                        onChange={(e) =>
                                                          handleUpdateQuizOption(mIndex, qIndex, oIndex, e.target.value)
                                                        }
                                                        placeholder={`Option ${oIndex + 1}`}
                                                        className="flex-1"
                                                      />
                                                      {quiz.options.length > 2 && (
                                                        <Button
                                                          size="sm"
                                                          variant="ghost"
                                                          onClick={() => handleRemoveQuizOption(mIndex, qIndex, oIndex)}
                                                          className="h-8 w-8 p-0"
                                                        >
                                                          <X className="h-4 w-4" />
                                                        </Button>
                                                      )}
                                                    </div>
                                                  ))}
                                                  <p className="text-xs text-muted-foreground">
                                                    Check the box next to the correct answer
                                                  </p>
                                                </div>
                                              </CardContent>
                                            </Card>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  </CardContent>
                                </CollapsibleContent>
                              </Collapsible>
                            </Card>
                          ))}
                        </div>

                        <Separator />

                        <div className="space-y-2">
                          <Label>EPC Reward Amount</Label>
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              min="1"
                              max="100"
                              value={editForm.reward}
                              onChange={(e) => setEditForm({ ...editForm, reward: e.target.value })}
                              className="w-32"
                            />
                            <span className="text-sm text-muted-foreground">EPC (1-100)</span>
                          </div>
                        </div>

                        <Separator />

                        <div className="space-y-3">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id={`available-all-${course.id}`}
                              checked={editForm.availableToAll}
                              onCheckedChange={(checked) =>
                                setEditForm({ ...editForm, availableToAll: checked as boolean })
                              }
                            />
                            <Label htmlFor={`available-all-${course.id}`} className="font-medium">
                              Available to all users
                            </Label>
                          </div>

                          {!editForm.availableToAll && (
                            <div className="space-y-2 pl-6">
                              <Label className="text-sm">Assign to Member Types:</Label>
                              <div className="grid grid-cols-2 gap-2">
                                {MEMBER_TYPE_OPTIONS.map((option) => (
                                  <div key={option.value} className="flex items-center space-x-2">
                                    <Checkbox
                                      id={`${course.id}-${option.value}`}
                                      checked={editForm.assignedMemberTypes.includes(option.value)}
                                      onCheckedChange={() => handleMemberTypeToggle(option.value)}
                                    />
                                    <Label
                                      htmlFor={`${course.id}-${option.value}`}
                                      className="text-sm font-normal"
                                    >
                                      {option.label}
                                    </Label>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline" className="bg-[#6A5ACD]/10 text-[#6A5ACD] border-[#6A5ACD]/20">
                            <Coins className="h-3 w-3 mr-1" />
                            {course.reward.toString()} EPC
                          </Badge>
                          <Badge variant="outline">{course.category}</Badge>
                          <Badge variant="outline" className="bg-accent/10">
                            {course.modules.length} {course.modules.length === 1 ? 'Module' : 'Modules'}
                          </Badge>
                          {course.availableToAll ? (
                            <Badge variant="secondary">Available to All</Badge>
                          ) : (
                            <Badge variant="outline">
                              {course.assignedMemberTypes.length} Member Type(s)
                            </Badge>
                          )}
                        </div>

                        {!course.availableToAll && course.assignedMemberTypes.length > 0 && (
                          <div className="space-y-2">
                            <Label className="text-sm text-muted-foreground">Assigned to:</Label>
                            <div className="flex flex-wrap gap-1">
                              {course.assignedMemberTypes.map((memberType) => (
                                <Badge key={memberType} variant="outline" className="text-xs">
                                  {getMemberTypeLabel(memberType)}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : isFetched ? (
            <div className="text-center py-12">
              <div className="flex flex-col items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-[#6A5ACD]/10 flex items-center justify-center">
                  <BookOpen className="h-8 w-8 text-[#6A5ACD] opacity-50" />
                </div>
                <div className="space-y-2">
                  <p className="text-lg font-medium text-foreground">No courses available</p>
                  <p className="text-sm text-muted-foreground">
                    Create your first course with module-based organization.
                  </p>
                </div>
                <Button
                  onClick={handleOpenCreateDialog}
                  className="mt-4 bg-[#6A5ACD] hover:bg-[#5a4abd] text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add New Course
                </Button>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Course Creation Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-[#6A5ACD]" />
              Create New Course
            </DialogTitle>
            <DialogDescription>
              Enter the basic information for your new course. You can add modules and content after creation.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="course-title">
                Course Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="course-title"
                value={createForm.title}
                onChange={(e) => {
                  setCreateForm({ ...createForm, title: e.target.value });
                  if (createFormErrors.title) {
                    setCreateFormErrors({ ...createFormErrors, title: '' });
                  }
                }}
                placeholder="e.g., Blockchain 101"
                className={createFormErrors.title ? 'border-destructive' : ''}
              />
              {createFormErrors.title && (
                <p className="text-sm text-destructive">{createFormErrors.title}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="course-description">
                Course Description <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="course-description"
                value={createForm.description}
                onChange={(e) => {
                  setCreateForm({ ...createForm, description: e.target.value });
                  if (createFormErrors.description) {
                    setCreateFormErrors({ ...createFormErrors, description: '' });
                  }
                }}
                placeholder="Provide a brief description of what students will learn..."
                rows={3}
                className={createFormErrors.description ? 'border-destructive' : ''}
              />
              {createFormErrors.description && (
                <p className="text-sm text-destructive">{createFormErrors.description}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="course-category">
                Category <span className="text-destructive">*</span>
              </Label>
              <Input
                id="course-category"
                value={createForm.category}
                onChange={(e) => {
                  setCreateForm({ ...createForm, category: e.target.value });
                  if (createFormErrors.category) {
                    setCreateFormErrors({ ...createFormErrors, category: '' });
                  }
                }}
                placeholder="e.g., Education, Blockchain, Web3"
                className={createFormErrors.category ? 'border-destructive' : ''}
              />
              {createFormErrors.category && (
                <p className="text-sm text-destructive">{createFormErrors.category}</p>
              )}
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                After creating the course, you can add modules, content, and questions using the Edit button.
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleCloseCreateDialog}
              disabled={createCourse.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateCourse}
              disabled={createCourse.isPending}
              className="bg-[#6A5ACD] hover:bg-[#5a4abd] text-white"
            >
              {createCourse.isPending ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                  Creating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Create Course
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {previewCourse && (
        <Dialog open={!!previewCourse} onOpenChange={() => setPreviewCourse(null)}>
          <DialogContent className="max-w-4xl max-h-[85vh]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-[#6A5ACD]" />
                {previewCourse.title}
              </DialogTitle>
              <DialogDescription>{previewCourse.description}</DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-[70vh] pr-4">
              <div className="space-y-6">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="bg-[#6A5ACD]/10 text-[#6A5ACD] border-[#6A5ACD]/20">
                    <Coins className="h-3 w-3 mr-1" />
                    {previewCourse.reward.toString()} EPC Reward
                  </Badge>
                  <Badge variant="outline">{previewCourse.category}</Badge>
                  <Badge variant="outline" className="bg-accent/10">
                    {previewCourse.modules.length} {previewCourse.modules.length === 1 ? 'Module' : 'Modules'}
                  </Badge>
                </div>

                <Separator />

                {previewCourse.modules.map((module, mIndex) => (
                  <div key={mIndex} className="space-y-4">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-[#6A5ACD]/10 flex items-center justify-center">
                        <span className="text-sm font-semibold text-[#6A5ACD]">{mIndex + 1}</span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{module.title}</h3>
                        <p className="text-sm text-muted-foreground">{module.description}</p>
                      </div>
                    </div>

                    <div className="pl-10 space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="h-6 w-6 rounded-full bg-[#6A5ACD]/10 flex items-center justify-center">
                            <span className="text-xs font-semibold text-[#6A5ACD]">T</span>
                          </div>
                          <Label className="text-sm font-semibold">Tell</Label>
                        </div>
                        <p className="text-sm text-foreground whitespace-pre-wrap pl-8">
                          {module.content.tell}
                        </p>
                      </div>

                      {module.content.show && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <div className="h-6 w-6 rounded-full bg-[#EFBF04]/10 flex items-center justify-center">
                              <span className="text-xs font-semibold text-[#EFBF04]">S</span>
                            </div>
                            <Label className="text-sm font-semibold">Show</Label>
                          </div>
                          <a
                            href={module.content.show}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-[#6A5ACD] hover:underline break-all pl-8 block"
                          >
                            {module.content.show}
                          </a>
                        </div>
                      )}

                      {module.questions.length > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <div className="h-6 w-6 rounded-full bg-accent/10 flex items-center justify-center">
                              <span className="text-xs font-semibold text-accent-foreground">D</span>
                            </div>
                            <Label className="text-sm font-semibold">Do - {module.questions.length} Questions</Label>
                          </div>
                          <div className="pl-8 space-y-3">
                            {module.questions.map((quiz, qIndex) => (
                              <Card key={qIndex} className="border-[#6A5ACD]/20">
                                <CardHeader className="pb-3">
                                  <Label className="text-sm font-medium">Question {qIndex + 1}</Label>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                  <p className="text-sm font-medium">{quiz.question}</p>
                                  <div className="space-y-1">
                                    {quiz.options.map((option, oIndex) => (
                                      <div
                                        key={oIndex}
                                        className={`flex items-center gap-2 p-2 rounded border text-sm ${
                                          Number(quiz.correctAnswer) === oIndex
                                            ? 'border-[#6A5ACD] bg-[#6A5ACD]/5'
                                            : 'border-border'
                                        }`}
                                      >
                                        <div
                                          className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${
                                            Number(quiz.correctAnswer) === oIndex
                                              ? 'border-[#6A5ACD] bg-[#6A5ACD]'
                                              : 'border-muted-foreground'
                                          }`}
                                        >
                                          {Number(quiz.correctAnswer) === oIndex && (
                                            <div className="h-2 w-2 rounded-full bg-white" />
                                          )}
                                        </div>
                                        <span>{option}</span>
                                        {Number(quiz.correctAnswer) === oIndex && (
                                          <Badge variant="outline" className="ml-auto text-xs bg-[#6A5ACD]/10 text-[#6A5ACD]">
                                            Correct
                                          </Badge>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {mIndex < previewCourse.modules.length - 1 && <Separator />}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
