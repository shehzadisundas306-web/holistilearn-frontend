import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  joinSession, 
  joinSessionParticipant, 
  leaveSessionParticipant, 
  endSession,
  getSessionParticipants 
} from '../../api/onlineClassApi';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { useGetData } from '../../context/userContext';
import JitsiMeetingComponent from '../../components/common/JitsiMeetingComponent';
import socketService from '../../services/socketService';
import { toast } from 'sonner';
import { Users, LogOut, Video, Mic, MicOff, VideoOff } from 'lucide-react';
import '../../styles/teacher/TeacherLiveClass.css';

const TeacherJoinLiveClass = () => {
  const { sessionId } = useParams();
  const { user } = useGetData();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [meeting, setMeeting] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [participantCount, setParticipantCount] = useState(0);
  const [showParticipants, setShowParticipants] = useState(false);
  const [isEnding, setIsEnding] = useState(false);
  const [jitsiApi, setJitsiApi] = useState(null);
  
  // Refs
  const hasJoinedParticipant = useRef(false);
  const socketListenersSetup = useRef(false);

  useEffect(() => {
    console.log('🚀 TeacherJoinLiveClass MOUNTED');
    console.log('Session ID:', sessionId);
    
    setupSocketListeners();
    fetchMeeting();
    
    return () => {
      cleanupSocketListeners();
      // Leave participant tracking when component unmounts
      if (hasJoinedParticipant.current && sessionId) {
        leaveSessionParticipant(sessionId).catch(console.error);
      }
    };
  }, [sessionId]);

  // Setup socket listeners for real-time updates
  const setupSocketListeners = () => {
    if (socketListenersSetup.current) return;
    
    if (!socketService.getConnectionStatus()) {
      socketService.connect();
    }
    
    // Listen for participant joined events
    socketService.on('participant-joined', (data) => {
      console.log('👤 Participant joined:', data);
      setParticipants(prev => [...prev, data]);
      setParticipantCount(prev => prev + 1);
      toast.info(`${data.name} joined the session`);
    });
    
    // Listen for participant left events
    socketService.on('participant-left', (data) => {
      console.log('👋 Participant left:', data);
      setParticipants(prev => prev.filter(p => p.userId !== data.userId));
      setParticipantCount(prev => prev - 1);
      toast.info(`${data.name} left the session`);
    });
    
    // Listen for participant count updates
    socketService.on('participant-count', (data) => {
      console.log('📊 Participant count:', data.count);
      setParticipantCount(data.count);
    });
    
    // Listen for session ended by teacher
    socketService.on('session-ended', (data) => {
      console.log('🔴 Session ended by teacher:', data);
      toast.warning('The teacher has ended the session');
      setTimeout(() => {
        navigate('/teacher/dashboard/classes');
      }, 2000);
    });
    
    // Listen for auto session ended
    socketService.on('session-auto-ended', (data) => {
      console.log('⏰ Session auto-ended:', data);
      toast.warning('The session time has ended');
      setTimeout(() => {
        navigate('/teacher/dashboard/classes');
      }, 2000);
    });
    
    socketListenersSetup.current = true;
    console.log('📡 Socket listeners setup complete');
  };

  const cleanupSocketListeners = () => {
    if (!socketListenersSetup.current) return;
    
    socketService.off('participant-joined');
    socketService.off('participant-left');
    socketService.off('participant-count');
    socketService.off('session-ended');
    socketService.off('session-auto-ended');
    
    socketListenersSetup.current = false;
    console.log('🧹 Socket listeners cleaned up');
  };

  const fetchMeeting = async () => {
    try {
      console.log('📡 Calling joinSession API...');
      const res = await joinSession(sessionId);
      console.log('📡 API Response:', res);
      
      if (res && res.success && res.meeting) {
        console.log('✅ Meeting data received:', res.meeting);
        setMeeting(res.meeting);
        
        // Join as participant for tracking
        await joinAsParticipant();
        
        // Fetch current participants
        await fetchParticipants();
      } else {
        console.error('❌ Invalid response:', res);
        setError(res?.message || 'Failed to join session');
      }
    } catch (err) {
      console.error('❌ Join error:', err);
      setError(err?.response?.data?.message || err?.message || 'Failed to join session');
    } finally {
      setLoading(false);
    }
  };

  const joinAsParticipant = async () => {
    if (hasJoinedParticipant.current) return;
    
    try {
      await joinSessionParticipant(sessionId);
      hasJoinedParticipant.current = true;
      console.log('✅ Joined as participant');
    } catch (error) {
      console.error('Failed to join as participant:', error);
    }
  };

  const fetchParticipants = async () => {
    try {
      const res = await getSessionParticipants(sessionId);
      if (res.success) {
        setParticipants(res.participants || []);
        setParticipantCount(res.count || 0);
      }
    } catch (error) {
      console.error('Failed to fetch participants:', error);
    }
  };

  const handleEndSession = async () => {
    if (isEnding) return;
    
    const confirmEnd = window.confirm(
      'Are you sure you want to end this session?\n\nAll participants will be disconnected immediately.'
    );
    
    if (!confirmEnd) return;
    
    setIsEnding(true);
    const loadingToast = toast.loading('Ending session...');
    
    try {
      const res = await endSession(sessionId);
      if (res.success) {
        toast.dismiss(loadingToast);
        toast.success('Session ended successfully');
        
        // Close Jitsi iframe if available
        if (jitsiApi) {
          jitsiApi.dispose();
        }
        
        // Navigate back to classes
        navigate('/teacher/dashboard/classes');
      } else {
        toast.dismiss(loadingToast);
        toast.error(res.message || 'Failed to end session');
      }
    } catch (error) {
      toast.dismiss(loadingToast);
      console.error('End session error:', error);
      toast.error(error?.response?.data?.message || 'Failed to end session');
    } finally {
      setIsEnding(false);
    }
  };

  const handleJitsiReady = (api) => {
    console.log('🎥 Jitsi API ready');
    setJitsiApi(api);
    
    // Optional: Add Jitsi event listeners
    api.addEventListener('participantJoined', (event) => {
      console.log('Jitsi: Participant joined', event);
    });
    
    api.addEventListener('participantLeft', (event) => {
      console.log('Jitsi: Participant left', event);
    });
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <LoadingSpinner text="Joining live class..." />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <h2>Unable to Join Session</h2>
        <p style={{ color: 'red', marginBottom: '20px' }}>{error}</p>
        <button 
          onClick={() => navigate('/teacher/dashboard/classes')}
          style={{ marginTop: '20px', padding: '10px 20px', cursor: 'pointer' }}
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  if (!meeting) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <h2>No Meeting Data</h2>
        <button onClick={() => navigate('/teacher/dashboard/classes')}>
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header with controls */}
      <div style={{ 
        marginBottom: '16px', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '10px'
      }}>
        <div>
          <button 
            onClick={() => navigate('/teacher/dashboard/classes')} 
            style={{ marginRight: '16px', cursor: 'pointer', padding: '8px 16px' }}
          >
            ← Back to Dashboard
          </button>
          <h2 style={{ display: 'inline-block', margin: 0 }}>{meeting.title}</h2>
        </div>
        
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {/* Participant count button */}
          <button
            onClick={() => setShowParticipants(!showParticipants)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              background: '#f0f0f0',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            <Users size={18} />
            <span>{participantCount} Participant{participantCount !== 1 ? 's' : ''}</span>
          </button>
          
          {/* End session button */}
          <button
            onClick={handleEndSession}
            disabled={isEnding}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              background: '#dc2626',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: isEnding ? 'not-allowed' : 'pointer',
              opacity: isEnding ? 0.7 : 1
            }}
          >
            <LogOut size={18} />
            {isEnding ? 'Ending...' : 'End Session'}
          </button>
        </div>
      </div>
      
      {/* Participants sidebar (toggleable) */}
      {showParticipants && (
        <div style={{
          position: 'fixed',
          right: '20px',
          top: '100px',
          width: '280px',
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          zIndex: 1000,
          maxHeight: '400px',
          overflowY: 'auto'
        }}>
          <div style={{ padding: '16px', borderBottom: '1px solid #eee' }}>
            <h3 style={{ margin: 0 }}>Participants ({participantCount})</h3>
          </div>
          <div style={{ padding: '8px' }}>
            {/* Teacher (you) */}
            <div style={{ 
              padding: '8px', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '10px',
              background: '#f0fdf4',
              borderRadius: '8px',
              marginBottom: '8px'
            }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: '#10b981',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold'
              }}>
                {user?.name?.charAt(0)?.toUpperCase() || 'T'}
              </div>
              <div>
                <strong>{user?.name || user?.username || 'You'}</strong>
                <span style={{ fontSize: '12px', color: '#10b981', marginLeft: '8px' }}>(Teacher)</span>
              </div>
            </div>
            
            {/* Other participants */}
            {participants.map(p => (
              <div key={p.userId} style={{ 
                padding: '8px', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '10px',
                borderRadius: '8px',
                marginBottom: '4px'
              }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: '#3b82f6',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold'
                }}>
                  {p.name?.charAt(0)?.toUpperCase() || 'S'}
                </div>
                <div>
                  {p.name}
                  <span style={{ fontSize: '10px', color: '#666', marginLeft: '8px' }}>
                    Joined {new Date(p.joinedAt).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))}
            
            {participants.length === 0 && (
              <div style={{ padding: '16px', textAlign: 'center', color: '#666' }}>
                No participants yet
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Jitsi Meeting Component */}
      <div style={{ flex: 1, minHeight: '600px', position: 'relative' }}>
        <JitsiMeetingComponent
          roomName={meeting.url}
          displayName={user?.name || user?.username || 'Teacher'}
          onMeetingEnd={() => navigate('/teacher/dashboard/classes')}
          onReady={handleJitsiReady}
        />
      </div>
    </div>
  );
};

export default TeacherJoinLiveClass;