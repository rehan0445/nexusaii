import React, { useState, useEffect, useCallback } from 'react';
import { Activity, Zap, Clock, HardDrive } from 'lucide-react';

interface PerformanceMetrics {
  fps: number;
  memoryUsage: number;
  loadTime: number;
  renderTime: number;
}

interface PerformanceMonitorProps {
  enabled?: boolean;
  showDetails?: boolean;
}

export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  enabled = false,
  showDetails = false,
}) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 0,
    memoryUsage: 0,
    loadTime: 0,
    renderTime: 0,
  });
  const [isVisible, setIsVisible] = useState(false);

  // FPS calculation
  const calculateFPS = useCallback(() => {
    let frameCount = 0;
    let lastTime = performance.now();

    const measureFPS = () => {
      frameCount++;
      const currentTime = performance.now();
      
      if (currentTime - lastTime >= 1000) {
        const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
        setMetrics(prev => ({ ...prev, fps }));
        frameCount = 0;
        lastTime = currentTime;
      }
      
      if (enabled) {
        requestAnimationFrame(measureFPS);
      }
    };

    if (enabled) {
      requestAnimationFrame(measureFPS);
    }
  }, [enabled]);

  // Memory usage
  const getMemoryUsage = useCallback(() => {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      const usedMB = Math.round(memory.usedJSHeapSize / 1024 / 1024);
      setMetrics(prev => ({ ...prev, memoryUsage: usedMB }));
    }
  }, []);

  // Load time measurement
  const measureLoadTime = useCallback(() => {
    const loadTime = performance.now();
    setMetrics(prev => ({ ...prev, loadTime }));
  }, []);

  // Render time measurement
  const measureRenderTime = useCallback(() => {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      setMetrics(prev => ({ ...prev, renderTime }));
    };
  }, []);

  useEffect(() => {
    if (enabled) {
      calculateFPS();
      measureLoadTime();
      
      const interval = setInterval(getMemoryUsage, 1000);
      return () => clearInterval(interval);
    }
  }, [enabled, calculateFPS, getMemoryUsage, measureLoadTime]);

  // Keyboard shortcut to toggle visibility
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'P') {
        e.preventDefault();
        setIsVisible(!isVisible);
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [isVisible]);

  if (!enabled || !isVisible) return null;

  const getPerformanceColor = (value: number, thresholds: { good: number; warning: number }) => {
    if (value <= thresholds.good) return 'text-green-400';
    if (value <= thresholds.warning) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="fixed top-4 right-4 z-50 bg-zinc-900/90 backdrop-blur-sm border border-zinc-700 rounded-lg p-3 shadow-xl">
      <div className="flex items-center space-x-2 mb-2">
        <Activity className="w-4 h-4 text-gold" />
        <span className="text-sm font-medium text-white">Performance</span>
        <button
          onClick={() => setIsVisible(false)}
          className="ml-auto text-zinc-400 hover:text-zinc-300"
          aria-label="Close performance monitor"
        >
          ×
        </button>
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <Zap className="w-3 h-3 text-blue-400" />
          <span className="text-xs text-zinc-300">FPS:</span>
          <span className={`text-xs font-mono ${getPerformanceColor(metrics.fps, { good: 50, warning: 30 })}`}>
            {metrics.fps}
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          <HardDrive className="w-3 h-3 text-purple-400" />
          <span className="text-xs text-zinc-300">Memory:</span>
          <span className={`text-xs font-mono ${getPerformanceColor(metrics.memoryUsage, { good: 100, warning: 200 })}`}>
            {metrics.memoryUsage}MB
          </span>
        </div>
        
        {showDetails && (
          <>
            <div className="flex items-center space-x-2">
              <Clock className="w-3 h-3 text-green-400" />
              <span className="text-xs text-zinc-300">Load:</span>
              <span className="text-xs font-mono text-zinc-400">
                {Math.round(metrics.loadTime)}ms
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              <Clock className="w-3 h-3 text-orange-400" />
              <span className="text-xs text-zinc-300">Render:</span>
              <span className="text-xs font-mono text-zinc-400">
                {Math.round(metrics.renderTime)}ms
              </span>
            </div>
          </>
        )}
      </div>
      
      <div className="mt-2 pt-2 border-t border-zinc-700">
        <p className="text-xs text-zinc-500">
          Press Ctrl+Shift+P to toggle
        </p>
      </div>
    </div>
  );
};

export default PerformanceMonitor; 