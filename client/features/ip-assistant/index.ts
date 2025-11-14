// Components
export { default as ChatHeaderActions } from "@/components/ip-assistant/ChatHeaderActions";
export { default as ChatInput } from "@/components/ip-assistant/ChatInput";
export { default as SidebarExtras } from "@/components/ip-assistant/SidebarExtras";
export { WelcomeScreen } from "@/components/ip-assistant/WelcomeScreen";
export { WhitelistDetailsModal } from "@/components/ip-assistant/WhitelistDetailsModal";
export { WhitelistMonitor } from "@/components/ip-assistant/WhitelistMonitor";

// Page
export { default as IpAssistant } from "@/pages/IpAssistant";
export { default as IpfiAssistant } from "@/pages/IpfiAssistant";

// Keep old paths as fallback for now - gradual migration
export {
  type BotMessage,
  type Message,
  type ChatSession,
} from "@/lib/ip-assistant/types";
export {
  IP_ASSISTANT_AVATAR,
  STORAGE_KEY,
  CURRENT_SESSION_KEY,
} from "@/lib/ip-assistant/constants";
export {
  truncateAddress,
  getCurrentTimestamp,
  getInitialBotMessage,
  isValidEthereumAddress,
  getMessagePreview,
  summaryFromAnswer,
} from "@/lib/ip-assistant/utils";
export { ANSWER_DETAILS } from "@/lib/ip-assistant/answer-details";
