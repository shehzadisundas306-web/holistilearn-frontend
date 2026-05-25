import { motion } from "framer-motion";
// import "./HowItWorks.css";
import { IoTrainSharp } from "react-icons/io5";
import { GiBrain } from "react-icons/gi";
import { FaChalkboardTeacher } from "react-icons/fa";
import '../styles/landingpage.css'

const steps = [
  {
    id: 1,
    title: "Ask the AI",
    description:
      "Students enter academic queries related to their subject, concept, or topic. The AI instantly processes context and delivers structured explanations.",
    icon: <IoTrainSharp className="text-primary"/>,
  },
  {
    id: 2,
    title: "Smart Understanding",
    description:
      "The AI adapts responses based on student input, generating explanations, examples, and practice assessments dynamically.",
    icon: <GiBrain className="text-success"/>,
  },
  {
    id: 3,
    title: "Connect with Teachers",
    description:
      "Students can optionally initiate communication with registered teachers for further clarification and academic mentoring.",
    icon: <FaChalkboardTeacher className="text-danger"/>,
  },
];

const containerVariant = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.3,
    },
  },
};

const cardVariant = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0 },
};

const HowItWorks = () => {
  return (
    <section className="how-section" id="how-it-works">
      <div className="how-container">

        {/* SECTION HEADER */}
        <motion.div
          className="how-header"
          initial={{ opacity: 0, y: -30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
        >
          <h2>How It Works</h2>
          <p>
            A seamless AI-powered academic assistance workflow designed
            for dynamic learning without predefined courses.
          </p>
        </motion.div>

        {/* STEPS */}
        <motion.div
          className="steps-wrapper"
          variants={containerVariant}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {steps.map((step) => (
            <motion.div
              key={step.id}
              className="step-card"
              variants={cardVariant}
              transition={{ duration: 0.6 }}
            >
              <div className="step-number">{step.id}</div>
              <div className="step-icon">{step.icon}</div>
              <h4>{step.title}</h4>
              <p>{step.description}</p>
            </motion.div>
          ))}
        </motion.div>

      </div>
    </section>
  );
};

export default HowItWorks;