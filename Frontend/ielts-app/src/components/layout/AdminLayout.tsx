import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { toast } from 'react-toastify';
import '../../assets/css/custom.css';
import CreateTestModal from '../utils/CreateTestModal';
import { useAuth } from '../../contexts/AuthContext';
import { createTest } from '../../services/testService';
import type { TestToCreate } from '../../types/Test';
import { getUserId } from '../../services/authService';
import { createParagraph, uploadQuestionsFromFile } from '../../services/questionService';
import { uploadFile } from '../../services/fileUploadService';

function AdminDashboardLayout() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isCreatingTest, setIsCreatingTest] = useState(false);
    const { logout, user } = useAuth();

    let navigate = useNavigate();

    const createInitialSections = async (testId: number, type: 'Reading' | 'Listening') => {

        if (!type) {
            console.error("Test type", type, "is not valid for creating sections.");
            return;
        }
        console.log("Creating initial sections for test type:", type);

        var questions;
        if (type === 'Reading'){
        questions = [
            { questionType: 'Paragraph', content: 'This is a sample paragraph 1.', correctAnswer: '', choices: '', explanation: '', parentId: 0, testId, link: '', order: 1 },
            { questionType: 'Paragraph', content: 'This is a sample paragraph 2.', correctAnswer: '', choices: '', explanation: '', parentId: 0, testId, link: '', order: 2 },
            { questionType: 'Paragraph', content: 'This is a sample paragraph 3.', correctAnswer: '', choices: '', explanation: '', parentId: 0, testId, link: '', order: 3 },
        ]
        } else if (type === 'Listening'){
            questions = [
                { questionType: 'Audio', content: 'section 1 requirement here', correctAnswer: '', choices: '', explanation: 'This is a sample audio 1 transcript.', parentId: 0, testId, link: '', order: 1 },
                { questionType: 'Audio', content: 'section 2 requirement here', correctAnswer: '', choices: '', explanation: 'This is a sample audio 2 transcript.', parentId: 0, testId, link: '', order: 2 },
                { questionType: 'Audio', content: 'section 3 requirement here', correctAnswer: '', choices: '', explanation: 'This is a sample audio 3 transcript.', parentId: 0, testId, link: '', order: 3 },
                { questionType: 'Audio', content: 'section 4 requirement here', correctAnswer: '', choices: '', explanation: 'This is a sample audio 4 transcript.', parentId: 0, testId, link: '', order: 4 },
            ]
        }

        if (!questions) return;

        for (const q of questions) {
            // Should call createParagraph from questionService not createQuestion
            await toast.promise(
                createParagraph(q),
                {
                    pending: `Creating ${q.content.substring(0, 30)}...`,
                    success: `Created paragraph successfully!`,
                    error: 'Failed to create paragraph'
                }
            ).then(() => {
                console.log(`Paragraph created: ${q}`);
            });
        }
    }


    interface TestData {
        testName: string;
        testTypeId: number;
        typeName: string;
        selectedFile?: File | null;
    }

    const handleCreateTest = async (testData: TestData): Promise<void> => {
        // Prevent multiple simultaneous requests
        if (isCreatingTest) {
            console.warn("Test creation already in progress");
            return;
        }

        const newTest: TestToCreate = {
            testName: testData.testName,
            typeId: testData.testTypeId,
            createdBy: Number(getUserId()) || 0,
            createdAt: new Date().toISOString(),
            resource: '',
            isActive: false,
        };

        setIsCreatingTest(true);

        try {
            // Step 1: Create the test with toast feedback
            const created = await toast.promise(
                createTest(newTest),
                {
                    pending: 'Creating test...',
                    success: 'Test created successfully!',
                    error: 'Failed to create test'
                }
            );

            // Step 2: Create initial paragraphs only if NO file is selected
            if (created && created.id && !testData.selectedFile) {
                console.log("Created test:", created);
                await toast.promise(
                    createInitialSections(created.id, testData.typeName as 'Reading' | 'Listening'),
                    {
                        pending: 'Creating initial sections...',
                        success: 'Initial sections created successfully!',
                        error: 'Failed to create initial sections'
                    }
                );
            } else if (created && created.id && testData.selectedFile) {
                console.log("File uploaded, skipping initial sections creation");
                // TODO: Handle file upload to backend here if needed
                // await uploadTestFile(created.id, testData.selectedFile);
                await uploadQuestionsFromFile(created.id, testData.selectedFile, testData.typeName).then(() => {
                    toast.success("Questions uploaded successfully from file!");
                    testData.selectedFile = null;
                }).catch((error) => {
                    console.log(created.id, testData.selectedFile, testData.typeName);
                    console.error("Error uploading questions from file:", error);
                    toast.error("Failed to upload questions from file.");
                });
            }


            // Step 3: Success - close modal and navigate
            setIsModalOpen(false);
            navigate(`/edit-test/${created.id}`);

        } catch (error) {
            // Handle any errors from either step
            console.error("Error in test creation process:", error);
        } finally {
            setIsCreatingTest(false);
        }
    };

    const handleOpenModal = () => {
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
    };

    const handleLogout = () => {
        logout();
        // window.location.href = '/login';
    };
    return (
        <div className="content">
            <div className="container">
                <div className="instructor-profile">
                    <div className="instructor-profile-bg">
                        <img src="/assets/img/bg/card-bg-01.png" className="instructor-profile-bg-1" alt="" />
                    </div>
                    <div className="row align-items-center row-gap-3">
                        <div className="col-md-6">
                            <div className="d-flex align-items-center">
                                <span className="avatar flex-shrink-0 avatar-xxl avatar-rounded me-3 border border-white border-3 position-relative">
                                    <img src="/assets/img/user/user-01.jpg" alt="img" />
                                    <span className="verify-tick"><i className="isax isax-verify5"></i></span>
                                </span>
                                {/* TODO: Change this to maybe a profile component that load user data */}
                                <div>
                                    <h5 className="mb-1 text-white d-inline-flex align-items-center">
                                        {user?.name || 'Loading...'}
                                        <NavLink to="/admin/settings" className="link-light fs-16 ms-2 mt-1">
                                            <i className="isax isax-edit"></i>
                                        </NavLink>
                                    </h5>
                                    <p className="text-light">{user?.role || 'Loading...'}</p>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-6">
                            <div className="d-flex align-items-center flex-wrap gap-3 justify-content-md-end">
                                <button
                                    onClick={handleOpenModal}
                                    className="btn btn-white rounded-pill"
                                >
                                    Add New Test
                                </button>
                                {/* <NavLink to="/student-dashboard" className="btn btn-secondary rounded-pill">Student Dashboard</NavLink> */}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="row">
                    {/* Sidebar */}
                    <div className="col-lg-3 theiaStickySidebar">
                        <div className="settings-sidebar mb-lg-0">
                            <div>
                                <h6 className="mb-3">Main Menu</h6>
                                <ul className="mb-3 pb-1">
                                    <li>
                                        <NavLink
                                            to="/admin/dashboard"
                                            className={({ isActive }) =>
                                                `d-inline-flex align-items-center ${isActive ? 'active' : ''}`
                                            }
                                        >
                                            <i className="isax isax-grid-35 me-2"></i>Dashboard
                                        </NavLink>
                                    </li>
                                    <li>
                                        <NavLink
                                            to="/admin/profile"
                                            className={({ isActive }) =>
                                                `d-inline-flex align-items-center ${isActive ? 'active' : ''}`
                                            }
                                        >
                                            <i className="fa-solid fa-user me-2"></i>My Profile
                                        </NavLink>
                                    </li>
                                    <li>
                                        <NavLink
                                            to="/admin/courses"
                                            className={({ isActive }) =>
                                                `d-inline-flex align-items-center ${isActive ? 'active' : ''}`
                                            }
                                        >
                                            <i className="isax isax-teacher5 me-2"></i>Tests
                                        </NavLink>
                                    </li>
                                    {/* <li>
                                        <NavLink
                                            to="/admin/announcements"
                                            className={({ isActive }) =>
                                                `d-inline-flex align-items-center ${isActive ? 'active' : ''}`
                                            }
                                        >
                                            <i className="isax isax-volume-high5 me-2"></i>Announcements
                                        </NavLink>
                                    </li> */}
                                    {/* <li>
                                        <NavLink
                                            to="/admin/assignments"
                                            className={({ isActive }) =>
                                                `d-inline-flex align-items-center ${isActive ? 'active' : ''}`
                                            }
                                        >
                                            <i className="isax isax-clipboard-text5 me-2"></i>Assignments
                                        </NavLink>
                                    </li> */}
                                    <li>
                                        <NavLink
                                            to="/admin/users"
                                            className={({ isActive }) =>
                                                `d-inline-flex align-items-center ${isActive ? 'active' : ''}`
                                            }
                                        >
                                            <i className="isax isax-profile-2user5 me-2"></i>Users
                                        </NavLink>
                                    </li>
                                    <li>
                                        <NavLink
                                            to="/admin/type-skill"
                                            className={({ isActive }) =>
                                                `d-inline-flex align-items-center ${isActive ? 'active' : ''}`
                                            }
                                        >
                                            <i className="isax isax-magicpen5 me-2"></i>Skills
                                        </NavLink>
                                    </li>

                                    <li>
                                        <NavLink
                                            to="/admin/media"
                                            className={({ isActive }) =>
                                                `d-inline-flex align-items-center ${isActive ? 'active' : ''}`
                                            }
                                        >
                                            <i className="isax isax-image5 me-2"></i>Media
                                        </NavLink>
                                    </li>
                                    {/* <li>
                                        <NavLink
                                            to="/admin/quiz"
                                            className={({ isActive }) =>
                                                `d-inline-flex align-items-center ${isActive ? 'active' : ''}`
                                            }
                                        >
                                            <i className="isax isax-award5 me-2"></i>Quiz
                                        </NavLink>
                                    </li> */}
                                    {/* <li>
                                        <NavLink
                                            to="/admin/quiz-results"
                                            className={({ isActive }) =>
                                                `d-inline-flex align-items-center ${isActive ? 'active' : ''}`
                                            }
                                        >
                                            <i className="isax isax-medal-star5 me-2"></i>Quiz Results
                                        </NavLink>
                                    </li> */}
                                    {/* <li>
                                        <NavLink
                                            to="/admin/certificates"
                                            className={({ isActive }) =>
                                                `d-inline-flex align-items-center ${isActive ? 'active' : ''}`
                                            }
                                        >
                                            <i className="isax isax-note-215 me-2"></i>Certificates
                                        </NavLink>
                                    </li> */}
                                    {/* <li>
                                        <NavLink
                                            to="/admin/earnings"
                                            className={({ isActive }) =>
                                                `d-inline-flex align-items-center ${isActive ? 'active' : ''}`
                                            }
                                        >
                                            <i className="isax isax-wallet-add5 me-2"></i>Earnings
                                        </NavLink>
                                    </li> */}
                                    {/* <li>
                                        <NavLink
                                            to="/admin/payout"
                                            className={({ isActive }) =>
                                                `d-inline-flex align-items-center ${isActive ? 'active' : ''}`
                                            }
                                        >
                                            <i className="isax isax-coin-15 me-2"></i>Payout
                                        </NavLink>
                                    </li> */}
                                    {/* <li>
                                        <NavLink
                                            to="/admin/statements"
                                            className={({ isActive }) =>
                                                `d-inline-flex align-items-center ${isActive ? 'active' : ''}`
                                            }
                                        >
                                            <i className="isax isax-shopping-cart5 me-2"></i>Statements
                                        </NavLink>
                                    </li> */}
                                    {/* <li>
                                        <NavLink
                                            to="/admin/messages"
                                            className={({ isActive }) =>
                                                `d-inline-flex align-items-center ${isActive ? 'active' : ''}`
                                            }
                                        >
                                            <i className="isax isax-messages-35 me-2"></i>Messages
                                        </NavLink>
                                    </li> */}
                                    {/* <li>
                                        <NavLink
                                            to="/admin/tickets"
                                            className={({ isActive }) =>
                                                `d-inline-flex align-items-center ${isActive ? 'active' : ''}`
                                            }
                                        >
                                            <i className="isax isax-ticket5 me-2"></i>Support Tickets
                                        </NavLink>
                                    </li> */}
                                </ul>
                                <hr />
                                <h6 className="mb-3">Account Settings</h6>
                                <ul>
                                    <li>
                                        <NavLink
                                            to="/admin/settings"
                                            className={({ isActive }) =>
                                                `d-inline-flex align-items-center ${isActive ? 'active' : ''}`
                                            }
                                        >
                                            <i className="isax isax-setting-25 me-2"></i>Settings
                                        </NavLink>
                                    </li>
                                    <li>
                                        <NavLink
                                            to="/login"
                                            className="d-inline-flex align-items-center"
                                            onClick={handleLogout}
                                        >
                                            <i className="isax isax-logout5 me-2"></i>Logout
                                        </NavLink>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                    {/* /Sidebar */}
                    <div className="col-lg-9">
                        {/* This is where child routes will be rendered */}
                        <Outlet />
                    </div>
                </div>
            </div>

            {/* Create Test Modal */}
            <CreateTestModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onConfirm={handleCreateTest}
            />
        </div>
    );
};

export default AdminDashboardLayout;
