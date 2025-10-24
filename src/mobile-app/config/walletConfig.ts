// Wallet Configuration - Your Phantom Wallet Addresses
export interface PhantomWallet {
  name: string;
  publicKey: string;
  privateKey?: string; // Only for devnet testing
  balance: number;
}

export const PHANTOM_WALLETS: PhantomWallet[] = [
  {
    name: 'dev1 (user)',
    publicKey: '3oVnL6Y34hoUXM41MBy6Rcd3asvyyTW8rFT3xgYeSdfZ',
    privateKey: 'iUYSbQx3Hyo63aNVwac7MrnRrxVmBHfW5S91YjtrpGKVfTJMEpkyywkSS7K1mEsjNtz6kS9nmeg3RW5NYntvQeo',
    balance: 0, // Will be updated from blockchain
  },
  {
    name: 'dev2 (distributor)', 
    publicKey: '6EMvJNLHXoqXwS98aGuRzMjfU35144fBcjyvaPfUQGK2',
    privateKey: '2tqoLKJ632JCPLbSiWvB5n9KDg4mtWEhLHdFGQk5mfeAJsFLRLQa3ag1DH4he8LwjK3BYjzE8XBMhiaNQKY2tGWc',
    balance: 0, // Will be updated from blockchain
  },
];

// Default wallet to use (dev1 for user, dev2 for distributor)
export const ACTIVE_WALLET = PHANTOM_WALLETS[0]; // dev1 (user)

// Helper function to get wallet by name
export const getWalletByName = (name: string): PhantomWallet | undefined => {
  return PHANTOM_WALLETS.find(wallet => wallet.name === name);
};

// Helper function to get wallet by public key
export const getWalletByPublicKey = (publicKey: string): PhantomWallet | undefined => {
  return PHANTOM_WALLETS.find(wallet => wallet.publicKey === publicKey);
};
