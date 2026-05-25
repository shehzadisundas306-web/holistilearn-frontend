// frontend/src/routes/StudentRoutes.js
import { Routes, Route } from "react-router-dom";
import DashboardLayout from "../components/student/layout/DashboardLayout";
import StudentDashboard from "../pages/StudentDashboard";
import LearningPath from "../components/student/pages/LearningPath";
import Progress from "../components/student/pages/Progress";
import DiscoverTopics from "../components/student/pages/DiscoverTopics";
import Chat from "../components/student/pages/Chat";
import AINotesGenerator from "../components/student/pages/AINotesGenerator";
import MentalStateTracker from "../components/student/pages/MentalStateTracker";
import QuizHub from "../components/quiz/QuizHub";
import ActivityTimeline from "../components/student/pages/ActivityTimeline";
import TopicDetail from "../components/student/topics/TopicDetail";
import TeachersPage from "../components/student/pages/TeachersPage";
import TopicsList from "../components/student/topics/TopicList";
import StudentClasses from "../pages/student/StudentClasses";
import StudentClassDetails from "../pages/student/StudentClassDetails";
import JoinClass from "../pages/student/JoinClass";
import StudentChat from "../pages/student/StudentChat";
// ✅ Import personal quiz components
import StudentTakeQuiz from "../pages/student/StudentTakeQuiz";
import StudentQuizResult from "../pages/student/StudentQuizResult";
import JoinLiveClass from "../pages/student/JoinLiveClass";
import QuizResults from "../components/quiz/QuizResults";
import TakeQuiz from "../components/quiz/TakeQuiz";

const StudentRoutes = () => {
  return (
    <Routes>
      <Route element={<DashboardLayout />}>
        {/* Dashboard Home */}
        <Route index element={<StudentDashboard />} />

        {/* Discovery & Topics */}
        <Route path="discover" element={<DiscoverTopics />} />
        <Route path="topics" element={<TopicsList />} />
        <Route path="topics/:topicId" element={<TopicDetail />} />

        {/* Learning Path */}
        <Route path="learning-path" element={<LearningPath />} />

        {/* ==================== QUIZ ROUTES ==================== */}
        
        {/* Personal Student Quizzes (self-generated AI quizzes) */}
        <Route path="student-quiz/:quizId" element={<TakeQuiz />} />
        <Route path="student-quiz/:quizId/result" element={<QuizResults />} />
        
        {/* Teacher Class Quizzes (handled by QuizHub) */}
        <Route path="quiz/*" element={<QuizHub />} />
        {/* import JoinLiveClass from '../pages/student/JoinLiveClass'; */}

{/* // Inside the <Routes> block, under DashboardLayout */}
<Route path="join-live/:sessionId" element={<JoinLiveClass />} />

        {/* Progress & History */}
        <Route path="progress" element={<Progress />} />
        <Route path="history" element={<ActivityTimeline />} />

        {/* Chat System */}
        <Route path="chat" element={<Chat />} />
        <Route path="chat/:chatId" element={<StudentChat />} />

        {/* AI Tools */}
        <Route path="ai" element={<AINotesGenerator />} />
        <Route path="mental" element={<MentalStateTracker />} />

        {/* Teachers Discovery */}
        <Route path="teachers" element={<TeachersPage />} />

        {/* Class Management */}
        <Route path="join" element={<JoinClass />} />
        <Route path="classes" element={<StudentClasses />} />
        <Route path="classes/:classId" element={<StudentClassDetails />} />
      </Route>
    </Routes>
  );
};

export default StudentRoutes;