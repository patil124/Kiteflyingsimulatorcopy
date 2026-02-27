import { useEffect, useRef, useState } from 'react';
import { WeatherState, ScoreState, ControlInput } from '../App';

interface KiteSimulatorProps {
  weather: WeatherState;
  isFlying: boolean;
  score: ScoreState;
  setScore: (score: ScoreState) => void;
  controlInput: ControlInput;
  onCrash: () => void;
}

interface Kite {
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  stringLength: number;
  rotation: number;
  rotationSpeed: number;
}

interface Cloud {
  x: number;
  y: number;
  size: number;
  speed: number;
  opacity: number;
}

interface Raindrop {
  x: number;
  y: number;
  speed: number;
  length: number;
}

interface CollectibleItem {
  id: number;
  x: number;
  y: number;
  type: 'star' | 'coin' | 'gem' | 'bird';
  collected: boolean;
  points: number;
  pulsePhase: number;
}

export function KiteSimulator({ weather, isFlying, score, setScore, controlInput, onCrash }: KiteSimulatorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const kiteRef = useRef<Kite>({
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    angle: 0,
    stringLength: 150,
    rotation: 0,
    rotationSpeed: 0
  });
  const cloudsRef = useRef<Cloud[]>([]);
  const raindropsRef = useRef<Raindrop[]>([]);
  const collectiblesRef = useRef<CollectibleItem[]>([]);
  const mouseRef = useRef({ x: 0, y: 0, isDown: false });
  const animationRef = useRef<number>();
  const lastTrickTimeRef = useRef<number>(0);
  const flightStartTimeRef = useRef<number>(0);
  const nextItemIdRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      
      // Initialize kite position at bottom center
      if (!isFlying) {
        kiteRef.current.x = canvas.width / 2;
        kiteRef.current.y = canvas.height - 100;
      } else if (kiteRef.current.y > canvas.height - 200) {
        kiteRef.current.x = canvas.width / 2;
        kiteRef.current.y = canvas.height / 2;
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Initialize clouds
    cloudsRef.current = Array.from({ length: 8 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height * 0.4,
      size: 40 + Math.random() * 60,
      speed: 0.2 + Math.random() * 0.5,
      opacity: 0.6 + Math.random() * 0.4
    }));

    // Initialize collectibles
    if (isFlying) {
      collectiblesRef.current = Array.from({ length: 8 }, (_, i) => {
        const types: Array<'star' | 'coin' | 'gem' | 'bird'> = ['star', 'coin', 'gem', 'bird'];
        const type = types[Math.floor(Math.random() * types.length)];
        const points = type === 'gem' ? 100 : type === 'bird' ? 75 : type === 'star' ? 50 : 25;
        
        return {
          id: i,
          x: 100 + Math.random() * (canvas.width - 200),
          y: 100 + Math.random() * (canvas.height - 300),
          type,
          collected: false,
          points,
          pulsePhase: Math.random() * Math.PI * 2
        };
      });
      nextItemIdRef.current = 8;
    }

    return () => window.removeEventListener('resize', resizeCanvas);
  }, [isFlying]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
    };

    const handleMouseDown = (e: MouseEvent) => {
      mouseRef.current.isDown = true;
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
    };

    const handleMouseUp = () => {
      mouseRef.current.isDown = false;
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mouseup', handleMouseUp);

    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let lastTime = performance.now();

    const updateWeatherEffects = () => {
      // Update clouds
      cloudsRef.current.forEach(cloud => {
        cloud.x += cloud.speed * (weather.windSpeed / 10);
        if (cloud.x > canvas.width + cloud.size) {
          cloud.x = -cloud.size;
          cloud.y = Math.random() * canvas.height * 0.4;
        }
      });

      // Update/create raindrops
      if (weather.type === 'rainy' || weather.type === 'stormy') {
        const rainIntensity = weather.type === 'stormy' ? 5 : 2;
        for (let i = 0; i < rainIntensity; i++) {
          if (Math.random() < 0.3) {
            raindropsRef.current.push({
              x: Math.random() * canvas.width,
              y: -10,
              speed: 8 + Math.random() * 4,
              length: 10 + Math.random() * 10
            });
          }
        }

        raindropsRef.current = raindropsRef.current.filter(drop => {
          drop.y += drop.speed;
          drop.x += weather.windSpeed * 0.3 * Math.cos(weather.windDirection * Math.PI / 180);
          return drop.y < canvas.height;
        });
      } else {
        raindropsRef.current = [];
      }
    };

    const updateScore = (currentTime: number) => {
      if (!isFlying) return;

      if (flightStartTimeRef.current === 0) {
        flightStartTimeRef.current = currentTime;
      }

      const kite = kiteRef.current;
      const newScore = { ...score };

      // Update flight time
      newScore.flightTime = (currentTime - flightStartTimeRef.current) / 1000;

      // Calculate altitude (higher is better, invert Y coordinate)
      const altitude = Math.max(0, canvas.height - kite.y);
      if (altitude > newScore.maxAltitude) {
        newScore.maxAltitude = altitude;
      }

      // Calculate frame points (before multiplier)
      let framePoints = 0;

      // Score from altitude (points per frame based on height)
      const altitudePoints = (altitude / canvas.height) * 0.5;
      framePoints += altitudePoints;

      // Score from flight time
      framePoints += 0.1;

      // Check collision with collectibles
      collectiblesRef.current.forEach(item => {
        if (!item.collected) {
          const dx = kite.x - item.x;
          const dy = kite.y - item.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < 40) {
            item.collected = true;
            newScore.itemsCollected += 1;
            framePoints += item.points;
            
            // Spawn new item after a delay
            setTimeout(() => {
              const types: Array<'star' | 'coin' | 'gem' | 'bird'> = ['star', 'coin', 'gem', 'bird'];
              const type = types[Math.floor(Math.random() * types.length)];
              const points = type === 'gem' ? 100 : type === 'bird' ? 75 : type === 'star' ? 50 : 25;
              
              collectiblesRef.current.push({
                id: nextItemIdRef.current++,
                x: 100 + Math.random() * (canvas.width - 200),
                y: 100 + Math.random() * (canvas.height - 300),
                type,
                collected: false,
                points,
                pulsePhase: Math.random() * Math.PI * 2
              });
            }, 2000);
          }
        }
      });

      // Remove collected items after a short delay
      collectiblesRef.current = collectiblesRef.current.filter(item => !item.collected);

      // Detect tricks (fast rotation)
      const rotationSpeed = Math.abs(kite.rotationSpeed);
      if (rotationSpeed > 2.5 && currentTime - lastTrickTimeRef.current > 1000) {
        newScore.tricksPerformed += 1;
        newScore.currentCombo += 1;
        const trickPoints = 50 * newScore.currentCombo;
        framePoints += trickPoints;
        lastTrickTimeRef.current = currentTime;
      } else if (currentTime - lastTrickTimeRef.current > 3000) {
        newScore.currentCombo = 0;
      }

      // Weather multipliers - apply only to new frame points
      let weatherMultiplier = 1;
      if (weather.type === 'stormy') weatherMultiplier = 2;
      else if (weather.type === 'rainy') weatherMultiplier = 1.5;
      else if (weather.type === 'windy') weatherMultiplier = 1.3;

      // Add multiplied frame points to total
      framePoints *= weatherMultiplier;
      newScore.totalScore += framePoints;

      // Safety check to prevent infinity
      if (!isFinite(newScore.totalScore)) {
        newScore.totalScore = 999999;
      }

      newScore.totalScore = Math.floor(newScore.totalScore);

      setScore(newScore);
    };

    const updateKitePhysics = (deltaTime: number, currentTime: number) => {
      if (!isFlying) {
        kiteRef.current.x = canvas.width / 2;
        kiteRef.current.y = canvas.height - 100;
        kiteRef.current.vx = 0;
        kiteRef.current.vy = 0;
        kiteRef.current.rotation = 0;
        kiteRef.current.rotationSpeed = 0;
        flightStartTimeRef.current = 0;
        return;
      }

      const kite = kiteRef.current;
      const dt = deltaTime / 16.67; // Normalize to 60fps

      // Wind force with gusts
      const gustFactor = 1 + Math.sin(Date.now() * 0.001) * weather.gustiness;
      const windForce = weather.windSpeed * gustFactor * 0.02;
      const windAngle = weather.windDirection * Math.PI / 180;
      
      const windX = Math.cos(windAngle) * windForce;
      const windY = Math.sin(windAngle) * windForce;

      // Control input force
      const controlForce = 0.8;
      if (controlInput.up) kite.vy -= controlForce * dt;
      if (controlInput.down) kite.vy += controlForce * dt;
      if (controlInput.left) kite.vx -= controlForce * dt;
      if (controlInput.right) kite.vx += controlForce * dt;

      // Rotation for tricks
      if (controlInput.left) kite.rotationSpeed -= 0.3 * dt;
      if (controlInput.right) kite.rotationSpeed += 0.3 * dt;

      // Mouse control
      let targetX = kite.x;
      let targetY = kite.y;

      if (mouseRef.current.isDown) {
        targetX = mouseRef.current.x;
        targetY = mouseRef.current.y;
      }

      // String tension
      const dx = targetX - kite.x;
      const dy = targetY - kite.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance > 0) {
        const tension = Math.min(distance * 0.01, 0.5);
        kite.vx += (dx / distance) * tension * dt;
        kite.vy += (dy / distance) * tension * dt;
      }

      // Apply forces
      kite.vx += windX * dt;
      kite.vy += windY * dt;
      kite.vy += 0.1 * dt; // Slight gravity

      // Lift force (kites fly better in wind)
      const liftForce = -weather.windSpeed * 0.015;
      kite.vy += liftForce * dt;

      // Drag
      kite.vx *= 0.95;
      kite.vy *= 0.95;
      kite.rotationSpeed *= 0.92;

      // Update position
      kite.x += kite.vx * dt;
      kite.y += kite.vy * dt;
      kite.rotation += kite.rotationSpeed * dt;

      // Check for crash (too low or too far to sides)
      if (kite.y > canvas.height - 80 || kite.x < 30 || kite.x > canvas.width - 30) {
        onCrash();
        return;
      }

      // Boundaries
      kite.x = Math.max(50, Math.min(canvas.width - 50, kite.x));
      kite.y = Math.max(50, Math.min(canvas.height - 50, kite.y));

      // Update angle based on velocity
      kite.angle = Math.atan2(kite.vy, kite.vx);
    };

    const drawSky = () => {
      // Sky gradient based on weather
      let topColor, bottomColor;
      
      switch (weather.type) {
        case 'stormy':
          topColor = '#4a5568';
          bottomColor = '#718096';
          break;
        case 'rainy':
          topColor = '#718096';
          bottomColor = '#a0aec0';
          break;
        case 'cloudy':
          topColor = '#7dd3fc';
          bottomColor = '#bae6fd';
          break;
        case 'windy':
          topColor = '#38bdf8';
          bottomColor = '#7dd3fc';
          break;
        default: // sunny
          topColor = '#0ea5e9';
          bottomColor = '#7dd3fc';
      }

      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, topColor);
      gradient.addColorStop(1, bottomColor);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    };

    const drawClouds = () => {
      const cloudCount = weather.type === 'cloudy' ? 1 : weather.type === 'stormy' || weather.type === 'rainy' ? 0.8 : 0.4;
      
      cloudsRef.current.forEach((cloud, index) => {
        if (Math.random() > cloudCount && weather.type !== 'stormy') return;
        
        ctx.fillStyle = weather.type === 'stormy' ? 
          `rgba(70, 70, 80, ${cloud.opacity})` : 
          `rgba(255, 255, 255, ${cloud.opacity})`;
        
        // Draw fluffy cloud shape
        ctx.beginPath();
        ctx.arc(cloud.x, cloud.y, cloud.size * 0.5, 0, Math.PI * 2);
        ctx.arc(cloud.x + cloud.size * 0.4, cloud.y, cloud.size * 0.4, 0, Math.PI * 2);
        ctx.arc(cloud.x - cloud.size * 0.4, cloud.y, cloud.size * 0.4, 0, Math.PI * 2);
        ctx.arc(cloud.x + cloud.size * 0.2, cloud.y - cloud.size * 0.3, cloud.size * 0.35, 0, Math.PI * 2);
        ctx.fill();
      });
    };

    const drawRain = () => {
      ctx.strokeStyle = weather.type === 'stormy' ? 
        'rgba(200, 200, 230, 0.6)' : 
        'rgba(200, 200, 230, 0.4)';
      ctx.lineWidth = 1;

      raindropsRef.current.forEach(drop => {
        ctx.beginPath();
        ctx.moveTo(drop.x, drop.y);
        ctx.lineTo(drop.x, drop.y + drop.length);
        ctx.stroke();
      });
    };

    const drawCollectibles = (currentTime: number) => {
      const collectibles = collectiblesRef.current;
      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;
      
      collectibles.forEach(item => {
        if (!item.collected) {
          const size = 20;
          const pulse = Math.sin(item.pulsePhase) * 5;
          const x = item.x + pulse;
          const y = item.y + pulse;
          
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(item.pulsePhase);
          
          // Draw collectible based on type
          switch (item.type) {
            case 'star':
              ctx.fillStyle = '#f6ad55';
              ctx.beginPath();
              ctx.moveTo(0, -size);
              ctx.lineTo(size * 0.5, -size * 0.5);
              ctx.lineTo(size, 0);
              ctx.lineTo(size * 0.5, size * 0.5);
              ctx.lineTo(0, size);
              ctx.lineTo(-size * 0.5, size * 0.5);
              ctx.lineTo(-size, 0);
              ctx.lineTo(-size * 0.5, -size * 0.5);
              ctx.closePath();
              ctx.fill();
              break;
            case 'coin':
              ctx.fillStyle = '#f6ad55';
              ctx.beginPath();
              ctx.arc(0, 0, size * 0.5, 0, Math.PI * 2);
              ctx.fill();
              ctx.strokeStyle = '#fbbf24';
              ctx.lineWidth = 2;
              ctx.beginPath();
              ctx.arc(0, 0, size * 0.5, 0, Math.PI * 2);
              ctx.stroke();
              break;
            case 'gem':
              ctx.fillStyle = '#f6ad55';
              ctx.beginPath();
              ctx.moveTo(0, -size);
              ctx.lineTo(size * 0.5, -size * 0.5);
              ctx.lineTo(size, 0);
              ctx.lineTo(size * 0.5, size * 0.5);
              ctx.lineTo(0, size);
              ctx.lineTo(-size * 0.5, size * 0.5);
              ctx.lineTo(-size, 0);
              ctx.lineTo(-size * 0.5, -size * 0.5);
              ctx.closePath();
              ctx.fill();
              ctx.strokeStyle = '#fbbf24';
              ctx.lineWidth = 2;
              ctx.beginPath();
              ctx.arc(0, 0, size * 0.5, 0, Math.PI * 2);
              ctx.stroke();
              break;
            case 'bird':
              ctx.fillStyle = '#f6ad55';
              ctx.beginPath();
              ctx.moveTo(0, -size);
              ctx.lineTo(size * 0.5, -size * 0.5);
              ctx.lineTo(size, 0);
              ctx.lineTo(size * 0.5, size * 0.5);
              ctx.lineTo(0, size);
              ctx.lineTo(-size * 0.5, size * 0.5);
              ctx.lineTo(-size, 0);
              ctx.lineTo(-size * 0.5, -size * 0.5);
              ctx.closePath();
              ctx.fill();
              ctx.strokeStyle = '#fbbf24';
              ctx.lineWidth = 2;
              ctx.beginPath();
              ctx.arc(0, 0, size * 0.5, 0, Math.PI * 2);
              ctx.stroke();
              break;
          }
          
          ctx.restore();
          
          // Update pulse phase
          item.pulsePhase += 0.05;
        }
      });
    };

    const drawKite = () => {
      const kite = kiteRef.current;
      
      // Draw string
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(canvas.width / 2, canvas.height - 50);
      
      // Draw string with curve
      const midX = (canvas.width / 2 + kite.x) / 2;
      const midY = (canvas.height - 50 + kite.y) / 2 + 50;
      ctx.quadraticCurveTo(midX, midY, kite.x, kite.y);
      ctx.stroke();

      // Draw kite body (diamond shape)
      ctx.save();
      ctx.translate(kite.x, kite.y);
      ctx.rotate(kite.rotation);

      const kiteSize = 30;
      
      // Kite diamond
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.moveTo(0, -kiteSize);
      ctx.lineTo(kiteSize * 0.7, 0);
      ctx.lineTo(0, kiteSize);
      ctx.lineTo(-kiteSize * 0.7, 0);
      ctx.closePath();
      ctx.fill();

      // Kite cross bars
      ctx.strokeStyle = '#7f1d1d';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, -kiteSize);
      ctx.lineTo(0, kiteSize);
      ctx.moveTo(-kiteSize * 0.7, 0);
      ctx.lineTo(kiteSize * 0.7, 0);
      ctx.stroke();

      // Kite tail
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 3;
      for (let i = 0; i < 5; i++) {
        const tailX = i * 15;
        const tailY = kiteSize + i * 10;
        const wave = Math.sin(Date.now() * 0.005 + i) * 10;
        
        if (i === 0) {
          ctx.beginPath();
          ctx.moveTo(0, kiteSize);
        }
        ctx.lineTo(wave, tailY);
        if (i === 4) ctx.stroke();
        
        // Tail ribbons
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.arc(wave, tailY, 3, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    };

    const animate = (currentTime: number) => {
      const deltaTime = currentTime - lastTime;
      lastTime = currentTime;

      updateWeatherEffects();
      updateKitePhysics(deltaTime, currentTime);
      updateScore(currentTime);

      drawSky();
      drawClouds();
      if (weather.type === 'rainy' || weather.type === 'stormy') {
        drawRain();
      }
      drawCollectibles(currentTime);
      drawKite();

      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [weather, isFlying, controlInput, score, setScore, onCrash]);

  return <canvas ref={canvasRef} className="absolute inset-0" />;
}