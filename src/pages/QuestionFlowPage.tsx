import React, { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { RadialProgress } from '../components/ui/RadialProgress';
import { 
  Heart, 
  DollarSign, 
  Briefcase, 
  Users, 
  Activity,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  MessageSquare,
  Info
} from 'lucide-react';

interface QuestionFlowPageProps {
  onNavigate: (route: string) => void;
}

interface Question {
  id: string;
  topic: string;
  icon: typeof Heart;
  question: string;
  answer?: {
    percentage: number;
    summary: string;
    explanation: string;
    sources: Array<{
      id: string;
      snippet: string;
      confidence: number;
      source: 'ProKerala' | 'KnowledgeBase';
    }>;
    confidenceBreakdown: {
      astrology: number;
      knowledge: number;
      ai: number;
    };
  };
  verified?: boolean;
  completed: boolean;
}

export function QuestionFlowPage({ onNavigate }: QuestionFlowPageProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [showExplanation, setShowExplanation] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [questions, setQuestions] = useState<Question[]>([
    {
      id: '1',
      topic: 'Love',
      icon: Heart,
      question: 'What does my love life look like in 2025?',
      completed: false
    },
    {
      id: '2',
      topic: 'Finance',
      icon: DollarSign,
      question: 'Will I have financial growth this year?',
      completed: false
    },
    {
      id: '3',
      topic: 'Career',
      icon: Briefcase,
      question: 'What are my career prospects for 2025?',
      completed: false
    },
    {
      id: '4',
      topic: 'Family',
      icon: Users,
      question: 'How will my family relationships evolve?',
      completed: false
    },
    {
      id: '5',
      topic: 'Health',
      icon: Activity,
      question: 'What should I focus on for my health?',
      completed: false
    }
  ]);

  const currentQuestion = questions[currentStep];
  const completedCount = questions.filter(q => q.completed).length;

  const handleAskQuestion = async () => {
    setIsLoading(true);
    
    // Simulate AI processing
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Mock response
    const mockAnswer = {
      percentage: Math.floor(Math.random() * 40) + 60, // 60-100%
      summary: `Based on your birth chart analysis, your ${currentQuestion.topic.toLowerCase()} prospects show positive indicators for the coming period.`,
      explanation: `The planetary positions in your chart suggest a favorable time ahead. Your ${currentQuestion.topic.toLowerCase()} sector is influenced by beneficial aspects that indicate growth and positive developments.`,
      sources: [
        {
          id: '1',
          snippet: 'Venus in 7th house indicates harmonious relationships and partnership opportunities.',
          confidence: 0.45,
          source: 'ProKerala' as const
        },
        {
          id: '2',
          snippet: 'Historical data shows similar planetary configurations correlate with positive outcomes.',
          confidence: 0.30,
          source: 'KnowledgeBase' as const
        }
      ],
      confidenceBreakdown: {
        astrology: 0.45,
        knowledge: 0.30,
        ai: 0.25
      }
    };

    setQuestions(prev => prev.map((q, index) => 
      index === currentStep ? { ...q, answer: mockAnswer } : q
    ));
    
    setIsLoading(false);
  };

  const handleVerification = (isAccurate: boolean) => {
    if (isAccurate) {
      setQuestions(prev => prev.map((q, index) => 
        index === currentStep ? { ...q, verified: true, completed: true } : q
      ));
      
      if (currentStep < questions.length - 1) {
        setTimeout(() => setCurrentStep(currentStep + 1), 500);
      } else {
        // All questions completed
        onNavigate('/dashboard');
      }
    } else {
      // Handle rephrase
      setQuestions(prev => prev.map((q, index) => 
        index === currentStep ? { ...q, answer: undefined } : q
      ));
    }
  };

  const progressPercentage = ((completedCount) / questions.length) * 100;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="h1 text-[var(--text-primary)] mb-2">
          AI Astrology Questions
        </h1>
        <p className="text-[var(--text-secondary)]">
          Get personalized predictions for 5 key areas of your life
        </p>
      </div>

      {/* Progress Bar */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium text-[var(--text-primary)]">
            Progress: {completedCount}/{questions.length}
          </span>
          <span className="text-sm text-[var(--text-secondary)]">
            {Math.round(progressPercentage)}% Complete
          </span>
        </div>
        <div className="w-full bg-[rgba(255,255,255,0.1)] rounded-full h-2">
          <div 
            className="bg-[var(--accent-500)] h-2 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        
        {/* Question indicators */}
        <div className="flex items-center justify-between mt-4">
          {questions.map((q, index) => {
            const Icon = q.icon;
            return (
              <div
                key={q.id}
                className={`flex flex-col items-center gap-2 ${
                  index === currentStep ? 'opacity-100' : 
                  index < currentStep && q.completed ? 'opacity-100' : 'opacity-40'
                }`}
              >
                <div className={`
                  w-10 h-10 rounded-full flex items-center justify-center border-2
                  ${index < currentStep && q.completed 
                    ? 'bg-[var(--success)] border-[var(--success)] text-white'
                    : index === currentStep
                    ? 'border-[var(--accent-500)] text-[var(--accent-500)]'
                    : 'border-[rgba(255,255,255,0.2)] text-[var(--text-secondary)]'
                  }
                `}>
                  {index < currentStep && q.completed ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <Icon className="w-5 h-5" />
                  )}
                </div>
                <span className="text-xs text-[var(--text-secondary)]">
                  {q.topic}
                </span>
              </div>
            );
          })}
        </div>
      </Card>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Current Question */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-[var(--accent-500)] rounded-full flex items-center justify-center">
                <currentQuestion.icon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="h2 text-[var(--text-primary)]">{currentQuestion.topic}</h2>
                <p className="text-[var(--text-secondary)]">
                  You have one free question for {currentQuestion.topic}
                </p>
              </div>
            </div>

            <div className="bg-[var(--bg-800)] rounded-lg p-4 mb-6">
              <p className="text-[var(--text-primary)] font-medium">
                {currentQuestion.question}
              </p>
            </div>

            {!currentQuestion.answer ? (
              <Button
                onClick={handleAskQuestion}
                loading={isLoading}
                variant="primary"
                size="lg"
                fullWidth
                icon={MessageSquare}
              >
                {isLoading ? 'AI is analyzing your chart...' : 'Get AI Prediction'}
              </Button>
            ) : (
              <div className="space-y-6">
                {/* Answer */}
                <div className="text-center">
                  <RadialProgress 
                    value={currentQuestion.answer.percentage}
                    size={150}
                    label={currentQuestion.topic}
                    className="mx-auto mb-4"
                  />
                  <h3 className="h2 text-[var(--text-primary)] mb-4">
                    AI Prediction Result
                  </h3>
                </div>

                <Card className="bg-[var(--bg-800)]">
                  <h4 className="font-semibold text-[var(--text-primary)] mb-3">Summary</h4>
                  <p className="text-[var(--text-secondary)] mb-4">
                    {currentQuestion.answer.summary}
                  </p>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={Info}
                    onClick={() => setShowExplanation(true)}
                  >
                    Why {currentQuestion.answer.percentage}%?
                  </Button>
                </Card>

                {!currentQuestion.verified && (
                  <Card className="border-[var(--accent-500)] bg-[rgba(106,13,173,0.05)]">
                    <h4 className="font-semibold text-[var(--text-primary)] mb-3">
                      Verification Required
                    </h4>
                    <p className="text-[var(--text-secondary)] mb-4">
                      Is this answer accurate for your question?
                    </p>
                    <div className="flex gap-3">
                      <Button
                        onClick={() => handleVerification(true)}
                        variant="primary"
                        icon={CheckCircle}
                        fullWidth
                      >
                        Confirm - Proceed
                      </Button>
                      <Button
                        onClick={() => handleVerification(false)}
                        variant="secondary"
                        icon={AlertCircle}
                        fullWidth
                      >
                        Not accurate - Rephrase
                      </Button>
                    </div>
                  </Card>
                )}
              </div>
            )}
          </Card>
        </div>

        {/* Previous Answers */}
        <div className="space-y-4">
          <h3 className="font-semibold text-[var(--text-primary)]">Previous Answers</h3>
          
          {questions.slice(0, currentStep).map((q, index) => (
            q.completed && q.answer && (
              <Card key={q.id} className="bg-[var(--bg-800)]" hover>
                <div className="flex items-center gap-2 mb-2">
                  <q.icon className="w-4 h-4 text-[var(--accent-500)]" />
                  <span className="font-medium text-[var(--text-primary)]">{q.topic}</span>
                  <CheckCircle className="w-4 h-4 text-[var(--success)] ml-auto" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-[var(--accent-500)]">
                    {q.answer.percentage}%
                  </span>
                  <p className="text-xs text-[var(--text-secondary)] flex-1">
                    {q.answer.summary.slice(0, 60)}...
                  </p>
                </div>
              </Card>
            )
          ))}

          {completedCount === 0 && (
            <div className="text-center py-8">
              <MessageSquare className="w-12 h-12 text-[var(--muted)] mx-auto mb-3" />
              <p className="text-[var(--text-secondary)] text-sm">
                Complete questions to see your prediction history
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Explanation Modal */}
      {currentQuestion.answer && (
        <Modal
          isOpen={showExplanation}
          onClose={() => setShowExplanation(false)}
          title="AI Confidence Breakdown"
          maxWidth="lg"
        >
          <div className="space-y-6">
            <p className="text-[var(--text-secondary)]">
              This score is a blended probability combining multiple data sources and AI analysis.
            </p>

            {/* Confidence Breakdown */}
            <div className="space-y-4">
              <h4 className="font-semibold text-[var(--text-primary)]">Confidence Sources</h4>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-[var(--bg-800)] rounded-lg">
                  <span className="text-[var(--text-primary)]">Astrology Signals</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-2 bg-[rgba(255,255,255,0.1)] rounded-full">
                      <div 
                        className="h-2 bg-[var(--accent-500)] rounded-full"
                        style={{ width: `${currentQuestion.answer.confidenceBreakdown.astrology * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-[var(--text-primary)] min-w-[3rem]">
                      {Math.round(currentQuestion.answer.confidenceBreakdown.astrology * 100)}%
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-[var(--bg-800)] rounded-lg">
                  <span className="text-[var(--text-primary)]">Knowledge Base</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-2 bg-[rgba(255,255,255,0.1)] rounded-full">
                      <div 
                        className="h-2 bg-[var(--accent-400)] rounded-full"
                        style={{ width: `${currentQuestion.answer.confidenceBreakdown.knowledge * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-[var(--text-primary)] min-w-[3rem]">
                      {Math.round(currentQuestion.answer.confidenceBreakdown.knowledge * 100)}%
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-[var(--bg-800)] rounded-lg">
                  <span className="text-[var(--text-primary)]">AI Model Confidence</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-2 bg-[rgba(255,255,255,0.1)] rounded-full">
                      <div 
                        className="h-2 bg-[var(--success)] rounded-full"
                        style={{ width: `${currentQuestion.answer.confidenceBreakdown.ai * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-[var(--text-primary)] min-w-[3rem]">
                      {Math.round(currentQuestion.answer.confidenceBreakdown.ai * 100)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Supporting Evidence */}
            <div className="space-y-4">
              <h4 className="font-semibold text-[var(--text-primary)]">Supporting Evidence</h4>
              
              {currentQuestion.answer.sources.map((source, index) => (
                <div key={source.id} className="p-3 bg-[var(--bg-800)] rounded-lg border-l-4 border-[var(--accent-500)]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs px-2 py-1 bg-[var(--accent-500)] text-white rounded-full">
                      {source.source}
                    </span>
                    <span className="text-xs text-[var(--text-secondary)]">
                      {Math.round(source.confidence * 100)}% confidence
                    </span>
                  </div>
                  <p className="text-sm text-[var(--text-secondary)]">
                    {source.snippet}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}