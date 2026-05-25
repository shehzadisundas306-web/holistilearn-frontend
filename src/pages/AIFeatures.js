import AIHero from "../components/AI/AIHero";
import AIModules from "../components/AI/AIModules";
import AIProcess from "../components/AI/AIProcess";
import AIBenefits from "../components/AI/AIBenefits";
import AIFuture from "../components/AI/AIFuture";
import AICTA from "../components/AI/AICTA";
import Topbar from "../components/Navbar/Topbar";
import Navbar from "../components/Navbar/Navbar";
import Footer from "../components/CTA/CTA";
import ScrollReveal from "../components/ScrollReveal";
// import "../styles/ai.css";

const AIFeatures = () => {
  return (
    <div className="ai-page">
      <ScrollReveal/>
      <Topbar/>
      <Navbar/>  
      <AIHero />
      <AIProcess />
      <AIModules />
      <AIBenefits />
      <AIFuture />
      <AICTA />
      <Footer/>
    </div>
  );
};

export default AIFeatures;