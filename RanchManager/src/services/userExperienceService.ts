import { Platform } from 'react-native';
import * as Speech from 'expo-speech';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { i18n } from '../i18n';
import { ThemeColors } from '../theme/ThemeContext';

export interface TutorialStep {
  id: string;
  title: string;
  description: string;
  target: string;
  position: 'top' | 'bottom' | 'left' | 'right';
  order: number;
}

export interface HelpContent {
  id: string;
  title: string;
  content: string;
  keywords: string[];
  relatedTopics: string[];
}

export interface AccessibilitySettings {
  fontSize: number;
  highContrast: boolean;
  screenReader: boolean;
  reducedMotion: boolean;
  voiceInput: boolean;
}

export class UserExperienceService {
  private static instance: UserExperienceService;
  private readonly TUTORIAL_COMPLETED_KEY = 'tutorial_completed';
  private readonly ACCESSIBILITY_SETTINGS_KEY = 'accessibility_settings';

  private constructor() {}

  static getInstance(): UserExperienceService {
    if (!UserExperienceService.instance) {
      UserExperienceService.instance = new UserExperienceService();
    }
    return UserExperienceService.instance;
  }

  // Onboarding Tutorial
  async getTutorialSteps(): Promise<TutorialStep[]> {
    return [
      {
        id: 'welcome',
        title: i18n.t('tutorial.welcome.title'),
        description: i18n.t('tutorial.welcome.description'),
        target: 'dashboard',
        position: 'bottom',
        order: 1,
      },
      {
        id: 'transactions',
        title: i18n.t('tutorial.transactions.title'),
        description: i18n.t('tutorial.transactions.description'),
        target: 'transactions_tab',
        position: 'right',
        order: 2,
      },
      {
        id: 'budgets',
        title: i18n.t('tutorial.budgets.title'),
        description: i18n.t('tutorial.budgets.description'),
        target: 'budgets_tab',
        position: 'right',
        order: 3,
      },
      {
        id: 'reports',
        title: i18n.t('tutorial.reports.title'),
        description: i18n.t('tutorial.reports.description'),
        target: 'reports_tab',
        position: 'right',
        order: 4,
      },
      {
        id: 'voice_input',
        title: i18n.t('tutorial.voice_input.title'),
        description: i18n.t('tutorial.voice_input.description'),
        target: 'voice_input_button',
        position: 'top',
        order: 5,
      },
    ];
  }

  async markTutorialComplete(): Promise<void> {
    try {
      await AsyncStorage.setItem(this.TUTORIAL_COMPLETED_KEY, 'true');
    } catch (error) {
      console.error('Error marking tutorial complete:', error);
    }
  }

  async isTutorialCompleted(): Promise<boolean> {
    try {
      const completed = await AsyncStorage.getItem(this.TUTORIAL_COMPLETED_KEY);
      return completed === 'true';
    } catch (error) {
      console.error('Error checking tutorial status:', error);
      return false;
    }
  }

  // Help System
  async getHelpContent(topic: string): Promise<HelpContent[]> {
    const helpContent: Record<string, HelpContent[]> = {
      'transactions': [
        {
          id: 'transaction_basics',
          title: i18n.t('help.transactions.basics.title'),
          content: i18n.t('help.transactions.basics.content'),
          keywords: ['transaction', 'entry', 'record', 'expense', 'income'],
          relatedTopics: ['categories', 'reports'],
        },
        {
          id: 'transaction_categories',
          title: i18n.t('help.transactions.categories.title'),
          content: i18n.t('help.transactions.categories.content'),
          keywords: ['category', 'classification', 'organization'],
          relatedTopics: ['transactions', 'reports'],
        },
      ],
      'budgets': [
        {
          id: 'budget_basics',
          title: i18n.t('help.budgets.basics.title'),
          content: i18n.t('help.budgets.basics.content'),
          keywords: ['budget', 'planning', 'forecast'],
          relatedTopics: ['transactions', 'reports'],
        },
      ],
      'reports': [
        {
          id: 'report_basics',
          title: i18n.t('help.reports.basics.title'),
          content: i18n.t('help.reports.basics.content'),
          keywords: ['report', 'analysis', 'summary'],
          relatedTopics: ['transactions', 'budgets'],
        },
      ],
    };

    return helpContent[topic] || [];
  }

  // Voice Input
  async startVoiceInput(): Promise<void> {
    try {
      // Check if speech recognition is available
      const isAvailable = await Speech.isAvailableAsync();
      if (!isAvailable) {
        throw new Error('Speech recognition is not available on this device');
      }

      // Initialize voice recognition
      // Implementation depends on the specific voice recognition library used
    } catch (error) {
      console.error('Error starting voice input:', error);
      throw error;
    }
  }

  // Accessibility
  async getAccessibilitySettings(): Promise<AccessibilitySettings> {
    try {
      const settings = await AsyncStorage.getItem(this.ACCESSIBILITY_SETTINGS_KEY);
      return settings ? JSON.parse(settings) : this.getDefaultAccessibilitySettings();
    } catch (error) {
      console.error('Error getting accessibility settings:', error);
      return this.getDefaultAccessibilitySettings();
    }
  }

  async updateAccessibilitySettings(settings: Partial<AccessibilitySettings>): Promise<void> {
    try {
      const currentSettings = await this.getAccessibilitySettings();
      const newSettings = { ...currentSettings, ...settings };
      await AsyncStorage.setItem(
        this.ACCESSIBILITY_SETTINGS_KEY,
        JSON.stringify(newSettings)
      );
    } catch (error) {
      console.error('Error updating accessibility settings:', error);
      throw error;
    }
  }

  private getDefaultAccessibilitySettings(): AccessibilitySettings {
    return {
      fontSize: 16,
      highContrast: false,
      screenReader: false,
      reducedMotion: false,
      voiceInput: false,
    };
  }

  // Haptic Feedback
  async provideHapticFeedback(type: 'light' | 'medium' | 'heavy'): Promise<void> {
    try {
      switch (type) {
        case 'light':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          break;
        case 'medium':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          break;
        case 'heavy':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          break;
      }
    } catch (error) {
      console.error('Error providing haptic feedback:', error);
    }
  }

  // Theme Support
  getAccessibleColors(colors: ThemeColors, highContrast: boolean): ThemeColors {
    if (!highContrast) return colors;

    return {
      ...colors,
      text: '#000000',
      background: '#FFFFFF',
      primary: '#0000FF',
      error: '#FF0000',
      success: '#008000',
      warning: '#FFA500',
      border: '#000000',
      card: '#FFFFFF',
      notification: '#FF0000',
    };
  }
} 