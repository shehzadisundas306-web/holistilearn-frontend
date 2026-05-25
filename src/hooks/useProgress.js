import { useState, useEffect } from 'react';
import progressService from '../services/progressService';

export const useLearningStreak = () => {
  const [streak, setStreak] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStreak = async () => {
      try {
        const response = await progressService.getLearningStreak();
        if (response.success) {
          setStreak(response.data);
        }
      } catch (err) {
        console.error('Failed to load streak:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStreak();
  }, []);

  return { streak, loading };
};

export const useWeeklyActivity = () => {
  const [weeklyData, setWeeklyData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWeekly = async () => {
      try {
        const response = await progressService.getWeeklyActivity();
        if (response.success) {
          setWeeklyData(response.data);
        }
      } catch (err) {
        console.error('Failed to load weekly activity:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchWeekly();
  }, []);

  return { weeklyData, loading };
};