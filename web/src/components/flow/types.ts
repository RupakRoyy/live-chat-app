export type ChatMode = "text" | "voice" | "video";

export type GenderPreference = "any" | "female" | "male";

export const genderPreferenceLabels: Record<GenderPreference, string> = {
  any: "Any Gender",
  female: "Female",
  male: "Male",
};

/** UI gate only. Pro activity always comes from the backend. */
export function canSelectGenderPreference(
  preference: GenderPreference,
  isPro: boolean,
): boolean {
  return preference === "any" || isPro;
}

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
