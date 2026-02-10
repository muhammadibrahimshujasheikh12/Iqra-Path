import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const VideoPage: React.FC = () => {
  const navigate = useNavigate();
  useEffect(() => {
    navigate('/', { replace: true });
  }, [navigate]);
  return null;
};

export default VideoPage;