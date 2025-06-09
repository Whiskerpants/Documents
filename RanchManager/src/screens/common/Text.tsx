import React from 'react';
import { Text as RNText, TextStyle, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/ThemeContext';

interface TextProps {
  children: React.ReactNode;
  style?: TextStyle;
}

export const Text: React.FC<TextProps> = ({ children, style }) => {
  const { colors } = useTheme();

  return (
    <RNText style={[styles.text, { color: colors.text }, style]}>
      {children}
    </RNText>
  );
};

const styles = StyleSheet.create({
  text: {
    fontSize: 16,
  },
}); 