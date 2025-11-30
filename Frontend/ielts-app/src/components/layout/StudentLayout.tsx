import { NavLink, Outlet } from 'react-router-dom';
import '../../assets/css/custom.css';
import { useAuth } from '../../contexts/AuthContext';

function StudentLayout() {
    const { logout, user } = useAuth();

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
                                        <NavLink to="/student/settings" className="link-light fs-16 ms-2 mt-1">
                                            <i className="isax isax-edit"></i>
                                        </NavLink>
                                    </h5>
                                    <p className="text-light">{user?.role || 'Loading...'}</p>
                                </div>
                            </div>
                        </div>
                        {/* <div className="col-md-6">
                            <div className="d-flex align-items-center flex-wrap gap-3 justify-content-md-end">
                                <NavLink to="/admin/add-course" className="btn btn-white rounded-pill">Become an Instructor</NavLink>
                                <NavLink to="/student-dashboard" className="btn btn-secondary rounded-pill">Instructor Dashboard</NavLink>
                            </div>
                        </div> */}
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
                                            to="/student/dashboard"
                                            className={({ isActive }) =>
                                                `d-inline-flex align-items-center ${isActive ? 'active' : ''}`
                                            }
                                        >
                                            <i className="isax isax-grid-35 me-2"></i>Dashboard
                                        </NavLink>
                                    </li>
                                    <li>
                                        <NavLink
                                            to="/student/profile"
                                            className={({ isActive }) =>
                                                `d-inline-flex align-items-center ${isActive ? 'active' : ''}`
                                            }
                                        >
                                            <i className="fa-solid fa-user me-2"></i>My Profile
                                        </NavLink>
                                    </li>
                                    <li>
                                        <NavLink
                                            to="/student/support"
                                            className={({ isActive }) =>
                                                `d-inline-flex align-items-center ${isActive ? 'active' : ''}`
                                            }
                                        >
                                            <i className="isax isax-messages-3 me-2"></i>Support
                                        </NavLink>
                                    </li>
                                    {/* <li>
                                        <NavLink
                                            to="/student/courses"
                                            className={({ isActive }) =>
                                                `d-inline-flex align-items-center ${isActive ? 'active' : ''}`
                                            }
                                        >
                                            <i className="isax isax-teacher5 me-2"></i>Enrolled Courses
                                        </NavLink>
                                    </li> */}
                                    {/* <li>
                                        <NavLink
                                            to="/student/announcements"
                                            className={({ isActive }) =>
                                                `d-inline-flex align-items-center ${isActive ? 'active' : ''}`
                                            }
                                        >
                                            <i className="isax isax-volume-high5 me-2"></i>Announcements
                                        </NavLink>
                                    </li> */}
                                    {/* <li>
                                        <NavLink
                                            to="/student/assignments"
                                            className={({ isActive }) =>
                                                `d-inline-flex align-items-center ${isActive ? 'active' : ''}`
                                            }
                                        >
                                            <i className="isax isax-clipboard-text5 me-2"></i>Assignments
                                        </NavLink>
                                    </li> */}
                                    {/* <li>
                                        <NavLink
                                            to="/student/students"
                                            className={({ isActive }) =>
                                                `d-inline-flex align-items-center ${isActive ? 'active' : ''}`
                                            }
                                        >
                                            <i className="isax isax-profile-2user5 me-2"></i>Students
                                        </NavLink>
                                    </li> */}
                                    {/* <li>
                                        <NavLink
                                            to="/student/quiz"
                                            className={({ isActive }) =>
                                                `d-inline-flex align-items-center ${isActive ? 'active' : ''}`
                                            }
                                        >
                                            <i className="isax isax-award5 me-2"></i>Quiz
                                        </NavLink>
                                    </li> */}
                                    {/* <li>
                                        <NavLink
                                            to="/student/quiz-results"
                                            className={({ isActive }) =>
                                                `d-inline-flex align-items-center ${isActive ? 'active' : ''}`
                                            }
                                        >
                                            <i className="isax isax-medal-star5 me-2"></i>Quiz Results
                                        </NavLink>
                                    </li> */}
                                    {/* <li>
                                        <NavLink
                                            to="/student/certificates"
                                            className={({ isActive }) =>
                                                `d-inline-flex align-items-center ${isActive ? 'active' : ''}`
                                            }
                                        >
                                            <i className="isax isax-note-215 me-2"></i>Certificates
                                        </NavLink>
                                    </li> */}
                                    {/* <li>
                                        <NavLink
                                            to="/student/earnings"
                                            className={({ isActive }) =>
                                                `d-inline-flex align-items-center ${isActive ? 'active' : ''}`
                                            }
                                        >
                                            <i className="isax isax-wallet-add5 me-2"></i>Earnings
                                        </NavLink>
                                    </li> */}
                                    {/* <li>
                                        <NavLink
                                            to="/student/payout"
                                            className={({ isActive }) =>
                                                `d-inline-flex align-items-center ${isActive ? 'active' : ''}`
                                            }
                                        >
                                            <i className="isax isax-coin-15 me-2"></i>Payout
                                        </NavLink>
                                    </li> */}
                                    {/* <li>
                                        <NavLink
                                            to="/student/statements"
                                            className={({ isActive }) =>
                                                `d-inline-flex align-items-center ${isActive ? 'active' : ''}`
                                            }
                                        >
                                            <i className="isax isax-shopping-cart5 me-2"></i>Statements
                                        </NavLink>
                                    </li> */}
                                    {/* <li>
                                        <NavLink
                                            to="/student/messages"
                                            className={({ isActive }) =>
                                                `d-inline-flex align-items-center ${isActive ? 'active' : ''}`
                                            }
                                        >
                                            <i className="isax isax-messages-35 me-2"></i>Messages
                                        </NavLink>
                                    </li> */}
                                    {/* <li>
                                        <NavLink
                                            to="/student/tickets"
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
                                            to="/student/settings"
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
        </div>
    );
};

export default StudentLayout;
