import { useState, useRef, useEffect } from "react";
import type { Route } from "./+types/loto";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Lô tô" }];
}

interface GameRecord {
  timestamp: number;
  numbers: number[];
  lastFiveNumbers: number[]; // Last 5 numbers called in this game
}

export default function LoTo() {
  const [numbers, setNumbers] = useState<number[]>(
    Array.from({ length: 90 }, (_, i) => i + 1)
  );
  const [calledNumbers, setCalledNumbers] = useState<number[]>([]);
  const [currentNumber, setCurrentNumber] = useState<number | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [delay, setDelay] = useState(1);
  const [gameStarted, setGameStarted] = useState(false);
  const [playStartSound, setPlayStartSound] = useState(true);
  const [lastFunnySoundThreshold, setLastFunnySoundThreshold] = useState(0);
  const [selectedVoice, setSelectedVoice] = useState("default");
  const [gameHistory, setGameHistory] = useState<GameRecord[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioHandlerRef = useRef<(() => void) | null>(null);

  // Load game history from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("lotoGameHistory");
    if (stored) {
      try {
        const history = JSON.parse(stored) as GameRecord[];
        setGameHistory(history);
      } catch (e) {
        console.log("Failed to load game history");
      }
    }
  }, []);

  // Save game to history
  const saveGameToHistory = (numbers: number[]) => {
    const lastFiveNumbers = numbers.slice(-5); // Get last 5 numbers
    const newRecord: GameRecord = {
      timestamp: Date.now(),
      numbers: [...numbers],
      lastFiveNumbers,
    };
    const updated = [newRecord, ...gameHistory].slice(0, 10); // Keep last 10 games
    setGameHistory(updated);
    localStorage.setItem("lotoGameHistory", JSON.stringify(updated));
  };

  // Get penalized numbers (last 5 from last 5 games only) that should be called late
  const getPenalizedNumbers = (): number[] => {
    if (gameHistory.length === 0) return [];
    const penalized = new Set<number>();
    // Only consider last 5 games to avoid deprioritizing all 90 numbers
    const recentGames = gameHistory.slice(0, 5);
    recentGames.forEach((record) => {
      if (record.lastFiveNumbers) {
        record.lastFiveNumbers.forEach((num) => penalized.add(num));
      }
    });
    return Array.from(penalized);
  };

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
      // Save completed game to history
      saveGameToHistory(calledNumbers);
      return;
    }

    // Get penalized numbers (last 5 from all previous games)
    const penalizedNumbers = getPenalizedNumbers();
    const position = calledNumbers.length;
    const DEPRIORITIZE_THRESHOLD = 60; // Deprioritize penalized numbers until position 60
    
    // If we're in early/mid game, try to avoid penalized numbers
    let selectionPool = numbersToUse;
    if (position < DEPRIORITIZE_THRESHOLD && penalizedNumbers.length > 0) {
      const nonPenalizedNumbers = numbersToUse.filter(
        (num) => !penalizedNumbers.includes(num)
      );
      
      // Only use non-penalized pool if we have options
      if (nonPenalizedNumbers.length > 0) {
        selectionPool = nonPenalizedNumbers;
      }
    }
    
    // Pick random from selection pool
    const randomIndex = Math.floor(Math.random() * selectionPool.length);
    const nextNumber = selectionPool[randomIndex];

    setCurrentNumber(nextNumber);
    setCalledNumbers((prev) => [...prev, nextNumber]);
    setNumbers((prev) => prev.filter((n) => n !== nextNumber));

    playSound(nextNumber);

    // Schedule next number after current sound finishes + delay
    // Pass the current position (which will be the next position after this number is added)
    scheduleNextNumber(numbersToUse.filter((n) => n !== nextNumber), position + 1);
  };

  const scheduleNextNumber = (remainingNumbers: number[], callPosition: number) => {
    if (remainingNumbers.length === 0) {
      setIsRunning(false);
      return;
    }

    const handleComplete = () => {
      if (audioRef.current) {
        audioRef.current.removeEventListener("ended", handleComplete);
      }
      audioHandlerRef.current = null;

      // Check if we need to play a funny sound after this number
      const thresholds = [45, 60, 75, 90];
      const shouldPlayFunnySound = thresholds.includes(callPosition) && lastFunnySoundThreshold < callPosition;

      if (shouldPlayFunnySound) {
        setLastFunnySoundThreshold(callPosition);
        playSound(`funny-${callPosition}`);
        
        // Schedule next number after funny sound ends
        const handleFunnySoundEnd = () => {
          if (audioRef.current) {
            audioRef.current.removeEventListener("ended", handleFunnySoundEnd);
          }
          timerRef.current = setTimeout(() => {
            callNextNumber(remainingNumbers);
          }, delay * 1000);
        };

        if (audioRef.current?.src) {
          audioRef.current.addEventListener("ended", handleFunnySoundEnd);
          
          const funnyTimer = setTimeout(() => {
            if (audioRef.current) {
              audioRef.current.removeEventListener("ended", handleFunnySoundEnd);
            }
            timerRef.current = setTimeout(() => {
              callNextNumber(remainingNumbers);
            }, delay * 1000);
          }, 10000);

          const wrappedFunnyHandler = () => {
            clearTimeout(funnyTimer);
            if (audioRef.current) {
              audioRef.current.removeEventListener("ended", wrappedFunnyHandler);
            }
            timerRef.current = setTimeout(() => {
              callNextNumber(remainingNumbers);
            }, delay * 1000);
          };

          if (audioRef.current) {
            audioRef.current.removeEventListener("ended", handleFunnySoundEnd);
            audioRef.current.addEventListener("ended", wrappedFunnyHandler);
          }
        } else {
          timerRef.current = setTimeout(() => {
            callNextNumber(remainingNumbers);
          }, delay * 1000);
        }
      } else {
        // Schedule next number with delay
        timerRef.current = setTimeout(() => {
          callNextNumber(remainingNumbers);
        }, delay * 1000);
      }
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
    // Sound file path pattern: /sounds/loto/{voice}/{sound}.mp3
    const soundPath = `/sounds/loto/${selectedVoice}/${sound}.mp3`;
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
    // Save current game if it has started and numbers were called
    if (gameStarted && calledNumbers.length > 0) {
      saveGameToHistory(calledNumbers);
    }

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

    // Funny sounds are now handled in scheduleNextNumber, so this is a no-op
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
        </header>

        {/* Current Number Display */}
        <div className="bg-white rounded-lg shadow-2xl p-6 md:p-8 mb-6 md:mb-8">
          <div className="text-center">
            <p className="text-gray-600 text-lg mb-4">Số được hô</p>
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
              Các số vừa hô ({calledNumbers.length})
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
                  className="px-6 md:px-8 py-3 md:py-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition text-lg"
                >
                  Cài đặt lại
                </button>
              </>
            )}
          </div>

          {/* Penalized Numbers Info */}
          {gameStarted && gameHistory.length > 0 && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-300 rounded-lg">
              <p className="text-sm font-semibold text-gray-700 mb-2">
                Số được ưu tiên hô sau (5 số cuối từ các ván đấu trước):
              </p>
              <div className="flex gap-2 flex-wrap">
                {getPenalizedNumbers().map((num) => (
                  <span
                    key={num}
                    className="px-3 py-1 bg-red-200 text-red-800 rounded text-sm font-semibold"
                  >
                    {num}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Delay Control */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-center gap-4 md:gap-6">
            <label className="flex items-center gap-2 md:gap-3">
              <span className="text-gray-700 font-semibold text-sm md:text-base">
                Giọng nói:
              </span>
              <select
                value={selectedVoice}
                onChange={(e) => setSelectedVoice(e.target.value)}
                disabled={gameStarted}
                className="px-3 py-2 md:px-4 md:py-2 border border-gray-300 rounded-lg disabled:bg-gray-100 disabled:cursor-not-allowed text-base text-gray-900"
              >
                <option value="default">Giọng Em Bé</option>
                <option value="voice2">Giọng Nam</option>
              </select>
            </label>
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
                className="px-3 py-2 md:px-4 md:py-2 border border-gray-300 rounded-lg w-20 md:w-24 disabled:bg-gray-100 disabled:cursor-not-allowed text-base text-gray-900"
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
          <div className="grid grid-cols-9 gap-1 md:gap-2">
            {/* Display 10 rows × 9 columns: 90, 10, 20, ... / 1, 11, 21, ... */}
            {Array.from({ length: 90 }, (_, idx) => {
              const gridRow = Math.floor(idx / 9);
              const gridCol = idx % 9;
              return gridRow === 0 && gridCol === 0 ? 90 : gridCol * 10 + gridRow;
            }).map((num) => {
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
              Kết thúc ván đấu!
            </h2>
            <p className="text-gray-700 text-base md:text-lg mb-6">
              Tất cả các số từ 1 đến 90 đã được hô.
            </p>
            <button
              onClick={resetGame}
              className="px-6 md:px-8 py-3 md:py-4 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition text-lg"
            >
              Chơi lại
            </button>
          </div>
        )}

        {/* Game History */}
        <div className="mt-6 md:mt-8 bg-white rounded-lg shadow-lg p-4 md:p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl md:text-2xl font-bold text-gray-800">
              Lịch sử ván đấu ({gameHistory.length})
            </h2>
            <div className="flex gap-2">
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
              >
                {showHistory ? "Ẩn" : "Xem"}
              </button>
              {gameHistory.length > 0 && (
                <button
                  onClick={() => {
                    setGameHistory([]);
                    localStorage.removeItem("lotoGameHistory");
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm"
                >
                  Xóa lịch sử
                </button>
              )}
            </div>
          </div>

          {showHistory && gameHistory.length > 0 && (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {gameHistory.map((record, index) => (
                <div
                  key={index}
                  className="border border-gray-300 rounded-lg p-3 bg-gray-50"
                >
                  <div className="flex justify-between items-start mb-2">
                    <p className="font-semibold text-gray-700">
                      Ván đấu {gameHistory.length - index}
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(record.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    Số lần hô: {record.numbers.length}
                  </p>
                  <p className="text-xs text-gray-500 break-words mb-2">
                    {record.numbers.join(", ")}
                  </p>
                  {record.lastFiveNumbers && record.lastFiveNumbers.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-gray-300">
                      <p className="text-xs font-semibold text-gray-700 mb-1">
                        5 số cuối (sẽ được hô sau ở ván đấu tiếp theo):
                      </p>
                      <div className="flex gap-1 flex-wrap">
                        {record.lastFiveNumbers.map((num, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 bg-red-200 text-red-800 rounded text-xs font-semibold"
                          >
                            {num}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {!showHistory && gameHistory.length > 0 && (
            <p className="text-sm text-gray-600">
              {gameHistory.length} ván đấu trong lịch sử. Nhấn "Xem" để xem chi tiết.
            </p>
          )}

          {gameHistory.length === 0 && (
            <p className="text-sm text-gray-500 italic">
              Chưa có lịch sử ván đấu. Hoàn thành một ván đấu để lưu lịch sử.
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
