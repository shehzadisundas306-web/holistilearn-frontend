import { motion } from "framer-motion";
import AnalyticsIcon from "@mui/icons-material/Analytics";
import QuizIcon from "@mui/icons-material/Quiz";
import SchoolIcon from "@mui/icons-material/School";
import DashboardIcon from "@mui/icons-material/Dashboard";
import BarChartIcon from "@mui/icons-material/BarChart";
import AllInclusiveIcon from "@mui/icons-material/AllInclusive";
import '../../styles/landingpage.css';

const features = [
  {
    icon: <AnalyticsIcon />,
    title: "AI-Powered Analytics",
    desc: "Real-time tracking and predictive insights for student growth."
  },
  {
    icon: <QuizIcon />,
    title: "Adaptive Quiz Engine",
    desc: "Smart quizzes that adjust based on performance levels."
  },
  {
    icon: <SchoolIcon />,
    title: "Student Membership",
    desc: "Structured membership system for organized learning."
  },
  {
    icon: <DashboardIcon />,
    title: "Teacher Dashboard",
    desc: "Comprehensive panel for managing classes and content."
  },
  {
    icon: <BarChartIcon />,
    title: "Performance Reports",
    desc: "Detailed analytics and downloadable progress reports."
  },
  {
    icon: <AllInclusiveIcon />,
    title: "Lifetime Access",
    desc: "Access your courses and materials anytime, anywhere."
  }
];

const FeaturesSection = () => {
  return (
    <section className="feature-section">
      <div className="container feature-grid">

        {/* LEFT SIDE */}
        <div className="feature-left">
          <h2>Features That Empower Everyone</h2>
          <p>
            HolistiLearn delivers intelligent tools for students and teachers,
            combining AI technology with modern educational systems to create
            a powerful digital learning environment. The proposed web application offers a unique blend of adaptive education and mental health support. Unlike traditional e-learning platforms, it does not only focus on 
            academic growth but also addresses student well-being, making it a holistic learning 
            ecosystem. It is not just learning app; it is a complete platform that helps student’s study 
            better and feel better at the same time. The app uses AI to give lessons, quizzes, and study material according to each student’s 
            level. Students can see their own performance clearly. Only the student should see private 
            mental health and academic data; teachers/parents can see anonymized or voluntary 
            shared data. The student-to-teacher Communication Dashboard provides a secure and private 
            channel for students to communicate directly with their instructors. It allows students 
            to ask questions, request guidance, seek feedback, or discuss academic and emotional 
            concerns without automatically sharing sensitive data. This feature promotes two-way communication and collaboration while maintaining 
            student control over personal and emotional data, creating a supportive and safe 
            learning environment.
          </p>
        </div>

        {/* RIGHT SIDE */}
        <div className="feature-right">
          {features.map((item, index) => (
            <motion.div
              key={index}
              className="feature-card"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <div className="feature-icon">{item.icon}</div>
              <h4>{item.title}</h4>
              <p>{item.desc}</p>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default FeaturesSection;
