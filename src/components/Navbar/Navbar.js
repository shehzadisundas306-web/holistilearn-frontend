import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import '../../styles/landingpage.css';

const Navbar = () => {
  return (
    <motion.nav className="navbar pt-3 pb-3 navbar-expand-lg custom-navbar ">
      <div className="container">
        {/* LOGO */}
        <Link className="navbar-brand logo-text" to="/">
          HolistiLearn
        </Link>

        <button
          className="navbar-toggler text-white"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarContent"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="navbarContent">

          {/* CENTER LINKS */}
          <ul className="navbar-nav mx-auto">
            <li className="nav-item-home">
              <Link className="nav-link nav-animated" to="/">Home</Link>
            </li>
            <li className="nav-item-home">
              <Link className="nav-link nav-animated" to="/about">About</Link>
            </li>

            <li className="nav-item-home">
              <Link className="nav-link nav-animated" to="/Aifeatures">AI Features</Link>
              
            </li>

          </ul>

          {/* GET STARTED BUTTON */}
          <div className="ms-auto">
            <Link to="/register" className="btn-get-started">
              Get Started
            </Link>
          </div>

        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar;
