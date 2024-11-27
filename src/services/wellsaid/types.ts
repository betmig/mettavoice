export interface WellSaidSpeaker {
  speaker_id: string;
  name: string;
  preview_url?: string;
  language?: string;
}

export interface WellSaidResponse {
  speakers: WellSaidSpeaker[];
}

export interface WellSaidError {
  message: string;
  code?: number;
}