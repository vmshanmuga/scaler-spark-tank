import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import DropshippingLoader from '../components/DropshippingLoader';
import './Login.css';

export default function Login() {
  const [error, setError] = useState('');
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [showError, setShowError] = useState(false);
  const { signInWithGoogle, user, loading } = useAuth();
  const navigate = useNavigate();

  // Typewriter effect
  useEffect(() => {
    const subtitle = document.getElementById('subtitle');
    if (subtitle) {
      setTimeout(() => {
        subtitle.classList.add('typed');
      }, 4000); // 1s delay + 3s typing
    }
  }, []);

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && user) {
      navigate('/home');
    }
  }, [user, loading, navigate]);

  // Create stars animation
  useEffect(() => {
    const createStars = () => {
      const container = document.getElementById('starsContainer');
      if (!container) return;

      container.innerHTML = '';
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight;

      // Create 200 stars for better visibility
      for (let i = 0; i < 200; i++) {
        const star = document.createElement('div');
        star.className = 'star';

        // Random starting position from top half of screen (left content and login card area)
        const startX = Math.random() * window.innerWidth;
        const startY = Math.random() * (window.innerHeight * 0.6); // Start from top 60% of screen

        // Set initial position
        star.style.left = startX + 'px';
        star.style.top = startY + 'px';

        // Calculate movement
        const deltaX = centerX - startX;
        const deltaY = centerY - startY;

        star.style.setProperty('--delta-x', deltaX + 'px');
        star.style.setProperty('--delta-y', deltaY + 'px');

        // Random animation duration and delay - shorter for more visibility
        const duration = 3 + Math.random() * 3;
        const delay = Math.random() * 4;

        star.style.animationDuration = duration + 's';
        star.style.animationDelay = delay + 's';

        container.appendChild(star);
      }
    };

    createStars();

    // Recreate on window resize
    let resizeTimer;
    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        createStars();
      }, 250);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(resizeTimer);
    };
  }, []);

  const handleGoogleSignIn = async () => {
    try {
      setError('');
      setShowError(false);
      setIsSigningIn(true);

      await signInWithGoogle();
      // Navigation will happen automatically via useEffect
    } catch (err) {
      console.error('Sign-in error:', err);

      // Don't show error if user just closed the popup
      if (err.code === 'auth/popup-closed-by-user' || err.message.includes('popup-closed-by-user')) {
        setIsSigningIn(false);
        return;
      }

      setError(err.message || 'Failed to sign in');
      setShowError(true);
      setIsSigningIn(false);

      // Hide error after 5 seconds
      setTimeout(() => {
        setShowError(false);
      }, 5000);
    }
  };

  // Show loader during sign-in
  if (isSigningIn || loading) {
    return <DropshippingLoader />;
  }

  return (
    <div className="login-page">
      {/* Green Black Hole */}
      <div className="blackhole-container">
        <div className="blackhole-core"></div>
        <div id="starsContainer"></div>
      </div>

      <div className="login-container">
        {/* Left Side - Content */}
        <div className="left-content">
          {/* Logo */}
          <img
            src="https://d2beiqkhq929f0.cloudfront.net/public_assets/assets/000/090/511/original/Copy_of_Logo-White.png?1727164234"
            alt="Scaler School of Business"
            className="logo"
          />

          {/* Badge */}
          <div className="competition-badge">
            <span>✨</span>
            <span>Dropshipping Competition 2025</span>
          </div>

          {/* Main Title */}
          <h1 className="main-title">Spark Tank</h1>

          {/* Subtitle */}
          <p className="subtitle" id="subtitle">
            Track your dropshipping sales in real-time.
          </p>
        </div>

        {/* Right Side - Login Card */}
        <div className="right-content">
          <div className="login-card">
            {/* Card Title */}
            <h2 className="card-title">Welcome Back</h2>
            <p className="card-subtitle">Sign in to access your dashboard</p>

            {/* Google Sign-In Button */}
            <button
              className="google-signin-btn"
              onClick={handleGoogleSignIn}
              disabled={isSigningIn}
            >
              <svg className="google-icon" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>

            {/* Error Message */}
            <div className={`error-message ${showError ? 'show' : ''}`}>
              {error}
            </div>

            {/* Footer */}
            <div style={{ width: '100%', display: 'flex', justifyContent: 'center', marginTop: '32px' }}>
              <div className="card-footer">Scaler School of Business © 2025</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
