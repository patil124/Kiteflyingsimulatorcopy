import { ControlInput } from '../App';
import { Button } from './ui/button';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, RotateCw, RotateCcw } from 'lucide-react';
import { useEffect } from 'react';

interface ControlButtonsProps {
  controlInput: ControlInput;
  setControlInput: (input: ControlInput) => void;
}

export function ControlButtons({ controlInput, setControlInput }: ControlButtonsProps) {
  const handleControl = (direction: keyof ControlInput, pressed: boolean) => {
    setControlInput({
      ...controlInput,
      [direction]: pressed
    });
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          e.preventDefault();
          handleControl('up', true);
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          e.preventDefault();
          handleControl('down', true);
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          e.preventDefault();
          handleControl('left', true);
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          e.preventDefault();
          handleControl('right', true);
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          e.preventDefault();
          handleControl('up', false);
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          e.preventDefault();
          handleControl('down', false);
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          e.preventDefault();
          handleControl('left', false);
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          e.preventDefault();
          handleControl('right', false);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [controlInput]);

  const ControlButton = ({ direction, icon: Icon, active }: { direction: keyof ControlInput; icon: any; active: boolean }) => (
    <button
      className={`w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center transition-all touch-none ${
        active 
          ? 'bg-white/80 shadow-lg scale-95' 
          : 'bg-white/30 hover:bg-white/40 shadow-md'
      }`}
      onMouseDown={() => handleControl(direction, true)}
      onMouseUp={() => handleControl(direction, false)}
      onMouseLeave={() => handleControl(direction, false)}
      onTouchStart={(e) => {
        e.preventDefault();
        handleControl(direction, true);
      }}
      onTouchEnd={(e) => {
        e.preventDefault();
        handleControl(direction, false);
      }}
    >
      <Icon className={`size-5 sm:size-6 ${active ? 'text-gray-900' : 'text-white'}`} />
    </button>
  );

  return (
    <div className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 z-20">
      <div className="relative">
        <div className="grid grid-cols-3 gap-1.5 sm:gap-2.5 w-40 sm:w-52">
          {/* Top row */}
          <div />
          <ControlButton direction="up" icon={ArrowUp} active={controlInput.up} />
          <div />

          {/* Middle row */}
          <ControlButton direction="left" icon={ArrowLeft} active={controlInput.left} />
          <div className="flex items-center justify-center">
            <div className="w-5 h-5 sm:w-7 sm:h-7 rounded-full bg-white/20 backdrop-blur-sm" />
          </div>
          <ControlButton direction="right" icon={ArrowRight} active={controlInput.right} />

          {/* Bottom row */}
          <div />
          <ControlButton direction="down" icon={ArrowDown} active={controlInput.down} />
          <div />
        </div>
      </div>
    </div>
  );
}