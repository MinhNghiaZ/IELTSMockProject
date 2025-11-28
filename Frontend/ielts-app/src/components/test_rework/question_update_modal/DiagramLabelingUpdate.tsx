import { useState, useEffect } from 'react';
import type { Question, QuestionToUpdate } from '../../../types/Question';
import { toast } from 'react-toastify';
import { updateQuestion } from '../../../services/questionService';
import { uploadFile } from "../../../services/fileUploadService";
import { Editor } from "@tinymce/tinymce-react";

interface DiagramLabelingUpdateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (updatedQuestion: Question) => void;
    question: Question;
}

function DiagramLabelingUpdateModal({ 
    isOpen, 
    onClose, 
    onSubmit, 
    question 
}: DiagramLabelingUpdateModalProps) {
    const [questionContent, setQuestionContent] = useState('');
    const [correctAnswer, setCorrectAnswer] = useState(''); // Simple string instead of entries
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string>('');
    const [currentImageUrl, setCurrentImageUrl] = useState<string>('');
    const [imageLink, setImageLink] = useState<string>('');
    const [imageMode, setImageMode] = useState<'upload' | 'link'>('upload');
    const [explanation, setExplanation] = useState('');
    const [hasChanges, setHasChanges] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    // Initialize form with question data when modal opens or question changes
    useEffect(() => {
        if (isOpen && question) {
            setQuestionContent(question.content || '');
            setCorrectAnswer(question.correctAnswer || '');
            setExplanation(question.explanation || '');
            setCurrentImageUrl(question.link || '');
            setImagePreview(question.link || ''); // Show current image as preview
            setImageLink(''); // Reset image link
            setImageMode('upload'); // Default to upload mode
            setHasChanges(false); // Reset changes when modal opens
            setSelectedImage(null); // Reset selected image
        }
    }, [isOpen, question]);

    const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            // Check file size (25MB limit for Discord)
            if (file.size > 25 * 1024 * 1024) {
                toast.error("File size too large. Please select an image under 25MB.");
                return;
            }
            
            // Check file type
            if (!file.type.startsWith('image/')) {
                toast.error("Please select a valid image file.");
                return;
            }
            
            setSelectedImage(file);
            setImageLink(''); // Clear link when file is selected
            setHasChanges(true);
            
            // Create preview URL
            const reader = new FileReader();
            reader.onload = (e) => {
                setImagePreview(e.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleImageLinkChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const url = event.target.value;
        setImageLink(url);
        setSelectedImage(null); // Clear file when link is entered
        setHasChanges(true);
        
        // Update preview with the link
        if (url.trim()) {
            setImagePreview(url);
        } else {
            setImagePreview(currentImageUrl); // Revert to current image if link is empty
        }
    };

    const handleModeChange = (mode: 'upload' | 'link') => {
        setImageMode(mode);
        
        // Clear the other mode's data when switching
        if (mode === 'upload') {
            setImageLink('');
            if (!selectedImage) {
                setImagePreview(currentImageUrl); // Show current image if no new file
            }
        } else {
            setSelectedImage(null);
            if (!imageLink) {
                setImagePreview(currentImageUrl); // Show current image if no link
            }
        }
    };

    // Track changes for question content
    const handleQuestionContentChange = (value: string) => {
        setQuestionContent(value);
        setHasChanges(true);
    };

    // Track changes for correct answer
    const handleCorrectAnswerChange = (value: string) => {
        setCorrectAnswer(value);
        setHasChanges(true);
    };

    // Track changes for explanation
    const handleExplanationChange = (value: string) => {
        setExplanation(value);
        setHasChanges(true);
    };

    const validateForm = () => {
        if (!questionContent.trim()) {
            toast.error('Question content is required');
            return false;
        }

        if (!currentImageUrl && !selectedImage && !imageLink.trim()) {
            toast.error('Please provide a diagram image');
            return false;
        }

        if (imageMode === 'link' && imageLink.trim() && !currentImageUrl && !selectedImage) {
            // Validate that the link was actually provided
            if (!imageLink.trim()) {
                toast.error('Please provide an image URL');
                return false;
            }
        }

        if (!correctAnswer.trim()) {
            toast.error('Correct answer is required');
            return false;
        }

        return true;
    };

    const uploadImageFile = async (file: File): Promise<string> => {
        // Use the generic upload function (includes Catbox 200MB limit validation)
        return await uploadFile(file);
    };

    const handleSubmit = async () => {
        // Check if there are any changes
        if (!hasChanges) {
            toast.info('No changes to save');
            return;
        }

        if (!validateForm()) {
            return;
        }

        if (isSubmitting) return; // Prevent multiple submissions

        setIsSubmitting(true);

        try {
            // Handle image based on selected mode
            let finalImageLink = currentImageUrl; // Keep existing image by default
            
            if (imageMode === 'upload' && selectedImage) {
                // Upload new image file
                try {
                    toast.info("Uploading new image...");
                    finalImageLink = await uploadImageFile(selectedImage);
                    toast.success("Image uploaded successfully!");
                    
                    // Update the preview to show the uploaded image URL instead of local file
                    setImagePreview(finalImageLink);
                    setCurrentImageUrl(finalImageLink);
                    setSelectedImage(null); // Clear the selected file since it's now uploaded
                } catch (uploadError) {
                    
                    // Ask user if they want to proceed without the new image
                    const proceed = window.confirm(
                        `Failed to upload new image: ${uploadError instanceof Error ? uploadError.message : 'Unknown error'}\n\n` +
                        'Would you like to proceed with updating the question while keeping the existing image?\n\n' +
                        'Click "OK" to proceed with existing image, or "Cancel" to try again.'
                    );
                    
                    if (!proceed) {
                        toast.error('Update cancelled. Please try uploading the image again.');
                        return;
                    }
                    
                    // Proceed with existing image
                    finalImageLink = currentImageUrl;
                    toast.warning('Proceeding with existing image due to upload failure.');
                }
            } else if (imageMode === 'link' && imageLink.trim()) {
                // Use the provided image URL directly
                finalImageLink = imageLink.trim();
            }

            const data: QuestionToUpdate = {
                questionType: 'DiagramLabeling',
                content: questionContent,
                choices: '', // No longer needed with simplified approach
                correctAnswer: correctAnswer,
                explanation: explanation,
                parentId: question.parentId,
                order: question.order,
                link: finalImageLink, // Store uploaded URL or provided image URL
            };

            // Call API to update question after Discord upload (if needed) succeeds
            await toast.promise(
                updateQuestion(question.id, data),
                {
                    pending: 'Updating diagram labeling question...',
                    success: 'Diagram labeling question updated successfully!',
                    error: 'Failed to update diagram labeling question'
                }
            ).then((updatedQuestion) => {
                // Ensure the updated question includes the new image link
                const questionWithUpdatedImage = {
                    ...updatedQuestion,
                    link: finalImageLink // Make sure the new image URL is included
                };
                onSubmit(questionWithUpdatedImage);
                onClose();
            });

        } catch (error) {
            toast.error("Failed to update question: " + (error instanceof Error ? error.message : 'Unknown error'));
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-lg modal-dialog-centered">
                <div className="modal-content" style={{ maxHeight: "90vh" }}>
                    <div className="modal-header">
                        <h5 className="modal-title">Edit Diagram Labeling Question</h5>
                        <button
                            type="button"
                            className="btn-close border-0 rounded-1"
                            aria-label="Close"
                            onClick={onClose}
                        ></button>
                    </div>
                    <div className="modal-body" style={{ maxHeight: "calc(90vh - 120px)", overflowY: "auto" }}>
                        {/* Image Mode Selector */}
                        <div className="mb-3">
                            <label className="form-label fw-bold">Diagram Image</label>
                            <div className="btn-group w-100 mb-3" role="group">
                                <input
                                    type="radio"
                                    className="btn-check"
                                    name="imageMode"
                                    id="uploadMode"
                                    checked={imageMode === 'upload'}
                                    onChange={() => handleModeChange('upload')}
                                />
                                <label 
                                    className={`btn ${imageMode === 'upload' ? 'btn-primary' : 'btn-outline-primary'}`} 
                                    htmlFor="uploadMode"
                                >
                                    <i className="bi bi-upload me-2"></i>
                                    Upload Image
                                </label>

                                <input
                                    type="radio"
                                    className="btn-check"
                                    name="imageMode"
                                    id="linkMode"
                                    checked={imageMode === 'link'}
                                    onChange={() => handleModeChange('link')}
                                />
                                <label 
                                    className={`btn ${imageMode === 'link' ? 'btn-primary' : 'btn-outline-primary'}`} 
                                    htmlFor="linkMode"
                                >
                                    <i className="bi bi-link-45deg me-2"></i>
                                    Use Image Link
                                </label>
                            </div>

                            {/* Upload Mode */}
                            {imageMode === 'upload' && (
                                <div>
                                    <input
                                        type="file"
                                        className="form-control"
                                        id="diagramImage"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                    />
                                    <small className="form-text text-muted">
                                        {selectedImage 
                                            ? 'New image selected for upload.' 
                                            : currentImageUrl 
                                                ? 'Select a new image to replace the current one, or leave as is.'
                                                : 'Select an image file from your computer to upload.'}
                                    </small>
                                </div>
                            )}

                            {/* Link Mode */}
                            {imageMode === 'link' && (
                                <div>
                                    <input
                                        type="url"
                                        className="form-control"
                                        id="diagramImageLink"
                                        placeholder="Enter direct image URL (e.g., https://example.com/diagram.png)"
                                        value={imageLink}
                                        onChange={handleImageLinkChange}
                                    />
                                    <small className="form-text text-muted">
                                        Provide a direct URL to an image hosted online.
                                    </small>
                                </div>
                            )}
                        </div>

                        {/* Image Preview */}
                        {imagePreview && (
                            <div className="mb-3">
                                <label className="form-label fw-bold">
                                    {selectedImage ? 'New Image Preview' : imageLink ? 'Image Preview' : 'Current Image'}
                                </label>
                                <div className="border rounded p-2 bg-light">
                                    <img
                                        src={imagePreview}
                                        alt="Diagram preview"
                                        className="img-fluid border rounded"
                                        style={{ maxHeight: "300px", maxWidth: "100%" }}
                                    />
                                </div>
                            </div>
                        )}

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
                                onChange={(e) => handleQuestionContentChange(e.target.value)}
                                placeholder="Enter instructions for the diagram labeling task..."
                            ></textarea> */}
                            <Editor
                                tinymceScriptSrc="/tinymce/tinymce.min.js"
                                licenseKey='gpl'
                                value={questionContent}
                                onEditorChange={(content: string) => handleQuestionContentChange(content)}
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
                                placeholder: 'Enter instructions for the diagram labeling task...',
                                content_style: 'body { font-family: Arial, sans-serif; font-size: 14px; }',
                                }}
                            />
                        </div>

                        {/* Correct Answer Section */}
                        <div className="mb-3">
                            <label htmlFor="correctAnswer" className="form-label fw-bold">
                                Correct Answer
                            </label>
                            <input
                                type="text"
                                className="form-control"
                                id="correctAnswer"
                                value={correctAnswer}
                                onChange={(e) => handleCorrectAnswerChange(e.target.value)}
                                placeholder="Enter the correct answer for this question..."
                            />
                            <small className="form-text text-muted">
                                Provide the correct answer that students should identify from the diagram
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
                                rows={3}
                                value={explanation}
                                onChange={(e) => handleExplanationChange(e.target.value)}
                                placeholder="Provide explanations for the correct answers..."
                            ></textarea>
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button
                            type="button"
                            className="btn btn-secondary me-3 rounded-3"
                            onClick={onClose}
                            disabled={isSubmitting}
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

export default DiagramLabelingUpdateModal;
