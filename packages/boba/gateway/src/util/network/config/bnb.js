
export const bnbConfig = {
  Testnet: {
    OMGX_WATCHER_URL: `https://api-watcher.testnet.bnb.boba.network/`,
    META_TRANSACTION: `https://api-meta-transaction.testnet.bnb.boba.network/`,
    MM_Label:         `bobaBnbTestnet`,
    addressManager:   `0xAee1fb3f4353a9060aEC3943fE932b6Efe35CdAa`,
    L1: {
      name: "BNB Testnet",
      chainId: 97,
      chainIdHex: '0x61',
      rpcUrl: [
        `https://data-seed-prebsc-1-s1.binance.org:8545`,
        `https://data-seed-prebsc-2-s1.binance.org:8545`,
        `https://bsc-testnet.public.blastapi.io`,
      ],
      transaction: `https://testnet.bscscan.com/tx/`,
      blockExplorerUrl: `https://testnet.bscscan.com/`,
      symbol: "tBNB",
      tokenName: "tBNB",
    },
    L2: {
      name: "Boba BNB Testnet",
      chainId: 9728,
      chainIdHex: '0x2600',
      rpcUrl: `https://testnet.bnb.boba.network`,
      blockExplorer: `https://blockexplorer.testnet.bnb.boba.network/`,
      transaction: `https://blockexplorer.testnet.bnb.boba.network/tx/`,
      blockExplorerUrl: `https://blockexplorer.testnet.bnb.boba.network/`,
      symbol: "BOBA",
      tokenName: "Boba Token",
    },
    gasEstimateAccount: `0xdb5a187FED81c735ddB1F6E47F28f2A5F74639b2`,
    twitterFaucetPromotionText: `https://twitter.com/intent/tweet?text=I%27m%20developing%20on%20Boba%20BNB%20Testnet%20for%20BNB%20`
  },
  Mainnet: {
    OMGX_WATCHER_URL: `https://api-watcher.bnb.boba.network/`,
    META_TRANSACTION: `https://api-meta-transaction.bnb.boba.network/`,
    MM_Label:         `bobaBnb`,
    addressManager:   `0xeb989B25597259cfa51Bd396cE1d4B085EC4c753`,
    L1: {
      name: "Binance Smart Chain Mainnet",
      chainId: 56,
      chainIdHex: '0x38',
      rpcUrl: [
        `https://bsc-dataseed.binance.org`,
        `https://rpc.ankr.com/bsc`,
        `https://1rpc.io/bnb`,
      ],
      transaction: `https://bscscan.com/tx/`,
      blockExplorerUrl: `https://bscscan.com/`,
      symbol: "BNB",
      tokenName: "BNB",
    },
    L2: {
      name: "Boba BNB Mainnet",
      chainId: 56288,
      chainIdHex: '0xDBE0',
      rpcUrl: `https://bnb.boba.network`,
      blockExplorer: `https://blockexplorer.bnb.boba.network/`,
      transaction: `https://blockexplorer.bnb.boba.network/tx/`,
      blockExplorerUrl: `https://blockexplorer.bnb.boba.network/`,
      symbol: "BOBA",
      tokenName: "Boba Token",
    },
    gasEstimateAccount: `0xdb5a187FED81c735ddB1F6E47F28f2A5F74639b2`,
    twitterFaucetPromotionText: `https://twitter.com/intent/tweet?text=I%27m%20developing%20on%20Boba%20BNB%20Testnet%20for%20BNB%20`
  }
}
