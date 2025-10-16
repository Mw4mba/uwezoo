"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Brain, Clock, CheckCircle2, XCircle, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuizQuestion {
  id: string;
  question: string;
  type: 'multiple_choice';
  options: string[];
  correct_answer: string;
  points: number;
}

interface Quiz {
  id: string;
  title: string;
  description: string;
  questions: QuizQuestion[];
  passing_score: number;
  time_limit_minutes: number;
}

interface QuizComponentProps {
  onQuizComplete?: (passed: boolean, score: number) => void;
}

export function QuizComponent({ onQuizComplete }: QuizComponentProps) {
  const { user } = useAuth();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [score, setScore] = useState<number | null>(null);
  const [passed, setPassed] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadQuiz();
  }, []);

  const handleTimeUp = useCallback(() => {
    if (!quizCompleted) {
      // Inline submission logic to avoid dependency issues
      setQuizCompleted(true);
    }
  }, [quizCompleted]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (quizStarted && !quizCompleted && timeRemaining > 0) {
      timer = setTimeout(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            handleTimeUp();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearTimeout(timer);
  }, [quizStarted, quizCompleted, timeRemaining, handleTimeUp]);

  const loadQuiz = async () => {
    try {
      // For now, create a sample quiz
      const sampleQuiz: Quiz = {
        id: 'sample-aptitude-quiz',
        title: 'General Aptitude Quiz',
        description: 'Test your problem-solving and analytical skills',
        passing_score: 70,
        time_limit_minutes: 15,
        questions: [
          {
            id: 'q1',
            question: 'What comes next in the sequence: 2, 4, 8, 16, ?',
            type: 'multiple_choice',
            options: ['24', '32', '20', '18'],
            correct_answer: '32',
            points: 10
          },
          {
            id: 'q2',
            question: 'If it takes 5 machines 5 minutes to make 5 widgets, how long would it take 100 machines to make 100 widgets?',
            type: 'multiple_choice',
            options: ['5 minutes', '100 minutes', '10 minutes', '1 minute'],
            correct_answer: '5 minutes',
            points: 15
          },
          {
            id: 'q3',
            question: 'Which word does NOT belong with the others?',
            type: 'multiple_choice',
            options: ['Apple', 'Orange', 'Banana', 'Carrot'],
            correct_answer: 'Carrot',
            points: 10
          },
          {
            id: 'q4',
            question: 'What is the next number in the series: 1, 1, 2, 3, 5, 8, ?',
            type: 'multiple_choice',
            options: ['11', '13', '15', '10'],
            correct_answer: '13',
            points: 15
          },
          {
            id: 'q5',
            question: 'If you rearrange the letters "CIFAIPC" you would have the name of a(n):',
            type: 'multiple_choice',
            options: ['Ocean', 'State', 'City', 'Animal'],
            correct_answer: 'Ocean',
            points: 20
          }
        ]
      };

      setQuiz(sampleQuiz);
    } catch (error) {
      console.error('Error loading quiz:', error);
    } finally {
      setLoading(false);
    }
  };

  const startQuiz = () => {
    if (!quiz) return;
    setQuizStarted(true);
    setTimeRemaining(quiz.time_limit_minutes * 60);
  };

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const nextQuestion = () => {
    if (quiz && currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const previousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const submitQuiz = async () => {
    if (!quiz || !user) return;

    setQuizCompleted(true);
    
    // Calculate score
    let totalScore = 0;
    let maxScore = 0;
    
    quiz.questions.forEach(question => {
      maxScore += question.points;
      if (answers[question.id] === question.correct_answer) {
        totalScore += question.points;
      }
    });

    const percentage = Math.round((totalScore / maxScore) * 100);
    const quizPassed = percentage >= quiz.passing_score;

    setScore(percentage);
    setPassed(quizPassed);

    // Save quiz attempt to database
    try {
      await supabase
        .from('quiz_attempts')
        .insert({
          user_id: user.id,
          quiz_id: quiz.id,
          answers: answers,
          score: percentage,
          passed: quizPassed,
          completed_at: new Date().toISOString(),
          time_taken_minutes: Math.ceil((quiz.time_limit_minutes * 60 - timeRemaining) / 60)
        });
    } catch (error) {
      console.error('Error saving quiz attempt:', error);
    }

    onQuizComplete?.(quizPassed, percentage);
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Aptitude Quiz
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="animate-pulse">Loading quiz...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!quiz) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Aptitude Quiz
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Quiz not available</p>
        </CardContent>
      </Card>
    );
  }

  if (quizCompleted) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Quiz Complete
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center space-y-4">
            <div className={cn(
              "w-20 h-20 rounded-full flex items-center justify-center mx-auto",
              passed ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
            )}>
              {passed ? (
                <CheckCircle2 className="h-10 w-10" />
              ) : (
                <XCircle className="h-10 w-10" />
              )}
            </div>
            
            <div>
              <h3 className="text-2xl font-bold">{score}%</h3>
              <p className="text-muted-foreground">
                {passed ? "Congratulations! You passed!" : "Better luck next time!"}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <Label>Your Score</Label>
                <p className="font-medium">{score}%</p>
              </div>
              <div>
                <Label>Passing Score</Label>
                <p className="font-medium">{quiz.passing_score}%</p>
              </div>
              <div>
                <Label>Questions</Label>
                <p className="font-medium">{quiz.questions.length}</p>
              </div>
              <div>
                <Label>Status</Label>
                <Badge variant={passed ? "default" : "destructive"}>
                  {passed ? "Passed" : "Failed"}
                </Badge>
              </div>
            </div>

            {!passed && (
              <Button 
                onClick={() => {
                  setQuizStarted(false);
                  setQuizCompleted(false);
                  setCurrentQuestionIndex(0);
                  setAnswers({});
                  setScore(null);
                  setPassed(null);
                }}
                className="w-full"
              >
                Retake Quiz
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!quizStarted) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            {quiz.title}
          </CardTitle>
          <CardDescription>{quiz.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              Time Limit: {quiz.time_limit_minutes} minutes
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Brain className="h-4 w-4" />
              Questions: {quiz.questions.length}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Trophy className="h-4 w-4" />
              Passing Score: {quiz.passing_score}%
            </div>
          </div>

          <div className="bg-muted/50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Instructions:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Read each question carefully</li>
              <li>• Select the best answer for each question</li>
              <li>• You can navigate between questions</li>
              <li>• Submit when you are ready or when time runs out</li>
            </ul>
          </div>

          <Button onClick={startQuiz} className="w-full">
            Start Quiz
          </Button>
        </CardContent>
      </Card>
    );
  }

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / quiz.questions.length) * 100;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Question {currentQuestionIndex + 1} of {quiz.questions.length}
          </CardTitle>
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4" />
            {formatTime(timeRemaining)}
          </div>
        </div>
        <Progress value={progress} className="w-full" />
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div>
          <h3 className="text-lg font-medium mb-4">{currentQuestion.question}</h3>
          
          <RadioGroup
            value={answers[currentQuestion.id] || ""}
            onValueChange={(value) => handleAnswerChange(currentQuestion.id, value)}
          >
            {currentQuestion.options.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <RadioGroupItem value={option} id={`option-${index}`} />
                <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                  {option}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={previousQuestion}
            disabled={currentQuestionIndex === 0}
          >
            Previous
          </Button>
          
          {currentQuestionIndex === quiz.questions.length - 1 ? (
            <Button onClick={submitQuiz}>
              Submit Quiz
            </Button>
          ) : (
            <Button onClick={nextQuestion}>
              Next
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}