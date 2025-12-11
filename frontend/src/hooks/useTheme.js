import { useState, useEffect } from 'react';
import { getCurrentBackdrop, rollNewBackdrop, themeAnimations } from '../themes';

export const useTheme = () => {
  const [currentTheme, setCurrentTheme] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Get random backdrop on component mount
    const backdrop = getCurrentBackdrop();
    setCurrentTheme(backdrop);
    setIsLoaded(true);

    // Inject theme animations into document
    const styleElement = document.createElement('style');
    styleElement.textContent = Object.values(themeAnimations).join('\n');
    document.head.appendChild(styleElement);

    // Log the chosen backdrop for debug
    console.log(`🌌 Reality loaded: ${backdrop.name}`);
    console.log(`📝 Vibe: ${backdrop.vibe}`);

    return () => {
      // Clean up on unmount
      if (document.head.contains(styleElement)) {
        document.head.removeChild(styleElement);
      }
    };
  }, []);

  const changeTheme = () => {
    const newBackdrop = rollNewBackdrop();
    setCurrentTheme(newBackdrop);
    console.log(`🎨 Reality shift: ${newBackdrop.name}`);
  };

  const getThemeStyles = () => {
    if (!currentTheme) return {};

    const baseStyles = {
      position: 'relative',
      minHeight: '100vh',
      width: '100%'
    };

    // Handle both gradients and images
    if (currentTheme.bg.startsWith('url(')) {
      baseStyles.backgroundImage = currentTheme.bg;
      baseStyles.backgroundSize = currentTheme.bgSize || 'cover';
      baseStyles.backgroundPosition = currentTheme.bgPosition || 'center';
      baseStyles.backgroundRepeat = 'no-repeat';
      baseStyles.backgroundAttachment = 'fixed';
    } else {
      baseStyles.background = currentTheme.bg;
    }

    // Add animation if theme has one
    if (currentTheme.animation) {
      switch (currentTheme.animation) {
        case 'flicker':
          baseStyles.animation = 'flicker 2s infinite';
          break;
        case 'glitch':
          baseStyles.animation = 'glitch 0.3s infinite';
          break;
        case 'lighthouse':
          baseStyles.animation = 'lighthouse 6s infinite';
          break;
        case 'speed':
          baseStyles.animation = 'speed 0.5s infinite linear';
          break;
        case 'neon':
          baseStyles.animation = 'neon 4s infinite';
          break;
      }
    }

    return baseStyles;
  };

  const getOverlayStyles = () => {
    if (!currentTheme || currentTheme.overlay === 'none') return { display: 'none' };
    
    return {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: currentTheme.overlay,
      pointerEvents: 'none',
      zIndex: 1
    };
  };

  const getTextGlowStyles = (isAssistant = false) => {
    if (!currentTheme) return {};
    
    return {
      textShadow: `0 0 10px ${currentTheme.textGlow}, 0 0 20px ${currentTheme.textGlow}`,
      color: isAssistant ? '#ffffff' : '#ffffff'
    };
  };

  return {
    currentTheme,
    isLoaded,
    changeTheme,
    getThemeStyles,
    getOverlayStyles,
    getTextGlowStyles
  };
};