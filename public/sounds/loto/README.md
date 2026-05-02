# Lô tô Sound Files

This directory contains audio files for the Lô tô game organized by voice/narrator.

## Directory Structure

Sound files are organized by voice in subdirectories:

```
/public/sounds/loto/
├── default/          (default voice)
│   ├── 1.mp3
│   ├── 2.mp3
│   ├── ...
│   ├── 90.mp3
│   ├── start.mp3
│   ├── funny-45.mp3
│   ├── funny-60.mp3
│   ├── funny-75.mp3
│   └── funny-90.mp3
├── voice2/          (person 2)
│   ├── 1.mp3
│   ├── 2.mp3
│   └── ...
├── voice3/          (person 3)
│   └── ...
└── voice4/          (person 4)
    └── ...
```

## Required Sound Files per Voice

Each voice directory should contain:

### Number Sounds
- `1.mp3` through `90.mp3` - Individual sound files for each number

### Special Sounds
- `start.mp3` - "1, 2, 3 bắt đầu" announcement sound
- `funny-45.mp3` - Plays when 45 numbers have been called
- `funny-60.mp3` - Plays when 60 numbers have been called
- `funny-75.mp3` - Plays when 75 numbers have been called
- `funny-90.mp3` - Plays when all 90 numbers have been called

## Setup Instructions

1. Create a subdirectory for each voice: `default/`, `voice2/`, `voice3/`, `voice4/`, etc.
2. Place all sound files in their respective voice directory
3. File format: MP3 is recommended for best browser compatibility
4. Other supported formats: WAV, OGG, M4A (any format supported by HTML5 `<audio>`)

## Using Different Voices

In the game interface:
1. Select a voice from the "Giọng nói:" (Voice) dropdown menu
2. This dropdown is disabled during gameplay - reconfigure before starting
3. All sounds for the selected voice will be played during the game

## Adding New Voices

To add more voice options:
1. Create a new directory: `/public/sounds/loto/voice5/`, etc.
2. Add all required sound files to the new directory
3. Then update the voice dropdown in the game code to include the new voice option

## Sound File Recommendations

- **Duration**: 1-3 seconds per sound
- **Volume**: Ensure consistent volume levels across all files and all voices
- **Number Sounds**: 
  - Vietnamese number announcements (e.g., "Số một", "Số bốn mươi lăm")
  - Or use simple beep/tone combinations
- **Funny Sounds**: Use entertaining sound effects for milestones
- **Start Sound**: Clear and recognizable announcement

## Fallback

If a voice directory or sound files are missing, the game will attempt to play them but will silently fail - no errors will occur, the game will just proceed without sound.

