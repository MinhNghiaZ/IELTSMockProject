import { useState, useEffect } from 'react';
import type { Question, QuestionToUpdate } from '../../../types/Question';
import { toast } from 'react-toastify';
import { updateQuestion } from '../../../services/questionService';
import { Editor } from "@tinymce/tinymce-react";

interface FillInTheBlankUpdateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (updatedQuestion: Question) => void;
    question: Question;
}

function FillInTheBlankUpdateModal({ 
    isOpen, 
    onClose, 
    onSubmit, 
    question 
}: FillInTheBlankUpdateModalProps) {
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

    // Validation function
    const validateForm = () => {
        // if (!questionContent.trim()) {
        //     toast.error('Question content is required');
        //     return false;
        // }

        // if (!questionContent.includes('_')) {
        //     toast.error('Question content must contain at least one blank (underscore) to indicate where users should fill in answers');
        //     return false;
        // }

        if (!correctAnswer.trim()) {
            toast.error('Correct answer is required');
            return false;
        }

        return true;
    };

    const handleSubmit = () => {
        // Check if there are any changes
        if (!hasChanges) {
            toast.info('No changes to save');
            return;
        }

        if (!validateForm()) {
            return;
        }

        if (isSubmitting) return; // Prevent multiple submissions

        const data: QuestionToUpdate = {
            questionType: 'FormCompletion',
            content: questionContent,
            choices: '', // Fill-in-the-blank questions don't use choices
            correctAnswer: correctAnswer,
            explanation: explanation,
            parentId: question.parentId,
            order: question.order,
            link: question.link || '',
        };

        console.log('Updating fill-in-the-blank question with data:', data);
        
        setIsSubmitting(true);

        // Call API to update question
        toast.promise(
            updateQuestion(question.id, data),
            {
                pending: 'Updating question...',
                success: 'Question updated successfully!',
                error: 'Failed to update question'
            }
        ).then((updatedQuestion) => {
            console.log('Fill-in-the-blank question updated:', updatedQuestion);
            onSubmit(updatedQuestion);
            onClose();
        }).catch(() => {
            // Error is already handled by toast.promise
        }).finally(() => {
            setIsSubmitting(false);
        });
    };

    if (!isOpen) return null;

    return (
        <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-lg modal-dialog-centered">
                <div className="modal-content" style={{ maxHeight: "90vh" }}>
                    <div className="modal-header">
                        <h5 className="modal-title">Edit Form Completion Question</h5>
                        <button
                            type="button"
                            className="btn-close border-0 rounded-1"
                            aria-label="Close"
                            onClick={onClose}
                        ></button>
                    </div>
                    <div className="modal-body" style={{ maxHeight: "calc(90vh - 120px)", overflowY: "auto" }}>
                        {/* Question Content */}
                        <div className="mb-3">
                            <label htmlFor="questionContent" className="form-label fw-bold">
                                Question Content
                            </label>
                            {/* <textarea
                                className="form-control"
                                id="questionContent"
                                rows={3}
                                value={questionContent}
                                onChange={(e) => {
                                    setQuestionContent(e.target.value);
                                    setHasChanges(true);
                                }}
                                placeholder="The capital of France is _______"
                            ></textarea> */}
                            <Editor
                                tinymceScriptSrc="/tinymce/tinymce.min.js"
                                licenseKey='gpl'
                                value={questionContent}
                                onEditorChange={(content: string) => {
                                    setQuestionContent(content);
                                    setHasChanges(true);
                                }}
                                init={{
                                height: 300,
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
                                placeholder: 'The capital of France is _______',
                                content_style: 'body { font-family: Arial, sans-serif; font-size: 14px; }',
                                }}
                            />
                            <small className="form-text text-muted">
                                Tip: Use underscores (___) to mark where students should type their answers
                            </small>
                        </div>

                        {/* Correct Answer */}
                        <div className="mb-3">
                            <label htmlFor="correctAnswer" className="form-label fw-bold">
                                Correct Answer
                            </label>
                            <input
                                type="text"
                                className="form-control"
                                id="correctAnswer"
                                value={correctAnswer}
                                onChange={(e) => {
                                    setCorrectAnswer(e.target.value);
                                    setHasChanges(true);
                                }}
                                placeholder="Enter the correct answer for the blank"
                            />
                            <small className="form-text text-muted">
                                Enter the exact text that should fill the blank
                            </small>
                        </div>

                        {/* Explanation */}
                        <div className="mb-3">
                            <label htmlFor="explanation" className="form-label fw-bold">
                                Explanation (optional)
                            </label>
                            <textarea
                                className="form-control"
                                id="explanation"
                                rows={2}
                                value={explanation}
                                onChange={(e) => {
                                    setExplanation(e.target.value);
                                    setHasChanges(true);
                                }}
                                placeholder="Enter explanation for the correct answer..."
                            ></textarea>
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button
                            type="button"
                            className="btn btn-secondary me-3 rounded-3"
                            onClick={onClose}
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            className={`btn rounded-3 ${hasChanges ? 'btn-primary' : 'btn-secondary'}`}
                            style={!hasChanges ? { backgroundColor: "#808080 ", borderColor: "#808080"} : {}}
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Updating...' : hasChanges ? 'Update Question' : 'No Changes'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default FillInTheBlankUpdateModal;
