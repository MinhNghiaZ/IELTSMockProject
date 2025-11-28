import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import type { Question } from "../../../types/Question";
import { getTestById } from "../../../services/testService";
import { getAllQuestionsAndParagraphsWithTestId } from "../../../services/questionService";
import { SubmitTest } from '../../../services/submissionService';
import { useAuth } from '../../../contexts/AuthContext';
import { toast } from "react-toastify/unstyled"
import { confirmToast } from '../../layout/confirmToast';
import parse from 'html-react-parser';
import DOMPurify from 'dompurify';

interface ListeningSection {
  id: number;
  title: string;
  audioUrl: string;
  questions: Question[];
  sectionContent?: string;
}

function NewListeningTestPage() {
  const { id: testId } = useParams<{ id: string }>();

  // State management for data fetching
  const [sections, setSections] = useState<ListeningSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Test configuration - will be updated based on fetched data
  const [testConfig, setTestConfig] = useState({
    title: "IELTS Listening Test",
    duration: 30 * 60, // 30 minutes in seconds
    totalQuestions: 0
  });

  // Data fetching effect
  useEffect(() => {
    const fetchTestData = async () => {
      if (!testId) {
        setError("No test ID provided");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Fetch test info and questions
        const [testData, allQuestionsData] = await Promise.all([
          getTestById(testId),
          getAllQuestionsAndParagraphsWithTestId(parseInt(testId)),
        ]);

        // Update test config with fetched data
        setTestConfig({
          title: testData.testName,
          duration: 30 * 60, // Default 30 minutes for listening
          totalQuestions: allQuestionsData.filter(q => q.parentId !== 0).length
        });

        // Process data into listening sections
        const processedSections = processDataIntoSections(allQuestionsData);
        setSections(processedSections);

      } catch (err) {
        console.error('Error fetching test data:', err);
        setError('Failed to load test data');
      } finally {
        setLoading(false);
      }
    };

    fetchTestData();
  }, [testId]);

  // Helper function to process fetched data into ListeningSection format
  const processDataIntoSections = (questionsData: any[]): ListeningSection[] => {
    // Separate Audio sections and questions
    const audioSections = questionsData
      .filter(q => q.questionType === "Audio" && q.parentId === 0)
      .sort((a, b) => a.order - b.order);
    
    const questions = questionsData
      .filter(q => q.parentId !== 0)
      .sort((a, b) => a.order - b.order);

    // Group questions by their parent ID
    const questionsByParent = questions.reduce((acc, question) => {
      if (!acc[question.parentId]) {
        acc[question.parentId] = [];
      }
      acc[question.parentId].push({
        id: question.id,
        questionType: question.questionType,
        content: question.content,
        correctAnswer: question.correctAnswer,
        choices: question.choices || "",
        explanation: question.explanation || "",
        parentId: question.parentId,
        testId: question.testId,
        order: question.order,
        link: question.link || ""
      });
      return acc;
    }, {} as { [key: number]: Question[] });

    // Create sections from audio sections (which contain the form content)
    return audioSections.map((audioSection, index) => {
      // Get questions that belong to this audio section by parentId
      const sectionQuestions = questionsByParent[audioSection.id] || [];

      return {
        id: audioSection.id,
        title: `Recording ${index + 1}`,
        audioUrl: audioSection.link, // || "/audio/example.mp3", // Use link field for audio URL
        sectionContent: audioSection.content, // Use Audio section content as form content
        questions: sectionQuestions
      };
    });
  };

  // State management
  const [currentSection, setCurrentSection] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(30 * 60);
  const [answers, setAnswers] = useState<{ [key: number]: string }>({});
  const [isMuted, setIsMuted] = useState(false);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [highlightedQuestion, setHighlightedQuestion] = useState<number | null>(null);
  // Store highlights per section - now with start/end positions
  const [highlights, setHighlights] = useState<{
    [sectionId: number]: { text: string; start: number; end: number }[];
  }>({});

  const audioRef = useRef<HTMLAudioElement>(null);
  const lastTimeUpdateRef = useRef(0);
  const navigate = useNavigate()

  const handleSubmitTest = () => {
    console.log('Submitting test with answers:', answers);
    // Implement submission logic here
    // const data = SubmitTest({
    //   userId: user?.id || 0,
    //   testId: testId || 0,
    //   userAnswerMap: answers,
    // })
    // console.log(data.then(res => console.log(res)));

    
    confirmToast(`You have ${40 - Object.keys(answers).length} unanswered questions. Do you want to submit the test now?`,
      async () => {
        try {
          const data = await SubmitTest({
            userId: user?.id || 0,
            testId: testId || 0,
            userAnswerMap: answers,
          });
          console.log("this is data",data);
          toast.success("Test submitted successfully!");
          navigate(`/submission-detail/${data.submissionId}`);
        } catch (error) {
          console.error('Submit failed', error);
          toast.error("Failed to submit the test. Please try again.");
        }
      },
      () => {
        console.log("Submission cancelled");
      }
    );
  };

  const handleLeave = () => {
    confirmToast("Are you sure you want to leave the test? Your progress will be lost.",
      async () => {
        // User confirmed, handle the leave action
        console.log("User confirmed leave");
        // You can add any additional logic here, e.g., navigating away
        navigate(`/test/${testId}`);
      },
      () => {
        console.log("Leave cancelled");
      }
    );
  };

  // Reset currentSection when sections change and update timer when config changes
  useEffect(() => {
    if (sections.length > 0 && currentSection >= sections.length) {
      setCurrentSection(0);
    }
    if (!loading && testConfig.duration > 0) {
      setTimeRemaining(testConfig.duration);
    }
  }, [sections, currentSection, loading, testConfig.duration]);

  // Reset audio when section changes
  useEffect(() => {
    if (sections.length > 0) {
      // Reset states
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);
      lastTimeUpdateRef.current = 0;
      
      // Log the current audio URL for debugging
      const currentAudioUrl = sections[currentSection]?.audioUrl;
      console.log('Section changed to:', currentSection + 1, 'Audio URL:', currentAudioUrl);
      
      // If there's an audio element and URL, force reload
      if (audioRef.current && currentAudioUrl) {
        audioRef.current.load(); // Force reload of the audio
      }
    }
  }, [currentSection, sections]);

  // Event handlers
  const handleAnswerChange = (questionId: number, answer: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  // Handle text highlighting with position-based approach
  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) {
      return;
    }

    const selectedText = selection.toString().trim();
    if (!selectedText || selectedText.length < 2) {
      return;
    }

    const currentSectionData = sections[currentSection];
    if (!currentSectionData || !currentSectionData.sectionContent) {
      return;
    }

    // Get the range to find position in the full text content
    const range = selection.getRangeAt(0);
    const preSelectionRange = range.cloneRange();
    const containerEl = document.querySelector('.section-content');
    
    if (!containerEl) {
      selection.removeAllRanges();
      return;
    }

    preSelectionRange.selectNodeContents(containerEl);
    preSelectionRange.setEnd(range.startContainer, range.startOffset);
    const start = preSelectionRange.toString().length;
    const end = start + selectedText.length;

    const sectionId = currentSectionData.id;
    const currentHighlights = highlights[sectionId] || [];

    // Check if this specific position overlaps with any existing highlight
    const overlappingIndex = currentHighlights.findIndex(
      (h) => (start >= h.start && start < h.end) || (end > h.start && end <= h.end) || (start <= h.start && end >= h.end)
    );

    if (overlappingIndex !== -1) {
      // Remove the overlapping highlight
      const newHighlights = currentHighlights.filter((_, idx) => idx !== overlappingIndex);
      setHighlights((prev) => ({
        ...prev,
        [sectionId]: newHighlights,
      }));
    } else {
      // Add new highlight with position
      setHighlights((prev) => ({
        ...prev,
        [sectionId]: [...currentHighlights, { text: selectedText, start, end }],
      }));
    }

    // Clear selection
    selection.removeAllRanges();
  };

  const handlePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(console.error);
      }
      setIsPlaying(!isPlaying);
    }
  };

  // Timer effect
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining(prev => prev > 0 ? prev - 1 : prev);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Close speed menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showSpeedMenu && !(event.target as Element).closest('.position-relative')) {
        setShowSpeedMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showSpeedMenu]);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const now = Date.now();
      // Reduce throttling from 100ms to 50ms for smoother progress bar
      if (now - lastTimeUpdateRef.current > 50) {
        const newCurrentTime = audioRef.current.currentTime;
        setCurrentTime(newCurrentTime);
        lastTimeUpdateRef.current = now;
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      const audioDuration = audioRef.current.duration;
      setDuration(audioDuration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const seekTime = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = seekTime;
      setCurrentTime(seekTime);
    }
  };

  const handleMuteToggle = () => {
    if (audioRef.current) {
      audioRef.current.muted = !audioRef.current.muted;
      setIsMuted(audioRef.current.muted);
    }
  };

  const handleSpeedChange = (speed: number) => {
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
      setPlaybackSpeed(speed);
      setShowSpeedMenu(false);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Apply highlights to section content - memoized to avoid recalculation
  const highlightedSectionContent = useMemo(() => {
    const currentSectionData = sections[currentSection];
    if (!currentSectionData || !currentSectionData.sectionContent) return "";

    const sectionHighlights = highlights[currentSectionData.id] || [];
    if (sectionHighlights.length === 0) {
      return currentSectionData.sectionContent;
    }

    // Work with HTML content directly
    let htmlContent = currentSectionData.sectionContent;
    
    // Create a temporary DOM to work with
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = DOMPurify.sanitize(htmlContent);
    
    // Sort highlights by start position (latest first to avoid position shifts)
    const sortedHighlights = [...sectionHighlights].sort(
      (a, b) => b.start - a.start
    );

    // Apply highlights by wrapping text nodes at specific positions
    sortedHighlights.forEach((highlight) => {
      let currentPos = 0;
      const walker = document.createTreeWalker(
        tempDiv,
        NodeFilter.SHOW_TEXT,
        null
      );

      let node;
      while ((node = walker.nextNode())) {
        const textNode = node as Text;
        const textLength = textNode.textContent?.length || 0;
        const nodeStart = currentPos;
        const nodeEnd = currentPos + textLength;

        // Check if this text node contains the highlight range
        if (highlight.start < nodeEnd && highlight.end > nodeStart) {
          const text = textNode.textContent || '';
          
          // Calculate positions within this text node
          const highlightStartInNode = Math.max(0, highlight.start - nodeStart);
          const highlightEndInNode = Math.min(textLength, highlight.end - nodeStart);
          
          // Split the text node
          const beforeText = text.substring(0, highlightStartInNode);
          const highlightedText = text.substring(highlightStartInNode, highlightEndInNode);
          const afterText = text.substring(highlightEndInNode);
          
          // Create new nodes
          const fragment = document.createDocumentFragment();
          
          if (beforeText) {
            fragment.appendChild(document.createTextNode(beforeText));
          }
          
          const mark = document.createElement('mark');
          mark.style.backgroundColor = '#ffeb3b';
          mark.style.cursor = 'pointer';
          mark.style.display = 'inline';
          mark.style.padding = '0';
          mark.style.margin = '0';
          mark.textContent = highlightedText;
          fragment.appendChild(mark);
          
          if (afterText) {
            fragment.appendChild(document.createTextNode(afterText));
          }
          
          // Replace the original text node
          textNode.parentNode?.replaceChild(fragment, textNode);
        }
        
        currentPos = nodeEnd;
      }
    });

    return tempDiv.innerHTML;
  }, [sections, currentSection, highlights]);

  // Helper function to get question number across all sections
  const getQuestionNumber = (questionId: number) => {
    const allQuestions = sections.flatMap(s => s.questions);
    const globalQuestionIndex = allQuestions.findIndex(q => q.id === questionId);
    return globalQuestionIndex + 1;
  };

  // Render question group based on type
  const renderQuestionGroup = (group: any, shouldShowSeparator: boolean) => {
    switch (group.type) {
      case 'form':
        return renderFormCompletionGroup(group, shouldShowSeparator);
      case 'matching':
        return renderMatchingGroup(group, shouldShowSeparator);
      case 'diagram':
        return renderDiagramGroup(group, shouldShowSeparator);
      case 'single':
        return renderSingleQuestion(group, shouldShowSeparator);
      default:
        return (
          <div key={`unknown-group`}>
            <div className="alert alert-warning">
              Unsupported group type: {group.type}
            </div>
            {shouldShowSeparator && <hr className="my-4" />}
          </div>
        );
    }
  };

  // Render form completion group
  const renderFormCompletionGroup = (group: any, shouldShowSeparator: boolean) => {
    const currentSectionData = sections[currentSection];
    
    return (
      <div key={`form-group`}>
        <div className="row mb-4">
          {/* Form content column */}
          <div className="col-md-8">
            <div 
              className="section-content border rounded bg-light p-3 h-100" 
              style={{ lineHeight: "2.5", userSelect: "text", cursor: "text" }}
              onMouseUp={handleTextSelection}
            >
              {currentSectionData.sectionContent ? (
                currentSectionData.sectionContent.includes('<') ? (
                  <div>{parse(DOMPurify.sanitize(highlightedSectionContent))}</div>
                ) : (
                  <div style={{ whiteSpace: 'pre-line' }}>{currentSectionData.sectionContent}</div>
                )
              ) : (
                <div className="text-center py-4">
                  <p className="text-muted">Form content will appear here</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Input fields column for all questions in this group */}
          <div className="col-md-4">
            <div className="pt-3" style={{ lineHeight: '2.5', paddingTop: '120px' }}>
              {group.questions.map((question: any) => {
                const questionNumber = getQuestionNumber(question.id);
                
                return (
                  <div 
                    key={question.id}
                    className={`mb-5 d-flex align-items-center`}
                  >
                    <span className="badge bg-primary rounded-circle me-2 d-flex align-items-center justify-content-center" style={{ width: '36px', height: '36px', fontSize: '1rem' }}>
                      {questionNumber}
                    </span>
                    <input
                      id={`question-${question.id}`}
                      type="text"
                      className="form-control form-control-sm"
                      style={{ width: '200px' }}
                      value={answers[question.id] as string || ''}
                      onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        {shouldShowSeparator && <hr className="my-4" />}
      </div>
    );
  };

  // Render matching group
  const renderMatchingGroup = (group: any, shouldShowSeparator: boolean) => {
    return (
      <div key={`matching-group`}>
        <div className="row mb-4">
          {/* Options and questions content column */}
          <div className="col-md-8">
            <div className="border rounded bg-light p-3 h-100">
              {/* Display the list of options from the first question in the group */}
              {group.questions[0].choices && (
                <div className="mb-4">
                  <h6 className="fw-bold mb-3">Options:</h6>
                  <div style={{ whiteSpace: 'pre-line', lineHeight: '1.8' }}>
                    {group.questions[0].choices}
                  </div>
                </div>
              )}
              
              {/* Display all question contents */}
              <div>
                <h6 className="fw-bold mb-3">Questions:</h6>
                {group.questions.map((question: any) => (
                  <div key={question.id} className="mb-3" style={{ lineHeight: '1.8' }}>
                    {question.content.includes('<') ? (
                      <span>{parse(DOMPurify.sanitize(question.content))}</span>
                    ) : (
                      <span>{question.content}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Input fields column for all questions in this group */}
          <div className="col-md-4">
            <div className="pt-3" style={{ lineHeight: '1.8' }}>
              {group.questions.map((question: any) => {
                const questionNumber = getQuestionNumber(question.id);
                
                return (
                  <div 
                    key={question.id}
                    className={`mb-5 d-flex align-items-center`}
                  >
                    <span className="badge bg-primary rounded-circle me-2 d-flex align-items-center justify-content-center" style={{ width: '36px', height: '36px', fontSize: '1rem' }}>
                      {questionNumber}
                    </span>
                    <input
                      id={`question-${question.id}`}
                      type="text"
                      className="form-control form-control-sm"
                      style={{ width: '200px' }}
                      value={answers[question.id] as string || ''}
                      onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        {shouldShowSeparator && <hr className="my-4" />}
      </div>
    );
  };

  // Render diagram group
  const renderDiagramGroup = (group: any, shouldShowSeparator: boolean) => {
    return (
      <div key={`diagram-group`}>
        <div className="row mb-4">
          {/* Left column: Image and question content */}
          <div className="col-md-8">
            <div className="pe-3">
              {/* Show image if available */}
              {group.questions[0]?.link && (
                <div className="mb-4">
                  <div className="border rounded p-3 bg-light">
                    <h6 className="fw-bold mb-3">Diagram:</h6>
                    <img
                      src={group.questions[0].link}
                      alt="Diagram for labeling"
                      className="img-fluid rounded mb-3"
                      style={{ maxHeight: "400px", maxWidth: "100%" }}
                    />
                    {/* Display all question contents */}
                    <div>
                      <h6 className="fw-bold mb-3">Questions:</h6>
                      {group.questions.map((question: any) => (
                        <div key={question.id} className="mb-3" style={{ lineHeight: '1.8' }}>
                          {question.content.includes('<') ? (
                            <span>{parse(DOMPurify.sanitize(question.content))}</span>
                          ) : (
                            <span>{question.content}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Input fields column for all questions in this group */}
          <div className="col-md-4">
            <div className="pt-3" style={{ lineHeight: '1.8' }}>
              {group.questions.map((question: any) => {
                const questionNumber = getQuestionNumber(question.id);
                
                return (
                  <div 
                    key={question.id}
                    className={`mb-5 d-flex align-items-center`}
                  >
                    <span className="badge bg-primary rounded-circle me-2 d-flex align-items-center justify-content-center" style={{ width: '36px', height: '36px', fontSize: '1rem' }}>
                      {questionNumber}
                    </span>
                    <input
                      id={`question-${question.id}`}
                      type="text"
                      className="form-control form-control-sm"
                      style={{ width: '200px' }}
                      value={answers[question.id] as string || ''}
                      onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        {shouldShowSeparator && <hr className="my-4" />}
      </div>
    );
  };

  // Render single question based on type
  const renderSingleQuestion = (group: any, shouldShowSeparator: boolean) => {
    const question = group.question;
    const questionNumber = getQuestionNumber(question.id);
    
    switch (question.questionType) {
      case 'SingleChoice':
      case 'MultipleChoice':
        return renderChoiceQuestion(question, questionNumber, shouldShowSeparator);
      case 'ShortAnswer':
        return renderShortAnswerQuestion(question, questionNumber, shouldShowSeparator);
      default:
        return (
          <div key={question.id}>
            <div className="alert alert-warning">
              Unsupported question type: {question.questionType}
            </div>
            {shouldShowSeparator && <hr className="my-4" />}
          </div>
        );
    }
  };

  // Render choice questions (Single/Multiple)
  const renderChoiceQuestion = (question: any, questionNumber: number, shouldShowSeparator: boolean) => {
    const choices = question.choices.split('|').map((c: string) => c.trim()).filter((c: string) => c);
    const isMultipleChoice = question.questionType === 'MultipleChoice';
    
    return (
      <div key={question.id}>
        <div 
          id={`question-${question.id}`}
          className={`question-item p-3 ${
            highlightedQuestion === question.id ? 'border border-warning rounded p-4' : ''
          }`}
          style={{ transition: 'all 0.5s ease' }}
        >
          <div className="d-flex align-items-start mb-3">
            <span className="badge bg-primary rounded-circle me-3 d-flex align-items-center justify-content-center" style={{ width: '36px', height: '36px', fontSize: '1rem' }}>
              {questionNumber}
            </span>
            <div className="flex-grow-1">
              {question.content.includes('<') ? (
                <div className="mb-3">{parse(DOMPurify.sanitize(question.content))}</div>
              ) : (
                <p className="mb-3">{question.content}</p>
              )}
              {choices.map((choice: string, index: number) => {
                const choiceValue = choice.trim();
                const currentAnswer = answers[question.id] || '';
                const currentAnswers = currentAnswer 
                  ? currentAnswer.split('|').filter(a => a.trim()) 
                  : [];
                const isChecked = isMultipleChoice 
                  ? currentAnswers.includes(choiceValue)
                  : answers[question.id] === choiceValue;
                
                return (
                  <div key={index} className="form-check mb-2">
                    <input
                      className="form-check-input border-dark"
                      type={isMultipleChoice ? "checkbox" : "radio"}
                      name={isMultipleChoice ? undefined : `question-${question.id}`}
                      id={`q${question.id}-${index}`}
                      value={choiceValue}
                      checked={isChecked}
                      onChange={(e) => {
                        if (isMultipleChoice) {
                          const cleanCurrentAnswer = answers[question.id] || '';
                          const cleanCurrentAnswers = cleanCurrentAnswer 
                            ? cleanCurrentAnswer.split('|').filter(a => a.trim()) 
                            : [];
                          
                          if (e.target.checked) {
                            const newAnswers = [...cleanCurrentAnswers, choiceValue];
                            const finalAnswer = newAnswers.join('|');
                            handleAnswerChange(question.id, finalAnswer);
                          } else {
                            const newAnswers = cleanCurrentAnswers.filter(a => a !== choiceValue);
                            const finalAnswer = newAnswers.join('|');
                            handleAnswerChange(question.id, finalAnswer);
                          }
                        } else {
                          handleAnswerChange(question.id, e.target.value);
                        }
                      }}
                    />
                    <label className="form-check-label" htmlFor={`q${question.id}-${index}`}>
                      {choiceValue}
                    </label>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        {shouldShowSeparator && <hr className="my-4" />}
      </div>
    );
  };

  // Render short answer question
  const renderShortAnswerQuestion = (question: any, questionNumber: number, shouldShowSeparator: boolean) => {
    return (
      <div key={question.id}>
        <div 
          id={`question-${question.id}`}
          className={`question-item p-3 ${
            highlightedQuestion === question.id ? 'border border-warning rounded p-4' : ''
          }`}
          style={{ transition: 'all 0.5s ease' }}
        >
          <div className="d-flex align-items-start mb-3">
            <span className="badge bg-primary rounded-circle me-3 d-flex align-items-center justify-content-center" style={{ width: '36px', height: '36px', fontSize: '1rem' }}>
              {questionNumber}
            </span>
            <div className="flex-grow-1">
              {question.content.includes('<') ? (
                <div className="mb-3">{parse(DOMPurify.sanitize(question.content))}</div>
              ) : (
                <p className="mb-3">{question.content}</p>
              )}
              <input
                type="text"
                className="form-control w-50"
                value={answers[question.id] as string || ''}
                onChange={(e) => handleAnswerChange(question.id, e.target.value)}
              />
            </div>
          </div>
        </div>
        {shouldShowSeparator && <hr className="my-4" />}
      </div>
    );
  };

  return (
    <>
    <style>{`
      .form-control:focus {
        border-color: #0d6efd !important;
        box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25) !important;
        outline: 0 !important;
      }
    `}</style>
    <div className="container-fluid py-4 px-3 px-lg-4">
      {/* Loading State */}
      {loading && (
        <div className="row">
          <div className="col-12">
            <div className="card border-0 shadow-sm">
              <div className="card-body text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-3 mb-0">Loading test data...</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="row">
          <div className="col-12">
            <div className="alert alert-danger" role="alert">
              <h4 className="alert-heading">Error!</h4>
              <p>{error}</p>
              <hr />
              <p className="mb-0">Please try refreshing the page or contact support if the problem persists.</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Content - Only show when not loading and no error */}
      {!loading && !error && sections.length > 0 && (
        <>
          {/* Header */}
          <div className="row mb-4">
            <div className="col-12">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h4 className="mb-0">{testConfig.title}</h4>
                </div>
                <div>
                  <button className="btn btn-outline-secondary" onClick={handleLeave}>Leave</button>
                </div>
              </div>
            </div>
          </div>

      {/* Audio Player Bar - Top */}
      <div className="row mb-4">
        <div className="col-12">
          {/* Simple Audio Player */}
          <div className="border rounded-3 shadow-sm p-3 bg-light">
            {/* Recording tabs row */}
            <div className="row mb-3">
              <div className="col-12">
                <div className="d-flex">
                  {sections && sections.length > 0 && sections.map((section, index) => (
                    <button
                      key={section.id}
                      className={`btn btn-sm me-2 ${
                        currentSection === index 
                          ? 'btn-primary' 
                          : 'btn-outline-secondary'
                      }`}
                      onClick={() => setCurrentSection(index)}
                    >
                      {section.title}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Audio Controls row */}
            <div className="row align-items-center">
              <div className="col-12">
                <audio
                  key={`audio-${currentSection}`}
                  ref={audioRef}
                  src={sections && sections[currentSection] && sections[currentSection].audioUrl ? sections[currentSection].audioUrl : undefined}
                  onTimeUpdate={handleTimeUpdate}
                  onLoadedMetadata={handleLoadedMetadata}
                  onEnded={() => setIsPlaying(false)}
                  onError={(e) => console.error('Audio error:', e)}
                  className="d-none"
                  preload="metadata"
                />

                <div className="d-flex align-items-center">
                  {/* Play/Pause Button */}
                  <button className="btn btn-outline-secondary me-3" onClick={handlePlayPause}>
                    <i className={`isax ${isPlaying ? 'isax-pause' : 'isax-play'}`}></i>
                  </button>
                  
                  {/* Progress Bar */}
                  <div className="flex-grow-1 me-3 position-relative">
                    <div className="progress mb-1" style={{ height: '8px', cursor: 'pointer', backgroundColor: '#e9ecef' }}>
                      <div 
                        className="progress-bar" 
                        style={{ 
                          width: `${duration ? (currentTime / duration) * 100 : 0}%`,
                          backgroundColor: '#342777'
                        }}
                      ></div>
                    </div>
                    <div className="d-flex justify-content-between">
                      <span className="small text-muted">{formatTime(currentTime)}</span>
                      <span className="small text-muted">{formatTime(duration)}</span>
                    </div>
                    {/* Invisible range input for seeking functionality */}
                    <input
                      type="range"
                      className="form-range position-absolute opacity-0"
                      style={{ 
                        height: '8px', 
                        top: '0', 
                        left: '0', 
                        width: '100%',
                        cursor: 'pointer',
                        margin: '0'
                      }}
                      min="0"
                      max={duration || 0}
                      value={currentTime}
                      onChange={handleSeek}
                    />
                  </div>
                  
                  {/* Control Icons */}
                  <div className="d-flex align-items-center">
                    <button 
                      className="btn btn-outline-secondary btn-sm me-2"
                      onClick={handleMuteToggle}
                      title={isMuted ? 'Unmute' : 'Mute'}
                    >
                      <i className={`isax ${isMuted ? 'isax-volume-slash' : 'isax-volume-high'}`}></i>
                    </button>
                    
                    {/* Settings Dropdown */}
                    <div className="position-relative">
                      <button 
                        className="btn btn-outline-secondary btn-sm"
                        onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                        title="Playback Speed"
                      >
                        <i className="isax isax-setting"></i>
                        <span className="ms-1 small">{playbackSpeed}x</span>
                      </button>
                      
                      {showSpeedMenu && (
                        <div 
                          className="position-absolute bg-white border rounded shadow-sm py-1"
                          style={{ 
                            top: '100%', 
                            right: '0', 
                            minWidth: '120px', 
                            zIndex: 1000,
                            marginTop: '4px'
                          }}
                        >
                          <div className="px-2 py-1 text-muted small border-bottom">Playback Speed</div>
                          {[0.5, 0.75, 1, 1.25, 1.5, 2].map((speed) => (
                            <button
                              key={speed}
                              className={`btn btn-sm w-100 text-start border-0 ${
                                playbackSpeed === speed ? 'bg-primary text-white' : 'btn-light'
                              }`}
                              onClick={() => handleSpeedChange(speed)}
                              style={{ borderRadius: '0' }}
                            >
                              {speed}x {speed === 1 ? '(Normal)' : ''}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>      
      <div className="row">
        {/* Questions Column - Now takes more space */}
        <div className="col-lg-9">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              {/* Questions Content - Unified Rendering */}
              {(() => {
                if (!sections?.length || currentSection >= sections.length) {
                  return <div className="text-center py-4"><p className="text-muted">No content available.</p></div>;
                }

                const currentSectionData = sections[currentSection];
                if (!currentSectionData) {
                  return <div className="text-center py-4"><p className="text-muted">Section data not found.</p></div>;
                }

                // Sort questions by their order to maintain proper sequence
                const sortedQuestions = [...currentSectionData.questions].sort((a, b) => a.order - b.order);
                
                // Group consecutive FormCompletion, Matching, and DiagramLabeling questions together
                const questionGroups: any[] = [];
                let currentGroup: any = null;
                
                sortedQuestions.forEach((question) => {
                  switch (question.questionType) {
                    case 'FormCompletion':
                      if (!currentGroup || currentGroup.type !== 'form') {
                        currentGroup = { type: 'form', questions: [question] };
                        questionGroups.push(currentGroup);
                      } else {
                        currentGroup.questions.push(question);
                      }
                      break;
                    
                    case 'Matching':
                      if (!currentGroup || currentGroup.type !== 'matching') {
                        currentGroup = { type: 'matching', questions: [question] };
                        questionGroups.push(currentGroup);
                      } else {
                        currentGroup.questions.push(question);
                      }
                      break;
                    
                    case 'DiagramLabeling':
                      if (!currentGroup || currentGroup.type !== 'diagram') {
                        currentGroup = { type: 'diagram', questions: [question] };
                        questionGroups.push(currentGroup);
                      } else {
                        currentGroup.questions.push(question);
                      }
                      break;
                    
                    default:
                      // All other question types (SingleChoice, MultipleChoice, etc.) are treated as single questions
                      currentGroup = { type: 'single', question: question };
                      questionGroups.push(currentGroup);
                      break;
                  }
                });
                
                return (
                  <div>
                    {questionGroups.map((group, groupIndex) => {
                      const isLastGroup = groupIndex === questionGroups.length - 1;
                      const nextGroup = !isLastGroup ? questionGroups[groupIndex + 1] : null;
                      
                      // Determine if we should show separator
                      let shouldShowSeparator = false;
                      if (!isLastGroup && nextGroup) {
                        if (group.type !== nextGroup.type) {
                          // Different group types (form, matching, diagram vs single)
                          shouldShowSeparator = true;
                        } else if (group.type === 'single' && nextGroup.type === 'single') {
                          // Both are single questions, check their question types
                          const currentQuestionType = group.question.questionType;
                          const nextQuestionType = nextGroup.question.questionType;
                          shouldShowSeparator = currentQuestionType !== nextQuestionType;
                        }
                      }
                      
                      return renderQuestionGroup(group, shouldShowSeparator);
                    })}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>

        {/* Right Column - Timer and Navigation */}
        <div className="col-lg-3">
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-body text-center">
              <h6 className="text-muted mb-1">Duration:</h6>
              <h2 className="text-danger mb-3">{formatTime(timeRemaining)}</h2>
              <button className="btn btn-primary w-100 mb-3" onClick={handleSubmitTest}>SUBMIT</button>
            </div>
          </div>

          {/* Dynamic Recording Navigation */}
          {sections && sections.length > 0 && sections.map((section, sectionIndex) => (
            <div key={section.id} className={`card border-0 shadow-sm ${sectionIndex > 0 ? 'mt-3' : ''}`}>
              <div className="card-header bg-light d-flex justify-content-between align-items-center">
                <span className="fw-bold">{section.title}</span>
              </div>
              <div className="card-body">
                <div className="row g-2 row-cols-5">
                  {section.questions.map((q) => {
                    // Calculate sequential question number across all sections
                    const allQuestions = sections.flatMap(s => s.questions);
                    const globalQuestionIndex = allQuestions.findIndex(question => question.id === q.id);
                    const questionNumber = globalQuestionIndex + 1;
                    
                    return (
                    <div key={q.id} className="col">
                      <button 
                        className={`btn btn-sm w-100 ${
                          answers[q.id] ? 'btn-success' : 
                          currentSection === sectionIndex ? 'btn-outline-primary' : 'btn-outline-secondary'
                        }`}
                        onClick={() => {
                          // Switch to the correct section if not already there
                          if (currentSection !== sectionIndex) {
                            setCurrentSection(sectionIndex);
                          }
                          // Scroll to and highlight the specific question
                          setTimeout(() => {
                            const questionElement = document.getElementById(`question-${q.id}`);
                            if (questionElement) {
                              // Scroll to the question
                              questionElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                              // Add highlight effect
                              setHighlightedQuestion(q.id);
                              // Remove highlight after 500ms
                              setTimeout(() => setHighlightedQuestion(null), 500);
                              
                              // Focus based on question type
                              switch (q.questionType) {
                                case 'FormCompletion':
                                  // For form completion, focus the input directly
                                  const inputElement = questionElement as HTMLInputElement;
                                  if (inputElement && inputElement.tagName === 'INPUT') {
                                    inputElement.focus();
                                  } else {
                                    // If questionElement is a container, find the input inside
                                    const input = questionElement.querySelector('input[type="text"]') as HTMLInputElement;
                                    if (input) input.focus();
                                  }
                                  break;
                                
                                case 'Matching':
                                case 'DiagramLabeling':
                                case 'ShortAnswer':
                                  // For matching, diagram labeling, and short answer questions, focus the input field
                                  const textInput = questionElement.querySelector('input[type="text"]') as HTMLInputElement;
                                  if (textInput) textInput.focus();
                                  break;
                                
                                case 'SingleChoice':
                                case 'MultipleChoice':
                                  // For single choice or multiple choice, focus the first input (radio or checkbox)
                                  const firstInput = questionElement.querySelector('input[type="radio"], input[type="checkbox"]') as HTMLInputElement;
                                  if (firstInput) firstInput.focus();
                                  break;
                                
                                default:
                                  // For other question types, try to focus any input
                                  const anyInput = questionElement.querySelector('input') as HTMLInputElement;
                                  if (anyInput) anyInput.focus();
                                  break;
                              }
                            }
                          }, 100);
                        }}
                        title={`Go to question ${questionNumber}: ${q.content || 'Question'}`}
                      >
                        {questionNumber}
                      </button>
                    </div>
                  )
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      </>
      )}
    </div>
    <footer className="footer">
        <div className="footer-bottom">
        <div className="container">
          <div className="row row-gap-2">
            <div className="col-md-6">
              <div className="text-center text-md-start">
                <p className="text-white">Copyright &copy; 2025 IELTS-MOCK. All rights reserved.</p>
              </div>
            </div>
            <div className="col-md-6">
              <div>
                <ul className="d-flex align-items-center justify-content-center justify-content-md-end footer-link">
                  <li><Link to="/terms-and-conditions">Terms & Conditions</Link></li>
                  <li><Link to="/privacy-policy">Privacy Policy</Link></li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        </div>
    </footer>
    </>
  );
}

export default NewListeningTestPage;
