import React from 'react';
import { View, Text, StyleSheet, ViewProps } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface BadgeProps extends ViewProps {
  children: React.ReactNode;
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning';
  gradient?: string[];
}

export function Badge({ children, variant = 'default', gradient, style, ...props }: BadgeProps) {
  if (gradient) {
    return (
      <View style={[styles.badge, style]}>
        <LinearGradient
          colors={gradient as any}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          <Text style={styles.textGradient}>{children}</Text>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={[styles.badge, styles[`badge_${variant}`], style]} {...props}>
      <Text style={[styles.text, styles[`text_${variant}`]]}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
  },
  badge_default: {
    backgroundColor: '#f3f4f6',
  },
  badge_primary: {
    backgroundColor: '#fce7f3',
  },
  badge_secondary: {
    backgroundColor: '#e0e7ff',
  },
  badge_success: {
    backgroundColor: '#d1fae5',
  },
  badge_warning: {
    backgroundColor: '#fef3c7',
  },
  gradient: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'left',
  },
  text_default: {
    color: '#374151',
  },
  text_primary: {
    color: '#ec4899',
  },
  text_secondary: {
    color: '#4f46e5',
  },
  text_success: {
    color: '#059669',
  },
  text_warning: {
    color: '#d97706',
  },
  textGradient: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'left',
  },
});
