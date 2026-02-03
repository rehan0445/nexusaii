# Sound Effects for Interactive Character Experience

This directory contains sound effects for the interactive character chat experience.

## Required Sound Files

### 1. `message.mp3`
- **Purpose**: Plays when a new character message arrives
- **Suggested**: Soft notification chime (0.5-1 second)
- **Tone**: Gentle, pleasant, non-intrusive
- **Example**: Soft bell chime or bubble pop

### 2. `levelup.mp3`
- **Purpose**: Plays when affection level increases (level-up)
- **Suggested**: Triumphant melody (1-2 seconds)
- **Tone**: Celebratory, uplifting
- **Example**: Success fanfare or achievement sound

### 3. `quest.mp3`
- **Purpose**: Plays when a quest/challenge is completed successfully
- **Suggested**: Success/completion sound (0.5-1 second)
- **Tone**: Positive, rewarding
- **Example**: Coin collect sound or power-up chime

### 4. `quest-start.mp3`
- **Purpose**: Plays when a new quest/challenge appears
- **Suggested**: Attention-grabbing notification (0.5-1 second)
- **Tone**: Curious, inviting
- **Example**: Sparkle sound or quest notification

## Audio Specifications

- **Format**: MP3 (for browser compatibility)
- **Sample Rate**: 44.1kHz or 48kHz
- **Bit Rate**: 128kbps - 192kbps
- **Duration**: Keep under 2 seconds for better UX
- **Volume**: Normalize to -3dB to -6dB peak

## Free Sound Resources

You can find free sound effects at:
- [Freesound.org](https://freesound.org/)
- [Zapsplat](https://www.zapsplat.com/)
- [Mixkit](https://mixkit.co/free-sound-effects/)
- [Pixabay Sounds](https://pixabay.com/sound-effects/)

## Implementation

The sound system is implemented in `/client/src/utils/sounds.ts` and includes:
- Auto-preloading of all sounds
- Volume control (0-1 scale)
- Enable/disable toggle
- LocalStorage persistence of settings
- Browser autoplay policy handling

Users can control sounds through settings in the chat interface.

