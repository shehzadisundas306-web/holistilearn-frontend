import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FaSearch, FaStickyNote, FaQuestionCircle, FaComments, FaArrowRight } from "react-icons/fa";

const QuickActions = () => {
  const navigate = useNavigate();

  const actions = [
    {
      title: "Discover Topics",
      description: "Explore AI learning paths",
      icon: <FaSearch />,
      path: "/student/discover",
      color: "gold"
    },
    {
      title: "Generate Notes",
      description: "AI-powered study guides",
      icon: <FaStickyNote />,
      path: "/student/ai",
      color: "blue"
    },
    {
      title: "Take Quiz",
      description: "Test your knowledge",
      icon: <FaQuestionCircle />,
      path: "/student/quiz",
      color: "green"
    },
    {
      title: "Teacher Chat",
      description: "Ask questions instantly",
      icon: <FaComments />,
      path: "/student/chat",
      color: "purple"
    }
  ];

  return (
    <div className="quick-actions-section">
      <div className="section-header">
        <h3>Quick Actions</h3>
        <p>Jump straight into your tasks</p>
      </div>

      <div className="actions-grid-premium">
        {actions.map((action, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ y: -8, transition: { duration: 0.2 } }}
            className={`action-card-premium ${action.color}`}
            onClick={() => navigate(action.path)}
          >
            <div className="action-card-content">
              <div className="icon-wrapper">
                {action.icon}
              </div>
              <div className="text-wrapper">
                <h4>{action.title}</h4>
                <p>{action.description}</p>
              </div>
              <div className="arrow-hint">
                <FaArrowRight />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default QuickActions;

