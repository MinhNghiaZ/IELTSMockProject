import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { deleteQuestion } from "../../../services/questionService";
import type { Question } from "../../../types/Question";
import { confirmToast } from "../../layout/confirmToast";
import parse from 'html-react-parser';
import DOMPurify from 'dompurify';

interface QuestionDisplayProps {
    question: Question;
    questionNumber?: number;
    onEdit?: (question: Question) => void;
    onDelete?: (questionId: number) => void;
    showActions?: boolean;
}

function QuestionDisplay({ question, questionNumber, onEdit, onDelete, showActions = true }: QuestionDisplayProps) {
    // State to track image loading errors
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
        Paragraph: "Paragraph",
        DiagramLabeling : "Diagram Labeling",
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
            Paragraph: "bg-secondary"
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
        
        // Check for Discord CDN URLs (they're always images if they contain attachments)
        if (url.includes('cdn.discordapp.com') && url.includes('attachments')) return true;
        
        return false;
    };

    // Truncate long text for display
    const truncateText = (text: string, maxLength: number = 100): string => {
        if (!text) return "";
        return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
    };

    // Handle edit click
    const handleEdit = () => {
        if (onEdit) {
            console.log("Editing question:", question);
            onEdit(question);
        }
    };

    // Handle delete click
    const handleDelete = () => {
        // if (onDelete && window.confirm("Are you sure you want to delete this question?")) {
        //     deleteQuestion(question.id).then(() => {
        //         onDelete(question.id);
        //     }).catch((error) => {
        //         console.error("Failed to delete question:", error);
        //         toast.error("Failed to delete question. Please try again.");
        //     });
        // }
        confirmToast("Are you sure you want to delete this question?", () => {
            if (onDelete) {
                deleteQuestion(question.id).then(() => {
                    onDelete(question.id);
                }).catch((error) => {
                    console.error("Failed to delete question:", error);
                    toast.error("Failed to delete question. Please try again.");
                });
            }
        });
    };

    const choices = parseChoices(question.choices);

    return (
        <div className="card mb-3 shadow-sm">
            <div className="card-body">
                <div className="row align-items-start">
                    {/* Question Number */}
                    <div className="col-auto">
                        <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center"
                            style={{ width: "40px", height: "40px", fontSize: "14px", fontWeight: "bold" }}>
                            {questionNumber || question.order}
                        </div>
                    </div>

                    {/* Question Content */}
                    <div className="col">
                        <div className="row">
                            {/* Question Type and Content */}
                            <div className="col-lg-8">
                                <div className="d-flex align-items-center mb-2">
                                    <span className={`badge ${getQuestionTypeBadgeClass(question.questionType)} me-2`}>
                                        {getQuestionTypeLabel(question.questionType)}
                                    </span>
                                    <small className="text-muted">ID: {question.id}</small>
                                </div>

                                <h6 className="mb-2 fw-semibold">
                                    Question Content:
                                </h6>
                                <div className="mb-2 fst-normal">
                                    {question.content && question.content.includes('<') ? (
                                        <div>{parse(DOMPurify.sanitize(truncateText(question.content, 150)))}</div>
                                    ) : (
                                        <p className="mb-0">{truncateText(question.content, 150)}</p>
                                    )}
                                </div>

                                {/* Image Preview (if link is an image) */}
                                {question.link && isImageUrl(question.link) && (
                                    <div className="mb-3">
                                        <small className="text-muted fw-semibold d-block mb-2">
                                            <i className="bi bi-image me-1"></i>
                                            Diagram Image:
                                        </small>
                                        <div className="border rounded p-2 bg-light">
                                            {!imageError ? (
                                                <img
                                                    src={`${question.link}?v=${Date.now()}`}
                                                    alt="Question diagram"
                                                    className="img-fluid rounded"
                                                    style={{ 
                                                        maxHeight: "200px", 
                                                        maxWidth: "100%",
                                                        objectFit: "contain"
                                                    }}
                                                    onError={() => setImageError(true)}
                                                />
                                            ) : (
                                                <div className="text-center text-muted p-3">
                                                    <i className="bi bi-image-fill fs-2 d-block mb-2"></i>
                                                    <small>Failed to load image</small>
                                                    <br />
                                                    <a 
                                                        href={question.link} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer" 
                                                        className="text-decoration-none"
                                                    >
                                                        <small>View Original Link</small>
                                                    </a>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Choices (if available) */}
                                {choices.length > 0 && (
                                    <div className="mb-2">
                                        <small className="text-muted fw-semibold">Choices:</small>
                                        <div className="mt-1">
                                            {choices.slice(0, 3).map((choice, index) => (
                                                <span key={index} className="badge bg-light text-dark me-1 mb-1">
                                                    {String.fromCharCode(65 + index)}. {truncateText(choice, 30)}
                                                </span>
                                            ))}
                                            {choices.length > 3 && (
                                                <span className="badge bg-light text-muted">
                                                    +{choices.length - 3} more
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Correct Answer */}
                                {question.correctAnswer && (
                                    <div className="mb-2">
                                        <small className="text-success fw-semibold">
                                            <i className="bi bi-check-circle me-1"></i>
                                            Correct Answer:
                                        </small>
                                        <span className="ms-1 text-success">
                                            {truncateText(question.correctAnswer, 50)}
                                        </span>
                                    </div>
                                )}
                            </div>
                            
                            {/* Question Details */}
                            <div className="col-lg-4">
                                <div className="text-end text-lg-start">
                                    {/* Question Metadata */}
                                    <div className="mb-2">
                                        <small className="text-muted d-block">
                                            <i className="bi bi-hash me-1"></i>
                                            Order: {question.order}
                                        </small>
                                        <small className="text-muted d-block">
                                            <i className="bi bi-folder me-1"></i>
                                            Parent ID: {question.parentId}
                                        </small>
                                        {question.link && (
                                            <small className="text-muted d-block">
                                                <i className="bi bi-link-45deg me-1"></i>
                                                <a href={question.link} target="_blank" rel="noopener noreferrer" className="text-decoration-none">
                                                    View Link
                                                </a>
                                            </small>
                                        )}
                                    </div>

                                    {/* Explanation Preview */}
                                    {question.explanation && (
                                        <div className="mb-2">
                                            <small className="text-info fw-semibold">
                                                <i className="bi bi-info-circle me-1"></i>
                                                Has Explanation
                                            </small>
                                            <div className="mt-1">
                                                <small className="text-muted">
                                                    {truncateText(question.explanation, 60)}
                                                </small>
                                            </div>
                                        </div>
                                    )}

                                    {/* Action Buttons */}
                                    {showActions && (
                                        <div className="mt-3">
                                            <div className="btn-group btn-group-lg">
                                                <button
                                                    type="button"
                                                    className="btn btn-outline-primary"
                                                    onClick={handleEdit}
                                                    title="Edit Question"
                                                >
                                                    <i className="bi bi-pencil"></i>
                                                </button>
                                                <button
                                                    type="button"
                                                    className="btn btn-outline-danger"
                                                    onClick={handleDelete}
                                                    title="Delete Question"
                                                >
                                                    <i className="bi bi-trash"></i>
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default QuestionDisplay;