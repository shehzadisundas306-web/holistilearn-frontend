import React from 'react';
import { JitsiMeeting } from '@jitsi/react-sdk';

const JitsiMeetingComponent = ({ roomName, displayName, onReady, onMeetingEnd }) => {
  return (
    <JitsiMeeting
      domain="meet.jit.si"
      roomName={roomName}
      configOverwrite={{
        startWithAudioMuted: false,
        startWithVideoMuted: false,
        disableDeepLinking: true,
      }}
      userInfo={{ displayName: displayName || 'Student' }}
      getIFrameRef={(iframe) => {
        iframe.style.height = '600px';
        iframe.style.width = '100%';
        iframe.style.border = '0';
      }}
      onReadyToClose={onMeetingEnd}
    />
  );
};

export default JitsiMeetingComponent;