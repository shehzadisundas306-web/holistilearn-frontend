// frontend/src/pages/Login.jsx
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { Button, Divider } from "@mui/material";
import GoogleIcon from "@mui/icons-material/Google";
import LoginSlider from "../components/LoginSlider";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { VisibilityOff, Visibility } from '@mui/icons-material';
import Footer from "../components/CTA/CTA";
import axios from "axios";
import { toast } from "sonner";
import { useGetData } from "../context/userContext";
import '../styles/login.css';

const Login = () => {
  const { updateUser } = useGetData();
  const navigate = useNavigate();
  const location = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [isGoogleRedirect, setIsGoogleRedirect] = useState(false);

  // ✅ Handle Google OAuth redirect response
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const token = urlParams.get('token');
    const error = urlParams.get('error');
    const requiresProfile = urlParams.get('requiresProfile') === 'true';
    const pendingApproval = urlParams.get('pendingApproval') === 'true';
    const selectRole = urlParams.get('selectRole') === 'true';

    if (error) {
      toast.error('Google authentication failed. Please try again.');
      return;
    }

    if (token) {
      setIsGoogleRedirect(true);
      
      // Fetch user data from token
      const fetchUserData = async () => {
        try {
          const response = await axios.get('http://localhost:5000/user/me', {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          if (response.data.success) {
            const user = response.data.user;
            
            // Save user data
            const userData = {
              id: user._id || user.id,
              name: user.name || user.username,
              username: user.username,
              email: user.email,
              role: user.role,
              phone: user.phone || '',
              bio: user.bio || 'Student at HolistiLearn',
              createdAt: user.createdAt,
              avatar: user.avatar,
              isActive: user.isActive,
              teacherData: user.teacherData || null
            };
            
            localStorage.setItem("accessToken", token);
            localStorage.setItem("token", token);
            localStorage.setItem("user", JSON.stringify(userData));
            
            updateUser(userData);
            
            toast.success(`Welcome, ${user.name || user.username || 'User'}!`);
            
            // Handle special cases
            if (selectRole) {
              navigate('/select-role', { replace: true });
            } else if (requiresProfile) {
              navigate('/teacher/setup-profile', { replace: true });
            } else if (pendingApproval) {
              navigate('/teacher/pending-approval', { replace: true });
            } else if (user.role === 'teacher') {
              navigate('/teacher/dashboard', { replace: true });
            } else if (user.role === 'student') {
              navigate('/student/dashboard', { replace: true });
            } else if (user.role === 'admin') {
              navigate('/admin/dashboard', { replace: true });
            } else {
              navigate('/select-role', { replace: true });
            }
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          toast.error('Failed to complete Google login');
        } finally {
          setIsGoogleRedirect(false);
        }
      };
      
      fetchUserData();
    }
  }, [location, navigate, updateUser]);

  const validationSchema = Yup.object({
    email: Yup.string()
      .email("Invalid email format")
      .required("Email is required"),
    password: Yup.string()
      .min(6, "Minimum 6 characters")
      .required("Password is required"),
  });

  const loginWithGoogle = () => {
    window.location.href = 'http://localhost:5000/user/auth/google';
  };

  const getRedirectPath = (user, requiresProfile = false, pendingApproval = false) => {
    if (user.role === 'teacher') {
      if (requiresProfile) return '/teacher/setup-profile';
      if (pendingApproval) return '/teacher/pending-approval';
      return '/teacher/dashboard';
    }
    
    switch (user.role) {
      case 'student':
        return '/student/dashboard';
      case 'admin':
        return '/admin/dashboard';
      case 'none':
        return '/select-role';
      default:
        return '/';
    }
  };

  return (
    <>
      <div className="login-container">
        <div className="login-left">
          <LoginSlider />
        </div>

        <div className="login-right">
          <motion.div
            className="login-form-section"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="form-card glass-card">
              <h2 style={{ textAlign: "center" }}>Welcome Back</h2>

              <Button
                fullWidth
                variant="contained"
                startIcon={<GoogleIcon />}
                sx={{
                  mt: 2, mb: 2,
                  backgroundColor: "#fff",
                  color: "#091057",
                  fontWeight: 600,
                  borderRadius: "10px",
                  "&:hover": { backgroundColor: "#f1f1f1" }
                }}
                onClick={loginWithGoogle}
                disabled={isGoogleRedirect}
              >
                {isGoogleRedirect ? "Redirecting..." : "Continue with Google"}
              </Button>

              <Divider className="span-tag" sx={{ mb: 2 }}>OR</Divider>

              <Formik
                initialValues={{ email: "", password: "" }}
                validationSchema={validationSchema}
                onSubmit={async (values, { setSubmitting }) => {
                  try {
                    const res = await axios.post(`http://localhost:5000/user/login`, values, {
                      headers: { "Content-Type": "application/json" }
                    });

                    if (res.data.success) {
                      const user = res.data.user;
                      const token = res.data.accessToken || res.data.token;
                      
                      const userData = {
                        id: user._id || user.id,
                        name: user.name || user.username,
                        username: user.username,
                        email: user.email,
                        role: user.role,
                        phone: user.phone || '',
                        bio: user.bio || 'Student at HolistiLearn',
                        createdAt: user.createdAt,
                        avatar: user.avatar,
                        isActive: user.isActive,
                        teacherData: user.teacherData || null
                      };
                      
                      localStorage.setItem("accessToken", token);
                      localStorage.setItem("token", token);
                      localStorage.setItem("user", JSON.stringify(userData));
                      
                      updateUser(userData);
                      
                      if (user.role === 'teacher') {
                        if (res.data.requiresProfile) {
                          toast.info('Please complete your teacher profile first');
                          navigate('/teacher/setup-profile', { replace: true });
                          setSubmitting(false);
                          return;
                        }
                        
                        if (res.data.pendingApproval || (user.teacherData && !user.teacherData.isApproved)) {
                          toast.warning('Your teacher account is pending admin approval');
                          navigate('/teacher/pending-approval', { replace: true });
                          setSubmitting(false);
                          return;
                        }
                      }
                      
                      toast.success(`Welcome back, ${user.name || user.username || 'User'}!`);
                      
                      const redirectPath = getRedirectPath(user, res.data.requiresProfile, res.data.pendingApproval);
                      navigate(redirectPath, { replace: true });
                    } else {
                      toast.error(res.data.message || "Invalid credentials");
                    }
                  } catch (error) {
                    console.error("Login Error:", error);
                    const errorMsg = error.response?.data?.message || "Server Error. Please try again later.";
                    toast.error(errorMsg);
                  } finally {
                    setSubmitting(false);
                  }
                }}
              >
                {({ isSubmitting }) => (
                  <Form>
                    <div className="form-group">
                      <Field
                        type="email"
                        name="email"
                        placeholder="Email address"
                      />
                      <ErrorMessage name="email" component="div" className="error-login" />
                    </div>

                    <div className="form-group password-group">
                      <Field
                        type={showPassword ? "text" : "password"}
                        name="password"
                        placeholder="Password"
                      />
                      <span
                        className="toggle-password"
                        style={{ cursor: 'pointer' }}
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </span>
                      <ErrorMessage name="password" component="div" className="error-login" />
                    </div>

                    <button 
                      type="submit" 
                      className="btn-login" 
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Verifying..." : "Login"}
                    </button>
                  </Form>
                )}
              </Formik>

              <div className="auth-links">
                <Link to="/forgot-password" className="forgot-link fst-italic">
                  Forgot Password?
                </Link>
              </div>

              <div className="auth-links">
                <p>
                  Don't have an account?{" "}
                  <Link to="/register" className="signup-link">
                    Sign up
                  </Link>
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Login;