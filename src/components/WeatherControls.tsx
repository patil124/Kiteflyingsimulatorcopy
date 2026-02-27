import { WeatherState, WeatherType } from '../App';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Slider } from './ui/slider';
import { Sun, Wind, Cloud, CloudRain, CloudLightning, Navigation } from 'lucide-react';

interface WeatherControlsProps {
  weather: WeatherState;
  setWeather: (weather: WeatherState) => void;
}

export function WeatherControls({ weather, setWeather }: WeatherControlsProps) {
  const weatherTypes: { type: WeatherType; icon: any; label: string }[] = [
    { type: 'sunny', icon: Sun, label: 'Sunny' },
    { type: 'windy', icon: Wind, label: 'Windy' },
    { type: 'cloudy', icon: Cloud, label: 'Cloudy' },
    { type: 'rainy', icon: CloudRain, label: 'Rainy' },
    { type: 'stormy', icon: CloudLightning, label: 'Stormy' }
  ];

  const handleWeatherChange = (type: WeatherType) => {
    const weatherPresets: Record<WeatherType, Partial<WeatherState>> = {
      sunny: { windSpeed: 10, gustiness: 0.2 },
      windy: { windSpeed: 25, gustiness: 0.5 },
      cloudy: { windSpeed: 12, gustiness: 0.3 },
      rainy: { windSpeed: 18, gustiness: 0.4 },
      stormy: { windSpeed: 35, gustiness: 0.8 }
    };

    setWeather({
      ...weather,
      type,
      ...weatherPresets[type]
    });
  };

  return (
    <Card className="bg-black/15 backdrop-blur-sm p-2 sm:p-2.5 border-0 shadow-lg">
      <div className="flex gap-1 sm:gap-1.5 mb-1.5 sm:mb-2">
        {weatherTypes.map(({ type, icon: Icon, label }) => (
          <button
            key={type}
            onClick={() => handleWeatherChange(type)}
            className={`h-6 w-6 sm:h-7 sm:w-7 rounded flex items-center justify-center transition-all ${
              weather.type === type 
                ? 'bg-white/30 text-white shadow-sm scale-110' 
                : 'bg-white/10 text-white/60 hover:bg-white/20'
            }`}
            title={label}
          >
            <Icon className="size-3 sm:size-3.5" />
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between text-white/80 gap-2 text-sm sm:text-base">
        <div className="flex items-center gap-1">
          <Wind className="size-2.5 sm:size-3 text-blue-400" />
          <span>{weather.windSpeed.toFixed(0)}</span>
        </div>
        <div className="flex items-center gap-1">
          <Navigation 
            className="size-2.5 sm:size-3 text-blue-400" 
            style={{ transform: `rotate(${weather.windDirection}deg)` }}
          />
          <span>{Math.round(weather.windDirection / 45) * 45}°</span>
        </div>
      </div>
    </Card>
  );
}