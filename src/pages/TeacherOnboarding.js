import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import '../styles/teacherboarding.css'

/* AutoSave Component*/
const AutoSave = ({ values }) => {
  useEffect(() => {
    localStorage.setItem("teacherData", JSON.stringify(values));
  }, [values]);

  return null;
};

const TeacherOnboarding = () => {
  const navigate = useNavigate();

  const savedData = JSON.parse(localStorage.getItem("teacherData")) || {};
  const savedStep = parseInt(localStorage.getItem("teacherStep")) || 1;

  const [step, setStep] = useState(savedStep);
  const totalSteps = 3;

  const validationSchemas = [
    Yup.object({
      fullName: Yup.string().required("Full name is required"),
    }),
    Yup.object({
      qualification: Yup.string().required("Qualification required"),
      specialization: Yup.string().required("Specialization required"),
    }),
    Yup.object({
      experience: Yup.number()
        .typeError("Enter valid number")
        .required("Experience required"),
      bio: Yup.string()
        .min(20, "Minimum 20 characters")
        .required("Bio required"),
    }),
  ];

  const initialValues = {
    fullName: savedData.fullName || "",
    qualification: savedData.qualification || "",
    specialization: savedData.specialization || "",
    experience: savedData.experience || "",
    bio: savedData.bio || "",
  };

  const handleNext = (values) => {
    localStorage.setItem("teacherData", JSON.stringify(values));
    localStorage.setItem("teacherStep", step + 1);
    setStep(step + 1);
  };

  const handleSubmit = (values) => {
    localStorage.setItem("teacherData", JSON.stringify(values));
    localStorage.setItem("teacherCompleted", "true");
    navigate("/teacher-dashboard");
  };

  const progressPercent = (step / totalSteps) * 100;

  return (
    <>
    <div className="teacher-onboard-container">
      <div className="overlay" />

      <motion.div
        className="teacher-card"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2 className="step-title teacher-profile-text">Complete Your Teacher Profile</h2>

        {/* Progress Bar */}
        <div className="progress-wrapper">
          <motion.div
            className="progress-bar"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>

        <Formik
          initialValues={initialValues}
          validationSchema={validationSchemas[step - 1]}
          onSubmit={(values) => {
            if (step < totalSteps) {
              handleNext(values);
            } else {
              handleSubmit(values);
            }
          }}
        >
          {({ values }) => (
            <>
              {/* Auto Save Hook Component */}
              <AutoSave values={values} />

              <Form>
                <AnimatePresence mode="wait">
                  {step === 1 && (
                    <motion.div
                      key="step1"
                      initial={{ x: 80, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      exit={{ x: -80, opacity: 0 }}
                    >
                      <div className="form-group">
                        <Field name="fullName" placeholder="Full Name" />
                        <ErrorMessage
                          name="fullName"
                          component="div"
                          className="error"
                        />
                      </div>
                    </motion.div>
                  )}

                  {step === 2 && (
                    <motion.div
                      key="step2"
                      initial={{ x: 80, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      exit={{ x: -80, opacity: 0 }}
                    >
                      <div className="form-group">
                        <Field
                          name="qualification"
                          placeholder="Highest Qualification"
                        />
                        <ErrorMessage
                          name="qualification"
                          component="div"
                          className="error"
                        />
                      </div>

                      <div className="form-group">
                        <Field
                          name="specialization"
                          placeholder="Specialization"
                        />
                        <ErrorMessage
                          name="specialization"
                          component="div"
                          className="error"
                        />
                      </div>
                    </motion.div>
                  )}

                  {step === 3 && (
                    <motion.div
                      key="step3"
                      initial={{ x: 80, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      exit={{ x: -80, opacity: 0 }}
                    >
                      <div className="form-group">
                        <Field
                          name="experience"
                          placeholder="Years of Experience"
                        />
                        <ErrorMessage
                          name="experience"
                          component="div"
                          className="error"
                        />
                      </div>

                      <div className="form-group">
                        <Field
                          as="textarea"
                          name="bio"
                          placeholder="Professional Bio"
                          rows="3"
                        />
                        <ErrorMessage
                          name="bio"
                          component="div"
                          className="error"
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="button-group">
                  {step > 1 && (
                    <button
                      type="button"
                      className="prev-btn"
                      onClick={() => {
                        localStorage.setItem("teacherStep", step - 1);
                        setStep(step - 1);
                      }}
                    >
                      Back
                    </button>
                  )}

                  <button type="submit" className="next-btn">
                    {step === totalSteps
                      ? "Complete Setup"
                      : "Next"}
                  </button>
                </div>
              </Form>
            </>
          )}
        </Formik>
      </motion.div>
    </div>
    </>
  );
};

export default TeacherOnboarding;

