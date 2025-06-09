import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
} from 'react-native';
import { useTheme } from '@react-navigation/native';
import { Text } from '../../components/common/Text';
import { Card } from '../../components/common/Card';
import { Icon } from '../../components/common/Icon';
import { Button } from '../../components/common/Button';
import { ContextualHelp } from '../../components/help/ContextualHelp';

interface Article {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  lastUpdated: Date;
}

interface Tutorial {
  id: string;
  title: string;
  description: string;
  steps: {
    id: string;
    title: string;
    description: string;
    target: string;
    position: 'top' | 'bottom' | 'left' | 'right';
  }[];
}

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
}

interface SupportTicket {
  id: string;
  subject: string;
  description: string;
  status: 'open' | 'in-progress' | 'resolved';
  priority: 'low' | 'medium' | 'high';
  createdAt: Date;
}

export const HelpCenter: React.FC = () => {
  const theme = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'knowledge' | 'tutorials' | 'faq' | 'support'>('knowledge');
  const [articles, setArticles] = useState<Article[]>([]);
  const [tutorials, setTutorials] = useState<Tutorial[]>([]);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [selectedTutorial, setSelectedTutorial] = useState<Tutorial | null>(null);
  const [isTutorialVisible, setIsTutorialVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    // TODO: Load data from API
    // For now, using mock data
    setArticles([
      {
        id: '1',
        title: 'Getting Started with Ranch Manager',
        content: 'Learn the basics of using Ranch Manager...',
        category: 'General',
        tags: ['beginner', 'setup'],
        lastUpdated: new Date(),
      },
      // Add more articles...
    ]);

    setTutorials([
      {
        id: '1',
        title: 'Setting Up Your First Herd',
        description: 'Learn how to add and manage your cattle inventory',
        steps: [
          {
            id: '1',
            title: 'Add New Cattle',
            description: 'Click the + button to add new cattle to your inventory',
            target: '#add-cattle-button',
            position: 'bottom',
          },
          // Add more steps...
        ],
      },
      // Add more tutorials...
    ]);

    setFaqs([
      {
        id: '1',
        question: 'How do I reset my password?',
        answer: 'To reset your password, click on the "Forgot Password" link...',
        category: 'Account',
      },
      // Add more FAQs...
    ]);

    setTickets([
      {
        id: '1',
        subject: 'Cannot sync data',
        description: 'The app is not syncing my cattle data...',
        status: 'open',
        priority: 'high',
        createdAt: new Date(),
      },
      // Add more tickets...
    ]);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    // TODO: Implement search functionality
  };

  const handleStartTutorial = (tutorial: Tutorial) => {
    setSelectedTutorial(tutorial);
    setCurrentStep(0);
    setIsTutorialVisible(true);
  };

  const handleTutorialComplete = () => {
    setIsTutorialVisible(false);
    setSelectedTutorial(null);
  };

  const handleSubmitTicket = () => {
    // TODO: Implement ticket submission
    Alert.alert('Success', 'Your support ticket has been submitted');
  };

  const renderKnowledgeBase = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Knowledge Base</Text>
      <FlatList
        data={articles}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Card style={styles.articleCard}>
            <Text style={styles.articleTitle}>{item.title}</Text>
            <Text style={styles.articleCategory}>{item.category}</Text>
            <Text style={styles.articleContent} numberOfLines={2}>
              {item.content}
            </Text>
            <View style={styles.articleFooter}>
              <Text style={styles.articleDate}>
                Last updated: {item.lastUpdated.toLocaleDateString()}
              </Text>
              <Button
                title="Read More"
                variant="secondary"
                onPress={() => {/* TODO: Navigate to article */}}
              />
            </View>
          </Card>
        )}
      />
    </View>
  );

  const renderTutorials = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Interactive Tutorials</Text>
      <FlatList
        data={tutorials}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Card style={styles.tutorialCard}>
            <Text style={styles.tutorialTitle}>{item.title}</Text>
            <Text style={styles.tutorialDescription}>{item.description}</Text>
            <Button
              title="Start Tutorial"
              variant="primary"
              onPress={() => handleStartTutorial(item)}
            />
          </Card>
        )}
      />
    </View>
  );

  const renderFAQ = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
      <FlatList
        data={faqs}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Card style={styles.faqCard}>
            <Text style={styles.faqQuestion}>{item.question}</Text>
            <Text style={styles.faqAnswer}>{item.answer}</Text>
            <Text style={styles.faqCategory}>{item.category}</Text>
          </Card>
        )}
      />
    </View>
  );

  const renderSupport = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Support Tickets</Text>
      <Card style={styles.ticketForm}>
        <Text style={styles.formTitle}>Submit a Support Ticket</Text>
        <TextInput
          style={styles.input}
          placeholder="Subject"
          placeholderTextColor="#666"
        />
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Describe your issue"
          placeholderTextColor="#666"
          multiline
          numberOfLines={4}
        />
        <Button
          title="Submit Ticket"
          variant="primary"
          onPress={handleSubmitTicket}
        />
      </Card>

      <Text style={styles.sectionSubtitle}>Recent Tickets</Text>
      <FlatList
        data={tickets}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Card style={styles.ticketCard}>
            <View style={styles.ticketHeader}>
              <Text style={styles.ticketSubject}>{item.subject}</Text>
              <Text
                style={[
                  styles.ticketStatus,
                  { color: getStatusColor(item.status) },
                ]}
              >
                {item.status}
              </Text>
            </View>
            <Text style={styles.ticketDescription}>{item.description}</Text>
            <View style={styles.ticketFooter}>
              <Text style={styles.ticketDate}>
                Created: {item.createdAt.toLocaleDateString()}
              </Text>
              <Text
                style={[
                  styles.ticketPriority,
                  { color: getPriorityColor(item.priority) },
                ]}
              >
                {item.priority} priority
              </Text>
            </View>
          </Card>
        )}
      />
    </View>
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return '#f44336';
      case 'in-progress':
        return '#ff9800';
      case 'resolved':
        return '#4caf50';
      default:
        return '#666';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return '#f44336';
      case 'medium':
        return '#ff9800';
      case 'low':
        return '#4caf50';
      default:
        return '#666';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Help Center</Text>
        <View style={styles.searchContainer}>
          <Icon name="search" size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search help articles..."
            value={searchQuery}
            onChangeText={handleSearch}
          />
        </View>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'knowledge' && styles.activeTab,
          ]}
          onPress={() => setActiveTab('knowledge')}
        >
          <Icon name="book" size={20} color={theme.colors.text} />
          <Text style={styles.tabText}>Knowledge Base</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'tutorials' && styles.activeTab]}
          onPress={() => setActiveTab('tutorials')}
        >
          <Icon name="school" size={20} color={theme.colors.text} />
          <Text style={styles.tabText}>Tutorials</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'faq' && styles.activeTab]}
          onPress={() => setActiveTab('faq')}
        >
          <Icon name="help" size={20} color={theme.colors.text} />
          <Text style={styles.tabText}>FAQ</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'support' && styles.activeTab]}
          onPress={() => setActiveTab('support')}
        >
          <Icon name="support" size={20} color={theme.colors.text} />
          <Text style={styles.tabText}>Support</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {activeTab === 'knowledge' && renderKnowledgeBase()}
        {activeTab === 'tutorials' && renderTutorials()}
        {activeTab === 'faq' && renderFAQ()}
        {activeTab === 'support' && renderSupport()}
      </ScrollView>

      {selectedTutorial && (
        <ContextualHelp
          steps={selectedTutorial.steps}
          isVisible={isTutorialVisible}
          onClose={() => setIsTutorialVisible(false)}
          onComplete={handleTutorialComplete}
          currentStep={currentStep}
          onStepChange={setCurrentStep}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 8,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    gap: 8,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  sectionSubtitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 24,
    marginBottom: 16,
  },
  articleCard: {
    marginBottom: 16,
    padding: 16,
  },
  articleTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  articleCategory: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  articleContent: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 16,
  },
  articleFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  articleDate: {
    fontSize: 14,
    color: '#666',
  },
  tutorialCard: {
    marginBottom: 16,
    padding: 16,
  },
  tutorialTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  tutorialDescription: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 16,
  },
  faqCard: {
    marginBottom: 16,
    padding: 16,
  },
  faqQuestion: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  faqAnswer: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 8,
  },
  faqCategory: {
    fontSize: 14,
    color: '#666',
  },
  ticketForm: {
    padding: 16,
    marginBottom: 24,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 4,
    padding: 8,
    marginBottom: 16,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  ticketCard: {
    marginBottom: 16,
    padding: 16,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  ticketSubject: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  ticketStatus: {
    fontSize: 14,
    fontWeight: '500',
  },
  ticketDescription: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 8,
  },
  ticketFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ticketDate: {
    fontSize: 14,
    color: '#666',
  },
  ticketPriority: {
    fontSize: 14,
    fontWeight: '500',
  },
}); 