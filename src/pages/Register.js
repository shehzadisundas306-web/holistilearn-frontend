import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { motion } from "framer-motion";
import { useState } from "react";
import { Button, Divider } from "@mui/material";
import GoogleIcon from "@mui/icons-material/Google";
import LoginSlider from "../components/LoginSlider";
import { Link, useNavigate } from "react-router-dom";
import { VisibilityOff, Visibility } from "@mui/icons-material";
import Footer from "../components/CTA/CTA";
import axios from "axios";
import { toast } from "sonner";

const Register = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const registerWithGoogle = () => {
  // This points to your backend route that initiates the Google handshake
  window.location.href = 'https://holistilearn-backend.vercel.app/user/auth/google';
};

  // ✅ Correct Validation Schema
  const validationSchema = Yup.object({
    username: Yup.string().required("Full name is required"),
    email: Yup.string()
      .email("Invalid email format")
      .required("Email is required"),
    password: Yup.string()
      .min(6, "Minimum 6 characters")
      .required("Password is required"),
  });

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

              <h2 style={{ textAlign: "center" }}>Create Account</h2>

              {/* GOOGLE SIGNUP */}
              <Button
                fullWidth
                variant="contained"
                startIcon={<GoogleIcon />}
                sx={{
                  mt: 2,
                  mb: 2,
                  backgroundColor: "#fff",
                  color: "#091057",
                  fontWeight: 600,
                  borderRadius: "10px",
                  "&:hover": { backgroundColor: "#f1f1f1" }
                }}
                onClick={registerWithGoogle}
              >
                Continue with Google
              </Button>

              <Divider className="span-tag" sx={{ mb: 2 }}>
                OR
              </Divider>

              {/* ✅ FORM START */}
              <Formik
                initialValues={{
                  username: "",
                  email: "",
                  password: "",
                }}
                validationSchema={validationSchema}
                onSubmit= {async(values, { setSubmitting }) => {
                  console.log(values);
                  setSubmitting(false);
                  try{
                    const res = await axios.post(`https://holistilearn-backend.vercel.app/user/register` , values , {
                      headers: {
                        "Content-Type": "application/json"
                      }
                    })
                    if(res.data.success){
                      navigate('/verify')
                      toast(res.data.message)
                    }
                  }catch(error){
                    console.log(error)

                  }
                }}
              >
                {({ isSubmitting }) => (
                  <Form>

                    <div className="form-group">
                      <Field
                        type="text"
                        name="username"
                        placeholder="Full Name"
                      />
                      <ErrorMessage
                        name="username"
                        component="div"
                        className="error-login"
                      />
                    </div>

                    <div className="form-group">
                      <Field
                        type="email"
                        name="email"
                        placeholder="Email address"
                      />
                      <ErrorMessage
                        name="email"
                        component="div"
                        className="error-login"
                      />
                    </div>

                    <div className="form-group password-group">
                      <Field
                        name="password"
                        placeholder="Password"
                        type={showPassword ? "text" : "password"}
                      />
                      <span
                        className="toggle-password"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </span>
                      <ErrorMessage
                        name="password"
                        component="div"
                        className=" error-login"
                      />
                    </div>

                    <button
                      type="submit"
                      className="btn-login"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Registering..." : "Register"}
                    </button>

                  </Form>
                )}
              </Formik>
              {/* ✅ FORM END */}

              <div className="auth-links">
                <p>
                  Already have an account?{" "}
                  <Link to="/login" className="signup-link">
                    Login
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

export default Register;