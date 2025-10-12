import React, { useState, useEffect } from 'react';
import './DropshippingLoader.css';

export default function DropshippingLoader() {
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState(0);

  useEffect(() => {
    // For 2 second total cycle: 2000ms / 4 stages = 500ms per stage
    const interval = setInterval(() => {
      setStage(s => (s + 1) % 4);
    }, 500); // Each stage shows for 500ms = 0.5 seconds

    const progressInterval = setInterval(() => {
      setProgress(prev => (prev + 2) % 100); // Faster progress animation
    }, 10);

    return () => {
      clearInterval(interval);
      clearInterval(progressInterval);
    };
  }, []);

  const stages = ['SOURCE', 'PACK', 'SHIP', 'ARRIVE'];
  const dots = 12;

  return (
    <div className="loader-overlay">
      <div className="loader-container">
        {/* Outer orbital ring */}
        <div className="loader-ring">
          {/* Rotating dots around perimeter */}
          {[...Array(dots)].map((_, i) => {
            const angle = (360 / dots) * i;
            const isActive = i <= (progress / 100) * dots;

            return (
              <div
                key={i}
                className="loader-dot"
                style={{
                  transform: `rotate(${angle}deg)`,
                  transition: 'opacity 0.3s'
                }}
              >
                <div
                  className={`loader-dot-inner ${isActive ? 'active' : 'inactive'}`}
                />
              </div>
            );
          })}

          {/* Inner morphing shape */}
          <div className="loader-shape-container">
            <svg width="120" height="120" viewBox="0 0 120 120" className="loader-svg">
              {/* Animated path that morphs between box and arrow */}
              <path
                d={
                  stage === 0
                    ? "M30,30 L90,30 L90,90 L30,90 Z" // Box
                    : stage === 1
                    ? "M40,30 L80,30 L90,60 L80,90 L40,90 L30,60 Z" // Hexagon
                    : stage === 2
                    ? "M30,60 L60,30 L90,60 L60,90 Z" // Diamond (package)
                    : "M20,60 L60,30 L60,50 L100,50 L100,70 L60,70 L60,90 Z" // Arrow
                }
                fill="none"
                stroke="white"
                strokeWidth="1"
                className="loader-path"
                style={{ opacity: 0.8 }}
              />

              {/* Inner fill with progress */}
              <path
                d={
                  stage === 0
                    ? "M30,30 L90,30 L90,90 L30,90 Z"
                    : stage === 1
                    ? "M40,30 L80,30 L90,60 L80,90 L40,90 L30,60 Z"
                    : stage === 2
                    ? "M30,60 L60,30 L90,60 L60,90 Z"
                    : "M20,60 L60,30 L60,50 L100,50 L100,70 L60,70 L60,90 Z"
                }
                fill="white"
                className="loader-fill"
                style={{
                  opacity: 0.05 + (progress / 500),
                  transform: `scale(${0.3 + progress / 200})`,
                  transformOrigin: 'center'
                }}
              />

              {/* Center pulsing dot */}
              <circle
                cx="60"
                cy="60"
                r="2"
                fill="white"
                className="loader-pulse-dot"
              />
            </svg>
          </div>

          {/* Rotating connection line */}
          <div
            className="loader-connection-line"
            style={{
              transform: `rotate(${progress * 3.6}deg)`,
              transition: 'transform 0.1s linear'
            }}
          >
            <div className="loader-line" />
          </div>
        </div>

        {/* Stage label with smooth transition */}
        <div className="loader-stage-label">
          <div className="loader-stage-text-container">
            {stages.map((s, i) => (
              <div
                key={s}
                className="loader-stage-text"
                style={{
                  opacity: i === stage ? 1 : 0,
                  transform: i === stage
                    ? 'translateY(0) scale(1)'
                    : i < stage
                    ? 'translateY(-20px) scale(0.8)'
                    : 'translateY(20px) scale(0.8)',
                }}
              >
                <span>
                  {s}
                </span>
              </div>
            ))}
          </div>

          {/* Minimalist progress indicator */}
          <div className="loader-progress-dots">
            {stages.map((_, i) => (
              <div
                key={i}
                className="loader-progress-dot"
                style={{
                  width: i === stage ? '32px' : '8px',
                  backgroundColor: i <= stage ? 'white' : 'rgba(255,255,255,0.2)',
                }}
              />
            ))}
          </div>
        </div>

        {/* Percentage - ultra minimal */}
        <div className="loader-percentage">
          <span>
            {String(Math.floor((stage * 25) + (progress / 4))).padStart(2, '0')}
          </span>
        </div>

        {/* Corner accent markers */}
        {[
          { x: -40, y: -40, r: 0 },
          { x: 40, y: -40, r: 90 },
          { x: 40, y: 40, r: 180 },
          { x: -40, y: 40, r: 270 }
        ].map((pos, i) => (
          <div
            key={i}
            className="loader-corner-marker"
            style={{
              left: '50%',
              top: '50%',
              transform: `translate(calc(-50% + ${pos.x * 3}px), calc(-50% + ${pos.y * 3}px)) rotate(${pos.r}deg)`,
              opacity: i === stage ? 0.4 : 0.1
            }}
          >
            <div className="loader-corner-marker-h" />
            <div className="loader-corner-marker-v" />
          </div>
        ))}
      </div>
    </div>
  );
}
