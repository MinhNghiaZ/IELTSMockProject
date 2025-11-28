import React, { useEffect, useState } from 'react';
import { getAllTypeSkills } from '../../services/typeSkillService';
import type { TypeSkillBasicDto } from '../../types/TypeSkill';

interface CreateTestModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (testData: TestData) => void;
}

interface TestData {
    testName: string;
    testTypeId: number;
    typeName: string;
    selectedFile?: File | null;
}

function CreateTestModal({ isOpen, onClose, onConfirm }: CreateTestModalProps) {
    const [testName, setTestName] = useState('');
    const [testTypeId, setTestTypeId] = useState(1);
    const [errors, setErrors] = useState<{ testName?: string }>({});
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [fileName, setFileName] = useState("");

    const [typeSkills, setTypeSkills] = useState<TypeSkillBasicDto[]>([]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        const newErrors: { testName?: string } = {};
        if (!testName.trim()) {
            newErrors.testName = 'Test name is required';
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        console.log('Creating test with data:', { testName, testTypeId });

        // Submit data
        onConfirm({
            testName: testName.trim(),
            testTypeId,
            typeName: typeSkills.find(ts => ts.id === testTypeId)?.typeName || '',
            selectedFile
        });

        // Reset form
        setTestName('');
        setTestTypeId(1);
        setErrors({});
        setSelectedFile(null);
        setFileName('');
    };

    const handleCancel = () => {
        setTestName('');
        setTestTypeId(1);
        setErrors({});
        setSelectedFile(null);
        setFileName('');
        onClose();
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            setFileName(file.name);
        }
    };

    const fetchData = async () => {
        let data = await getAllTypeSkills();
        console.log(data);
        setTypeSkills(data);
    };

    useEffect(() => {
        fetchData();
    }, [])


    if (!isOpen) return null;



    return (
        <div
            className="modal d-block"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
            onClick={handleCancel}
        >
            <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">Create New IELTS Test</h5>
                        <button
                            type="button"
                            className="btn p-0 border-0 bg-transparent"
                            onClick={handleCancel}
                            aria-label="Close"
                            style={{ fontSize: '1.5rem', lineHeight: '1' }}
                        >
                            ×
                        </button>
                    </div>

                    <form onSubmit={handleSubmit}>
                        <div className="modal-body">
                            <div className="mb-3">
                                <label htmlFor="testName" className="form-label">
                                    Test Name <span className="text-danger">*</span>
                                </label>
                                <input
                                    type="text"
                                    id="testName"
                                    className={`form-control ${errors.testName ? 'is-invalid' : ''}`}
                                    placeholder="Enter test name (e.g., IELTS Practice Test 1)"
                                    value={testName}
                                    onChange={(e) => {
                                        setTestName(e.target.value);
                                        if (errors.testName) {
                                            setErrors({ ...errors, testName: undefined });
                                        }
                                    }}
                                />
                                {errors.testName && (
                                    <div className="invalid-feedback">{errors.testName}</div>
                                )}
                            </div>

                            <div className="mb-3">
                                <label htmlFor="testType" className="form-label">
                                    Test Type <span className="text-danger">*</span>
                                </label>
                                <select
                                    id="testType"
                                    className="form-select"
                                    value={testTypeId}
                                    onChange={(e) => setTestTypeId(Number(e.target.value))}
                                >
                                    {typeSkills.map((type) => (
                                        <option key={type.id} value={type.id}>
                                            {type.typeName}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="mb-3">
                                <label htmlFor="testType" className="form-label">
                                    Upload
                                </label>
                                <div className="mb-3">
                            <input
                                type="file"
                                className="form-control"
                                onChange={handleFileSelect}
                                accept=".pdf,.doc,.docx,.xlsx"
                            />
                            {fileName && (
                                <small className="text-success d-block mt-2">
                                    Selected: {fileName}
                                </small>
                            )}
                        </div>
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button
                                type="button"
                                className="btn btn-secondary me-3"
                                style={{ borderRadius: '0.375rem' }}
                                onClick={handleCancel}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="btn btn-primary"
                                style={{ borderRadius: '0.375rem' }}
                            >
                                Create Test
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default CreateTestModal;
