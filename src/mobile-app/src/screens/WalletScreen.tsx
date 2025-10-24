import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../styles/theme';
import { fonts } from '../styles/fonts';
import GradientText from '../components/GradientText';
import { DEV_WALLET } from '../config/devWallet';

const { width: screenWidth } = Dimensions.get('window');

export default function WalletScreen() {
  // Wallet connection state
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);

  // Sample wallet data
  const walletData = {
    usdtBalance: 47.32,
    totalEarned: 156.78,
    totalPoints: 1247,
    weeklyPoints: 89,
    weeklyRank: 23,
    rankChange: 5,
    nextClaimDate: 'Oct 25, 01:16 AM',
    daysLeft: 2,
    estimatedPayout: 12.50,
    currentPoints: 89,
  };

  // Sample transaction data
  const recentTransactions = [
    {
      id: '1',
      type: 'reward',
      amount: 5.25,
      description: 'Weekly USDT Claim',
      timestamp: '2024-01-15T10:30:00Z',
      status: 'completed',
      icon: 'gift' as const,
    },
    {
      id: '2',
      type: 'airdrop',
      amount: 12.50,
      description: 'Community Airdrop',
      timestamp: '2024-01-12T14:20:00Z',
      status: 'completed',
      icon: 'airplane' as const,
    },
    {
      id: '3',
      type: 'reward',
      amount: 3.80,
      description: 'Weekly USDT Claim',
      timestamp: '2024-01-08T10:30:00Z',
      status: 'completed',
      icon: 'gift' as const,
    },
    {
      id: '4',
      type: 'airdrop',
      amount: 8.75,
      description: 'Early Adopter Airdrop',
      timestamp: '2024-01-05T16:45:00Z',
      status: 'completed',
      icon: 'airplane' as const,
    },
    {
      id: '5',
      type: 'reward',
      amount: 4.20,
      description: 'Weekly USDT Claim',
      timestamp: '2024-01-01T10:30:00Z',
      status: 'completed',
      icon: 'gift' as const,
    },
  ];

  const copyAddress = async () => {
    try {
      // Best-effort copy support for web; native requires expo-clipboard or RN Clipboard.
      // Avoid adding deps here: provide graceful fallback.
      if (typeof navigator !== 'undefined' && (navigator as any).clipboard?.writeText && walletAddress) {
        await (navigator as any).clipboard.writeText(walletAddress);
        Alert.alert('Copied', 'Wallet address copied to clipboard');
      } else if (walletAddress) {
        Alert.alert('Wallet Address', walletAddress);
      }
    } catch (e) {
      Alert.alert('Copy Failed', 'Unable to copy the wallet address.');
    }
  };

  const formatTransactionDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  const getTransactionIconColor = (type) => {
    switch (type) {
      case 'reward':
        return theme.colors.success;
      case 'airdrop':
        return theme.colors.gold;
      default:
        return theme.colors.textSecondary;
    }
  };

  const connectDevWallet = async () => {
    // Dev-mode: set provided devnet wallet and mark as connected.
    setWalletAddress(DEV_WALLET.publicKey);
    setIsWalletConnected(true);
    Alert.alert(
      'Wallet Connected',
      `${DEV_WALLET.label} on ${DEV_WALLET.network} (token: ${DEV_WALLET.token})`,
    );
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingBottom: 32 }}>
      {/* Header */}
      <View style={styles.headerContent}>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Wallet</Text>
          <Text style={styles.headerSubtitle}>Manage your USDT rewards</Text>
        </View>
        <TouchableOpacity style={styles.headerRight} onPress={connectDevWallet}>
          <Ionicons name="wallet" size={24} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      {/* USDT Balance Section */}
      <View style={styles.balanceCard}>
        <View style={styles.balanceHeader}>
          <View style={styles.balanceIcon}>
            <Text style={styles.usdtSymbol}>₮</Text>
          </View>
          <Text style={styles.balanceLabel}>
            {isWalletConnected ? `${DEV_WALLET.token} Balance` : 'Connect Wallet'}
          </Text>
          <TouchableOpacity style={styles.copyButton} onPress={copyAddress}>
            <Ionicons name="copy-outline" size={16} color="#FFFFFF" />
            <Text style={styles.copyText}>Copy Address</Text>
          </TouchableOpacity>
        </View>
        
        <GradientText
          colors={['#1E90FF', '#00D4FF', '#1E90FF']}
          style={{alignSelf: 'flex-start'}}
          textStyle={styles.balanceAmount}
        >
          {walletData.usdtBalance.toFixed(2)} {isWalletConnected ? DEV_WALLET.token : 'USDT'}
        </GradientText>
        <Text style={styles.totalEarned}>
          {isWalletConnected
            ? `Network: ${DEV_WALLET.network}  •  Token: ${DEV_WALLET.token}`
            : `Total earned: ${walletData.totalEarned.toFixed(2)} USDT`}
        </Text>
        {isWalletConnected && (
          <Text style={styles.totalEarned}>
            Address: {walletAddress?.slice(0, 4)}...{walletAddress?.slice(-4)}
          </Text>
        )}
      </View>

      {/* Points and Rank Row */}
      <View style={styles.statsRow}>
        {/* Total Points */}
        <View style={styles.statCard}>
          <View style={styles.statIcon}>
            <Ionicons name="eye" size={20} color={theme.colors.primary} />
          </View>
          <Text style={styles.statLabel}>Total Points</Text>
          <Text style={styles.statValue}>{walletData.totalPoints.toLocaleString()}</Text>
          <Text style={styles.statSubtext}>+{walletData.weeklyPoints} this week</Text>
        </View>

        {/* Weekly Rank */}
        <View style={styles.statCard}>
          <View style={styles.statIcon}>
            <Ionicons name="trophy" size={20} color="#FFD700" />
          </View>
          <Text style={styles.statLabel}>Weekly Rank</Text>
          <Text style={styles.statValue}>#{walletData.weeklyRank}</Text>
          <View style={styles.rankChange}>
            <Ionicons name="trending-up" size={12} color="#00D4FF" />
            <Text style={styles.rankChangeText}>+{walletData.rankChange} from last week</Text>
          </View>
        </View>
      </View>

      {/* Next USDT Claim Section */}
      <View style={styles.claimCard}>
        <View style={styles.claimHeader}>
          <View style={styles.claimIcon}>
            <Ionicons name="time" size={20} color={theme.colors.primary} />
          </View>
          <Text style={styles.claimLabel}>Next USDT Claim</Text>
          <Text style={styles.daysLeft}>{walletData.daysLeft} days left</Text>
        </View>
        
        <Text style={styles.claimDate}>Weekly epoch closes {walletData.nextClaimDate}</Text>
        
        <View style={styles.claimDetails}>
          <View style={styles.claimRow}>
            <Text style={styles.claimDetailLabel}>Estimated payout</Text>
            <Text style={styles.claimDetailValue}>~{walletData.estimatedPayout.toFixed(2)} USDT</Text>
          </View>
          
          <View style={styles.claimRow}>
            <Text style={styles.claimDetailLabel}>Based on current points</Text>
            <Text style={styles.claimDetailValue}>{walletData.currentPoints} pts</Text>
          </View>
        </View>
        
        <TouchableOpacity style={styles.claimButton} disabled>
          <Text style={styles.claimButtonText}>Claim available in {walletData.daysLeft} days</Text>
        </TouchableOpacity>
      </View>

      {/* Recent Transactions Section */}
      <View style={styles.transactionsCard}>
        <View style={styles.transactionsHeader}>
          <Text style={styles.transactionsTitle}>Recent Transactions</Text>
          <TouchableOpacity>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.transactionsList}>
          {recentTransactions.map((transaction) => (
            <View key={transaction.id} style={styles.transactionItem}>
              <View style={styles.transactionLeft}>
                <View style={styles.transactionIconContainer}>
                  <Ionicons 
                    name={transaction.icon} 
                    size={20} 
                    color={getTransactionIconColor(transaction.type)} 
                  />
                </View>
                <View style={styles.transactionDetails}>
                  <Text style={styles.transactionDescription}>{transaction.description}</Text>
                  <Text style={styles.transactionDate}>{formatTransactionDate(transaction.timestamp)}</Text>
                </View>
              </View>
              
              <View style={styles.transactionRight}>
                <Text style={[
                  styles.transactionAmount,
                  { color: transaction.amount >= 0 ? theme.colors.success : theme.colors.error }
                ]}>
                  {transaction.amount >= 0 ? '+' : ''}{transaction.amount.toFixed(2)} USDT
                </Text>
                <Text style={styles.transactionStatus}>{transaction.status}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: theme.spacing.xl,
    paddingHorizontal: theme.spacing.lg,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerRight: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.sm,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  headerTitle: {
    fontSize: theme.typography.fontSize['3xl'],
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  headerSubtitle: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  balanceCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: theme.spacing.lg,
    marginHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  balanceIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.sm,
  },
  usdtSymbol: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  balanceLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: 8,
  },
  copyText: {
    fontSize: 12,
    color: '#FFFFFF',
    marginLeft: 4,
  },
  balanceAmount: {
    fontSize: 32,
    lineHeight: 36,
    fontWeight: 'bold',
    textAlign: 'left',
    marginBottom: theme.spacing.xs,
  },
  totalEarned: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: theme.spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 212, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.sm,
  },
  statLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: theme.spacing.xs,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: theme.spacing.xs,
  },
  statSubtext: {
    fontSize: 12,
    color: theme.colors.primary,
  },
  rankChange: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rankChangeText: {
    fontSize: 12,
    color: theme.colors.primary,
    marginLeft: 4,
  },
  claimCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: theme.spacing.lg,
    marginHorizontal: theme.spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  claimHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  claimIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 212, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.sm,
  },
  claimLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  daysLeft: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.warning,
  },
  claimDate: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: theme.spacing.lg,
  },
  claimDetails: {
    marginBottom: theme.spacing.lg,
  },
  claimRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  claimDetailLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  claimDetailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  claimButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
  },
  claimButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.6)',
  },
  
  // Recent Transactions styles
  transactionsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: theme.spacing.lg,
    marginHorizontal: theme.spacing.lg,
    marginTop: theme.spacing.xl,
    marginBottom: theme.spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  transactionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  transactionsTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  viewAllText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.primary,
    fontWeight: '500',
  },
  transactionsList: {
    gap: theme.spacing.md,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.sm,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  transactionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionDescription: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: '500',
    color: theme.colors.text,
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  transactionStatus: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.textSecondary,
    textTransform: 'capitalize',
  },
});
