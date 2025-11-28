import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import parse from 'html-react-parser';
import DOMPurify from 'dompurify';
import type { TestWithAuthorName } from "../../../types/Test";
import { getAllQuestionsAndParagraphsWithTestId } from "../../../services/questionService";
import { getTestById } from "../../../services/testService";
import { SubmitTest } from "../../../services/submissionService";
import { useAuth } from "../../../contexts/AuthContext";
import { toast } from "react-toastify/unstyled";
import { confirmToast } from "../../layout/confirmToast";

interface ParagraphData {
  id: number;
  content: string;
  order: number;
  paragraphNumber: number;
}

interface QuestionData {
  id: number;
  questionType: string;
  content: string;
  choices: string;
  correctAnswer: string;
  explanation: string;
  order: number;
  parentId: number;
  link: string;
  paragraphNumber: number;
}

function ReadingPage() {
  const { id: testId } = useParams<{ id: string }>();
  const { user } = useAuth();

  // State management
  const [test, setTest] = useState<TestWithAuthorName | null>(null);
  const [paragraphs, setParagraphs] = useState<ParagraphData[]>([]);
  const [questions, setQuestions] = useState<QuestionData[]>([]);
  const [userAnswers, setUserAnswers] = useState<{
    [questionId: number]: string;
  }>({});
  const [currentParagraphNumber, setCurrentParagraphNumber] = useState(1);
  const [loading, setLoading] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState(60 * 60); // 60 minutes in seconds
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [modalImageSrc, setModalImageSrc] = useState("");
  // Store highlights per paragraph - now with start/end positions
  const [highlights, setHighlights] = useState<{
    [paragraphId: number]: { text: string; start: number; end: number }[];
  }>({});
  const navigate = useNavigate();

  //Fetch test data
  useEffect(() => {
    const fetchTestData = async () => {
      if (!testId) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        // Fetch test info and questions
        const [testData, allQuestionsData] = await Promise.all([
          getTestById(testId),
          getAllQuestionsAndParagraphsWithTestId(parseInt(testId)),
        ]);

        setTest(testData);

        // Separate paragraphs and questions based on ParentId
        const paragraphsData = allQuestionsData
          .filter((q) => q.parentId === 0) // ParentId = 0 means it's a paragraph
          .map((p) => ({
            id: p.id,
            content: p.content,
            order: p.order,
            paragraphNumber: p.order, //maybe this is not necessary, just use ORDER
          }))
          .sort((a, b) => a.order - b.order);

        //specific sequence of paragraphs
        const paragraphMap = new Map(
          paragraphsData.map((p) => [p.id, p.order])
        );

        const actualQuestions = allQuestionsData
          .filter((q) => q.parentId !== 0) // ParentId != 0 means it's a normal question
          .map((q) => ({
            id: q.id,
            questionType: q.questionType,
            content: q.content,
            choices: q.choices || "",
            correctAnswer: q.correctAnswer,
            explanation: q.explanation,
            order: q.order,
            parentId: q.parentId,
            link: q.link || "",
            paragraphNumber: paragraphMap.get(q.parentId) || 1,
          }))
          .sort((a, b) => {
            if (a.paragraphNumber !== b.paragraphNumber) {
              return a.paragraphNumber - b.paragraphNumber;
            }
            return a.order - b.order;
          });

        setParagraphs(paragraphsData);
        setQuestions(actualQuestions);
        setLoading(false);
      } catch (error) {
        setLoading(false);
        console.log("Error fetching test data:", error);
      }
    };

    fetchTestData();
  }, [testId]);

  // Timer effect
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          handleSubmitTest();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Handle Escape key for image modal
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && imageModalOpen) {
        closeImageModal();
      }
    };

    if (imageModalOpen) {
      document.addEventListener("keydown", handleEscapeKey);
    }

    return () => {
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, [imageModalOpen]);

  // Handle answer changes
  const handleAnswerChange = (questionId: number, answer: string) => {
    setUserAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  // Handle image modal
  const openImageModal = (imageSrc: string) => {
    setModalImageSrc(imageSrc);
    setImageModalOpen(true);
  };

  const closeImageModal = () => {
    setImageModalOpen(false);
    setModalImageSrc("");
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

    if (!currentParagraph) {
      return;
    }

    // Get the range to find position in the full text content
    const range = selection.getRangeAt(0);
    const preSelectionRange = range.cloneRange();
    const containerEl = document.querySelector('.paragraph-content');
    
    if (!containerEl) {
      selection.removeAllRanges();
      return;
    }

    preSelectionRange.selectNodeContents(containerEl);
    preSelectionRange.setEnd(range.startContainer, range.startOffset);
    const start = preSelectionRange.toString().length;
    const end = start + selectedText.length;

    const paragraphId = currentParagraph.id;
    const currentHighlights = highlights[paragraphId] || [];

    // Check if this specific position overlaps with any existing highlight
    const overlappingIndex = currentHighlights.findIndex(
      (h) => (start >= h.start && start < h.end) || (end > h.start && end <= h.end) || (start <= h.start && end >= h.end)
    );

    if (overlappingIndex !== -1) {
      // Remove the overlapping highlight
      const newHighlights = currentHighlights.filter((_, idx) => idx !== overlappingIndex);
      setHighlights((prev) => ({
        ...prev,
        [paragraphId]: newHighlights,
      }));
    } else {
      // Add new highlight with position
      setHighlights((prev) => ({
        ...prev,
        [paragraphId]: [...currentHighlights, { text: selectedText, start, end }],
      }));
    }

    // Clear selection
    selection.removeAllRanges();
  };

  // Paragraph navigation functions
  const goToNextParagraph = () => {
    const totalParagraphs = paragraphs.length;
    if (currentParagraphNumber < totalParagraphs) {
      setCurrentParagraphNumber(currentParagraphNumber + 1);
    }
  };

  const goToPreviousParagraph = () => {
    if (currentParagraphNumber > 1) {
      setCurrentParagraphNumber(currentParagraphNumber - 1);
    }
  };

  // Get current paragraph and its questions
  const currentParagraph = paragraphs.find(
    (p) => p.paragraphNumber === currentParagraphNumber
  );
  const currentParagraphQuestions = questions.filter(
    (q) => q.paragraphNumber === currentParagraphNumber
  );
  const totalParagraphs = paragraphs.length;

  // Apply highlights to paragraph content - memoized to avoid recalculation
  const highlightedContent = useMemo(() => {
    if (!currentParagraph) return "";

    const paragraphHighlights = highlights[currentParagraph.id] || [];
    if (paragraphHighlights.length === 0) {
      return currentParagraph.content;
    }

    // Work with HTML content directly
    let htmlContent = currentParagraph.content;
    
    // Create a temporary DOM to work with
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = DOMPurify.sanitize(htmlContent);
    
    // Sort highlights by start position (latest first to avoid position shifts)
    const sortedHighlights = [...paragraphHighlights].sort(
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
  }, [currentParagraph, highlights]);

  // Calculate global question numbers
  // may be not necessary, it is possible to render sequence of questions directly
  const getGlobalQuestionNumber = (questionId: number) => {
    // Sort all questions by paragraph and order
    const sortedQuestions = [...questions].sort((a, b) => {
      if (a.paragraphNumber !== b.paragraphNumber) {
        return a.paragraphNumber - b.paragraphNumber;
      }
      return a.order - b.order;
    });

    const index = sortedQuestions.findIndex((q) => q.id === questionId);
    return index + 1;
  };

  // Navigate to specific question and paragraph
  const navigateToQuestion = (questionId: number) => {
    const question = questions.find((q) => q.id === questionId);
    if (question && question.paragraphNumber !== currentParagraphNumber) {
      setCurrentParagraphNumber(question.paragraphNumber);
    }

    // Scroll to the question after a brief delay to ensure the paragraph has rendered
    setTimeout(() => {
      const questionElement = document.getElementById(`question-${questionId}`);
      if (questionElement) {
        questionElement.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 100);
  };

  // Get all questions with global numbering
  const getAllQuestionsWithGlobalNumbers = () => {
    return [...questions]
      .sort((a, b) => {
        if (a.paragraphNumber !== b.paragraphNumber) {
          return a.paragraphNumber - b.paragraphNumber;
        }
        return a.order - b.order;
      })
      .map((question, index) => ({
        ...question,
        globalNumber: index + 1,
      }));
  };

  // Handle leave test
  const handleLeave = () => {
    confirmToast(
      "Are you sure you want to leave the test? Your progress will be lost.",
      async () => {
        console.log("User confirmed leave");
        navigate(`/test/${testId}`);
      },
      () => {
        console.log("Leave cancelled");
      }
    );
  };

  // Submit test
  const handleSubmitTest = () => {
    console.log("Submitting test with answers:", userAnswers);
    confirmToast(
      `You have ${
        40 - Object.keys(userAnswers).length
      } questions unanswered. Do you want to submit the test now?`,
      async () => {
        try {
          const data = await SubmitTest({
            userId: user?.id || 0,
            testId: test ? test.id : 0,
            userAnswerMap: userAnswers,
          });
          console.log("this is data", data);
          toast.success("Test submitted successfully!");
          navigate(`/submission-detail/${data.submissionId}`);
        } catch (err) {
          console.error("Submit failed", err);
          toast.error("Failed to submit test. Please try again.");
        }
      },
      () => {
        // Optional cancel callback - just closes the toast
        console.log("Submit cancelled");
      }
    );
  };

  // Format time
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Render question based on type
  const renderQuestion = (question: QuestionData) => {
    const userAnswer = userAnswers[question.id] || "";

    switch (question.questionType) {
      case "MultipleChoice":
        return renderMultipleChoiceQuestion(question, userAnswer);
      case "SingleChoice": // Single selection from choices - use radio buttons
      case "OneChoice": // Used for T/F/NG questions - single selection from choices
        return renderSingleChoiceQuestion(question, userAnswer);
      case "FormCompletion":
      case "ShortAnswer":
        return renderFormCompletionQuestion(question, userAnswer);
      case "Matching":
        return renderMatchingQuestion(question, userAnswer);
      case "DiagramLabeling":
        return renderDiagramLabelingQuestion(question, userAnswer);
      default:
        return (
          <div className="alert alert-warning">
            Unsupported question type: {question.questionType}
          </div>
        );
    }
  };

  const renderMultipleChoiceQuestion = (
    question: QuestionData,
    userAnswer: string
  ) => {
    const choices = question.choices
      .split("|")
      .filter((choice) => choice.trim() !== "");

    // Parse user answers (pipe-separated string to array)
    const selectedAnswers = userAnswer ? userAnswer.split("|") : [];

    const handleMultipleChoiceChange = (choice: string, isChecked: boolean) => {
      let newAnswers = [...selectedAnswers];

      if (isChecked) {
        // Add choice if not already selected
        if (!newAnswers.includes(choice)) {
          newAnswers.push(choice);
        }
      } else {
        // Remove choice if unchecked
        newAnswers = newAnswers.filter((answer) => answer !== choice);
      }

      // Convert back to pipe-separated string
      const newAnswerString = newAnswers.join("|");
      handleAnswerChange(question.id, newAnswerString);
    };

    return (
      <div className="question-content">
        <p className="question-text">{parse(DOMPurify.sanitize(question.content))}</p>
        {question.link && (
          <div className="audio-player mb-3">
            <audio controls>
              <source src={question.link} type="audio/mpeg" />
              Your browser does not support the audio element.
            </audio>
          </div>
        )}
        <div className="choices">
          {choices.map((choice, index) => (
            <div key={index} className="form-check mb-2">
              <input
                className="form-check-input"
                type="checkbox"
                id={`question-${question.id}-choice-${index}`}
                value={choice}
                checked={selectedAnswers.includes(choice)}
                onChange={(e) =>
                  handleMultipleChoiceChange(choice, e.target.checked)
                }
              />
              <label
                className="form-check-label"
                htmlFor={`question-${question.id}-choice-${index}`}
              >
                {choice}
              </label>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderSingleChoiceQuestion = (
    question: QuestionData,
    userAnswer: string
  ) => {
    const choices = question.choices
      .split("|")
      .filter((choice) => choice.trim() !== "");

    return (
      <div className="question-content">
        <p className="question-text">{parse(DOMPurify.sanitize(question.content))}</p>
        {question.link && (
          <div className="audio-player mb-3">
            <audio controls>
              <source src={question.link} type="audio/mpeg" />
              Your browser does not support the audio element.
            </audio>
          </div>
        )}
        <div className="choices d-flex flex-wrap gap-3">
          {choices.map((choice, index) => (
            <div key={index} className="form-check">
              <input
                className="form-check-input"
                type="radio"
                name={`question-${question.id}`}
                id={`question-${question.id}-choice-${index}`}
                value={choice}
                checked={userAnswer === choice}
                onChange={(e) =>
                  handleAnswerChange(question.id, e.target.value)
                }
              />
              <label
                className="form-check-label"
                htmlFor={`question-${question.id}-choice-${index}`}
              >
                {parse(DOMPurify.sanitize(choice))}
              </label>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderFormCompletionQuestion = (
    question: QuestionData,
    userAnswer: string
  ) => {
    return (
      <div className="question-content">
        <p className="question-text">{parse(DOMPurify.sanitize(question.content))}</p>
        {question.link && (
          <div className="audio-player mb-3">
            <audio controls>
              <source src={question.link} type="audio/mpeg" />
              Your browser does not support the audio element.
            </audio>
          </div>
        )}
        <div className="form-completion-input">
          <input
            type="text"
            className="form-control"
            value={userAnswer}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            placeholder="Type your answer here"
          />
        </div>
      </div>
    );
  };

  const renderMatchingQuestion = (
    question: QuestionData,
    userAnswer: string
  ) => {
    const choices = question.choices
      .split("\n")
      .filter((choice) => choice.trim() !== "");

    return (
      <div className="question-content">
        <p className="question-text">{parse(DOMPurify.sanitize(question.content))}</p>
        {question.link && (
          <div className="audio-player mb-3">
            <audio controls>
              <source src={question.link} type="audio/mpeg" />
              Your browser does not support the audio element.
            </audio>
          </div>
        )}
        <div className="choices-list mb-3">
          <h6>Options:</h6>
          {choices.map((choice, index) => (
            <div key={index} className="choice-item">
              {parse(DOMPurify.sanitize(choice))}
            </div>
          ))}
        </div>
        <div className="matching-input">
          <label className="form-label">Your answer:</label>
          <input
            type="text"
            className="form-control"
            value={userAnswer}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            placeholder="Enter letter (A, B, C, etc.)"
            maxLength={10}
          />
        </div>
      </div>
    );
  };

  const renderDiagramLabelingQuestion = (
    question: QuestionData,
    userAnswer: string
  ) => {
    return (
      <div className="question-content">
        <p className="question-text">{parse(DOMPurify.sanitize(question.content))}</p>

        {/* Display diagram image if link exists */}
        {question.link && (
          <div className="diagram-image mb-3">
            <img
              src={question.link}
              alt="Diagram for labeling"
              className="img-fluid border rounded"
              style={{
                maxHeight: "400px",
                maxWidth: "100%",
                cursor: "pointer",
                transition: "transform 0.2s ease-in-out",
              }}
              onClick={() => openImageModal(question.link)}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "scale(1.02)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
              }}
              title="Click to enlarge image"
            />
            <small className="text-muted d-block mt-1">
              <i className="bi bi-zoom-in me-1"></i>
              Click image to enlarge
            </small>
          </div>
        )}

        {/* Input field for user answer */}
        <div className="diagram-labeling-input">
          <label className="form-label">Your answer:</label>
          <input
            type="text"
            className="form-control"
            value={userAnswer}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            placeholder="Enter your answer for this diagram"
          />
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ height: "100vh" }}
      >
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <>
    <div className="reading-test-container p-3">
      {/* Header Row - Test Name and Leave Button */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h4 className="mb-0">{test?.testName}</h4>
            </div>
            <div>
              <button className="btn btn-outline-secondary" onClick={handleLeave}>
                Leave
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Paragraph Navigation Bar */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="border rounded-3 shadow-sm p-3 bg-light">
            {/* Paragraph tabs row */}
            <div className="row">
              <div className="col-12">
                <div className="d-flex">
                  {paragraphs.map((paragraph, index) => (
                    <button
                      key={paragraph.id}
                      className={`btn btn-sm me-2 ${
                        currentParagraphNumber === paragraph.paragraphNumber
                          ? "btn-primary"
                          : "btn-outline-secondary"
                      }`}
                      onClick={() => setCurrentParagraphNumber(paragraph.paragraphNumber)}
                    >
                      Paragraph {paragraph.paragraphNumber}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        className="container-fluid"
        style={{ height: "calc(100vh - 100px)" }}
      >
        <div className="row h-100">
          {/* Reading Passage (Left Side) - Only Current Paragraph */}
          <div className="col-lg-6 col-md-12 h-100">
            <div className="reading-passages p-3 h-100 overflow-auto">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="mb-0">Reading Passage</h5>
                {/* Paragraph Navigation */}
                <div className="paragraph-navigation">
                  <button
                    className="btn btn-outline-secondary btn-sm me-2"
                    onClick={goToPreviousParagraph}
                    disabled={currentParagraphNumber === 1}
                  >
                    <i className="bi bi-arrow-left"></i> Previous Paragraph
                  </button>
                  <button
                    className="btn btn-outline-secondary btn-sm"
                    onClick={goToNextParagraph}
                    disabled={currentParagraphNumber === totalParagraphs}
                  >
                    Next Paragraph <i className="bi bi-arrow-right"></i>
                  </button>
                </div>
              </div>

              {currentParagraph && (
                <div className="paragraph-section">
                  <h6 className="paragraph-title">
                    Paragraph {currentParagraph.paragraphNumber}
                  </h6>
                  <div
                    className="paragraph-content p-3 border rounded bg-light"
                    onMouseUp={handleTextSelection}
                    style={{ userSelect: "text", cursor: "text" }}
                  >
                    {parse(DOMPurify.sanitize(highlightedContent))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Side - Questions and Navigation */}
          <div className="col-lg-6 col-md-12 h-100">
            <div className="row h-100">
              {/* Questions Panel */}
              <div className="col-lg-7 col-md-8 h-100">
                <div
                  className="questions-panel p-3 h-100 overflow-auto"
                  key={`paragraph-${currentParagraphNumber}`}
                >
                  {/* Questions Content */}
                  {currentParagraphQuestions.map((question) => (
                    <div
                      key={question.id}
                      id={`question-${question.id}`}
                      className="question-item mb-4 p-3 border rounded"
                    >
                      <div className="question-header mb-3">
                        <div className="d-flex justify-content-between align-items-center">
                          <h6 className="mb-0">
                            Question {getGlobalQuestionNumber(question.id)}
                          </h6>
                          <span className="badge bg-secondary">
                            {question.questionType}
                          </span>
                        </div>
                      </div>

                      <div className="question-content">
                        {renderQuestion(question)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column - Timer and Navigation */}
              <div className="col-lg-5 col-md-4 h-100">
                <div className="h-100 overflow-auto">
                  {/* Timer and Submit Card */}
                  <div className="card border-0 shadow-sm mb-3">
                    <div className="card-body text-center">
                      <h6 className="text-muted mb-1">Duration:</h6>
                      <h2 className="text-danger mb-3">{formatTime(timeRemaining)}</h2>
                      <button className="btn btn-primary w-100" onClick={handleSubmitTest}>
                        SUBMIT
                      </button>
                    </div>
                  </div>

                  {/* Dynamic Paragraph Navigation */}
                  {paragraphs.map((paragraph, paragraphIndex) => {
                    const paragraphQuestions = questions.filter(
                      (q) => q.paragraphNumber === paragraph.paragraphNumber
                    );
                    
                    return (
                      <div
                        key={paragraph.id}
                        className={`card border-0 shadow-sm ${paragraphIndex > 0 ? "mt-3" : ""}`}
                      >
                        <div className="card-header bg-light d-flex justify-content-between align-items-center">
                          <span className="fw-bold">Paragraph {paragraph.paragraphNumber}</span>
                        </div>
                        <div className="card-body">
                          <div className="row g-2 row-cols-5">
                            {paragraphQuestions.map((q) => {
                              const questionNumber = getGlobalQuestionNumber(q.id);
                              
                              return (
                                <div key={q.id} className="col">
                                  <button
                                    className={`btn btn-sm w-100 ${
                                      userAnswers[q.id]
                                        ? "btn-success"
                                        : currentParagraphNumber === paragraph.paragraphNumber
                                        ? "btn-outline-primary"
                                        : "btn-outline-secondary"
                                    }`}
                                    onClick={() => navigateToQuestion(q.id)}
                                    title={`Question ${questionNumber}`}
                                  >
                                    {questionNumber}
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Image Modal for Diagram Viewing */}
      {imageModalOpen && (
        <div
          className="modal show d-block"
          tabIndex={-1}
          style={{ backgroundColor: "rgba(0,0,0,0.8)", zIndex: 1050 }}
          onClick={closeImageModal}
        >
          <div className="modal-dialog modal-xl modal-dialog-centered">
            <div className="modal-content bg-transparent border-0">
              <div className="modal-header border-0 pb-0">
                <button
                  type="button"
                  className="btn-close btn-close-white ms-auto"
                  aria-label="Close"
                  onClick={closeImageModal}
                  style={{
                    fontSize: "1.5rem",
                    backgroundColor: "rgba(255,255,255,0.2)",
                    borderRadius: "50%",
                    padding: "10px",
                  }}
                ></button>
              </div>
              <div className="modal-body text-center p-0">
                <img
                  src={modalImageSrc}
                  alt="Enlarged diagram"
                  className="img-fluid rounded"
                  style={{
                    maxHeight: "85vh",
                    maxWidth: "100%",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
                  }}
                  onClick={(e) => e.stopPropagation()} // Prevent modal close when clicking image
                />
                <div className="mt-3">
                  <small className="text-white bg-dark bg-opacity-75 px-3 py-1 rounded">
                    <i className="bi bi-info-circle me-1"></i>
                    Click outside or press X to close
                  </small>
                </div>
              </div>
            </div>
          </div>
        </div>
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

export default ReadingPage;
