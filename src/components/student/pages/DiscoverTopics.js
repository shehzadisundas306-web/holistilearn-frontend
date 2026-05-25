// frontend/src/components/student/pages/DiscoverTopics.js
import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FaSearch, FaRocket, FaClock, FaSignal, FaSpinner, FaBookmark, 
  FaTimes, FaChevronLeft, FaChevronRight, FaRobot, FaBrain, 
  FaLightbulb, FaStar, FaFire, FaFilter, FaHistory
} from "react-icons/fa";
import { topicsAPI } from "../../../api/topics";
import { learningPathAPI } from "../../../api/learningPath";
import { dashboardAPI } from "../../../api/dashboard";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import debounce from "lodash/debounce";
import "../../../styles/DiscoverTopics.css";

const DiscoverTopics = () => {
  const navigate = useNavigate();
  
  // State Management
  const [loading, setLoading] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [topics, setTopics] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchSource, setSearchSource] = useState(null);
  const [isAIGenerating, setIsAIGenerating] = useState(false);
  const [mentalState, setMentalState] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [existingPaths, setExistingPaths] = useState([]);
  const [filters, setFilters] = useState({
    difficulty: "",
    goal: "mastery"
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    pages: 1
  });
  const [error, setError] = useState(null);
  
  // UI State
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchInputRef = useRef(null);
  const abortControllerRef = useRef(null);

  // Fetch mental state and existing paths on mount
  useEffect(() => {
    const fetchUserContext = async () => {
      try {
        // Fetch mental state
        const mentalResponse = await dashboardAPI.getMentalState?.();
        if (mentalResponse?.success && mentalResponse?.data) {
          setMentalState(mentalResponse.data.current);
          
          if (mentalResponse.data.current?.stressLevel === 'high') {
            toast.info("🧘 You seem stressed. Showing easier topics to help you ease in.");
            setFilters(prev => ({ ...prev, difficulty: 'beginner' }));
          }
        }
        
        // Fetch existing learning paths to check for duplicates
        const pathsResponse = await learningPathAPI.getAllPaths();
        if (pathsResponse.success && pathsResponse.data) {
          const allPaths = pathsResponse.data.allPaths || [];
          setExistingPaths(allPaths);
        }
      } catch (error) {
        console.log('User context fetch skipped:', error.message);
      }
    };
    fetchUserContext();
  }, []);

  // Fetch categories on mount
  useEffect(() => {
    fetchCategories();
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Fetch topics when category or pagination changes (not search)
  useEffect(() => {
    if (!searchQuery) {
      fetchTopics();
    }
  }, [activeCategory, pagination.page]);

  const fetchCategories = async () => {
    try {
      const response = await topicsAPI.getCategories();
      if (response.success) {
        setCategories(["All", ...response.data.map(cat => cat.name)]);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
      toast.error("Failed to load categories");
    }
  };

  const fetchTopics = async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    abortControllerRef.current = new AbortController();
    
    try {
      setLoading(true);
      setError(null);
      
      const queryParams = {
        page: pagination.page,
        limit: pagination.limit,
        sortBy: "popularity",
        ...(activeCategory !== "All" && { category: activeCategory })
      };
      
      const response = await topicsAPI.getTopics(queryParams);
      
      if (response.success) {
        setTopics(response.data.topics || []);
        setSearchSource('database');
        setPagination(response.data.pagination || {
          page: 1,
          limit: 12,
          total: 0,
          pages: 1
        });
      } else {
        setError(response.message || "Failed to load topics");
        toast.error(response.message || "Failed to load topics");
      }
    } catch (error) {
      if (error.name !== "AbortError") {
        console.error("Error fetching topics:", error);
        setError("Network error. Please check your connection.");
        toast.error("Failed to load topics");
      }
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  };

  // AI-Powered Search
  const performAISearch = async (query, difficulty, goal) => {
    setIsAIGenerating(true);
    setError(null);
    setLoading(true);
    
    try {
      const response = await topicsAPI.discoverTopics({ 
        query, 
        difficulty: difficulty || filters.difficulty || 'intermediate',
        goal: goal || filters.goal || 'mastery'
      });
      
      if (response.success) {
        // Mark topics that already have learning paths
        const topicsWithPathStatus = response.data.map(topic => ({
          ...topic,
          hasExistingPath: existingPaths.some(p => p.goal.toLowerCase() === topic.title.toLowerCase())
        }));
        
        setTopics(topicsWithPathStatus);
        setSearchSource(response.source);
        setPagination(prev => ({ ...prev, total: topicsWithPathStatus.length, pages: 1 }));
        
        if (response.source === 'ai') {
          toast.success(`🤖 AI generated ${topicsWithPathStatus.length} topics for "${query}"`);
        } else {
          toast.success(`Found ${topicsWithPathStatus.length} topics matching "${query}"`);
        }
      } else {
        setError(response.message || "No topics found");
        setTopics([]);
      }
    } catch (error) {
      console.error("AI Search error:", error);
      setError("Unable to discover topics. Please try again.");
      setTopics([]);
    } finally {
      setIsAIGenerating(false);
      setLoading(false);
    }
  };

  // Debounced search handler with AI fallback
  const debouncedSearch = useCallback(
    debounce(async (value) => {
      if (!value.trim() || value.length < 2) {
        if (searchQuery) {
          setSearchQuery("");
          setSearchSource(null);
          fetchTopics();
        }
        return;
      }
      
      setSearchQuery(value);
      await performAISearch(value);
    }, 600),
    [filters.difficulty, filters.goal, existingPaths]
  );

  const handleSearchChange = (e) => {
    const value = e.target.value;
    debouncedSearch(value);
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setSearchSource(null);
    debouncedSearch.cancel();
    if (searchInputRef.current) {
      searchInputRef.current.value = "";
      searchInputRef.current.focus();
    }
    fetchTopics();
  };

  const handleCategoryChange = (category) => {
    setActiveCategory(category);
    setSearchQuery("");
    setSearchSource(null);
    if (searchInputRef.current) {
      searchInputRef.current.value = "";
    }
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // UPDATED: Handle start topic - Direct to Learning Path
  const handleStartTopic = async (topic) => {
    try {
      // Check if a learning path already exists for this topic
      const existingPath = existingPaths.find(p => p.goal.toLowerCase() === topic.title.toLowerCase());
      
      if (existingPath) {
        // Path exists - offer to switch to it
        const confirmSwitch = window.confirm(
          `You already have a learning path for "${topic.title}".\n\nWould you like to switch to it?`
        );
        
        if (confirmSwitch) {
          toast.loading("Switching to existing learning path...");
          const switchResponse = await learningPathAPI.switchToPath(existingPath._id);
          toast.dismiss();
          
          if (switchResponse.success) {
            toast.success(`Switched to "${topic.title}" learning path!`);
            navigate("/student/learning-path");
          } else {
            toast.error("Failed to switch to existing path");
          }
        }
        return;
      }
      
      // No existing path - create new learning path
      toast.loading("Creating your personalized learning path...");
      
      const response = await learningPathAPI.generatePath({
        topic: topic.title,
        difficulty: topic.difficulty || filters.difficulty || 'intermediate',
        goal: filters.goal || 'mastery',
        timeCommitment: "moderate",
        forceCreate: true
      });
      
      toast.dismiss();
      
      if (response.success) {
        toast.success(`✨ Learning path for "${topic.title}" created!`);
        // Refresh existing paths list
        const pathsResponse = await learningPathAPI.getAllPaths();
        if (pathsResponse.success) {
          setExistingPaths(pathsResponse.data.allPaths || []);
        }
        navigate("/student/learning-path");
      } else if (response.warning) {
        // Path was just created but there's a warning
        toast.info(response.message || "Learning path created");
        navigate("/student/learning-path");
      } else {
        toast.error(response.message || "Failed to create learning path");
      }
      
    } catch (error) {
      toast.dismiss();
      console.error("Error starting topic:", error);
      toast.error(error.response?.data?.message || "Failed to start topic");
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    if (searchQuery) {
      performAISearch(searchQuery, key === 'difficulty' ? value : filters.difficulty, key === 'goal' ? value : filters.goal);
    }
  };

  const getDifficultyColor = (difficulty) => {
    const colors = {
      beginner: "#10b981",
      intermediate: "#f59e0b",
      advanced: "#ef4444"
    };
    return colors[difficulty] || "#6b7280";
  };

  const getDifficultyIcon = (difficulty) => {
    const icons = {
      beginner: "🌱",
      intermediate: "⚡",
      advanced: "🔥"
    };
    return icons[difficulty] || "📚";
  };

  const getStatusBadge = (status) => {
    const badges = {
      not_started: { text: "Not Started", color: "#6b7280" },
      in_progress: { text: "In Progress", color: "#f59e0b" },
      completed: { text: "Completed", color: "#10b981" }
    };
    return badges[status] || badges.not_started;
  };

  // Loading skeleton
  if (initialLoading) {
    return (
      <div className="discover-wrapper">
        <div className="skeleton-container">
          <div className="skeleton-header"></div>
          <div className="skeleton-tabs"></div>
          <div className="skeleton-grid">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="skeleton-card"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="discover-wrapper">
      {/* Header Section */}
      <header className="discover-header">
        <div className="title-area">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            Explore Knowledge
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            Discover topics and instantly create personalized learning paths
          </motion.p>
        </div>

        <div className={`search-container ${isSearchFocused ? "focused" : ""}`}>
          <div className="search-input-wrapper">
            <FaSearch className="search-icon" />
            <input
              ref={searchInputRef}
              type="text"
              className="search-input"
              placeholder="Search any topic... AI will help discover and create learning paths!"
              defaultValue={searchQuery}
              onChange={handleSearchChange}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              aria-label="Search topics"
            />
            {isAIGenerating && (
              <div className="ai-loading-indicator">
                <FaSpinner className="spinner-small" />
                <span>AI discovering topics...</span>
              </div>
            )}
            {searchQuery && !isAIGenerating && (
              <button 
                className="search-clear-btn" 
                onClick={handleClearSearch}
                aria-label="Clear search"
              >
                <FaTimes />
              </button>
            )}
          </div>
          
          {/* My Paths Button */}
          <button 
            className="my-paths-btn"
            onClick={() => navigate("/student/learning-path")}
            title="View your learning paths"
          >
            <FaHistory/>My Paths
          </button>
          
          {/* Filter Toggle Button */}
          <button 
            className={`filter-toggle-btn ${showFilters ? 'active' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
            aria-label="Toggle filters"
          >
            <FaFilter />
          </button>
        </div>

        {/* Filter Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div 
              className="filter-panel"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <div className="filter-group">
                <label>Difficulty</label>
                <div className="filter-options">
                  {['', 'beginner', 'intermediate', 'advanced'].map(diff => (
                    <button
                      key={diff}
                      className={`filter-option ${filters.difficulty === diff ? 'active' : ''}`}
                      onClick={() => handleFilterChange('difficulty', diff)}
                    >
                      {diff || 'All'}
                    </button>
                  ))}
                </div>
              </div>
              <div className="filter-group">
                <label>Learning Goal</label>
                <div className="filter-options">
                  {['mastery', 'job_preparation', 'project_based', 'exam', 'quick_overview'].map(goal => (
                    <button
                      key={goal}
                      className={`filter-option ${filters.goal === goal ? 'active' : ''}`}
                      onClick={() => handleFilterChange('goal', goal)}
                    >
                      {goal.replace('_', ' ').charAt(0).toUpperCase() + goal.replace('_', ' ').slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Filter Tabs (only show when not searching) */}
      {!searchQuery && (
        <nav className="filter-tabs" aria-label="Topic categories">
          <div className="tabs-container">
            {categories.map((cat) => (
              <button
                key={cat}
                className={`tab-btn ${activeCategory === cat ? "active" : ""}`}
                onClick={() => handleCategoryChange(cat)}
                aria-pressed={activeCategory === cat}
              >
                {cat}
              </button>
            ))}
          </div>
        </nav>
      )}

      {/* AI Search Badge */}
      {searchSource === 'ai' && searchQuery && (
        <motion.div 
          className="ai-badge"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <FaRobot className="ai-icon" />
          <span>AI-Generated topics for "{searchQuery}"</span>
          {mentalState?.stressLevel === 'high' && (
            <span className="mental-tag">🧘 Adjusted for lower stress</span>
          )}
          {filters.difficulty && (
            <span className="filter-tag">🎯 {filters.difficulty}</span>
          )}
        </motion.div>
      )}

      {/* Mental State Tip */}
      {mentalState?.stressLevel === 'high' && !searchQuery && (
        <div className="mental-tip">
          <FaLightbulb className="tip-icon" />
          <span>You seem stressed. Try these beginner-friendly topics to ease in.</span>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="error-state">
          <p>{error}</p>
          <button onClick={() => searchQuery ? performAISearch(searchQuery) : fetchTopics()} className="retry-btn">
            Try Again
          </button>
        </div>
      )}

      {/* Topics Grid */}
      {!error && (
        <>
          <div className="results-info">
            <span className="results-count">
              {topics.length > 0 
                ? `${topics.length} topic${topics.length !== 1 ? 's' : ''} found`
                : !loading && !isAIGenerating ? "No topics found" : ""
              }
            </span>
            {searchSource === 'ai' && (
              <span className="ai-powered-badge">
                <FaRobot /> AI Powered
              </span>
            )}
            {existingPaths.length > 0 && (
              <span className="paths-count-badge" onClick={() => navigate("/student/learning-path")}>
                <FaHistory /> {existingPaths.length} Path{existingPaths.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          <motion.div layout className="topics-grid1">
            <AnimatePresence mode="wait">
              {(loading || isAIGenerating) ? (
                <div className="loading-grid">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="skeleton-card"></div>
                  ))}
                </div>
              ) : topics.length === 0 ? (
                <motion.div 
                  className="empty-state"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <div className="empty-icon">🔍</div>
                  <h3>No topics found</h3>
                  <p>Try a different search term or browse categories</p>
                  <button onClick={handleClearSearch} className="clear-filters-btn">
                    Browse All Topics
                  </button>
                </motion.div>
              ) : (
                topics.map((topic, index) => {
                  const statusBadge = getStatusBadge(topic.userProgress?.status);
                  const hasExistingPath = existingPaths.some(p => p.goal.toLowerCase() === topic.title.toLowerCase());
                  
                  return (
                    <motion.div
                      layout
                      key={topic._id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ delay: Math.min(index * 0.05, 0.5) }}
                      whileHover={{ y: -8 }}
                      className={`topic-card-discover ${topic.isAIGenerated ? 'ai-generated' : ''} ${hasExistingPath ? 'has-path' : ''}`}
                    >
                      {topic.isAIGenerated && (
                        <div className="ai-tag">
                          <FaRobot /> AI Suggested
                        </div>
                      )}
                      
                      {hasExistingPath && (
                        <div className="existing-path-tag">
                          <FaHistory /> Learning Path Exists
                        </div>
                      )}
                      
                      <div className="card-badge" style={{ background: getDifficultyColor(topic.difficulty) }}>
                        <span className="difficulty-icon">{getDifficultyIcon(topic.difficulty)}</span>
                        <span className="difficulty-text">{topic.difficulty}</span>
                      </div>
                      
                      <div className="card-body card-body-discover1">
                        <h3 className="topic-title-discover">{topic.title}</h3>
                        <p className="topic-description-discover">
                          {topic.description?.substring(0, 120)}
                          {topic.description?.length > 120 && "..."}
                        </p>
                        {topic.whyRecommended && (
                          <div className="recommendation-reason">
                            <FaBrain className="reason-icon" />
                            <span>{topic.whyRecommended}</span>
                          </div>
                        )}
                      </div>

                      <div className="card-meta">
                        <div className="meta-item">
                          <FaSignal className="meta-icon" />
                          <span>{topic.category || 'Learning'}</span>
                        </div>
                        <div className="meta-item">
                          <FaClock className="meta-icon" />
                          <span>{Math.floor(topic.duration / 60)}h {topic.duration % 60}m</span>
                        </div>
                        {!topic.isAIGenerated && (
                          <div className="meta-item">
                            <span className={`status-dot ${topic.userProgress?.status}`} />
                            <span className="status-text">{statusBadge.text}</span>
                          </div>
                        )}
                      </div>

                      {/* Skills Tags */}
                      {topic.skills && topic.skills.length > 0 && (
                        <div className="skills-tags">
                          {topic.skills.slice(0, 3).map((skill, i) => (
                            <span key={i} className="skill-tag">{skill}</span>
                          ))}
                        </div>
                      )}

                      <div className="card-footer card-footer-discover1">
                        <button 
                          className={`enroll-btn ${hasExistingPath ? 'existing-path' : ''}`}
                          onClick={() => handleStartTopic(topic)}
                        >
                          <FaRocket /> 
                          <span>
                            {hasExistingPath ? "Continue Learning Path" : "Create Learning Path"}
                          </span>
                        </button>
                        <button 
                          className="save-btn-discover" 
                          title="Save to Library"
                          onClick={(e) => {
                            e.stopPropagation();
                            toast.info("Save to library coming soon!");
                          }}
                          aria-label="Save to library"
                        >
                          <FaBookmark />
                        </button>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </AnimatePresence>
          </motion.div>

          {/* Pagination - only for database results */}
          {!searchQuery && pagination.pages > 1 && !loading && topics.length > 0 && (
            <div className="pagination">
              <button
                className="page-btn prev"
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                aria-label="Previous page"
              >
                <FaChevronLeft /> Previous
              </button>
              
              <div className="page-numbers">
                {[...Array(Math.min(pagination.pages, 5))].map((_, i) => {
                  let pageNum;
                  if (pagination.pages <= 5) {
                    pageNum = i + 1;
                  } else if (pagination.page <= 3) {
                    pageNum = i + 1;
                  } else if (pagination.page >= pagination.pages - 2) {
                    pageNum = pagination.pages - 4 + i;
                  } else {
                    pageNum = pagination.page - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      className={`page-number ${pagination.page === pageNum ? "active" : ""}`}
                      onClick={() => handlePageChange(pageNum)}
                      aria-label={`Page ${pageNum}`}
                      aria-current={pagination.page === pageNum ? "page" : undefined}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              
              <button
                className="page-btn next"
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.pages}
                aria-label="Next page"
              >
                Next <FaChevronRight />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default DiscoverTopics;