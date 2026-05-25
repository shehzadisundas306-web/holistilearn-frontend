import { motion } from "framer-motion";
import PsychologyIcon from '@mui/icons-material/Psychology';
import QueryStatsIcon from '@mui/icons-material/QueryStats';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import '../../styles/ai.css';

const AIHero = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.3 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.6 } }
  };

  return (
    <section className="ai-intelligence-section">
      <div className="container ai-grid">
        
        {/* LEFT: Content & Stats */}
        <motion.div 
          className="ai-info-side"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <motion.span className="ai-badge" variants={itemVariants}>
            <AutoFixHighIcon style={{ fontSize: '1rem' }} /> Proprietary Engine
          </motion.span>
          
          <motion.h2 className="ai-title" variants={itemVariants}>
            AI-Powered <span className="text-blue">Learning Intelligence</span>
          </motion.h2>
          
          <motion.p className="ai-description" variants={itemVariants}>
            HolistiLearn goes beyond simple automation. We use **Emotional Analytics** and **Neural Mapping** to adjust content based on a student's cognitive load and stress levels.
          </motion.p>

          <div className="ai-feature-list">
            <motion.div className="ai-feature-item" variants={itemVariants}>
              <div className="ai-icon-circle"><PsychologyIcon /></div>
              <div>
                <h4>Cognitive Baseline</h4>
                <p>Maps 15+ learning traits to create a unique student DNA.</p>
              </div>
            </motion.div>

            <motion.div className="ai-feature-item" variants={itemVariants}>
              <div className="ai-icon-circle"><QueryStatsIcon /></div>
              <div>
                <h4>Predictive Analysis</h4>
                <p>Identifies potential learning blocks before they happen.</p>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* RIGHT: The AI Visualization */}
        <div className="ai-visual-side">
          <motion.div 
            className="ai-main-orb"
            animate={{ 
              boxShadow: ["0 0 20px #1e90ff", "0 0 60px #1e90ff", "0 0 20px #1e90ff"],
              scale: [1, 1.05, 1]
            }}
            transition={{ repeat: Infinity, duration: 4 }}
          >
            <div className="inner-pulse"></div>
            
            {/* Floating Data Nodes */}
            <motion.div 
              className="data-node n1"
              animate={{ y: [0, -20, 0] }}
              transition={{ repeat: Infinity, duration: 3 }}
            >
              <span>Stress Level: Low</span>
            </motion.div>
            <motion.div 
              className="data-node n2"
              animate={{ y: [0, 20, 0] }}
              transition={{ repeat: Infinity, duration: 3.5, delay: 0.5 }}
            >
              <span>Focus: 92%</span>
            </motion.div>
          </motion.div>
          
          <div className="ai-scan-line"></div>
        </div>

      </div>
    </section>
  );
};

export default AIHero;