import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import SchoolIcon from "@mui/icons-material/School";
import PersonIcon from "@mui/icons-material/Person";
import '../../styles/landingpage.css';

const RoleHighlight = () => {
  const navigate = useNavigate();

  return (
    <section className="role-section">
      <div className="container text-center">

        <h2 className="role-heading">Who Is HolistiLearn For?</h2>
        <p className="role-subtext">
          Designed to empower both learners and educators through
          intelligent digital education tools.
        </p>

        <div className="role-highlight">

          <motion.div
            className="role-card"
            whileHover={{ y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <div className="role-icon">
              <SchoolIcon fontSize="large" />
            </div>
            <h3>Students</h3>
            <p>
              Personalized AI-driven learning paths,
              performance tracking, and adaptive assessments.
            </p>
            <button
              className="role-btn"
              onClick={() => navigate("/register")}
            >
              Join as Student
            </button>
          </motion.div>

          <motion.div
            className="role-card"
            whileHover={{ y: -10 }}
            transition={{ duration: 0.3 }}
          >
            <div className="role-icon">
              <PersonIcon fontSize="large" />
            </div>
            <h3>Teachers</h3>
            <p>
              Manage classrooms, analyze student performance,
              and mentor with powerful analytics tools.
            </p>
            <button
              className="role-btn"
              onClick={() => navigate("/register")}
            >
              Join as Teacher
            </button>
          </motion.div>

        </div>
      </div>
    </section>
  );
};

export default RoleHighlight;
