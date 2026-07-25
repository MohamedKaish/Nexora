export const designTokens = {
  colors: {
    electricBlue: "#24D4FF",
    signalBlue: "#3B82F6",
    deepPurple: "#8B5CF6",
    matteBlack: "#05070D",
    glass: "rgba(10, 15, 28, 0.62)"
  },
  spacing: {
    pageX: "clamp(1rem, 4vw, 4rem)",
    sectionY: "clamp(5rem, 11vw, 8rem)"
  },
  shadows: {
    glow: "0 0 48px rgba(36, 212, 255, 0.28)",
    glass: "0 24px 80px rgba(0, 0, 0, 0.36)"
  },
  typography: {
    display: "clamp(4rem, 13vw, 10rem)",
    headline: "clamp(2.3rem, 6vw, 5.5rem)",
    body: "clamp(1rem, 1.8vw, 1.18rem)"
  }
} as const;

