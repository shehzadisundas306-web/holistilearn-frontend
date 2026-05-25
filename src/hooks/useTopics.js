import { useState, useEffect } from 'react';
import topicService from '../services/topicService';

export const useRecommendedTopics = () => {
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRecommendations = async () => {
    try {
      const response = await topicService.getRecommendedTopics();
      if (response.success) {
        setTopics(response.data);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, []);

  return { topics, loading, error, refresh: fetchRecommendations };
};