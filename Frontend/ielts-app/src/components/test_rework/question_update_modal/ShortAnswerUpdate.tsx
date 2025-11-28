import { useState, useEffect } from 'react';
import type { Question, QuestionToUpdate } from '../../../types/Question';
import { toast } from 'react-toastify';
import { updateQuestion } from '../../../services/questionService';
import { Editor } from "@tinymce/tinymce-react";

interface ShortAnswerUpdateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (updatedQuestion: Question) => void;
    question: Question;
}

function ShortAnswerUpdateModal({ 
    isOpen, 
    onClose, 
    onSubmit, 
    question 
}: ShortAnswerUpdateModalProps) {
    const [questionContent, setQuestionContent] = useState('');
    const [correctAnswer, setCorrectAnswer] = useState('');
    const [explanation, setExplanation] = useState('');
    const [hasChanges, setHasChanges] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Initialize form with question data when modal opens or question changes
    useEffect(() => {
        if (isOpen && question) {
            setQuestionContent(question.content || '');
            setCorrectAnswer(question.correctAnswer || '');
            setExplanation(question.explanation || '');
            setHasChanges(false); // Reset changes when modal opens
        }
    }, [isOpen, question]);

    // Check for changes
    useEffect(() => {
        if (question) {
            const contentChanged = questionContent !== (question.content || '');
            const answerChanged = correctAnswer !== (question.correctAnswer || '');
            const explanationChanged = explanation !== (question.explanation || '');
            
            setHasChanges(contentChanged || answerChanged || explanationChanged);
        }
    }, [questionContent, correctAnswer, explanation, question]);

    // Validation function
    const validateForm = () => {
        if (!questionContent.trim()) {
            toast.error('Question content is required');
            return false;
        }

        if (!correctAnswer.trim()) {
            toast.error('Correct answer is required');
            return false;
        }

        return true;
    };

    // Handle form submission
    const handleSubmit = async () => {
        if (!validateForm() || isSubmitting) return;

        const { id, ...rest } = question;
        const updatedQuestion: QuestionToUpdate = {
            ...rest,
            content: questionContent,
            correctAnswer: correctAnswer,
            explanation: explanation,
        };

        console.log('Updating Short Answer Question:', updatedQuestion);
        setIsSubmitting(true);

        try {
            await toast.promise(
                updateQuestion(id, updatedQuestion),
                {
                    pending: 'Updating short answer question...',
                    success: 'Question updated successfully!',
                    error: 'Failed to update question'
                }
            );

            // Create the updated question object to pass back
            const finalUpdatedQuestion: Question = {
                ...question,
                content: questionContent,
                correctAnswer: correctAnswer,
                explanation: explanation,
            };

            onSubmit(finalUpdatedQuestion);
            onClose();
        } catch (error) {
            console.error('Error updating question:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        if (isSubmitting) return;
        onClose();
    };

    if (!isOpen || !question) return null;

    return (
        <div
            className="modal show d-block"
            tabIndex={-1}
            style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
        >
            <div className="modal-dialog modal-lg modal-dialog-centered">
                <div className="modal-content" style={{ maxHeight: "90vh" }}>
                    <div className="modal-header">
                        <h5 className="modal-title">Edit Short Answer Question</h5>
                        <button
                            type="button"
                            className="btn-close border-0 rounded-1"
                            aria-label="Close"
                            onClick={handleClose}
                            disabled={isSubmitting}
                        ></button>
                    </div>
                    <div className="modal-body" style={{ maxHeight: "calc(90vh - 120px)", overflowY: "auto" }}>
                        {/* Question Content */}
                        <div className="mb-4">
                            <label htmlFor="questionContent" className="form-label fw-bold">
                                <i className="bi bi-question-circle me-1"></i>
                                Question Content
                                <span className="text-danger">*</span>
                            </label>
                            {/* <textarea
                                id="questionContent"
                                className="form-control"
                                rows={4}
                                placeholder="Enter the question content here..."
                                value={questionContent}
                                onChange={(e) => setQuestionContent(e.target.value)}
                                disabled={isSubmitting}
                            /> */}
                            <Editor
                                tinymceScriptSrc="/tinymce/tinymce.min.js"
                                licenseKey='gpl'
                                value={questionContent}
                                onEditorChange={(content: string) => {
                                    setQuestionContent(content);
                                }}
                                disabled={isSubmitting}
                                init={{
                                height: 200,
                                menubar: false,
                                plugins: [
                                    'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
                                    'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
                                    'insertdatetime', 'media', 'table', 'help', 'wordcount', 'hr'
                                ],
                                toolbar: 'undo redo | blocks | ' +
                                    'bold italic underline strikethrough | forecolor backcolor | ' +
                                    'alignleft aligncenter alignright alignjustify | ' +
                                    'bullist numlist outdent indent | ' +
                                    'hr | removeformat | table | link image | help',
                                placeholder: 'Why was World War I happened?',
                                content_style: 'body { font-family: Arial, sans-serif; font-size: 14px; }',
                                }}
                            />
                            <div className="form-text">
                                Write a clear question that requires a short written response.
                            </div>
                        </div>

                        {/* Correct Answer */}
                        <div className="mb-4">
                            <label htmlFor="correctAnswer" className="form-label fw-bold">
                                <i className="bi bi-check-circle me-1"></i>
                                Correct Answer
                                <span className="text-danger">*</span>
                            </label>
                            <input
                                type="text"
                                id="correctAnswer"
                                className="form-control"
                                placeholder="Enter the expected answer..."
                                value={correctAnswer}
                                onChange={(e) => setCorrectAnswer(e.target.value)}
                                disabled={isSubmitting}
                            />
                            <div className="form-text">
                                Provide the expected correct answer for this question.
                            </div>
                        </div>

                        {/* Explanation */}
                        <div className="mb-4">
                            <label htmlFor="explanation" className="form-label fw-bold">
                                <i className="bi bi-info-circle me-1"></i>
                                Explanation
                                <span className="text-muted">(Optional)</span>
                            </label>
                            <textarea
                                id="explanation"
                                className="form-control"
                                rows={3}
                                placeholder="Provide an explanation for the correct answer..."
                                value={explanation}
                                onChange={(e) => setExplanation(e.target.value)}
                                disabled={isSubmitting}
                            />
                            <div className="form-text">
                                Explain why this is the correct answer or provide additional context.
                            </div>
                        </div>

                        {/* Preview Section */}
                        {questionContent && (
                            <div className="mb-4">
                                <h6 className="fw-bold text-muted">
                                    <i className="bi bi-eye me-1"></i>
                                    Preview
                                </h6>
                                <div className="border rounded p-3 bg-light">
                                    <p className="mb-2 fw-medium">{questionContent}</p>
                                    <div className="mb-2">
                                        <small className="text-muted">Expected Answer:</small>
                                        <div className="badge bg-success ms-2">{correctAnswer || "Not specified"}</div>
                                    </div>
                                    {explanation && (
                                        <div>
                                            <small className="text-muted">Explanation:</small>
                                            <p className="small mb-0 mt-1">{explanation}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Changes indicator */}
                        {hasChanges && (
                            <div className="alert alert-info mb-3">
                                <i className="bi bi-info-circle me-2"></i>
                                You have unsaved changes.
                            </div>
                        )}
                    </div>
                    <div className="modal-footer">
                        <button
                            type="button"
                            className="btn btn-secondary me-3 rounded-3"
                            onClick={handleClose}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            className={`btn rounded-3 ${hasChanges ? 'btn-primary' : 'btn-secondary'}`}
                            style={!hasChanges ? { backgroundColor: "#808080 ", borderColor: "#808080"} : {}}
                            onClick={handleSubmit}
                            disabled={isSubmitting || !hasChanges || !questionContent.trim() || !correctAnswer.trim()}
                        >
                            {isSubmitting ? 'Updating...' : hasChanges ? 'Update Question' : 'No Changes'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ShortAnswerUpdateModal;