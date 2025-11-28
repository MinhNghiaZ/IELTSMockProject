import { useState, useEffect } from 'react';
import type { Question, QuestionToUpdate } from '../../../types/Question';
import { toast } from 'react-toastify';
import { updateQuestion } from '../../../services/questionService';
import { Editor } from '@tinymce/tinymce-react';

interface Choice {
    id: number;
    text: string;
    isCorrect: boolean;
}

interface SingleChoiceUpdateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (updatedQuestion: Question) => void;
    question: Question;
}

// Move ChoiceItem outside of SingleChoiceModal to avoid redefinition on each render
function ChoiceItem({ choice, index, onTextChange, onCorrectChange, onDelete, canDelete 
}: { 
    choice: Choice; 
    index: number; 
    onTextChange: (id: number, text: string) => void;
    onCorrectChange: (id: number) => void;
    onDelete: (id: number) => void;
    canDelete: boolean;
}) {
    return (
        <div className="border rounded p-3 mb-3 bg-light">
            <div className="row align-items-center">
                <div className="col-9">
                    <div className="input-group mb-2">
                        <div className="input-group-text me-2">
                            <input
                                className="form-check-input mt-0"
                                type="radio"
                                id={`correct-${choice.id}`}
                                name="correctChoice"
                                checked={choice.isCorrect}
                                onChange={() => onCorrectChange(choice.id)}
                                title="Mark as correct answer"
                                style={{ 
                                    cursor: 'pointer', 
                                    width: '20px',
                                    height: '20px',
                                }}
                            />
                        </div>
                        <input
                            type="text"
                            className="form-control"
                            value={choice.text}
                            onChange={(e) => onTextChange(choice.id, e.target.value)}
                            placeholder={`Enter choice ${index + 1}`}
                        />
                    </div>
                </div>
                <div className="col-3 text-center">
                    <button
                        type="button"
                        className="btn btn-outline-danger btn-md rounded-3"
                        onClick={() => onDelete(choice.id)}
                        disabled={!canDelete}
                        title="Delete choice"
                    >
                        Delete
                    </button>
                </div>
            </div>
        </div>
    );
}

function SingleChoiceUpdateModal({ isOpen, onClose, onSubmit, question }: SingleChoiceUpdateModalProps) {
    const [questionContent, setQuestionContent] = useState('');
    const [choices, setChoices] = useState<Choice[]>([]);
    const [explanation, setExplanation] = useState('');
    const [nextChoiceId, setNextChoiceId] = useState(1);
    const [hasChanges, setHasChanges] = useState(false);

    // Parse choices from question data
    const parseChoicesFromQuestion = (choicesStr: string, correctAnswerStr: string): Choice[] => {
        if (!choicesStr) return [
            { id: 1, text: '', isCorrect: false },
            { id: 2, text: '', isCorrect: false }
        ];

        const choiceTexts = choicesStr.split('|').filter(Boolean);
        const correctAnswer = correctAnswerStr ? correctAnswerStr.trim() : '';
        
        return choiceTexts.map((text, index) => ({
            id: index + 1,
            text: text.trim(),
            isCorrect: text.trim() === correctAnswer
        }));
    };

    // Initialize form with question data when modal opens or question changes
    useEffect(() => {
        if (isOpen && question) {
            setQuestionContent(question.content || '');
            setExplanation(question.explanation || '');
            
            const parsedChoices = parseChoicesFromQuestion(question.choices, question.correctAnswer);
            setChoices(parsedChoices);
            setNextChoiceId(parsedChoices.length + 1);
            setHasChanges(false); // Reset changes when modal opens
        }
    }, [isOpen, question]);

    const handleAddChoice = () => {
        const newChoice: Choice = {
            id: nextChoiceId,
            text: '',
            isCorrect: false
        };
        setChoices([...choices, newChoice]);
        setNextChoiceId(nextChoiceId + 1);
        setHasChanges(true);
    };

    const handleChoiceTextChange = (id: number, text: string) => {
        setChoices(choices.map(choice =>
            choice.id === id ? { ...choice, text } : choice
        ));
        setHasChanges(true);
    };

    const handleChoiceCorrectChange = (id: number) => {
        // For single choice, only one can be correct
        setChoices(choices.map(choice =>
            choice.id === id 
                ? { ...choice, isCorrect: true }
                : { ...choice, isCorrect: false }
        ));
        setHasChanges(true);
    };

    const handleDeleteChoice = (id: number) => {
        // Prevent deleting if only 2 choices remain
        if (choices.length <= 2) return;
        setChoices(choices.filter(choice => choice.id !== id));
        setHasChanges(true);
    };

    function formatChoicesToString(choices: Choice[]): string {
        return choices.map(choice => choice.text).join('|');
    }

    function formatCorrectAnswerToString(choices: Choice[]): string {
        const correctChoice = choices.find(c => c.isCorrect);
        return correctChoice ? correctChoice.text : '';
    }

    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = () => {
        // Check if there are any changes
        if (!hasChanges) {
            toast.info('No changes to save');
            return;
        }

        if (!questionContent.trim()) {
            toast.error('Question content is required');
            return;
        }
        if (choices.some(c => !c.text.trim())) {
            toast.error('All choices must have text');
            return;
        }
        if (!choices.some(c => c.isCorrect)) {
            toast.error('Please select exactly one correct answer');
            return;
        }

        if (isSubmitting) return; // Prevent multiple submissions

        const data: QuestionToUpdate = {
            questionType: 'SingleChoice',
            content: questionContent,
            choices: formatChoicesToString(choices),
            correctAnswer: formatCorrectAnswerToString(choices),
            explanation: explanation,
            parentId: question.parentId,
            order: question.order,
            link: question.link || "",
        };

        console.log('Updating single choice question with data:', data);
        
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
            console.log('Single choice question updated:', updatedQuestion);
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
                        <h5 className="modal-title">Edit Single Choice Question</h5>
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
                                placeholder="Enter your question here..."
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
                                placeholder: 'Enter your question here...',
                                content_style: 'body { font-family: Arial, sans-serif; font-size: 14px; }',
                                }}
                            />
                        </div>

                        {/* Choices Section */}
                        <div className="mb-3">
                            <label className="form-label fw-bold">Choices</label>
                            <small className="form-text text-muted d-block mb-3">Select the correct choice (only one allowed)</small>

                            {/* Render all choices */}
                            {choices.map((choice, index) => (
                                <ChoiceItem 
                                    key={choice.id} 
                                    choice={choice} 
                                    index={index}
                                    onTextChange={handleChoiceTextChange}
                                    onCorrectChange={handleChoiceCorrectChange}
                                    onDelete={handleDeleteChoice}
                                    canDelete={choices.length > 2}
                                />
                            ))}

                            {/* Add Choice Button */}
                            <button
                                type="button"
                                className="btn btn-outline-primary btn-sm rounded-1"
                                onClick={handleAddChoice}
                            >
                                <i className="bi bi-plus me-1"></i>
                                Add Choice
                            </button>
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
                                placeholder="Explain why this is the correct answer..."
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

export default SingleChoiceUpdateModal;
