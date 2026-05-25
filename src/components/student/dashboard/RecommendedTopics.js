import { motion } from "framer-motion";
import { FaTerminal, FaBrain, FaCode, FaMicrochip, FaPlus } from "react-icons/fa";

const topics = [
  { name: "Deep Learning", icon: <FaBrain />, level: "Advanced", color: "#F5C45E" },
  { name: "Computer Vision", icon: <FaMicrochip />, level: "Intermediate", color: "#3498db" },
  { name: "React Optimization", icon: <FaCode />, level: "Expert", color: "#2ecc71" },
  { name: "Natural Language Processing", icon: <FaTerminal />, level: "Advanced", color: "#9b59b6" }
];

const RecommendedTopics = () => {
  return (
    <div className="recommended-section-premium">
      <div className="section-header-flex">
        <div>
          <h3>Tailored for Your Growth</h3>
          <p>Based on your recent activity in AI & Development</p>
        </div>
        <button className="view-all-link">View All Topics</button>
      </div>

      <div className="topics-grid-modern">
        {topics.map((topic, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ y: -5, backgroundColor: "rgba(255, 255, 255, 0.06)" }}
            className="topic-pill-card"
          >
            <div className="topic-icon-circle" style={{ color: topic.color }}>
              {topic.icon}
            </div>
            
            <div className="topic-info">
              <span className="level-tag">{topic.level}</span>
              <h4>{topic.name}</h4>
            </div>

            <motion.button 
              className="add-to-path-btn"
              whileTap={{ scale: 0.9 }}
            >
              <FaPlus />
            </motion.button>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default RecommendedTopics;



