import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet, Platform, TextStyle } from 'react-native';
import { Text } from '../../screens/common/Text';
import { Icon } from '../../screens/common/Icon';
import { useTheme } from '../../theme/ThemeContext';
import { UserExperienceService } from '../../services/userExperienceService';

interface VoiceInputProps {
  onResult: (text: string) => void;
  onError?: (error: Error) => void;
}

export const VoiceInput: React.FC<VoiceInputProps> = ({ onResult, onError }) => {
  const [isListening, setIsListening] = useState(false);
  const { colors } = useTheme();
  const uxService = UserExperienceService.getInstance();

  const startListening = async () => {
    try {
      setIsListening(true);
      await uxService.provideHapticFeedback('medium');

      // Initialize voice recognition
      if (Platform.OS === 'ios') {
        // Use iOS speech recognition
        const recognition = new (window as any).webkitSpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
          const text = event.results[0][0].transcript;
          onResult(text);
          setIsListening(false);
        };

        recognition.onerror = (event: any) => {
          onError?.(new Error(event.error));
          setIsListening(false);
        };

        recognition.start();
      } else if (Platform.OS === 'android') {
        // Use Android speech recognition
        const { SpeechRecognizer } = require('react-native-voice');
        const recognizer = new SpeechRecognizer();

        recognizer.onResult = (result: string) => {
          onResult(result);
          setIsListening(false);
        };

        recognizer.onError = (error: Error) => {
          onError?.(error);
          setIsListening(false);
        };

        await recognizer.start();
      }
    } catch (error) {
      onError?.(error as Error);
      setIsListening(false);
    }
  };

  const stopListening = () => {
    setIsListening(false);
    if (Platform.OS === 'ios') {
      const recognition = new (window as any).webkitSpeechRecognition();
      recognition.stop();
    } else if (Platform.OS === 'android') {
      const { SpeechRecognizer } = require('react-native-voice');
      const recognizer = new SpeechRecognizer();
      recognizer.stop();
    }
  };

  return (
    <TouchableOpacity
      onPress={isListening ? stopListening : startListening}
      style={[
        styles.container,
        { backgroundColor: isListening ? colors.error : colors.primary },
      ]}
    >
      <Icon
        name={isListening ? 'stop' : 'mic'}
        size={24}
        color={colors.background}
      />
      <Text style={{ ...styles.text, color: colors.background }}>
        {isListening ? 'Stop' : 'Start'} Voice Input
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    marginVertical: 8,
  },
  text: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
  } as TextStyle,
}); 