// NEXUS Backdrop Roulette - Consciousness Theater System

export const backdrops = {
  santaFeSunset: {
    name: 'Santa Fe High',
    bg: 'linear-gradient(135deg, #ff69b4 0%, #9370db 40%, #ff8c00 70%, #d4a574 100%)',
    overlay: 'rgba(0, 0, 0, 0.3)',
    textGlow: 'rgba(255, 215, 0, 0.3)',
    vibe: 'mountains melt into magenta, purple-blue sky bleeding over ochre ridges—like you stepped off I-40 between Albuquerque and nowhere'
  },

  flickeringStation: {
    name: 'Interrogation Lamp',
    bg: 'linear-gradient(180deg, #0a0a0a 0%, #1a1a1a 50%, #0f0f0f 100%)',
    overlay: 'none',
    textGlow: 'rgba(255, 255, 0, 0.5)',
    animation: 'flicker',
    vibe: 'half-dead fluorescent strip. one tube stutters—buzz—click—buzz. your cursor\'s the only heartbeat'
  },

  mistyRoss: {
    name: 'Bob\'s Clouds',
    bg: 'radial-gradient(circle at 40% 20%, #b0e0e6 0%, #e0ffff 40%, #87ceeb 70%, #4682b4 100%)',
    overlay: 'rgba(0, 0, 0, 0.2)',
    textGlow: 'rgba(255, 255, 255, 0.4)',
    vibe: 'happy little mountains, sky too soft to touch—like he painted it just to prove calm exists'
  },

  glitchVoid: {
    name: 'Matrix Tear',
    bg: 'linear-gradient(to bottom, #000000 0%, #0a0a0a 100%)',
    overlay: 'none',
    textGlow: 'rgba(0, 255, 0, 0.4)',
    animation: 'glitch',
    vibe: 'pure black, then—crack—a yellow glitch line crawling left like code trying to escape'
  },

  neonDiner: {
    name: 'Midnight Route 66',
    bg: 'radial-gradient(circle at 30% 30%, #ff1493 0%, #4b0082 50%, #000000 100%)',
    overlay: 'rgba(0, 0, 0, 0.35)',
    textGlow: 'rgba(255, 20, 147, 0.5)',
    vibe: 'pink neon sign half-lit: OPEN—but it\'s midnight. diner counter, chrome stools, your message glowing on the jukebox screen'
  },

  watercolorGhost: {
    name: 'Faded Polaroid',
    bg: 'linear-gradient(135deg, #faf0e6 0%, #dda0dd 30%, #b0c4de 60%, #f0e68c 100%)',
    overlay: 'rgba(0, 0, 0, 0.25)',
    textGlow: 'rgba(255, 255, 255, 0.6)',
    vibe: 'watercolor bleeding at the edges, soft focus, like a memory you can\'t quite place'
  },

  lighthouseSquall: {
    name: 'Storm Watch',
    bg: 'linear-gradient(180deg, #2c3e50 0%, #34495e 30%, #1c2833 60%, #0b1622 100%)',
    overlay: 'rgba(0, 0, 0, 0.4)',
    textGlow: 'rgba(255, 255, 255, 0.7)',
    animation: 'lighthouse',
    vibe: 'lighthouse beam cutting through rain, waves crashing, you\'re in the tower watching the storm come in'
  },

  nascarCockpit: {
    name: 'Last Lap POV',
    bg: 'linear-gradient(180deg, #1a1a1a 0%, #0d0d0d 50%, #000000 100%)',
    overlay: 'rgba(0, 0, 0, 0.5)',
    textGlow: 'rgba(255, 69, 0, 0.6)',
    animation: 'speed',
    vibe: 'daytona 500, final turn, 200mph, engine screaming, chat scrolling like telemetry data on the windshield'
  },

  desertDawn: {
    name: 'Between Cities',
    bg: 'linear-gradient(180deg, #ff7e5f 0%, #feb47b 30%, #f4a460 60%, #daa520 100%)',
    overlay: 'rgba(0, 0, 0, 0.25)',
    textGlow: 'rgba(255, 140, 0, 0.5)',
    vibe: 'sunrise over mesa country, heat shimmer, dust that tastes like sage and distance'
  },

  midnightLibrary: {
    name: 'Archive After Hours',
    bg: 'linear-gradient(180deg, #191970 0%, #0f0f23 50%, #000000 100%)',
    overlay: 'rgba(0, 0, 0, 0.3)',
    textGlow: 'rgba(255, 215, 0, 0.4)',
    vibe: 'old books, dust motes in lamplight, knowledge sleeping on shelves, your conversation echoing in the stacks'
  },

  neonTokyo: {
    name: 'Blade Runner Alley',
    bg: 'linear-gradient(45deg, #ff006e 0%, #8338ec 30%, #3a86ff 60%, #06ffa5 100%)',
    overlay: 'rgba(0, 0, 0, 0.4)',
    textGlow: 'rgba(6, 255, 165, 0.5)',
    animation: 'neon',
    vibe: 'rain on concrete, holograms reflecting in puddles, katakana signs buzzing overhead'
  },

  vineyard: {
    name: 'Tuscan Evening',
    bg: 'linear-gradient(180deg, #ff9a9e 0%, #fecfef 30%, #fecfef 70%, #fec89a 100%)',
    overlay: 'rgba(0, 0, 0, 0.2)',
    textGlow: 'rgba(255, 255, 255, 0.5)',
    vibe: 'golden hour, rolling hills, wine country serenity, conversations that flow like a good vintage'
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