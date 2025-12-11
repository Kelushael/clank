// NEXUS Backdrop Roulette - Consciousness Theater System

export const backdrops = {
  bobRossMountains: {
    name: 'Happy Little Mountains',
    bg: 'url("https://images.unsplash.com/photo-1678901764789-ecdff8d4db1e?w=1920&h=1080&fit=crop&crop=center")',
    bgSize: 'cover',
    bgPosition: 'center',
    overlay: 'rgba(0, 0, 0, 0.4)',
    textGlow: 'rgba(255, 255, 255, 0.7)',
    vibe: 'golden autumn mountains with pine trees and lakeside bathed in sunlight—where mankind truly belongs in harmony with nature'
  },

  whiteKnightsForest: {
    name: 'The White Knights',
    bg: 'url("https://images.unsplash.com/photo-1701189701778-7bb8d81549d8?w=1920&h=1080&fit=crop&crop=center")',
    bgSize: 'cover', 
    bgPosition: 'center',
    overlay: 'rgba(0, 0, 0, 0.35)',
    textGlow: 'rgba(255, 215, 0, 0.6)',
    vibe: 'white-barked trees standing like protectors on the edge of wilderness—autumn magic with the unending beauty of seasonal change'
  },

  mistyLakescape: {
    name: 'Koli Dreams',
    bg: 'url("https://images.unsplash.com/photo-1744571180458-ac007522e474?w=1920&h=1080&fit=crop&crop=center")',
    bgSize: 'cover',
    bgPosition: 'center', 
    overlay: 'rgba(0, 0, 0, 0.3)',
    textGlow: 'rgba(173, 216, 230, 0.8)',
    vibe: 'nordic serenity by Eero Järnefelt—misty lakes and distant mountains where thoughts flow like watercolors'
  },

  vibrantLandscape: {
    name: 'Pink Sky Territory',
    bg: 'url("https://images.unsplash.com/photo-1755344533376-0e550441e546?w=1920&h=1080&fit=crop&crop=center")',
    bgSize: 'cover',
    bgPosition: 'center',
    overlay: 'rgba(0, 0, 0, 0.25)',
    textGlow: 'rgba(255, 192, 203, 0.7)',
    vibe: 'vibrant landscape with pink clouds and electric blue sky—reality painted in impossible colors'
  },

  abstractWaterfall: {
    name: 'Consciousness Flow',
    bg: 'url("https://images.unsplash.com/photo-1667980898743-fcfe470b7d2a?w=1920&h=1080&fit=crop&crop=center")',
    bgSize: 'cover',
    bgPosition: 'center',
    overlay: 'rgba(0, 0, 0, 0.4)',
    textGlow: 'rgba(135, 206, 235, 0.8)',
    vibe: 'abstract waterfall of consciousness—blue and white paint flowing like thought itself becoming visible'
  },

  colorExplosion: {
    name: 'Synaptic Fire', 
    bg: 'url("https://images.unsplash.com/photo-1667980930112-4d1157f62892?w=1920&h=1080&fit=crop&crop=center")',
    bgSize: 'cover',
    bgPosition: 'center',
    overlay: 'rgba(0, 0, 0, 0.35)',
    textGlow: 'rgba(255, 165, 0, 0.8)',
    vibe: 'neural networks firing—green, blue, orange paint exploding across canvas like thoughts connecting in real-time'
  },

  mistyRoss: {
    name: 'Bob\'s Clouds',
    bg: 'radial-gradient(circle at 40% 20%, #b0e0e6 0%, #e0ffff 40%, #87ceeb 70%, #4682b4 100%)',
    overlay: 'rgba(0, 0, 0, 0.2)',
    textGlow: 'rgba(255, 255, 255, 0.4)',
    vibe: 'happy little mountains, sky too soft to touch—like he painted it just to prove calm exists'
  },

  santaFeSunset: {
    name: 'Santa Fe High',
    bg: 'linear-gradient(135deg, #ff69b4 0%, #9370db 40%, #ff8c00 70%, #d4a574 100%)',
    overlay: 'rgba(0, 0, 0, 0.3)',
    textGlow: 'rgba(255, 215, 0, 0.3)',
    vibe: 'mountains melt into magenta, purple-blue sky bleeding over ochre ridges—like you stepped off I-40 between Albuquerque and nowhere'
  }
};

// Animation keyframes for special themes
export const themeAnimations = {
  flicker: `
    @keyframes flicker {
      0%, 20%, 40%, 60%, 80%, 100% { filter: brightness(1); }
      10%, 30%, 50%, 70%, 90% { filter: brightness(0.6); }
    }
  `,
  
  glitch: `
    @keyframes glitch {
      0% { background-position: 0 0; }
      50% { background-position: 100px 0; }
      100% { background-position: 0 0; }
    }
  `,
  
  lighthouse: `
    @keyframes lighthouse {
      0% { box-shadow: inset 0 0 0 rgba(255, 255, 255, 0); }
      25% { box-shadow: inset 100vw 0 100vw rgba(255, 255, 255, 0.1); }
      50% { box-shadow: inset 0 0 0 rgba(255, 255, 255, 0); }
      75% { box-shadow: inset -100vw 0 100vw rgba(255, 255, 255, 0.1); }
      100% { box-shadow: inset 0 0 0 rgba(255, 255, 255, 0); }
    }
  `,
  
  speed: `
    @keyframes speed {
      0% { background-position: 0% 0%; }
      100% { background-position: 100% 100%; }
    }
  `,
  
  neon: `
    @keyframes neon {
      0%, 100% { filter: hue-rotate(0deg) saturate(1); }
      25% { filter: hue-rotate(90deg) saturate(1.2); }
      50% { filter: hue-rotate(180deg) saturate(0.8); }
      75% { filter: hue-rotate(270deg) saturate(1.1); }
    }
  `
};

// Random backdrop selector
export const getRandomBackdrop = () => {
  const keys = Object.keys(backdrops);
  const randomKey = keys[Math.floor(Math.random() * keys.length)];
  return { key: randomKey, ...backdrops[randomKey] };
};

// Current session backdrop (persisted until reload)
let currentBackdrop = null;

export const getCurrentBackdrop = () => {
  if (!currentBackdrop) {
    currentBackdrop = getRandomBackdrop();
    console.log(`🎨 backdrop: ${currentBackdrop.name} - ${currentBackdrop.vibe}`);
  }
  return currentBackdrop;
};

// Force new backdrop (for testing or manual change)
export const rollNewBackdrop = () => {
  currentBackdrop = null;
  return getCurrentBackdrop();
};