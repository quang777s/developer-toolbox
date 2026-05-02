import { useState, useRef, useEffect } from "react";
import type { Route } from "./+types/loto";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Lô tô - Trò chơi Xổ số Việt Nam" }];
}

export default function LoTo() {
  const [numbers, setNumbers] = useState<number[]>(
    Array.from({ length: 90 }, (_, i) => i + 1)
  );
  const [calledNumbers, setCalledNumbers] = useState<number[]>([]);
  const [currentNumber, setCurrentNumber] = useState<number | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [delay, setDelay] = useState(3);
  const [gameStarted, setGameStarted] = useState(false);
  const [playStartSound, setPlayStartSound] = useState(true);
  const [lastFunnySoundThreshold, setLastFunnySoundThreshold] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioHandlerRef = useRef<(() => void) | null>(null);

  const startGame = () => {
    const initialNumbers = Array.from({ length: 90 }, (_, i) => i + 1);
    setGameStarted(true);
    setNumbers(initialNumbers);
    setCalledNumbers([]);
    setCurrentNumber(null);
    setLastFunnySoundThreshold(0);

    if (playStartSound) {
      playSound("start");
      // Don't set isRunning yet - wait for startup sound to finish
    } else {
      setIsRunning(true);
    }
  };

  const callNextNumber = (numbersToUse: number[]) => {
    if (numbersToUse.length === 0) {
      setIsRunning(false);
      return;
    }

    const randomIndex = Math.floor(Math.random() * numbersToUse.length);
    const nextNumber = numbersToUse[randomIndex];

    setCurrentNumber(nextNumber);
    setCalledNumbers((prev) => [...prev, nextNumber]);
    setNumbers((prev) => prev.filter((n) => n !== nextNumber));

    playSound(nextNumber);

    // Schedule next number after current sound finishes + delay
    scheduleNextNumber(numbersToUse.filter((n) => n !== nextNumber));
  };

  const scheduleNextNumber = (remainingNumbers: number[]) => {
    if (remainingNumbers.length === 0) {
      setIsRunning(false);
      return;
    }

    const handleComplete = () => {
      if (audioRef.current) {
        audioRef.current.removeEventListener("ended", handleComplete);
      }
      audioHandlerRef.current = null;

      // Schedule next number with delay
      timerRef.current = setTimeout(() => {
        callNextNumber(remainingNumbers);
      }, delay * 1000);
    };

    audioHandlerRef.current = handleComplete;

    if (audioRef.current?.src) {
      audioRef.current.addEventListener("ended", handleComplete);

      // Safety timeout (if sound doesn't load within 10s, proceed anyway)
      const safetyTimer = setTimeout(() => {
        if (audioRef.current && audioHandlerRef.current === handleComplete) {
          audioRef.current.removeEventListener("ended", handleComplete);
          audioHandlerRef.current = null;
          timerRef.current = setTimeout(() => {
            callNextNumber(remainingNumbers);
          }, delay * 1000);
        }
      }, 10000);

      // Wrap handler to clear safety timeout
      const wrappedHandler = () => {
        clearTimeout(safetyTimer);
        if (audioRef.current) {
          audioRef.current.removeEventListener("ended", wrappedHandler);
        }
        audioHandlerRef.current = null;
        timerRef.current = setTimeout(() => {
          callNextNumber(remainingNumbers);
        }, delay * 1000);
      };

      if (audioRef.current) {
        audioRef.current.removeEventListener("ended", handleComplete);
        audioRef.current.addEventListener("ended", wrappedHandler);
      }
      audioHandlerRef.current = wrappedHandler;
    } else {
      timerRef.current = setTimeout(() => {
        callNextNumber(remainingNumbers);
      }, delay * 1000);
    }
  };

  const playSound = (sound: number | string) => {
    // Sound file path pattern: /sounds/loto/{sound}.mp3
    const soundPath = `/sounds/loto/${sound}.mp3`;
    if (audioRef.current) {
      audioRef.current.src = soundPath;
      audioRef.current.muted = false;
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch((err) => {
        console.log("Sound play error (may be blocked by browser):", err);
      });
    }
  };

  const stopGame = () => {
    setIsRunning(false);
    // Clear any pending timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    // Remove audio event listeners
    if (audioRef.current) {
      if (audioHandlerRef.current) {
        audioRef.current.removeEventListener("ended", audioHandlerRef.current);
      }
      audioRef.current.removeEventListener("ended", (e: any) => {});
      audioRef.current.pause();
    }
  };

  const resumeGame = () => {
    setIsRunning(true);
    // The useEffect will handle calling the next number
  };

  const resetGame = () => {
    setIsRunning(false);
    setGameStarted(false);
    setCalledNumbers([]);
    setCurrentNumber(null);
    setNumbers(Array.from({ length: 90 }, (_, i) => i + 1));
    setLastFunnySoundThreshold(0);
    
    // Clear timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    
    // Remove audio event listener and stop
    if (audioRef.current) {
      if (audioHandlerRef.current) {
        audioRef.current.removeEventListener("ended", audioHandlerRef.current);
        audioHandlerRef.current = null;
      }
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  const callNumberManually = (num: number) => {
    if (!numbers.includes(num)) return;

    setCurrentNumber(num);
    setCalledNumbers((prev) => [...prev, num]);
    setNumbers((prev) => prev.filter((n) => n !== num));
    playSound(num);

    // If game is running and user manually calls a number, the effect will handle the next scheduled call
  };

  useEffect(() => {
    if (!gameStarted) return;

    // Handle startup sound - wait for it to finish before starting game
    if (playStartSound && audioRef.current?.src?.includes("start")) {
      const handleStartSoundEnd = () => {
        setIsRunning(true);
        audioRef.current?.removeEventListener("ended", handleStartSoundEnd);
      };

      audioRef.current.addEventListener("ended", handleStartSoundEnd);
      return () => {
        audioRef.current?.removeEventListener("ended", handleStartSoundEnd);
      };
    }
  }, [gameStarted, playStartSound]);

  useEffect(() => {
    if (!gameStarted || calledNumbers.length === 0) return;

    const thresholds = [45, 60, 75, 90];
    for (const threshold of thresholds) {
      if (
        calledNumbers.length === threshold &&
        lastFunnySoundThreshold < threshold
      ) {
        setLastFunnySoundThreshold(threshold);
        playSound(`funny-${threshold}`);
        break;
      }
    }
  }, [calledNumbers, gameStarted, lastFunnySoundThreshold]);

  useEffect(() => {
    if (!gameStarted || !isRunning || numbers.length === 0) return;

    // Call next number if no timer is pending (start or resume)
    if (timerRef.current === null) {
      callNextNumber(numbers);
    }

    return () => {
      // Cleanup on pause/stop
    };
  }, [isRunning, gameStarted]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      if (audioRef.current && audioHandlerRef.current) {
        audioRef.current.removeEventListener("ended", audioHandlerRef.current);
      }
    };
  }, []);

  const remainingCount = numbers.length;

  return (
    <main className="min-h-screen bg-gradient-to-br from-red-500 to-yellow-500 p-4">
      <audio ref={audioRef} crossOrigin="anonymous" preload="auto" />

      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="text-center mb-6 md:mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-2 drop-shadow-lg">
            Lô tô
          </h1>
          <p className="text-lg md:text-xl text-white drop-shadow">
            Trò chơi Xổ số Việt Nam
          </p>
        </header>

        {/* Current Number Display */}
        <div className="bg-white rounded-lg shadow-2xl p-6 md:p-8 mb-6 md:mb-8">
          <div className="text-center">
            <p className="text-gray-600 text-lg mb-4">Số được gọi</p>
            <div className="text-7xl md:text-9xl font-bold text-red-600 min-h-32 flex items-center justify-center">
              {currentNumber !== null ? currentNumber : "-"}
            </div>
            <p className="text-gray-500 mt-4">Còn lại: {remainingCount} số</p>
          </div>
        </div>

        {/* Recent Called Numbers */}
        {calledNumbers.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-4 md:p-6 mb-6 md:mb-8">
            <h3 className="text-lg md:text-xl font-bold text-gray-800 mb-3 md:mb-4">
              Các số vừa gọi ({calledNumbers.length})
            </h3>
            <div className="flex flex-wrap gap-2 md:gap-3">
              {[...calledNumbers].reverse().map((num, index) => (
                <div
                  key={index}
                  className={`px-3 md:px-4 py-2 md:py-2 rounded-lg font-semibold text-white text-sm md:text-base ${
                    index === 0
                      ? "bg-yellow-500 ring-2 ring-yellow-600 scale-110"
                      : "bg-blue-500"
                  }`}
                >
                  {num}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="bg-white rounded-lg shadow-lg p-4 md:p-6 mb-6 md:mb-8">
          <div className="flex flex-wrap gap-3 md:gap-4 justify-center mb-4 md:mb-6">
            {!gameStarted ? (
              <button
                onClick={startGame}
                className="px-6 md:px-8 py-3 md:py-4 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition text-lg"
              >
                Bắt đầu
              </button>
            ) : (
              <>
                {isRunning ? (
                  <button
                    onClick={stopGame}
                    className="px-6 md:px-8 py-3 md:py-4 bg-orange-600 text-white font-semibold rounded-lg hover:bg-orange-700 transition text-lg"
                  >
                    Tạm dừng
                  </button>
                ) : (
                  <button
                    onClick={resumeGame}
                    className="px-6 md:px-8 py-3 md:py-4 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition text-lg"
                  >
                    Tiếp tục
                  </button>
                )}
                <button
                  onClick={resetGame}
                  className="px-6 md:px-8 py-3 md:py-4 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition text-lg"
                >
                  Bắt đầu lại
                </button>
              </>
            )}
          </div>

          {/* Delay Control */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-center gap-4 md:gap-6">
            <label className="flex items-center gap-2 md:gap-3">
              <span className="text-gray-700 font-semibold text-sm md:text-base">
                Thời gian chờ (giây):
              </span>
              <input
                type="number"
                min="1"
                max="30"
                value={delay}
                onChange={(e) => setDelay(Math.max(1, parseInt(e.target.value) || 1))}
                disabled={gameStarted}
                className="px-3 py-2 md:px-4 md:py-2 border border-gray-300 rounded-lg w-20 md:w-24 disabled:bg-gray-100 disabled:cursor-not-allowed text-base"
              />
            </label>
            <label className="flex items-center gap-2 md:gap-3">
              <input
                type="checkbox"
                checked={playStartSound}
                onChange={(e) => setPlayStartSound(e.target.checked)}
                disabled={gameStarted}
                className="w-4 h-4 disabled:cursor-not-allowed"
              />
              <span className="text-gray-700 text-sm md:text-base">
                Phát âm thanh "1, 2, 3 bắt đầu"
              </span>
            </label>
            {gameStarted && (
              <span
                className={`px-4 py-2 rounded-lg font-semibold text-white text-sm md:text-base ${
                  isRunning ? "bg-green-600" : "bg-orange-600"
                }`}
              >
                {isRunning ? "Đang chạy" : "Tạm dừng"}
              </span>
            )}
          </div>
        </div>

        {/* Numbers Grid */}
        <div className="bg-white rounded-lg shadow-lg p-4 md:p-6">
          <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-4 md:mb-6">
            Các số còn lại
          </h2>
          <div className="grid grid-cols-9 md:grid-cols-15 gap-1 md:gap-2">
            {Array.from({ length: 90 }, (_, i) => i + 1).map((num) => {
              const isCalled = calledNumbers.includes(num);
              const isCurrentNumber = currentNumber === num;

              return (
                <button
                  key={num}
                  onClick={() => gameStarted && callNumberManually(num)}
                  disabled={isCalled || !gameStarted}
                  className={`aspect-square flex items-center justify-center rounded font-bold text-xs md:text-sm transition transform hover:scale-105 active:scale-95 ${
                    isCurrentNumber
                      ? "bg-yellow-400 text-black shadow-lg scale-110"
                      : isCalled
                        ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                        : "bg-blue-600 text-white hover:bg-blue-700 cursor-pointer"
                  }`}
                >
                  {num}
                </button>
              );
            })}
          </div>
        </div>

        {/* Game Over Message */}
        {gameStarted && remainingCount === 0 && (
          <div className="mt-6 md:mt-8 bg-white rounded-lg shadow-lg p-6 md:p-8 text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-green-600 mb-4">
              Kết thúc trò chơi!
            </h2>
            <p className="text-gray-700 text-base md:text-lg mb-6">
              Tất cả các số từ 1 đến 90 đã được gọi.
            </p>
            <button
              onClick={resetGame}
              className="px-6 md:px-8 py-3 md:py-4 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition text-lg"
            >
              Chơi lại
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
