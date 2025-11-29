export type NetworkType = "mainnet" | "testnet";

export interface NetworkConfig {
  name: string;
  rpc: string;
  chainId: number;
  blockExplorer: string;
}

const networkConfigs: Record<NetworkType, NetworkConfig> = {
  mainnet: {
    name: "Story",
    rpc: "https://mainnet.storyrpc.io",
    chainId: 1514,
    blockExplorer: "https://mainnet.storyscan.xyz",
  },
  testnet: {
    name: "Story Testnet",
    rpc: "https://aeneid.storyrpc.io",
    chainId: 1516,
    blockExplorer: "https://testnet.storyscan.xyz",
  },
};

export function getNetworkConfig(network: NetworkType): NetworkConfig {
  return networkConfigs[network];
}

export function getAllNetworks(): Record<NetworkType, NetworkConfig> {
  return networkConfigs;
}
