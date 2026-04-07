export interface VoiceAgentAction {
  action: "search" | "navigate" | "answer" | "create_interaction" | "create_reminder";
  response: string;
  data?: {
    query?: string;
    route?: string;
    contactName?: string;
    filters?: {
      tag?: string;
      company?: string;
      sentiment?: string;
    };
  };
}

export type VoiceAgentPhase = "idle" | "listening" | "processing" | "speaking" | "error";

export interface UseVoiceAgentOptions {
  onAction?: (action: VoiceAgentAction) => void;
  onError?: (error: string) => void;
}