import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const Logo: React.FC<LogoProps> = ({ className = "", size = 'md' }) => {
  const sizeClasses = {
    sm: { text: 'text-base sm:text-lg md:text-xl', tracking: 'tracking-[0.15em]', gap: 'gap-1' },
    md: { text: 'text-lg sm:text-2xl md:text-4xl', tracking: 'tracking-[0.2em]', gap: 'gap-1.5' },
    lg: { text: 'text-2xl sm:text-5xl md:text-6xl', tracking: 'tracking-[0.25em]', gap: 'gap-2' },
    xl: { text: 'text-3xl sm:text-6xl md:text-8xl', tracking: 'tracking-[0.2em] sm:tracking-[0.3em]', gap: 'gap-2 sm:gap-3' },
  };

  const current = sizeClasses[size];

  return (
    <div className={`flex items-baseline justify-center select-none font-cinzel uppercase ${current.gap} ${className} relative group`}>
      {/* Moving Shine Animation Styles */}
      <style>{`
        .premium-gold-text {
          background: linear-gradient(
            to right, 
            #bf953f 0%, 
            #fcf6ba 25%, 
            #b38728 50%, 
            #fcf6ba 75%, 
            #bf953f 100%
          );
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: shine 4s linear infinite;
          display: inline-block;
        }

        @keyframes shine {
          to {
            background-position: 200% center;
          }
        }

        .gold-glow-intense {
          filter: drop-shadow(0 0 12px rgba(212, 175, 55, 0.4)) 
                  drop-shadow(0 0 2px rgba(253, 245, 230, 0.6));
        }
      `}</style>

      {/* IQRA - The Authority */}
      <span 
        className={`${current.text} font-black premium-gold-text gold-glow-intense transition-all duration-700 group-hover:scale-[1.02]`}
      >
        IQRA
      </span>

      {/* PATH - The Journey */}
      <span 
        className={`${current.text} font-light ${current.tracking} premium-gold-text gold-glow-intense opacity-90 transition-all duration-700 group-hover:opacity-100`}
        style={{ animationDelay: '0.5s' }}
      >
        PATH
      </span>
    </div>
  );
};

export default Logo;