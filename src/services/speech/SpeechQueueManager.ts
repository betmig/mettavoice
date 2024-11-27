import { EventEmitter } from '../../utils/EventEmitter';

interface QueueItem {
  text: string;
  resolve: () => void;
  reject: (error: Error) => void;
}

export class SpeechQueueManager {
  private static instance: SpeechQueueManager;
  private queue: QueueItem[] = [];
  private isProcessing = false;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private events = new EventEmitter();
  private pauseTimeout: number | null = null;
  private utteranceTimeout: number | null = null;
  private maxUtteranceTime = 30000; // 30 seconds max per utterance
  private pauseDuration = 500; // 500ms pause between utterances
  private keepAliveInterval: number | null = null;

  private constructor() {
    this.setupSpeechSynthesis();
  }

  static getInstance(): SpeechQueueManager {
    if (!SpeechQueueManager.instance) {
      SpeechQueueManager.instance = new SpeechQueueManager();
    }
    return SpeechQueueManager.instance;
  }

  private setupSpeechSynthesis() {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.cancel();
      }
    });

    window.addEventListener('beforeunload', () => {
      this.cancel();
    });
  }

  async speak(text: string, voice: SpeechSynthesisVoice): Promise<void> {
    return new Promise((resolve, reject) => {
      this.queue.push({ text, resolve, reject });
      this.processQueue(voice);
    });
  }

  private async processQueue(voice: SpeechSynthesisVoice) {
    if (this.isProcessing || this.queue.length === 0) return;

    this.isProcessing = true;
    const item = this.queue[0];

    try {
      await this.speakText(item.text, voice);
      this.queue.shift();
      item.resolve();

      await new Promise(resolve => {
        this.pauseTimeout = window.setTimeout(resolve, this.pauseDuration);
      });

      this.isProcessing = false;
      this.processQueue(voice);
    } catch (error) {
      this.queue.shift();
      item.reject(error instanceof Error ? error : new Error('Speech synthesis failed'));
      this.isProcessing = false;
      this.processQueue(voice);
    }
  }

  private speakText(text: string, voice: SpeechSynthesisVoice): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.voice = voice;
        utterance.rate = 1;
        utterance.pitch = 1;
        utterance.volume = 1;

        this.utteranceTimeout = window.setTimeout(() => {
          window.speechSynthesis.cancel();
          reject(new Error('Speech synthesis timed out'));
        }, this.maxUtteranceTime);

        utterance.onend = () => {
          this.cleanup();
          resolve();
        };

        utterance.onerror = (event) => {
          this.cleanup();
          reject(new Error(`Speech synthesis error: ${event.error}`));
        };

        utterance.onpause = () => {
          window.speechSynthesis.resume();
        };

        this.currentUtterance = utterance;
        window.speechSynthesis.speak(utterance);

        // Keep synthesis active
        this.startKeepAlive();
      } catch (error) {
        this.cleanup();
        reject(error);
      }
    });
  }

  private startKeepAlive() {
    if (this.keepAliveInterval) {
      window.clearInterval(this.keepAliveInterval);
    }

    this.keepAliveInterval = window.setInterval(() => {
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.pause();
        window.speechSynthesis.resume();
      } else {
        this.stopKeepAlive();
      }
    }, 5000);
  }

  private stopKeepAlive() {
    if (this.keepAliveInterval) {
      window.clearInterval(this.keepAliveInterval);
      this.keepAliveInterval = null;
    }
  }

  private cleanup() {
    if (this.utteranceTimeout) {
      window.clearTimeout(this.utteranceTimeout);
      this.utteranceTimeout = null;
    }
    if (this.pauseTimeout) {
      window.clearTimeout(this.pauseTimeout);
      this.pauseTimeout = null;
    }
    this.stopKeepAlive();
    this.currentUtterance = null;
  }

  cancel(): void {
    this.queue = [];
    this.isProcessing = false;
    this.cleanup();
    window.speechSynthesis.cancel();
    this.events.emit('cancelled');
  }

  onCancelled(callback: () => void): void {
    this.events.on('cancelled', callback);
  }

  offCancelled(callback: () => void): void {
    this.events.off('cancelled', callback);
  }
}

export const speechQueueManager = SpeechQueueManager.getInstance();