// Components
export { default as ChatHeaderActions } from "@/components/ip-assistant/ChatHeaderActions";
export { default as ChatInput } from "@/components/ip-assistant/ChatInput";
export { default as SidebarExtras } from "@/components/ip-assistant/SidebarExtras";
export { WelcomeScreen } from "@/components/ip-assistant/WelcomeScreen";
export { WhitelistDetailsModal } from "@/components/ip-assistant/WhitelistDetailsModal";
export { WhitelistMonitor } from "@/components/ip-assistant/WhitelistMonitor";
export { YouTubeStyleSearchResults } from "@/components/ip-assistant/YouTubeStyleSearchResults";

// Page
export { default as IpAssistant } from "@/pages/IpAssistant";
export { default as IpfiAssistant } from "@/pages/IpfiAssistant";

// Types and Utils
export {
  type BotMessage,
  type Message,
  type ChatSession,
} from "@/features/ip-assistant/lib/types";
export {
  IP_ASSISTANT_AVATAR,
  STORAGE_KEY,
  CURRENT_SESSION_KEY,
} from "@/features/ip-assistant/lib/constants";
export {
  truncateAddress,
  getCurrentTimestamp,
  getInitialBotMessage,
  isValidEthereumAddress,
  getMessagePreview,
  summaryFromAnswer,
} from "@/features/ip-assistant/lib/utils";
export { ANSWER_DETAILS } from "@/features/ip-assistant/lib/answer-details";
