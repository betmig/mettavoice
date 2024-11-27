import { BellSound } from '../../types';

export class AudioPlayer {
  private audioContext: AudioContext;
  private gainNode: GainNode;
  private activeSource: AudioBufferSourceNode | null = null;
  private isPlaying = false;
  private playbackTimeout: NodeJS.Timeout | null = null;
  private currentPlaybackGain: GainNode | null = null;
  private reverbTailDuration = 1; // Additional time in seconds to let reverb tail fade

  constructor(audioContext: AudioContext) {
    this.audioContext = audioContext;
    this.gainNode = audioContext.createGain();
    this.gainNode.connect(audioContext.destination);
  }

  async play(buffer: AudioBuffer): Promise<void> {
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }

    // Clean up any existing playback
    await this.stop();

    return new Promise((resolve, reject) => {
      try {
        // Create and configure source
        this.activeSource = this.audioContext.createBufferSource();
        this.activeSource.buffer = buffer;
        
        // Create a new gain node for this specific playback
        this.currentPlaybackGain = this.audioContext.createGain();
        this.currentPlaybackGain.gain.value = this.gainNode.gain.value;
        
        // Connect the nodes
        this.activeSource.connect(this.currentPlaybackGain);
        this.currentPlaybackGain.connect(this.gainNode);

        this.isPlaying = true;

        // Calculate total duration including reverb tail
        const totalDuration = (buffer.duration + this.reverbTailDuration) * 1000;

        // Handle completion
        const handleEnded = () => {
          // Don't cleanup immediately - wait for reverb tail
          setTimeout(() => {
            if (this.playbackTimeout) {
              clearTimeout(this.playbackTimeout);
              this.playbackTimeout = null;
            }
            this.cleanup();
            resolve();
          }, this.reverbTailDuration * 1000);
        };

        this.activeSource.addEventListener('ended', handleEnded, { once: true });

        // Fallback cleanup in case the ended event doesn't fire
        this.playbackTimeout = setTimeout(() => {
          if (this.isPlaying) {
            this.cleanup();
            resolve();
          }
        }, totalDuration + 500); // Add extra buffer time

        // Start playback
        const startTime = this.audioContext.currentTime;
        this.activeSource.start(startTime);

      } catch (error) {
        this.cleanup();
        reject(error);
      }
    });
  }

  async stop(): Promise<void> {
    if (!this.isPlaying) return;

    return new Promise<void>((resolve) => {
      if (this.playbackTimeout) {
        clearTimeout(this.playbackTimeout);
        this.playbackTimeout = null;
      }

      if (this.activeSource && this.isPlaying) {
        try {
          // Fade out to avoid clicks
          if (this.currentPlaybackGain) {
            const now = this.audioContext.currentTime;
            this.currentPlaybackGain.gain.cancelScheduledValues(now);
            this.currentPlaybackGain.gain.setValueAtTime(this.currentPlaybackGain.gain.value, now);
            this.currentPlaybackGain.gain.linearRampToValueAtTime(0, now + 0.1);
          }
          
          // Wait for fade out before stopping
          setTimeout(() => {
            if (this.activeSource) {
              try {
                this.activeSource.stop();
              } catch (error) {
                // Ignore errors if already stopped
              }
            }
            this.cleanup();
            resolve();
          }, 150); // Slightly longer than fade time to ensure smooth stop
        } catch (error) {
          // Ignore errors if already stopped
          this.cleanup();
          resolve();
        }
      } else {
        this.cleanup();
        resolve();
      }
    });
  }

  setVolume(volume: number): void {
    const safeVolume = Math.max(0, Math.min(1, volume));
    const now = this.audioContext.currentTime;
    
    // Smoothly transition to new volume
    this.gainNode.gain.cancelScheduledValues(now);
    this.gainNode.gain.setValueAtTime(this.gainNode.gain.value, now);
    this.gainNode.gain.linearRampToValueAtTime(safeVolume, now + 0.1);
    
    if (this.isPlaying && this.currentPlaybackGain) {
      this.currentPlaybackGain.gain.cancelScheduledValues(now);
      this.currentPlaybackGain.gain.setValueAtTime(this.currentPlaybackGain.gain.value, now);
      this.currentPlaybackGain.gain.linearRampToValueAtTime(safeVolume, now + 0.1);
    }
  }

  private cleanup(): void {
    if (this.activeSource) {
      try {
        this.activeSource.disconnect();
      } catch (error) {
        // Ignore disconnection errors
      }
      this.activeSource = null;
    }
    if (this.currentPlaybackGain) {
      try {
        this.currentPlaybackGain.disconnect();
      } catch (error) {
        // Ignore disconnection errors
      }
      this.currentPlaybackGain = null;
    }
    this.isPlaying = false;
  }

  public dispose(): void {
    this.stop();
    if (this.gainNode) {
      try {
        this.gainNode.disconnect();
      } catch (error) {
        // Ignore disconnection errors
      }
    }
  }
}