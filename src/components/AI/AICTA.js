import { motion } from "framer-motion";
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import InsightsIcon from '@mui/icons-material/Insights';
import '../../styles/ai.css';

const AICTA = () => {
  return (
    <section className="ai-cta-clean ">
      <div className="container ">
        <motion.div 
          className="cta-minimal-content"
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          viewport={{ once: true }}
        >
          <motion.div 
            className="cta-icon-float"
            animate={{ y: [0, -10, 0] }}
            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
          >
            <InsightsIcon />
          </motion.div>

          <h2 className="cta-headline">
            Experience the next generation of <br />
            <span className="text-gradient-intelligence">Intelligent Learning</span>
          </h2>
          
          <p className="cta-subtext">
            Join thousands of students using HolistiLearn to map their cognitive potential 
            and achieve academic mastery through personalized AI.
          </p>

          <div className="cta-button-group">
            <motion.button 
              className="btn-ai-primary"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Start Your Journey Now <ArrowForwardIcon className="arrow-icon" />
            </motion.button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default AICTA;