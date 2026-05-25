import { motion } from "framer-motion";
import TrackChangesIcon from '@mui/icons-material/TrackChanges';
import FavoriteIcon from '@mui/icons-material/Favorite';
import InsightIcon from '@mui/icons-material/Assessment';
import '../../styles/about.css'

const Mission = () => {
  const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: (i) => ({
      opacity: 1, 
      y: 0, 
      transition: { delay: i * 0.2, duration: 0.6, ease: "easeOut" }
    })
  };

  const missionData = [
    {
      icon: <TrackChangesIcon fontSize="large" />,
      title: "Personalized Evolution",
      desc: "Our AI tailors every quiz and lesson to match the student's unique cognitive pace."
    },
    {
      icon: <FavoriteIcon fontSize="large" />,
      title: "Holistic Well-being",
      desc: "We analyze emotional patterns to ensure students stay motivated and stress-free."
    },
    {
      icon: <InsightIcon fontSize="large" />,
      title: "Actionable Intel",
      desc: "Transforming raw data into clear pathways for both teachers and students."
    }
  ];

  return (
    <section className="mission-section">
      <div className="container">
        <motion.div
          className="mission-header"
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <span className="section-badge">Our Purpose</span>
          <h2 className="section-title-navy">Empowering the Next Generation</h2>
          <p className="section-subtitle">
            Beyond just grades, we aim to build intelligent systems that understand 
            the human side of learning.
          </p>
        </motion.div>

        <div className="mission-grid">
          {missionData.map((item, i) => (
            <motion.div
              className="mission-premium-card"
              custom={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={cardVariants}
              key={i}
            >
              <div className="mission-icon-wrapper">{item.icon}</div>
              <h3>{item.title}</h3>
              <p>{item.desc}</p>
              <div className="card-accent-line"></div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Mission;