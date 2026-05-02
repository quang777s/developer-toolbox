# Lô tô Sound Files

This directory contains audio files for the Lô tô game.

## Required Sound Files

### Startup Sound
- `start.mp3` - "1, 2, 3 bắt đầu" announcement sound

### Milestone Sounds (Funny Sounds)
- `funny-45.mp3` - Plays when 45 numbers have been called
- `funny-60.mp3` - Plays when 60 numbers have been called
- `funny-75.mp3` - Plays when 75 numbers have been called
- `funny-90.mp3` - Plays when all 90 numbers have been called

### Number Sounds
- `1.mp3` through `90.mp3` - Individual sound files for each number (1 to 90)
  - Name format: `{number}.mp3`
  - Examples: `1.mp3`, `2.mp3`, `45.mp3`, `90.mp3`, etc.

## Setup Instructions

1. Place all sound files directly in this directory (`/public/sounds/loto/`)
2. File format: MP3 is recommended for best browser compatibility
3. Other supported formats: WAV, OGG, M4A (any format supported by HTML5 `<audio>`)

## Sound File Recommendations

- **Duration**: 1-3 seconds per sound
- **Volume**: Ensure consistent volume levels across all files
- **Number Sounds**: 
  - Vietnamese number announcements (e.g., "Số một", "Số bốn mươi lăm")
  - Or use simple beep/tone combinations
- **Funny Sounds**: Use entertaining sound effects for milestones

## Testing

Once you add the sound files:
1. Navigate to the Lô tô game page
2. Enable the "Phát âm thanh '1, 2, 3 bắt đầu'" checkbox for startup sound
3. Click "Bắt đầu" to start playing
4. Sounds will play automatically as numbers are called
5. Funny sounds will trigger at 45, 60, 75, and 90 called numbers

## Fallback

If sound files are missing, the game will work perfectly with the visual interface alone - no errors will occur.
