import { useState, useEffect } from "react";
import type { QuestionWithUserChoice } from "../../types/Question";
import parse from 'html-react-parser';
import DOMPurify from 'dompurify';

interface SubmissionQuestionDisplayProps {
    question: QuestionWithUserChoice;
    questionNumber?: number;
}

function SubmissionQuestionDisplay({ question, questionNumber }: SubmissionQuestionDisplayProps) {
    const [imageError, setImageError] = useState(false);

    // Reset image error when question link changes
    useEffect(() => {
        setImageError(false);
    }, [question.link]);

    // Question types mapping
    const questionTypeLabels: Record<string, string> = {
        FillInTheBlank: "Fill In The Blank",
        MultipleChoice: "Multiple Choice",
        SingleChoice: "Single Choice",
        Matching: "Matching",
        DiagramLabeling: "Diagram Labeling",
        ShortAnswer: "Short Answer",
        FormCompletion: "Form Completion",
    };

    // Get question type display label
    const getQuestionTypeLabel = (type: string): string => {
        return questionTypeLabels[type] || type;
    };

    // Get question type badge color
    const getQuestionTypeBadgeClass = (type: string): string => {
        const badgeClasses: Record<string, string> = {
            FillInTheBlank: "bg-primary",
            MultipleChoice: "bg-success",
            SingleChoice: "bg-info",
            Matching: "bg-warning text-dark",
            DiagramLabeling: "bg-secondary",
            ShortAnswer: "bg-dark",
        };
        return badgeClasses[type] || "bg-dark";
    };

    // Parse choices if they exist (assuming JSON format)
    const parseChoices = (choices: string): string[] => {
        if (!choices) return [];
        try {
            return JSON.parse(choices);
        } catch {
            // If not JSON, try splitting by common delimiters
            return choices.split(/[,|;]/).map(choice => choice.trim()).filter(Boolean);
        }
    };

    // Check if a URL is an image
    const isImageUrl = (url: string): boolean => {
        if (!url) return false;
        
        // Check for common image extensions
        const imageExtensions = /\.(jpg|jpeg|png|gif|bmp|webp|svg)(\?.*)?$/i;
        if (imageExtensions.test(url)) return true;
        
        // Check for Discord CDN URLs
        if (url.includes('cdn.discordapp.com') && url.includes('attachments')) return true;
        
        return false;
    };

    // Check if a URL is an audio file
    const isAudioUrl = (url: string): boolean => {
        if (!url) return false;
        const audioExtensions = /\.(mp3|wav|ogg|m4a|aac)(\?.*)?$/i;
        return audioExtensions.test(url);
    };

    // Check if user's answer is correct
    const isCorrect = (): boolean => {
        if (!question.answer || !question.correctAnswer) return false;
        
        // Normalize user's answer
        const userAnswer = question.answer.trim().toLowerCase();
        
        // Split correct answers by | delimiter
        const correctAnswers = question.correctAnswer
            .split('|')
            .map(ans => ans.trim().toLowerCase())
            .filter(ans => ans.length > 0);
        
        // Check if user's answer matches any of the correct answers
        return correctAnswers.includes(userAnswer);
    };

    const choices = parseChoices(question.choices);
    const userAnswerIsCorrect = isCorrect();

    return (
        <div className={`card mb-3 border-start border-4 ${userAnswerIsCorrect ? 'border-success' : 'border-danger'}`}>
            <div className="card-body">
                <div className="row align-items-start">
                    {/* Question Number */}
                    <div className="col-auto">
                        <div 
                            className={`${userAnswerIsCorrect ? 'bg-success' : 'bg-danger'} text-white rounded-circle d-flex align-items-center justify-content-center`}
                            style={{ width: "40px", height: "40px", fontSize: "14px", fontWeight: "bold" }}
                        >
                            {questionNumber || question.order}
                        </div>
                    </div>

                    {/* Question Content */}
                    <div className="col">
                        {/* Question Type Badge */}
                        <div className="mb-3">
                            <span className={`badge ${getQuestionTypeBadgeClass(question.questionType)} me-2`}>
                                {getQuestionTypeLabel(question.questionType)}
                            </span>
                            {userAnswerIsCorrect ? (
                                <span className="badge bg-success">
                                    <i className="bi bi-check-circle me-1"></i>
                                    Correct
                                </span>
                            ) : (
                                <span className="badge bg-danger">
                                    <i className="bi bi-x-circle me-1"></i>
                                    Incorrect
                                </span>
                            )}
                        </div>

                        {/* Question Content */}
                        <h6 className="mb-3 fw-semibold text-dark">
                            {/* {question.content} */}
                            {parse(DOMPurify.sanitize(question.content))}
                        </h6>

                        {/* Image Preview (if link is an image) */}
                        {question.link && isImageUrl(question.link) && (
                            <div className="mb-3">
                                <small className="text-muted fw-semibold d-block mb-2">
                                    <i className="bi bi-image me-1"></i>
                                    Diagram:
                                </small>
                                <div className="border rounded p-2 bg-light">
                                    {!imageError ? (
                                        <img
                                            src={`${question.link}?v=${Date.now()}`}
                                            alt="Question diagram"
                                            className="img-fluid rounded"
                                            style={{ 
                                                maxHeight: "300px", 
                                                maxWidth: "100%",
                                                objectFit: "contain"
                                            }}
                                            onError={() => setImageError(true)}
                                        />
                                    ) : (
                                        <div className="text-center text-muted p-3">
                                            <i className="bi bi-image-fill fs-1"></i>
                                            <p className="mb-0 mt-2">Failed to load image</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Audio Player (if link is an audio file) */}
                        {question.link && isAudioUrl(question.link) && (
                            <div className="mb-3">
                                <small className="text-muted fw-semibold d-block mb-2">
                                    <i className="bi bi-volume-up me-1"></i>
                                    Audio:
                                </small>
                                <audio controls className="w-100">
                                    <source src={question.link} />
                                    Your browser does not support the audio element.
                                </audio>
                            </div>
                        )}

                        {/* Choices Display (if available) */}
                        {choices.length > 0 && (
                            <div className="mb-3">
                                <small className="text-muted fw-semibold d-block mb-2">Choices:</small>
                                <div className="list-group">
                                    {choices.map((choice, index) => {
                                        const choiceLetter = String.fromCharCode(65 + index);
                                        const isUserChoice = question.answer === choice || question.answer === choiceLetter;
                                        const isCorrectChoice = question.correctAnswer === choice || question.correctAnswer === choiceLetter;

                                        return (
                                            <div 
                                                key={index} 
                                                className={`list-group-item d-flex align-items-start ${
                                                    isCorrectChoice ? 'list-group-item-success' : 
                                                    isUserChoice ? 'list-group-item-danger' : ''
                                                }`}
                                            >
                                                <span className="fw-bold me-2">{choiceLetter}.</span>
                                                <span className="flex-grow-1">{choice}</span>
                                                {isCorrectChoice && (
                                                    <i className="bi bi-check-circle-fill text-success ms-2"></i>
                                                )}
                                                {isUserChoice && !isCorrectChoice && (
                                                    <i className="bi bi-x-circle-fill text-danger ms-2"></i>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* User Answer and Correct Answer */}
                        <div className="row">
                            <div className="col-md-6">
                                <div className="mb-2">
                                    <small className="text-muted fw-semibold d-block mb-1">
                                        <i className="bi bi-pencil me-1"></i>
                                        Your Answer:
                                    </small>
                                    <div className={`p-2 rounded ${userAnswerIsCorrect ? 'bg-success bg-opacity-10 text-success' : 'bg-danger bg-opacity-10 text-danger'}`}>
                                        <strong>{question.answer || "(No answer provided)"}</strong>
                                    </div>
                                </div>
                            </div>
                            <div className="col-md-6">
                                <div className="mb-2">
                                    <small className="text-muted fw-semibold d-block mb-1">
                                        <i className="bi bi-check-circle me-1"></i>
                                        Correct Answer:
                                    </small>
                                    <div className="p-2 rounded bg-success bg-opacity-10 text-success">
                                        <strong>{question.correctAnswer}</strong>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Explanation (if available) */}
                        {question.explanation && (
                            <div className="mt-3 p-3 bg-info bg-opacity-10 rounded">
                                <small className="text-info fw-semibold d-block mb-2">
                                    <i className="bi bi-lightbulb me-1"></i>
                                    {isAudioUrl(question.link) ? 'Transcript:' : 'Explanation:'}
                                </small>
                                <p className="mb-0 text-dark" style={{ whiteSpace: 'pre-wrap' }}>{question.explanation}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default SubmissionQuestionDisplay;