import { motion } from "framer-motion";
import AutoGraphIcon from '@mui/icons-material/AutoGraph';
import FaceRetouchingNaturalIcon from '@mui/icons-material/FaceRetouchingNatural';
import QuizIcon from '@mui/icons-material/Quiz';
import TimelineIcon from '@mui/icons-material/Timeline';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import TipsAndUpdatesIcon from '@mui/icons-material/TipsAndUpdates';
import '../../styles/ai.css';

const modules = [
  {
    title: "Adaptive Learning",
    desc: "Adjusts content difficulty based on real-time performance patterns.",
    icon: <AutoGraphIcon />,
    color: "#1e90ff"
  },
  {
    title: "Emotion Recognition",
    desc: "Analyzes engagement signals to prevent student burnout.",
    icon: <FaceRetouchingNaturalIcon />,
    color: "#ff8c00"
  },
  {
    title: "Smart Quiz Gen",
    desc: "Automatically crafts personalized assessments using NLP.",
    icon: <QuizIcon />,
    color: "#1e90ff"
  },
  {
    title: "Trend Prediction",
    desc: "Identifies grade outcomes using longitudinal trend analysis.",
    icon: <TimelineIcon />,
    color: "#ff8c00"
  },
  {
    title: "AI Study Planner",
    desc: "Optimizes schedules based on peak cognitive performance hours.",
    icon: <CalendarMonthIcon />,
    color: "#1e90ff"
  },
  {
    title: "Intelligent Feedback",
    desc: "Generates semantic insights to bridge specific knowledge gaps.",
    icon: <TipsAndUpdatesIcon />,
    color: "#ff8c00"
  }
];

const AIModules = () => {
  return (
    <section className="ai-modules-premium">
      <div className="container">
        <div className="modules-header">
          <span className="badge-glow">System Architecture</span>
          <h2 className="title-white">Core <span className="text-gradient-blue">Intelligence</span> Modules</h2>
          <p className="subtitle-gray">A multi-layered neural network designed for educational excellence.</p>
        </div>

        <div className="modules-grid-modern">
          {modules.map((mod, i) => (
            <motion.div
              key={i}
              className="module-card-glass"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              whileHover={{ y: -10 }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              viewport={{ once: true }}
            >
              <div className="module-status">
                <div className="status-dot"></div> Active
              </div>
              <div className="module-icon-box" style={{ color: mod.color }}>
                {mod.icon}
              </div>
              <h3>{mod.title}</h3>
              <p>{mod.desc}</p>
              <div className="module-card-footer">
                <span>V2.4 Powered</span>
                <div className="footer-line"></div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AIModules;