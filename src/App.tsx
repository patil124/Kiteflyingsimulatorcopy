import { useState, useRef, useEffect } from 'react';
import { KiteSimulator } from './components/KiteSimulator';
import { WeatherControls } from './components/WeatherControls';
import { ScoreDisplay } from './components/ScoreDisplay';
import { ControlButtons } from './components/ControlButtons';
import { PWAInstaller } from './components/PWAInstaller';
import { usePWA } from './hooks/usePWA';

export type WeatherType = 'sunny' | 'windy' | 'cloudy' | 'rainy' | 'stormy';

export interface WeatherState {
  type: WeatherType;
  windSpeed: number;
  windDirection: number;
  gustiness: number;
}

export interface ScoreState {
  totalScore: number;
  flightTime: number;
  maxAltitude: number;
  tricksPerformed: number;
  currentCombo: number;
  itemsCollected: number;
}

export interface ControlInput {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
}

export default function App() {
  const [weather, setWeather] = useState<WeatherState>({
    type: 'sunny',
    windSpeed: 15,
    windDirection: 45,
    gustiness: 0.3
  });

  const [isFlying, setIsFlying] = useState(false);
  const [score, setScore] = useState<ScoreState>({
    totalScore: 0,
    flightTime: 0,
    maxAltitude: 0,
    tricksPerformed: 0,
    currentCombo: 0,
    itemsCollected: 0
  });
  const [controlInput, setControlInput] = useState<ControlInput>({
    up: false,
    down: false,
    left: false,
    right: false
  });

  const handleLaunch = () => {
    setIsFlying(true);
    setScore({
      totalScore: 0,
      flightTime: 0,
      maxAltitude: 0,
      tricksPerformed: 0,
      currentCombo: 0,
      itemsCollected: 0
    });
  };

  const handleCrash = () => {
    setIsFlying(false);
  };

  usePWA();

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-300 to-sky-100 relative overflow-hidden">
      <div className="absolute inset-0">
        <KiteSimulator 
          weather={weather} 
          isFlying={isFlying} 
          score={score}
          setScore={setScore}
          controlInput={controlInput}
          onCrash={handleCrash}
        />
      </div>
      
      {/* Title - centered and faded */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-5">
        <h1 className="text-white/20 text-4xl sm:text-6xl md:text-7xl drop-shadow-2xl tracking-wider">
          Kite Flying Simulator
        </h1>
      </div>

      {/* Score - top left */}
      {isFlying && (
        <div className="absolute top-2 left-2 sm:top-4 sm:left-4 z-20 pointer-events-none">
          <ScoreDisplay score={score} />
        </div>
      )}

      {/* Weather controls - top right */}
      <div className="absolute top-2 right-2 sm:top-4 sm:right-4 z-20 pointer-events-auto">
        <WeatherControls weather={weather} setWeather={setWeather} />
      </div>

      {isFlying && (
        <ControlButtons 
          controlInput={controlInput} 
          setControlInput={setControlInput}
        />
      )}

      {!isFlying && (
        <div className="absolute inset-0 flex items-center justify-center">
          <button
            onClick={handleLaunch}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg shadow-lg transition-colors"
          >
            {score.totalScore > 0 ? `Launch Again (Last Score: ${score.totalScore})` : 'Launch Kite'}
          </button>
        </div>
      )}

      <PWAInstaller />
    </div>
  );
}