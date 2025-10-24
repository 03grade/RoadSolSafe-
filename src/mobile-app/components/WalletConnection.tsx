// Wallet Connection Component
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, Modal } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import walletService, { WalletInfo } from '../services/WalletService';
import { PHANTOM_WALLETS } from '../config/walletConfig';

interface WalletConnectionProps {
  onWalletConnected?: (wallet: WalletInfo) => void;
  onWalletDisconnected?: () => void;
}

const WalletConnection: React.FC<WalletConnectionProps> = ({
  onWalletConnected,
  onWalletDisconnected,
}) => {
  const { theme } = useTheme();
  const [wallet, setWallet] = useState<WalletInfo | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showWalletSelector, setShowWalletSelector] = useState(false);

  useEffect(() => {
    loadWallet();
  }, []);

  const loadWallet = async () => {
    try {
      setIsLoading(true);
      const existingWallet = await walletService.loadWallet();
      if (existingWallet) {
        setWallet(existingWallet);
        onWalletConnected?.(existingWallet);
      }
    } catch (error) {
      console.error('Error loading wallet:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const connectWallet = async () => {
    try {
      setIsConnecting(true);
      const newWallet = await walletService.connectWallet();
      setWallet(newWallet);
      onWalletConnected?.(newWallet);
      
      Alert.alert(
        'Wallet Connected!',
        `Connected to ${newWallet.walletName || 'Phantom'} wallet:\n${newWallet.publicKey.slice(0, 8)}...${newWallet.publicKey.slice(-8)}\n\nBalance: ${newWallet.balance.toFixed(4)} SOL`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error connecting wallet:', error);
      Alert.alert('Connection Failed', 'Failed to connect wallet. Please try again.');
    } finally {
      setIsConnecting(false);
    }
  };

  const switchWallet = async (walletName: string) => {
    try {
      setIsConnecting(true);
      const newWallet = await walletService.switchWallet(walletName);
      setWallet(newWallet);
      onWalletConnected?.(newWallet);
      setShowWalletSelector(false);
      
      Alert.alert(
        'Wallet Switched!',
        `Now using ${walletName}:\n${newWallet.publicKey.slice(0, 8)}...${newWallet.publicKey.slice(-8)}\n\nBalance: ${newWallet.balance.toFixed(4)} SOL`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error switching wallet:', error);
      Alert.alert('Switch Failed', 'Failed to switch wallet.');
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = async () => {
    try {
      await walletService.disconnectWallet();
      setWallet(null);
      onWalletDisconnected?.();
      
      Alert.alert('Wallet Disconnected', 'Your wallet has been disconnected.');
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
      Alert.alert('Disconnect Failed', 'Failed to disconnect wallet.');
    }
  };

  const requestAirdrop = async () => {
    try {
      if (!wallet) return;
      
      Alert.alert(
        'Request Airdrop',
        'Request 2 SOL from devnet? (This only works on devnet)',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Request',
            onPress: async () => {
              try {
                const signature = await walletService.requestAirdrop(2);
                await loadWallet(); // Refresh balance
                
                Alert.alert(
                  'Airdrop Received!',
                  `Transaction: ${signature.slice(0, 8)}...${signature.slice(-8)}`
                );
              } catch (error) {
                Alert.alert('Airdrop Failed', 'Failed to request airdrop. You may have already requested today.');
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error requesting airdrop:', error);
    }
  };

  const refreshBalance = async () => {
    try {
      if (!wallet) return;
      
      const newBalance = await walletService.updateBalance(wallet.publicKey);
      setWallet({ ...wallet, balance: newBalance });
    } catch (error) {
      console.error('Error refreshing balance:', error);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: theme === 'light' ? '#fff' : '#2d2d2d' }]}>
        <Text style={[styles.loadingText, { color: theme === 'light' ? '#000' : '#fff' }]}>
          Loading wallet...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme === 'light' ? '#fff' : '#2d2d2d' }]}>
      <Text style={[styles.title, { color: theme === 'light' ? '#000' : '#fff' }]}>
        Wallet Connection
      </Text>
      
      {wallet ? (
        <View style={styles.walletInfo}>
          <View style={styles.walletHeader}>
            <View style={[styles.statusDot, { backgroundColor: '#34C759' }]} />
            <Text style={[styles.statusText, { color: theme === 'light' ? '#000' : '#fff' }]}>
              Connected
            </Text>
          </View>
          
          <View style={styles.walletDetails}>
            <Text style={[styles.label, { color: theme === 'light' ? '#666' : '#aaa' }]}>
              Wallet:
            </Text>
            <Text style={[styles.walletName, { color: theme === 'light' ? '#000' : '#fff' }]}>
              {wallet.walletName || 'Phantom'} ({wallet.publicKey.slice(0, 8)}...{wallet.publicKey.slice(-8)})
            </Text>
            
            <Text style={[styles.label, { color: theme === 'light' ? '#666' : '#aaa' }]}>
              Balance:
            </Text>
            <Text style={[styles.balance, { color: theme === 'light' ? '#000' : '#fff' }]}>
              {wallet.balance.toFixed(4)} SOL (devnet)
            </Text>
          </View>
          
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.button, styles.refreshButton]}
              onPress={refreshBalance}
            >
              <Text style={styles.buttonText}>Refresh</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.button, styles.switchButton]}
              onPress={() => setShowWalletSelector(true)}
            >
              <Text style={styles.buttonText}>Switch</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.button, styles.airdropButton]}
              onPress={requestAirdrop}
            >
              <Text style={styles.buttonText}>Get SOL</Text>
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity
            style={[styles.button, styles.disconnectButton]}
            onPress={disconnectWallet}
          >
            <Text style={styles.buttonText}>Disconnect</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.connectSection}>
          <Text style={[styles.connectText, { color: theme === 'light' ? '#666' : '#aaa' }]}>
            Connect your wallet to start earning rewards
          </Text>
          
          <TouchableOpacity
            style={[styles.button, styles.connectButton]}
            onPress={connectWallet}
            disabled={isConnecting}
          >
            <Text style={styles.buttonText}>
              {isConnecting ? 'Connecting...' : 'Connect Wallet'}
            </Text>
          </TouchableOpacity>
          
          <Text style={[styles.noteText, { color: theme === 'light' ? '#999' : '#666' }]}>
            Note: Using your Phantom wallet addresses for development.
          </Text>
        </View>
      )}

      {/* Wallet Selector Modal */}
      <Modal
        visible={showWalletSelector}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowWalletSelector(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme === 'light' ? '#fff' : '#2d2d2d' }]}>
            <Text style={[styles.modalTitle, { color: theme === 'light' ? '#000' : '#fff' }]}>
              Select Phantom Wallet
            </Text>
            
            {PHANTOM_WALLETS.map((phantomWallet) => (
              <TouchableOpacity
                key={phantomWallet.name}
                style={[
                  styles.walletOption,
                  { backgroundColor: theme === 'light' ? '#f5f5f5' : '#3d3d3d' },
                  wallet?.walletName === phantomWallet.name && styles.selectedWallet
                ]}
                onPress={() => switchWallet(phantomWallet.name)}
                disabled={isConnecting}
              >
                <View style={styles.walletOptionContent}>
                  <Text style={[styles.walletOptionName, { color: theme === 'light' ? '#000' : '#fff' }]}>
                    {phantomWallet.name}
                  </Text>
                  <Text style={[styles.walletOptionAddress, { color: theme === 'light' ? '#666' : '#aaa' }]}>
                    {phantomWallet.publicKey.slice(0, 8)}...{phantomWallet.publicKey.slice(-8)}
                  </Text>
                </View>
                {wallet?.walletName === phantomWallet.name && (
                  <Text style={styles.selectedText}>✓</Text>
                )}
              </TouchableOpacity>
            ))}
            
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={() => setShowWalletSelector(false)}
            >
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    margin: 15,
    padding: 20,
    borderRadius: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  loadingText: {
    fontSize: 16,
    textAlign: 'center',
    padding: 20,
  },
  walletInfo: {
    gap: 15,
  },
  walletHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  statusText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  walletDetails: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
  },
  walletName: {
    fontSize: 16,
    fontFamily: 'monospace',
    backgroundColor: 'rgba(0,0,0,0.1)',
    padding: 8,
    borderRadius: 6,
  },
  balance: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  button: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    flex: 1,
  },
  connectButton: {
    backgroundColor: '#007AFF',
  },
  switchButton: {
    backgroundColor: '#5856D6',
  },
  airdropButton: {
    backgroundColor: '#FF9500',
  },
  disconnectButton: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  connectSection: {
    alignItems: 'center',
    gap: 15,
  },
  connectText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  noteText: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
    fontStyle: 'italic',
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxWidth: 400,
    borderRadius: 12,
    padding: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  walletOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  selectedWallet: {
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  walletOptionContent: {
    flex: 1,
  },
  walletOptionName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  walletOptionAddress: {
    fontSize: 14,
    marginTop: 2,
  },
  selectedText: {
    fontSize: 20,
    color: '#007AFF',
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: '#8E8E93',
    marginTop: 10,
  },
});

export default WalletConnection;
