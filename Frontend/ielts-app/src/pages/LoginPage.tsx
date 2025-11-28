// import { useState } from "react";
// import { useForm, type SubmitHandler } from 'react-hook-form';
// import { Link, useNavigate } from "react-router-dom";

// type LoginInputs = {
//     email: string;
//     password: string;
//     rememberMe: boolean;
// }

// function LoginPage(){
    
//     const {register, handleSubmit, formState: { errors }} = useForm<LoginInputs>();
    
//     let [alertMessage, setAlertMessage] = useState('');
//     const [showPassword, setShowPassword] = useState(false);

//     let navigate = useNavigate();

//     function togglePasswordVisibility() {
//         setShowPassword(!showPassword);
//     }

//     function loginSuccess(){
//         navigate('/');
//     }

//     function loginFailed(e: string){
//         setAlertMessage(e);
//     }

//     const onSubmit: SubmitHandler<LoginInputs> = (data) => {
//         // Sanity check: Log the form data
//         console.log('Login form submitted with data:', data);

//         // Clear any previous error messages
//         setAlertMessage('');

//         // TODO: API CALL HERE
//         try {
//             console.log('Login attempt with:', {
//                 email: data.email,
//                 password: data.password,
//                 rememberMe: data.rememberMe
//             });

            
//             loginSuccess();
//         } catch (error) {
//             loginFailed('Login failed. Please check your credentials.');
//         }
//     }

//     return (
//         <div className="login-content">
//                 <div className="row">
//                     {/* <!-- Login Banner --> */}
//                     <div className="col-md-6 login-bg d-none d-lg-flex">
//                         <div className="login-carousel">
//                             <div>
//                                 <div className="login-carousel-section mb-3">
//                                     <div className="login-banner">
//                                         <img src="../assets/img/auth/auth-1.svg" className="img-fluid" alt="Logo"/>
//                                     </div>
//                                     <div className="mentor-course text-center">
//                                         <h3 className="mb-2">Welcome to <br />IELTS<span className="text-secondary">Mock</span> Platform.</h3>
//                                         <p>Comprehensive IELTS preparation platform designed to help test-takers achieve their target band scores through realistic mock tests and expert guidance.</p>
//                                     </div>
//                                 </div>
//                             </div>
//                             {/* <div>
//                                 <div className="login-carousel-section mb-3">
//                                     <div className="login-banner">
//                                         <img src="../assets/img/auth/auth-1.svg" className="img-fluid" alt="Logo"/>
//                                     </div>
//                                     <div className="mentor-course text-center">
//                                         <h3 className="mb-2">Welcome to <br/>Dreams<span className="text-secondary">LMS</span> Courses.</h3>
//                                         <p>Platform designed to help organizations, educators, and learners manage, deliver, and track learning and training activities.</p>
//                                     </div>
//                                 </div>
//                             </div>
//                             <div>
//                                 <div className="login-carousel-section mb-3">
//                                     <div className="login-banner">
//                                         <img src="../assets/img/auth/auth-1.svg" className="img-fluid" alt="Logo"/>
//                                     </div>
//                                     <div className="mentor-course text-center">
//                                         <h3 className="mb-2">Welcome to <br/>Dreams<span className="text-secondary">LMS</span> Courses.</h3>
//                                         <p>Platform designed to help organizations, educators, and learners manage, deliver, and track learning and training activities.</p>
//                                     </div>
//                                 </div>
//                             </div> */}
//                         </div>
//                     </div>
//                     {/* <!-- /Login Banner --> */}
        
