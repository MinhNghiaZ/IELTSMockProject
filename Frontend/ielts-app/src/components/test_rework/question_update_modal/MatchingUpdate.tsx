import { useState, useEffect } from 'react';
import type { Question, QuestionToUpdate } from '../../../types/Question';
import { toast } from 'react-toastify';
import { updateQuestion } from '../../../services/questionService';
import { Editor } from "@tinymce/tinymce-react";

interface MatchingUpdateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (updatedQuestion: Question) => void;
    question: Question;
}

function MatchingUpdateModal({ 
    isOpen, 
    onClose, 
    onSubmit, 
    question 
}: MatchingUpdateModalProps) {
    const [listOfOptions, setListOfOptions] = useState('');
    const [questionContent, setQuestionContent] = useState('');
    const [correctAnswer, setCorrectAnswer] = useState('');
    const [explanation, setExplanation] = useState('');
    const [hasChanges, setHasChanges] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Initialize form with question data when modal opens or question changes
    useEffect(() => {
        if (isOpen && question) {
            setListOfOptions(question.choices || '');
            setQuestionContent(question.content || '');
            setCorrectAnswer(question.correctAnswer || '');
            setExplanation(question.explanation || '');
            setHasChanges(false); // Reset changes when modal opens
        }
    }, [isOpen, question]);

    // Validation function
    const validateForm = () => {
        if (!listOfOptions.trim()) {
            toast.error('List of options is required');
            return false;
        }

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
            questionType: 'Matching',
            content: questionContent,
            choices: listOfOptions,
            correctAnswer: correctAnswer,
            explanation: explanation,
            parentId: question.parentId,
            order: question.order,
            link: question.link || '',
        };

        console.log('Updating matching question with data:', data);
        
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
            console.log('Matching question updated:', updatedQuestion);
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
                        <h5 className="modal-title">Edit Matching Question</h5>
                        <button
                            type="button"
                            className="btn-close border-0 rounded-1"
                            aria-label="Close"
                            onClick={onClose}
                        ></button>
                    </div>
                    <div className="modal-body" style={{ maxHeight: "calc(90vh - 120px)", overflowY: "auto" }}>
                        {/* List of Options */}
                        <div className="mb-3">
                            <label htmlFor="listOfOptions" className="form-label fw-bold">
                                List of Options
                            </label>
                            {/* <textarea
                                className="form-control"
                                id="listOfOptions"
                                rows={6}
                                value={listOfOptions}
                                onChange={(e) => {
                                    setListOfOptions(e.target.value);
                                    setHasChanges(true);
                                }}
                                placeholder="Paste or type your list of options here:&#10;A. Option 1&#10;B. Option 2&#10;i. Option 1&#10;ii. Option 2"
                            ></textarea> */}
                            <Editor
                                tinymceScriptSrc="/tinymce/tinymce.min.js"
                                licenseKey='gpl'
                                value={listOfOptions}
                                onEditorChange={(content: string) => {
                                    setListOfOptions(content);
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
                                placeholder: `Paste or type your list of options here:
                                    A. Option 1
                                    B. Option 2
                                    i. Option 1
                                    ii. Option 2`,
                                content_style: 'body { font-family: Arial, sans-serif; font-size: 14px; }',
                                }}
                            />
                            <small className="form-text text-muted">
                                Paste your list of options here. Each option should be on a new line.
                            </small>
                        </div>

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
                                placeholder="Match this statement with the correct option:"
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
                                placeholder: 'Match this statement with the correct option:',
                                content_style: 'body { font-family: Arial, sans-serif; font-size: 14px; }',
                                }}
                            />
                            <small className="form-text text-muted">
                                Enter the matching instruction
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
                                placeholder="Option 1 | Option 2"
                            />
                            <small className="form-text text-muted">
                                Enter the correct option letter or text
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

export default MatchingUpdateModal;
