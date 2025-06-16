import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

const ProgressBarContainer = styled.div`
  width: 100%;
  max-width: 600px;
  margin: 20px auto;
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  overflow: hidden;
  height: 8px;
`;

const ProgressBarFill = styled.div<{ width: number; color: string }>`
  height: 100%;
  width: ${props => props.width}%;
  background: ${props => props.color};
  transition: width 0.5s ease;
  border-radius: 8px;
`;

const ProgressText = styled.div`
  font-size: 0.8rem;
  color: #94a3b8;
  text-align: center;
  margin-top: 8px;
`;

interface ProgressBarProps {
  // If determinate is true, use the provided progress value
  // If determinate is false, show an animated indeterminate progress
  determinate?: boolean;
  progress?: number; // 0-100
  status?: string;
  duration?: number; // Animation duration in seconds
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  determinate = false,
  progress = 0,
  status = '',
  duration = 30
}) => {
  const [animatedProgress, setAnimatedProgress] = useState(0);
  const [timeElapsed, setTimeElapsed] = useState(0);
  
  // For indeterminate mode, animate the progress bar
  useEffect(() => {
    if (!determinate) {
      // Simulate progress with a non-linear curve
      // Start slow, accelerate in the middle, then slow down near the end
      // Never reach 100% until actual completion
      const interval = setInterval(() => {
        setTimeElapsed(prev => prev + 1);
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, [determinate]);
  
  // Calculate animated progress based on time elapsed
  useEffect(() => {
    if (!determinate) {
      // Non-linear progress simulation
      // Faster at the beginning, slower as it approaches 90%
      const calculatedProgress = Math.min(
        90, // Never go above 90% in indeterminate mode
        timeElapsed <= duration * 0.1 ? timeElapsed * 2 : // Fast start
        timeElapsed <= duration * 0.5 ? 20 + (timeElapsed - duration * 0.1) * 1.5 : // Medium pace
        timeElapsed <= duration * 0.8 ? 65 + (timeElapsed - duration * 0.5) * 0.8 : // Slowing down
        80 + (timeElapsed - duration * 0.8) * 0.5 // Very slow at the end
      );
      setAnimatedProgress(calculatedProgress);
    } else {
      setAnimatedProgress(progress);
    }
  }, [determinate, progress, timeElapsed, duration]);
  
  // Determine color based on progress
  const getColor = (progress: number) => {
    if (progress < 30) return 'linear-gradient(90deg, #3b82f6, #60a5fa)';
    if (progress < 60) return 'linear-gradient(90deg, #60a5fa, #34d399)';
    if (progress < 90) return 'linear-gradient(90deg, #34d399, #10b981)';
    return 'linear-gradient(90deg, #10b981, #059669)';
  };
  
  return (
    <div>
      <ProgressBarContainer>
        <ProgressBarFill 
          width={animatedProgress} 
          color={getColor(animatedProgress)}
        />
      </ProgressBarContainer>
      {status && <ProgressText>{status}</ProgressText>}
      <ProgressText>
        {determinate 
          ? `${Math.round(progress)}% complete` 
          : `Estimated time: ${Math.max(0, duration - timeElapsed)} seconds remaining`}
      </ProgressText>
    </div>
  );
};

export default ProgressBar; 