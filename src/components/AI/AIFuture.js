import { motion } from "framer-motion";
import SmartToyIcon from '@mui/icons-material/SmartToy';
import PsychologyIcon from '@mui/icons-material/Psychology';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import TrackChangesIcon from '@mui/icons-material/TrackChanges';
import '../../styles/ai.css';

const futurePillars = [
  { icon: <SmartToyIcon />, title: "AI Virtual Tutor", text: "24/7 NLP-powered assistance for instant student support." },
  { icon: <PsychologyIcon />, title: "Reinforcement Learning", text: "Systems that evolve and optimize based on successful outcomes." },
  { icon: <AutoAwesomeIcon />, title: "Auto-Assessments", text: "Generative AI creating unique evaluations on the fly." },
  { icon: <TrackChangesIcon />, title: "Behavioral Adaptation", text: "Real-time adjustments based on cognitive load signals." }
];

const AIFuture = () => {
  return (
    <section className="ai-future-premium">
      {/* Decorative background elements */}
      <div className="future-bg-glow"></div>
      
      <div className="container">
        <motion.div 
          className="future-header"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <span className="future-badge">Coming Soon</span>
          <h2 className="future-title">The Future of <span className="text-orange">AI Intelligence</span></h2>
          <p className="future-intro">
            We are engineering the next frontier of education. By merging Reinforcement Learning with 
            Predictive Analytics, HolistiLearn is evolving into a truly autonomous learning ecosystem.
          </p>
        </motion.div>

        <div className="future-pillars-grid">
          {futurePillars.map((pillar, index) => (
            <motion.div 
              key={index}
              className="pillar-card"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.15, duration: 0.6 }}
              viewport={{ once: true }}
              whileHover={{ y: -5, backgroundColor: "rgba(255, 255, 255, 0.08)" }}
            >
              <div className="pillar-icon">{pillar.icon}</div>
              <h3>{pillar.title}</h3>
              <p>{pillar.text}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AIFuture;