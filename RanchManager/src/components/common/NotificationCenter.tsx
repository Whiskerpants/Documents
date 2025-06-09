import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Platform,
  ViewStyle,
} from 'react-native';
import { useTheme } from '@react-navigation/native';
import { Text } from './Text';
import { Button } from './Button';
import { Card } from './Card';
import { Icon } from './Icon';
import { NotificationService, Notification, NotificationGroup, NotificationPreferences } from '../../services/NotificationService';
import { formatDate } from '../../utils/formatUtils';

interface NotificationCenterProps {
  visible: boolean;
  onClose: () => void;
  onNotificationPress?: (notification: Notification) => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  visible,
  onClose,
  onNotificationPress,
}) => {
  const theme = useTheme();
  const notificationService = NotificationService.getInstance();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [groups, setGroups] = useState<NotificationGroup[]>([]);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [showPreferences, setShowPreferences] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const slideAnim = new Animated.Value(visible ? 0 : -300);

  useEffect(() => {
    if (visible) {
      loadData();
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: -300,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const loadData = async () => {
    try {
      const [notifs, notifGroups] = await Promise.all([
        notificationService.getNotifications(),
        notificationService.getNotificationGroups(),
      ]);
      setNotifications(notifs);
      setGroups(notifGroups);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const handleNotificationPress = async (notification: Notification) => {
    if (!notification.read) {
      await notificationService.markAsRead(notification.id);
    }
    if (onNotificationPress) {
      onNotificationPress(notification);
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    try {
      await notificationService.deleteNotification(notificationId);
      setNotifications((prev) =>
        prev.filter((n) => n.id !== notificationId)
      );
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const handleUpdatePreferences = async (
    newPreferences: Partial<NotificationPreferences>
  ) => {
    try {
      await notificationService.updatePreferences(newPreferences);
      setPreferences((prev) => ({ ...prev, ...newPreferences }));
    } catch (error) {
      console.error('Error updating preferences:', error);
    }
  };

  const renderNotificationItem = (notification: Notification) => (
    <Card
      key={notification.id}
      style={[
        styles.notificationItem,
        !notification.read ? styles.unreadNotification : undefined,
      ] as any}
    >
      <TouchableOpacity
        style={styles.notificationContent}
        onPress={() => handleNotificationPress(notification)}
      >
        <View style={styles.notificationHeader}>
          <View style={styles.notificationTitle}>
            <Icon
              name={getCategoryIcon(notification.category)}
              size={20}
              color={theme.colors.primary}
            />
            <Text style={styles.notificationTitleText}>
              {notification.title}
            </Text>
          </View>
          <Text style={styles.notificationTime}>
            {formatDate(notification.timestamp)}
          </Text>
        </View>

        <Text style={styles.notificationBody}>{notification.body}</Text>

        {notification.action && (
          <Button
            title={getActionButtonTitle(notification.action.type)}
            onPress={() => handleNotificationPress(notification)}
            variant="secondary"
            style={styles.actionButton}
          />
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDeleteNotification(notification.id)}
      >
        <Icon name="delete" size={20} color={theme.colors.notification} />
      </TouchableOpacity>
    </Card>
  );

  const renderPreferences = () => (
    <Card style={styles.preferencesCard}>
      <Text style={styles.sectionTitle}>Notification Settings</Text>

      <View style={styles.preferenceSection}>
        <Text style={styles.preferenceLabel}>Push Notifications</Text>
        <View style={styles.preferenceOptions}>
          <TouchableOpacity
            style={[
              styles.preferenceToggle,
              preferences?.push.enabled && styles.preferenceEnabled,
            ]}
            onPress={() =>
              handleUpdatePreferences({
                push: { ...preferences?.push, enabled: !preferences?.push.enabled },
              })
            }
          >
            <Text>{preferences?.push.enabled ? 'Enabled' : 'Disabled'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.preferenceSection}>
        <Text style={styles.preferenceLabel}>Email Notifications</Text>
        <View style={styles.preferenceOptions}>
          <TouchableOpacity
            style={[
              styles.preferenceToggle,
              preferences?.email.enabled && styles.preferenceEnabled,
            ]}
            onPress={() =>
              handleUpdatePreferences({
                email: { ...preferences?.email, enabled: !preferences?.email.enabled },
              })
            }
          >
            <Text>{preferences?.email.enabled ? 'Enabled' : 'Disabled'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.preferenceSection}>
        <Text style={styles.preferenceLabel}>In-App Notifications</Text>
        <View style={styles.preferenceOptions}>
          <TouchableOpacity
            style={[
              styles.preferenceToggle,
              preferences?.inApp.enabled && styles.preferenceEnabled,
            ]}
            onPress={() =>
              handleUpdatePreferences({
                inApp: { ...preferences?.inApp, enabled: !preferences?.inApp.enabled },
              })
            }
          >
            <Text>{preferences?.inApp.enabled ? 'Enabled' : 'Disabled'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.preferenceSection}>
        <Text style={styles.preferenceLabel}>Scheduled Reminders</Text>
        <View style={styles.preferenceOptions}>
          <TouchableOpacity
            style={[
              styles.preferenceToggle,
              preferences?.scheduled.enabled && styles.preferenceEnabled,
            ]}
            onPress={() =>
              handleUpdatePreferences({
                scheduled: {
                  ...preferences?.scheduled,
                  enabled: !preferences?.scheduled.enabled,
                },
              })
            }
          >
            <Text>{preferences?.scheduled.enabled ? 'Enabled' : 'Disabled'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Card>
  );

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateX: slideAnim }],
        },
      ]}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Notifications</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.preferencesButton}
            onPress={() => setShowPreferences(!showPreferences)}
          >
            <Icon
              name={showPreferences ? 'settings' : 'settings-outline'}
              size={24}
              color={theme.colors.primary}
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Icon name="close" size={24} color={theme.colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content}>
        {showPreferences ? (
          renderPreferences()
        ) : (
          <>
            <View style={styles.categoryFilters}>
              <TouchableOpacity
                style={[
                  styles.categoryButton,
                  !selectedCategory && styles.selectedCategory,
                ]}
                onPress={() => setSelectedCategory(null)}
              >
                <Text>All</Text>
              </TouchableOpacity>
              {groups.map((group) => (
                <TouchableOpacity
                  key={group.id}
                  style={[
                    styles.categoryButton,
                    selectedCategory === group.category && styles.selectedCategory,
                  ]}
                  onPress={() => setSelectedCategory(group.category)}
                >
                  <Text>{group.category}</Text>
                  {group.unreadCount > 0 && (
                    <View style={styles.unreadBadge}>
                      <Text style={styles.unreadCount}>
                        {group.unreadCount}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {notifications
              .filter(
                (n) => !selectedCategory || n.category === selectedCategory
              )
              .map(renderNotificationItem)}
          </>
        )}
      </ScrollView>
    </Animated.View>
  );
};

const getCategoryIcon = (category: string): string => {
  switch (category) {
    case 'financial':
      return 'attach-money';
    case 'inventory':
      return 'inventory';
    case 'health':
      return 'favorite';
    case 'maintenance':
      return 'build';
    case 'security':
      return 'security';
    case 'system':
      return 'settings';
    default:
      return 'notifications';
  }
};

const getActionButtonTitle = (actionType: string): string => {
  switch (actionType) {
    case 'view':
      return 'View Details';
    case 'approve':
      return 'Approve';
    case 'reject':
      return 'Reject';
    default:
      return 'Take Action';
  }
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: 300,
    backgroundColor: '#fff',
    borderRightWidth: 1,
    borderRightColor: '#e0e0e0',
    zIndex: 1000,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  preferencesButton: {
    marginRight: 16,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  categoryFilters: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  categoryButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    backgroundColor: '#f0f0f0',
  },
  selectedCategory: {
    backgroundColor: '#007AFF',
  },
  unreadBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadCount: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  notificationItem: {
    margin: 8,
    padding: 0,
  },
  unreadNotification: {
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  notificationContent: {
    padding: 16,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  notificationTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  notificationTitleText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  notificationTime: {
    fontSize: 12,
    color: '#666',
  },
  notificationBody: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
  },
  actionButton: {
    alignSelf: 'flex-start',
  },
  deleteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    padding: 4,
  },
  preferencesCard: {
    margin: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  preferenceSection: {
    marginBottom: 16,
  },
  preferenceLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  preferenceOptions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  preferenceToggle: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
    backgroundColor: '#f0f0f0',
  },
  preferenceEnabled: {
    backgroundColor: '#007AFF',
  },
}); 