//                     <div className="col-md-6 login-wrap-bg">
//                         {/* <!-- Login --> */}
//                         <div className="login-wrapper">
//                             <div className="loginbox">
//                                 <div className="w-100">
//                                     <div className="d-flex align-items-center justify-content-between login-header">
//                                         <img src="../assets/img/logo.svg" className="img-fluid" alt="Logo"/>
//                                         {/* <a href="index.html" className="link-1">Back to Home</a> */}
//                                         <Link to="/" className="link-1">Back to Home</Link>
//                                     </div>
//                                     <div className={"alert alert-danger "+(alertMessage != "" ? "d-block" : "d-none")}>{alertMessage}</div>
//                                     <h1 className="fs-32 fw-bold topic">Sign into Your Account</h1>
//                                     <form onSubmit={handleSubmit(onSubmit)} className="mb-3 pb-3">
//                                         <div className="mb-3 position-relative">
//                                             <label className="form-label">Email<span className="text-danger ms-1">*</span></label>
//                                             <div className="position-relative">
//                                                 <input 
//                                                     type="email" 
//                                                     className="form-control form-control-lg" 
//                                                     {...register("email", { 
//                                                         required: "Email is required",
//                                                         pattern: {
//                                                             value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
//                                                             message: "Please enter a valid email address"
//                                                         }
//                                                     })}
//                                                 />
//                                                 <span><i className="isax isax-sms input-icon text-gray-7 fs-14"></i></span>
//                                             </div>
//                                             {errors.email && <div className="text-danger mt-1 fs-12">{errors.email.message}</div>}
//                                         </div>
//                                         <div className="mb-3 position-relative">
//                                             <label className="form-label">Password <span className="text-danger ms-1" >*</span></label>
//                                             <div className="position-relative" id="passwordInput">
//                                                 <input 
//                                                     type={showPassword ? "text" : "password"}
//                                                     className="pass-inputs form-control form-control-lg" 
//                                                     {...register("password", { 
//                                                         required: "Password is required",
//                                                         minLength: {
//                                                             value: 8,
//                                                             message: "Password must be at least 8 characters"
//                                                         }
//                                                     })}
//                                                 />
//                                                 <span 
//                                                     className={`isax toggle-passwords fs-14 ${showPassword ? 'isax-eye' : 'isax-eye-slash'}`}
//                                                     onClick={togglePasswordVisibility}
//                                                     style={{ cursor: 'pointer' }}
//                                                 ></span>
//                                             </div>
//                                             {errors.password && <div className="text-danger mt-1 fs-12">{errors.password.message}</div>}
//                                         </div>
//                                         <div className="d-flex align-items-center justify-content-between mb-4">
//                                             <div className="remember-me d-flex align-items-center">
//                                                 <input 
//                                                     className="form-check-input" 
//                                                     type="checkbox" 
//                                                     id="flexCheckDefault" 
//                                                     {...register("rememberMe")}
//                                                 />
//                                                 <label className="form-check-label ms-2" htmlFor="flexCheckDefault">
//                                                     Remember Me
//                                                 </label>
//                                             </div>
//                                             <div className="">
//                                                 <Link to="/forgot-password" className="link-2">
//                                                     Forgot Password ?
//                                                 </Link>
//                                             </div>
//                                         </div>
//                                         <div className="d-grid">
//                                             <button className="btn btn-secondary btn-lg" type="submit">Login <i className="isax isax-arrow-right-3 ms-1"></i></button>
//                                         </div>
//                                     </form>

//                                     <div className="d-flex align-items-center justify-content-center or fs-14 mb-3">
//                                         Or
//                                     </div>

//                                     <div className="d-flex align-items-center justify-content-center mb-3">
//                                         <a href="javascript:void(0);" className="btn btn-light me-2"><img src="../assets/img/icons/google.svg" alt="img" className="me-2"/>Google</a>
//                                         <a href="javascript:void(0);" className="btn btn-light"><img src="../assets/img/icons/facebook.svg" alt="img" className="me-2"/>Facebook</a>
//                                     </div>

//                                     <div className="fs-14 fw-normal d-flex align-items-center justify-content-center">
//                                         Don't you have an account?<Link to="/register" className="link-2 ms-1">Sign up</Link>
//                                     </div>
    
//                                     {/* <!-- /Login --> */}
        
//                                 </div>
//                             </div>
//                         </div>
//                     </div>
//                 </div>
//             </div>
//     )
// }

// export default LoginPage;