import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  TouchableOpacityProps,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface ButtonProps extends TouchableOpacityProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'small' | 'medium' | 'large';
  gradient?: readonly [string, string, ...string[]];
}

export function Button({
  children,
  variant = 'primary',
  size = 'medium',
  gradient,
  style,
  ...props
}: ButtonProps) {
  const buttonStyles = [
    styles.button,
    styles[`button_${size}`],
    variant === 'outline' && styles.buttonOutline,
    variant === 'secondary' && styles.buttonSecondary,
    style,
  ];

  const textStyles = [
    styles.text,
    styles[`text_${size}`],
    variant === 'outline' && styles.textOutline,
    variant === 'secondary' && styles.textSecondary,
  ];

  if (variant === 'primary' && gradient) {
    return (
      <TouchableOpacity {...props} style={[buttonStyles, { overflow: 'hidden' }]}>
        <LinearGradient
          colors={gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          <Text style={textStyles}>{children}</Text>
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity {...props} style={buttonStyles}>
      <Text style={textStyles}>{children}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },

  button_small: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },

  button_medium: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },

  button_large: {
    paddingVertical: 16,
    paddingHorizontal: 32,
  },

  buttonSecondary: {
    backgroundColor: '#f3f4f6',
  },

  buttonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#ec4899',
  },

gradient: {
  flex: 1,
  width: '100%',
  borderRadius: 16,
  justifyContent: 'center',
  alignItems: 'center',
},

  text: {
    fontWeight: '600',
    color: '#ffffff',
  },

  text_small: {
    fontSize: 14,
  },

  text_medium: {
    fontSize: 16,
  },

  text_large: {
    fontSize: 18,
  },

  textSecondary: {
    color: '#374151',
  },

  textOutline: {
    color: '#ec4899',
  },
});