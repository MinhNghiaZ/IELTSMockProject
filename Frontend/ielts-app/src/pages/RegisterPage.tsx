import { useEffect, useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import { createUser } from "../services/userService";
import "./pages.css";
import { registerNewUser } from "../services/authService";
import { toast } from "react-toastify";

type Inputs = {
  fullName: string;
  email: string;
  phoneNumber: string;
  password: string;
  confirmPassword: string;
  agreeToTerms: boolean;
};

const RegisterPage = () => {
  const {
    register,
    watch,
    handleSubmit,
    formState: { errors },
  } = useForm<Inputs>();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [passwordStrength, setPasswordStrength] = useState(0);
  const [passwordComment, setPasswordComment] = useState("");

  const [alertMessage, setAlertMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  let navigate = useNavigate();

  // Calculate password strength -> update the visual bars
  // Might remove this since it's a hassle to get to work 💀
  // react-hook-form error message might be more useful
  function calculatePasswordStrength(inputPass: string) {
    let poorRegExp = /^(?:[a-zA-Z]+|[0-9]+)$/; // Only letters OR only numbers
    let weakRegExp = /(?=.*[a-zA-Z])(?=.*[0-9])/; // Both letters AND numbers
    let strongRegExp = /(?=.*[a-zA-Z])(?=.*[0-9])(?=.*[#?!@$%^&*-])/; // Letters, numbers AND special characters

    let whitespaceRegExp = /^$|\s+/;

    let strength = 0;
    let comment = "";

    if (inputPass.length < 8) {
      strength = 1;
      comment = "Weak, must be at least 8 characters";
    } else if (poorRegExp.test(inputPass)) {
      strength = 2;
      comment = "Average, only letters or numbers";
    } else if (weakRegExp.test(inputPass)) {
      strength = 3;
      comment = "Good, must contain special symbol";
    }

    if (strongRegExp.test(inputPass)) {
      strength = 4;
      comment = "Strong, contains letters, numbers, and special characters";
    }

    if (inputPass.match(whitespaceRegExp)) {
      setPasswordStrength(0);
      setPasswordComment("Password cannot contain whitespace");
      return 0;
    }

    setPasswordStrength(strength);
    setPasswordComment(comment);
    return strength;
  }

  const watchPassword = watch("password");
  useEffect(() => {
    if (watchPassword) {
      const strength = calculatePasswordStrength(watchPassword);
      setPasswordStrength(strength);
    } else {
      setPasswordStrength(0);
      setPasswordComment("");
    }
  }, [watchPassword]);

  function registerSuccess() {
    navigate("/login");
  }

  function registerFailed(e: string) {
    setAlertMessage(e);
  }

  const onSubmit: SubmitHandler<Inputs> = async (data) => {
    // Sanity check: Log the form data
    console.log("Form submitted with data:", data);

    // Check if passwords match
    if (data.password !== data.confirmPassword) {
      registerFailed("Passwords do not match");
      return;
    }

    // Check password strength
    if (calculatePasswordStrength(data.password) < 4) {
      registerFailed("Password is not strong enough");
      return;
    }

    // Check if terms are agreed
    if (!data.agreeToTerms) {
      registerFailed("You must agree to the terms and conditions");
      return;
    }

    // Clear any previous error messages
    setAlertMessage("");
    setIsLoading(true);

    try {
      // Prepare user data for API (map form data to DTO format)
      const newUserData = {
        fullName: data.fullName,
        email: data.email,
        password: data.password,
        phoneNumber: data.phoneNumber || null,
        role: "Student",
      };

      // Call API to create users
      console.log("Sending data to API:", newUserData);
      const result = await registerNewUser(newUserData);

      toast.success('Registration successful! Redirecting to login...');
      setTimeout(() => registerSuccess(), 500);

      // Registration successful
      // registerSuccess();
    } catch (error: any) {
      // Handle API errors
      console.error("Registration error:", error);
      console.error("Error response:", error.response?.data);
      const errorMessage =
        error.response?.data ||
        error.message ||
        "Registration failed. Please try again.";
      registerFailed(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="main-wrapper">
      <div className="login-content">
        <div className="row">
          {/* Login Banner */}
          <div className="col-md-6 login-bg d-none d-lg-flex">
            <div className="login-carousel">
              <div>
                <div className="login-carousel-section mb-3">
                  <div className="login-banner">
                    <img
                      src="../assets/img/auth/auth-1.svg"
                      className="img-fluid"
                      alt="IELTS Platform Logo"
                    />
                  </div>
                  <div className="mentor-course text-center">
                    <h3 className="mb-2">
                      Welcome to <br />
                      IELTS<span className="text-secondary">Mock</span>{" "}
                      Platform.
                    </h3>
                    <p>
                      Comprehensive IELTS preparation platform designed to help
                      test-takers achieve their target band scores through
                      realistic mock tests and expert guidance.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* /Login Banner */}

          <div className="col-md-6 login-wrap-bg">
            {/* Registration Form */}
            <div className="login-wrapper">
              <div className="loginbox">
                <div className="w-100">
                  <div className="d-flex align-items-center justify-content-between login-header">
                    <Link to="/" className="link-1">
                      <img
                        src="../assets/img/logo.svg"
                        className="img-fluid"
                        alt="IELTS Mock Platform Logo"
                      />
                    </Link>

                    {/* <Link to="/" className="link-1">Back to Home</Link> */}
                  </div>
                  <div
                    className={
                      "alert alert-danger " +
                      (alertMessage != "" ? "d-block" : "d-none")
                    }
                  >
                    {alertMessage}
                  </div>
                  <h1 className="fs-32 fw-bold topic">
                    Create Your IELTS Account
                  </h1>

                  <form onSubmit={handleSubmit(onSubmit)} className="mb-3 pb-3">
                    <div className="mb-3 position-relative">
                      <label className="form-label">
                        Full Name<span className="text-danger ms-1">*</span>
                      </label>
                      <div className="position-relative">
                        <input
                          type="text"
                          className="form-control form-control-lg"
                          {...register("fullName", {
                            required: "Full name is required",
                            minLength: {
                              value: 2,
                              message:
                                "Full name must be at least 2 characters",
                            },
                          })}
                        />
                        <span>
                          <i className="isax isax-user input-icon text-gray-7 fs-14"></i>
                        </span>
                      </div>
                      {errors.fullName && (
                        <div className="text-danger mt-1 fs-12">
                          {errors.fullName.message}
                        </div>
                      )}
                    </div>
                    <div className="mb-3 position-relative">
                      <label className="form-label">
                        Email<span className="text-danger ms-1">*</span>
                      </label>
                      <div className="position-relative">
                        <input
                          type="email"
                          className="form-control form-control-lg"
                          {...register("email", {
                            required: "Email is required",
                            pattern: {
                              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                              message: "Please enter a valid email address",
                            },
                          })}
                        />

                        <span>
                          <i className="isax isax-sms input-icon text-gray-7 fs-14"></i>
                        </span>
                      </div>
                      {errors.email && (
                        <div className="text-danger mt-1 fs-12">
                          {errors.email.message}
                        </div>
                      )}
                    </div>
                    <div className="mb-3 position-relative">
                      <label className="form-label">Phone Number</label>
                      <div className="position-relative">
                        <input
                          type="tel"
                          inputMode="numeric"
                          className="form-control form-control-lg"
                          {...register("phoneNumber", {
                            required: "Phone number is required",
                            pattern: {
                              value: /^[\+]?[0-9\s\-\(\)]{10,}$/,
                              message: "Please enter a valid phone number",
                            },
                          })}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (/^\+?\d*$/.test(val)) {
                              e.target.value = val;
                            } else {
                              e.target.value = e.target.value = val.slice(
                                0,
                                -1
                              );
                            }
                          }}
                        />
                        <span>
                          <i className="isax isax-call input-icon text-gray-7 fs-14"></i>
                        </span>
                      </div>
                      {errors.phoneNumber && (
                        <div className="text-danger mt-1 fs-12">
                          {errors.phoneNumber.message}
                        </div>
                      )}
                    </div>
                    <div className="mb-3 position-relative">
                      <label className="form-label">
                        New Password <span className="text-danger"> *</span>
                      </label>
                      <div className="position-relative" id="passwordInput">
                        <input
                          type={showPassword ? "text" : "password"}
                          className="pass-inputs form-control form-control-lg"
                          {...register("password", {
                            required: "Password is required",
                            minLength: {
                              value: 8,
                              message: "Password must be at least 8 characters",
                            },
                            validate: (value) => {
                              const strength = calculatePasswordStrength(value);
                              if (strength < 4) {
                                return "Password must contain letters, numbers, and special characters";
                              }
                              return true;
                            },
                          })}
                        />
                        <span
                          className={`isax toggle-passwords ${
                            showPassword ? "isax-eye" : "isax-eye-slash"
                          } text-gray-7 fs-14`}
                          onClick={() => setShowPassword(!showPassword)}
                          style={{ cursor: "pointer" }}
                        ></span>
                      </div>
                      <div className="password-strength" id="passwordStrength">
                        <span
                          id="poor"
                          className={
                            passwordStrength > 0
                              ? `strength-${passwordStrength}`
                              : ""
                          }
                        ></span>
                        <span
                          id="weak"
                          className={
                            passwordStrength > 1
                              ? `strength-${passwordStrength}`
                              : ""
                          }
                        ></span>
                        <span
                          id="strong"
                          className={
                            passwordStrength > 2
                              ? `strength-${passwordStrength}`
                              : ""
                          }
                        ></span>
                        <span
                          id="heavy"
                          className={
                            passwordStrength > 3
                              ? `strength-${passwordStrength}`
                              : ""
                          }
                        ></span>
                      </div>
                      <div
                        className={
                          "mt-2 " + `strength-text-${passwordStrength}`
                        }
                        id="passwordInfo"
                      >
                        {passwordComment}
                      </div>

                      {/* UNCOMMENT THIS WHEN SWITCH TO REACT-HOOK-FORM FOR PASSWORD */}
                      {/* {errors.password && <div className="text-danger mt-1 fs-12">{errors.password.message}</div>} */}
                    </div>
                    <div className="mb-3 position-relative">
                      <label className="form-label">
                        Confirm Password <span className="text-danger"> *</span>
                      </label>
                      <div className="position-relative">
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          className="pass-inputa form-control form-control-lg"
                          {...register("confirmPassword", {
                            required: "Please confirm your password",
                            validate: (value) => {
                              const password = watch("password");
                              if (value !== password) {
                                return "Passwords do not match";
                              }
                              return true;
                            },
                          })}
                        />
                        <span
                          className={`isax toggle-passworda ${
                            showConfirmPassword ? "isax-eye" : "isax-eye-slash"
                          } text-gray-7 fs-14`}
                          onClick={() =>
                            setShowConfirmPassword(!showConfirmPassword)
                          }
                          style={{ cursor: "pointer" }}
                        ></span>
                      </div>
                      {errors.confirmPassword && (
                        <div className="text-danger mt-1 fs-12">
                          {errors.confirmPassword.message}
                        </div>
                      )}
                    </div>
                    <div className="d-flex align-items-center justify-content-between mb-4">
                      <div className="remember-me d-flex align-items-center">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="flexCheckDefault"
                          {...register("agreeToTerms", {
                            required:
                              "You must agree to the terms and conditions",
                          })}
                        />
                        <label
                          className="form-check-label mb-0 d-inline-flex remember-me fs-14"
                          htmlFor="flexCheckDefault"
                        >
                          I agree with{" "}
                          <Link to="/terms" className="link-2 mx-2">
                            Terms of Service
                          </Link>{" "}
                          and{" "}
                          <Link to="/privacy" className="link-2 mx-2">
                            Privacy Policy
                          </Link>
                        </label>
                      </div>
                      {errors.agreeToTerms && (
                        <div className="text-danger mt-1 fs-12 w-100">
                          {errors.agreeToTerms.message}
                        </div>
                      )}
                    </div>
                    <div className="d-grid">
                      <button
                        className="btn btn-secondary btn-lg"
                        type="submit"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <>
                            <span
                              className="spinner-border spinner-border-sm me-2"
                              role="status"
                              aria-hidden="true"
                            ></span>
                            Creating Account...
                          </>
                        ) : (
                          <>
                            Start IELTS Journey{" "}
                            <i className="isax isax-arrow-right-3 ms-1"></i>
                          </>
                        )}
                      </button>
                    </div>
                  </form>

                  <div className="d-flex align-items-center justify-content-center or fs-14 mb-3">
                    Or
                  </div>

                  <div className="d-flex align-items-center justify-content-center mb-3">
                    <button className="btn btn-light me-2">
                      <img
                        src="../assets/img/icons/google.svg"
                        alt="Google"
                        className="me-2"
                      />
                      Google
                    </button>
                    <button className="btn btn-light">
                      <img
                        src="../assets/img/icons/facebook.svg"
                        alt="Facebook"
                        className="me-2"
                      />
                      Facebook
                    </button>
                  </div>

                  <div className="fs-14 fw-normal d-flex align-items-center justify-content-center">
                    Already have an account?
                    <Link to="/login" className="link-2 ms-1">
                      {" "}
                      Sign In
                    </Link>
                  </div>

                  {/* /Registration Form */}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
