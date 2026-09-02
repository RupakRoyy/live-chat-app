export type ChatMode = "text" | "voice" | "video";

export type AppState =
  | "landing"
  | "finding"
  | "connecting"
  | "chat"
  | "disconnected"
  | "ended";

export const chatModeLabels: Record<ChatMode, string> = {
  text: "Text",
  voice: "Voice",
  video: "Video",
};

export const startChatLabels: Record<ChatMode, string> = {
  text: "Start Text Chat →",
  voice: "Start Voice Chat →",
  video: "Start Video Chat →",
};
