import { motion } from "framer-motion";
import AppRegistrationIcon from '@mui/icons-material/AppRegistration';
import OnlinePredictionIcon from '@mui/icons-material/OnlinePrediction';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import AssessmentIcon from '@mui/icons-material/Assessment';
import '../../styles/about.css'

const steps = [
  {
    title: "Enroll & Profile",
    desc: "Join the platform and let our AI build your initial cognitive baseline.",
    icon: <AppRegistrationIcon fontSize="large" />
  },
  {
    title: "Pattern Analysis",
    desc: "The system monitors how you interact with content to find your learning gaps.",
    icon: <OnlinePredictionIcon fontSize="large" />
  },
  {
    title: "Adaptive Delivery",
    desc: "Lessons and quizzes evolve in real-time to challenge you perfectly.",
    icon: <AutoFixHighIcon fontSize="large" />
  },
  {
    title: "Growth Tracking",
    desc: "Receive deep insights into your academic and emotional progress.",
    icon: <AssessmentIcon fontSize="large" />
  }
];

const HowItWorks = () => {
  return (
    <section className="how-it-works-premium" id="how-it-works">
      <div className="container">
        <motion.div 
          className="section-header-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <span className="badge-navy">The Process</span>
          <h2 className="title-navy">How <span className="blue-text">HolistiLearn</span> Evolves</h2>
          <p className="p-subtitle">A continuous feedback loop designed for peak performance.</p>
        </motion.div>

        <div className="process-flow">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              className="process-step"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.2, duration: 0.8 }}
              viewport={{ once: true }}
            >
              <div className="step-number-wrapper">
                <div className="step-number-pill">0{index + 1}</div>
                {/* Visual Connector Line */}
                {index !== steps.length - 1 && (
                  <motion.div 
                    className="step-line-progress"
                    initial={{ height: 0 }}
                    whileInView={{ height: "100%" }}
                    transition={{ delay: 0.5, duration: 1 }}
                  />
                )}
              </div>

              <div className="step-card-modern">
                <div className="step-icon-circle">{step.icon}</div>
                <h3>{step.title}</h3>
                <p>{step.desc}</p>
                
                {/* Subtle numbering background for premium feel */}
                <span className="bg-number">{index + 1}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;