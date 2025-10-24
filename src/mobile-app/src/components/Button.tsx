import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../styles/theme';
import { fonts } from '../styles/fonts';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  style,
  textStyle,
}) => {
  const getButtonStyle = () => {
    const baseStyle = [styles.button, styles[`button_${size}`]];
    
    if (variant === 'primary') {
      return [...baseStyle, styles.buttonPrimary];
    } else if (variant === 'secondary') {
      return [...baseStyle, styles.buttonSecondary];
    } else if (variant === 'success') {
      return [...baseStyle, styles.buttonSuccess];
    } else if (variant === 'warning') {
      return [...baseStyle, styles.buttonWarning];
    } else if (variant === 'error') {
      return [...baseStyle, styles.buttonError];
    }
    
    return baseStyle;
  };

  const getTextStyle = () => {
    const baseStyle = [styles.buttonText, styles[`buttonText_${size}`]];
    
    if (variant === 'primary') {
      return [...baseStyle, styles.buttonTextPrimary];
    } else if (variant === 'secondary') {
      return [...baseStyle, styles.buttonTextSecondary];
    } else if (variant === 'success') {
      return [...baseStyle, styles.buttonTextSuccess];
    } else if (variant === 'warning') {
      return [...baseStyle, styles.buttonTextWarning];
    } else if (variant === 'error') {
      return [...baseStyle, styles.buttonTextError];
    }
    
    return baseStyle;
  };

  const ButtonContent = () => (
    <View style={styles.buttonContent}>
      {loading ? (
        <ActivityIndicator 
          size="small" 
          color={variant === 'secondary' ? theme.colors.text : '#FFFFFF'} 
        />
      ) : (
        <>
          {icon && (
            <Ionicons 
              name={icon} 
              size={size === 'sm' ? 16 : size === 'lg' ? 24 : 20} 
              color={variant === 'secondary' ? theme.colors.text : '#FFFFFF'}
              style={styles.buttonIcon}
            />
          )}
          <Text style={[...getTextStyle(), textStyle]}>{title}</Text>
        </>
      )}
    </View>
  );

  if (variant === 'primary') {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled || loading}
        style={[getButtonStyle(), disabled && styles.buttonDisabled, style]}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={['#1E90FF', '#0066CC']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientButton}
        >
          <ButtonContent />
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[getButtonStyle(), disabled && styles.buttonDisabled, style]}
      activeOpacity={0.8}
    >
      <ButtonContent />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.md,
  },
  button_sm: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    minHeight: 36,
  },
  button_md: {
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    minHeight: 44,
  },
  button_lg: {
    paddingHorizontal: theme.spacing['2xl'],
    paddingVertical: theme.spacing.lg,
    minHeight: 52,
  },
  buttonPrimary: {
    backgroundColor: theme.colors.primary,
  },
  buttonSecondary: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  buttonSuccess: {
    backgroundColor: theme.colors.success,
  },
  buttonWarning: {
    backgroundColor: theme.colors.warning,
  },
  buttonError: {
    backgroundColor: theme.colors.error,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  gradientButton: {
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonIcon: {
    marginRight: theme.spacing.sm,
  },
  buttonText: {
    ...fonts.button,
    textAlign: 'center',
  },
  buttonText_sm: {
    ...fonts.bodySmall,
  },
  buttonText_md: {
    ...fonts.button,
  },
  buttonText_lg: {
    ...fonts.buttonLarge,
  },
  buttonTextPrimary: {
    color: '#FFFFFF',
  },
  buttonTextSecondary: {
    color: theme.colors.text,
  },
  buttonTextSuccess: {
    color: '#FFFFFF',
  },
  buttonTextWarning: {
    color: '#FFFFFF',
  },
  buttonTextError: {
    color: '#FFFFFF',
  },
});
