import { motion } from "framer-motion";
import '../../styles/ai.css';

const steps = [
  { 
    title: "Data Collection", 
    desc: "Aggregating multi-modal learning inputs from student interactions." 
  },
  { 
    title: "Behavioral Analysis", 
    desc: "Neural networks identify focus shifts and cognitive load patterns." 
  },
  { 
    title: "Algorithm Application", 
    desc: "Adaptive logic selects the optimal learning path for the current state." 
  },
  { 
    title: "Personalized Delivery", 
    desc: "Real-time content generation tailored to specific knowledge gaps." 
  },
  { 
    title: "Feedback Loop", 
    desc: "System recalibrates based on outcome success for future accuracy." 
  }
];

const AIProcess = () => {
  return (
    <section className="ai-process-minimal">
      <div className="container">
        <div className="process-intro">
          <span className="process-badge">Operational Flow</span>
          <h2 className="process-title-main">The <span className="text-blue">Intelligence</span> Pipeline</h2>
        </div>

        <div className="process-timeline">
          {/* Central Line */}
          <div className="timeline-line"></div>

          {steps.map((step, index) => (
            <motion.div
              key={index}
              className={`process-item-row ${index % 2 === 0 ? "left" : "right"}`}
              initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: index * 0.1 }}
              viewport={{ once: true, margin: "-100px" }}
            >
              <div className="process-node">
                <div className="node-number">{index + 1}</div>
              </div>
              
              <div className="process-content-box">
                <h3 className="step-title">{step.title}</h3>
                <p className="step-desc">{step.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AIProcess;