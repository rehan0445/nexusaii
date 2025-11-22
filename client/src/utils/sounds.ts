// Sound Effects Utility: Manage notification and interaction sounds
type SoundType = 'message' | 'levelup' | 'quest_complete' | 'quest_start';

interface SoundSettings {
  enabled: boolean;
  volume: number; // 0-1
}

const SOUND_PATHS: Record<SoundType, string> = {
  message: '/sounds/message.mp3',
  levelup: '/sounds/levelup.mp3',
  quest_complete: '/sounds/quest.mp3',
  quest_start: '/sounds/quest-start.mp3'
};

class SoundManager {
  private sounds: Map<SoundType, HTMLAudioElement> = new Map();
  private settings: SoundSettings;

  constructor() {
    // Load settings from localStorage
    const savedSettings = localStorage.getItem('soundSettings');
    this.settings = savedSettings 
      ? JSON.parse(savedSettings)
      : { enabled: true, volume: 0.5 };

    // Preload all sounds
    this.preloadSounds();
  }

  private preloadSounds() {
    Object.entries(SOUND_PATHS).forEach(([type, path]) => {
      try {
        const audio = new Audio(path);
        audio.volume = this.settings.volume;
        audio.preload = 'auto';
        this.sounds.set(type as SoundType, audio);
      } catch (error) {
        console.warn(`Failed to preload sound: ${type}`, error);
      }
    });
  }

  /**
   * Play a sound effect
   * @param type - Sound type to play
   * @param forcePlay - Play even if sounds are disabled
   */
  play(type: SoundType, forcePlay = false) {
    if (!this.settings.enabled && !forcePlay) {
      return;
    }

    const sound = this.sounds.get(type);
    if (!sound) {
      console.warn(`Sound not found: ${type}`);
      return;
    }

    try {
      // Clone the audio to allow multiple simultaneous plays
      const audioClone = sound.cloneNode(true) as HTMLAudioElement;
      audioClone.volume = this.settings.volume;
      audioClone.play().catch(error => {
        // Handle autoplay restrictions
        if (error.name === 'NotAllowedError') {
          console.log('Sound play blocked by browser autoplay policy');
        } else {
          console.warn('Error playing sound:', error);
        }
      });
    } catch (error) {
      console.warn('Failed to play sound:', error);
    }
  }

  /**
   * Enable or disable all sounds
   */
  setEnabled(enabled: boolean) {
    this.settings.enabled = enabled;
    this.saveSettings();
  }

  /**
   * Set volume for all sounds (0-1)
   */
  setVolume(volume: number) {
    this.settings.volume = Math.max(0, Math.min(1, volume));
    
    // Update all loaded sounds
    this.sounds.forEach(sound => {
      sound.volume = this.settings.volume;
    });
    
    this.saveSettings();
  }

  /**
   * Get current settings
   */
  getSettings(): SoundSettings {
    return { ...this.settings };
  }

  /**
   * Save settings to localStorage
   */
  private saveSettings() {
    localStorage.setItem('soundSettings', JSON.stringify(this.settings));
  }

  /**
   * Toggle sounds on/off
   */
  toggle(): boolean {
    this.settings.enabled = !this.settings.enabled;
    this.saveSettings();
    return this.settings.enabled;
  }
}

// Create singleton instance
const soundManager = new SoundManager();

// Export convenience functions
export const playMessageSound = () => soundManager.play('message');
export const playLevelUpSound = () => soundManager.play('levelup');
export const playQuestCompleteSound = () => soundManager.play('quest_complete');
export const playQuestStartSound = () => soundManager.play('quest_start');

export const toggleSounds = () => soundManager.toggle();
export const setSoundsEnabled = (enabled: boolean) => soundManager.setEnabled(enabled);
export const setSoundsVolume = (volume: number) => soundManager.setVolume(volume);
export const getSoundSettings = () => soundManager.getSettings();

export default soundManager;

