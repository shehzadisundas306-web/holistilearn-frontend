import { useEffect, useState } from "react"; // Added useEffect
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { School, MenuBook } from '@mui/icons-material';
import { useGetData } from "../context/userContext";
import { toast } from "sonner";
import '../styles/roleselection.css'

const RoleSelection = () => {
  const { user, updateUser } = useGetData(); // Pull 'user' state too
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const navigate = useNavigate();

  // SAFETY CHECK: If user already has a role, don't let them stay here
  useEffect(() => {
    if (user && user.role !== "none") {
      navigate(user.role === "student" ? "/student" : "/teacher-onboarding");
    }
    
    if (!localStorage.getItem("accessToken")) {
       toast.error("Please login first");
       navigate("/login");
    }
  }, [user, navigate]);

  const handleContinue = async () => {
    if (!selected) return;

    setLoading(true);
    try {
      const token = localStorage.getItem("accessToken");
      
      // Ensure the port (5000 or 5001) matches your server.js!
      const res = await axios.put(
        "http://localhost:5000/user/update-role", 
        { role: selected },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (res.data.success) {
        updateUser(res.data.user);
        toast.success(`Welcome aboard as a ${selected}!`);

        if (selected === "student") {
          navigate("/student");
        } else {
          navigate("/teacher/dashboard");
        }
      }
    } catch (error) {
      console.error("Error updating role:", error);
      toast.error(error.response?.data?.message || "Failed to update role");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="role-container">
      {/* ... your existing motion.div and JSX ... */}
      <motion.div
        className="role-card-wrapper"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <h1 className="role-title">Choose Your Role</h1>
        <p className="role-subtitle">Select how you want to experience HolistiLearn</p>

        <div className="role-options">
          <motion.div
            className={`role-card ${selected === "student" ? "active" : ""}`}
            whileHover={{ scale: 1.05 }}
            onClick={() => setSelected("student")}
            style={{ cursor: "pointer" }}
          >
            <div className="role-icon"><School className="icons1" fontSize="large" /></div>
            <h2>Student</h2>
            <p className="text-dark fw-bold text-white">Learn with AI-powered personalized guidance</p>
          </motion.div>

          <motion.div
            className={`role-card ${selected === "teacher" ? "active" : ""}`}
            whileHover={{ scale: 1.05 }}
            onClick={() => setSelected("teacher")}
            style={{ cursor: "pointer" }}
          >
            <div className="role-icon"><MenuBook className="icons1" fontSize="large" /></div>
            <h2>Teacher</h2>
            <p className="text-dark fw-bold text-white">Track performance and mentor students effectively</p>
          </motion.div>
        </div>

        <button
          className="role-continue-btn"
          disabled={!selected || loading}
          onClick={handleContinue}
        >
          {loading ? "Saving..." : "Continue"}
        </button>
      </motion.div>
    </div>
  );
};

export default RoleSelection;
