import { motion } from "framer-motion";
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import QuizIcon from '@mui/icons-material/Quiz';
import TimelineIcon from '@mui/icons-material/Timeline';
import Counter from "./Counter"; // Ensure Counter.jsx is in the same folder
import '../../styles/about.css'

const highlights = [
  {
    title: "AI Study Plans",
    desc: "Dynamically adjusted schedules that prioritize your weak areas while optimizing for your peak focus hours.",
    icon: <AutoFixHighIcon fontSize="large" />
  },
  {
    title: "Smart Quiz System",
    desc: "Adaptive testing that changes difficulty in real-time based on your current understanding level.",
    icon: <QuizIcon fontSize="large" />
  },
  {
    title: "Advanced Analytics",
    desc: "Visualize your growth with granular data tracking emotional trends and cognitive retention.",
    icon: <TimelineIcon fontSize="large" />
  }
];

const AboutFeatures = () => {
  return (
    <section className="about-features-premium">
      <div className="container">
        {/* SECTION INTRO */}
        <motion.div 
          className="section-intro"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <span className="badge-outline">Innovation</span>
          <h2 className="h2-navy">Platform Highlights</h2>
          <p className="p-gray">Designed to modernize the educational landscape through intelligence.</p>
        </motion.div>

        {/* NEW: STATS COUNTER BANNER */}
        <motion.div 
          className="stats-banner-modern"
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <div className="stat-item-about">
            <h5><Counter end={98} />%</h5>
            <p>Accuracy Rate</p>
          </div>
          <div className="stat-divider"></div>
          <div className="stat-item-about">
            <h5><Counter end={24} />/7</h5>
            <p>AI Support</p>
          </div>
          <div className="stat-divider"></div>
          <div className="stat-item-about">
            <h5><Counter end={10} />k+</h5>
            <p>Active Learners</p>
          </div>
        </motion.div>

        {/* FEATURES GRID */}
        <div className="features-grid-premium">
          {highlights.map((item, index) => (
            <motion.div
              key={index}
              className="feature-card-modern"
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.15, duration: 0.7 }}
              viewport={{ once: true }}
              whileHover={{ y: -10 }}
            >
              <div className="feature-icon-box">{item.icon}</div>
              <h3>{item.title}</h3>
              <p>{item.desc}</p>
              <div className="card-glow-effect"></div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AboutFeatures;