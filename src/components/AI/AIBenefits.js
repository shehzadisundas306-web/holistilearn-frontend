import { motion } from "framer-motion";
import MemoryIcon from '@mui/icons-material/Memory';
import SpeedIcon from '@mui/icons-material/Speed';
import SelfImprovementIcon from '@mui/icons-material/SelfImprovement';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import '../../styles/ai.css';

const benefits = [
  {
    title: "Improved Retention",
    desc: "Adaptive repetition and neural-pathway mapping increase long-term memory retention by up to 40%.",
    icon: <MemoryIcon />,
    metric: "+40%"
  },
  {
    title: "Faster Mastery",
    desc: "Our engine adjusts difficulty in real-time, allowing students to master concepts 2x faster than traditional methods.",
    icon: <SpeedIcon />,
    metric: "2.5x"
  },
  {
    title: "Reduced Stress",
    desc: "Predictive planning prevents cognitive overload by balancing intense study with necessary mental breaks.",
    icon: <SelfImprovementIcon />,
    metric: "Optimal"
  },
  {
    title: "Higher Performance",
    desc: "Granular data insights help bridge knowledge gaps, consistently leading to higher academic percentiles.",
    icon: <TrendingUpIcon />,
    metric: "Top 10%"
  }
];

const AIBenefits = () => {
  return (
    <section className="benefits-minimal-section">
      <div className="container">
        <div className="benefits-header-simple">
          <span className="accent-text">Real-World Impact</span>
          <h2 className="title-navy-bold">AI-Driven <span className="text-orange">Outcomes</span></h2>
          <div className="title-underline"></div>
        </div>

        <div className="benefits-layout-grid">
          {benefits.map((item, index) => (
            <motion.div
              key={index}
              className="benefit-item-modern"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.7 }}
              viewport={{ once: true }}
            >
              <div className="benefit-top">
                <div className="benefit-icon-wrapper">{item.icon}</div>
                <span className="benefit-metric-tag">{item.metric}</span>
              </div>
              <div className="benefit-body">
                <h3>{item.title}</h3>
                <p>{item.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AIBenefits;