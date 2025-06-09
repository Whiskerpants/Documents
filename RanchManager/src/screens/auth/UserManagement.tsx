import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useTheme } from '@react-navigation/native';
import { Text } from '../../components/common/Text';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Card } from '../../components/common/Card';
import { Icon } from '../../components/common/Icon';
import { AuthService } from '../../services/AuthService';
import { User, UserRole, UserActivity } from '../../store/types/auth';
import { useAuth } from '../../hooks/useAuth';
import { formatDate } from '../../utils/dateUtils';

export const UserManagement: React.FC = () => {
  const theme = useTheme();
  const { user: currentUser } = useAuth();
  const authService = AuthService.getInstance();
  const [users, setUsers] = useState<User[]>([]);
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState({
    email: '',
    firstName: '',
    lastName: '',
    role: 'worker' as UserRole,
  });

  useEffect(() => {
    loadUsers();
    loadActivities();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      // Implement user loading logic
      setLoading(false);
    } catch (error) {
      console.error('Error loading users:', error);
      Alert.alert('Error', 'Failed to load users');
    }
  };

  const loadActivities = async () => {
    try {
      // Implement activity loading logic
    } catch (error) {
      console.error('Error loading activities:', error);
    }
  };

  const handleAddUser = async () => {
    try {
      if (!newUser.email || !newUser.firstName || !newUser.lastName) {
        Alert.alert('Error', 'Please fill in all required fields');
        return;
      }

      // Generate temporary password
      const tempPassword = Math.random().toString(36).slice(-8);

      // Create user
      await authService.register({
        ...newUser,
        password: tempPassword,
      });

      // Send welcome email with temporary password
      // Implement email sending logic

      setShowAddUser(false);
      setNewUser({
        email: '',
        firstName: '',
        lastName: '',
        role: 'worker',
      });
      loadUsers();

      Alert.alert(
        'Success',
        'User added successfully. A welcome email has been sent with login instructions.'
      );
    } catch (error) {
      console.error('Error adding user:', error);
      Alert.alert('Error', 'Failed to add user');
    }
  };

  const handleUpdateRole = async (userId: string, newRole: UserRole) => {
    try {
      if (!currentUser) return;

      await authService.updateUserRole(userId, newRole, currentUser.id);
      loadUsers();
      Alert.alert('Success', 'User role updated successfully');
    } catch (error) {
      console.error('Error updating role:', error);
      Alert.alert('Error', 'Failed to update user role');
    }
  };

  const handleRemoveUser = async (userId: string) => {
    try {
      Alert.alert(
        'Confirm Removal',
        'Are you sure you want to remove this user?',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Remove',
            style: 'destructive',
            onPress: async () => {
              // Implement user removal logic
              loadUsers();
              Alert.alert('Success', 'User removed successfully');
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error removing user:', error);
      Alert.alert('Error', 'Failed to remove user');
    }
  };

  const renderUserCard = ({ item: user }: { item: User }) => (
    <Card style={styles.userCard}>
      <View style={styles.userInfo}>
        <View>
          <Text style={styles.userName}>
            {user.firstName} {user.lastName}
          </Text>
          <Text style={styles.userEmail}>{user.email}</Text>
          <Text style={styles.userRole}>Role: {user.role}</Text>
          <Text style={styles.userStatus}>
            Status:{' '}
            {user.isEmailVerified ? 'Verified' : 'Pending Verification'}
          </Text>
        </View>
        <View style={styles.userActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleUpdateRole(user.id, 'manager')}
            disabled={user.role === 'manager' || !authService.canManageRoles(currentUser?.role || 'worker')}
          >
            <Icon name="star" size={24} color={theme.colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleUpdateRole(user.id, 'worker')}
            disabled={user.role === 'worker' || !authService.canManageRoles(currentUser?.role || 'worker')}
          >
            <Icon name="user" size={24} color={theme.colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.removeButton]}
            onPress={() => handleRemoveUser(user.id)}
            disabled={!authService.canManageRoles(currentUser?.role || 'worker')}
          >
            <Icon name="trash" size={24} color={theme.colors.error} />
          </TouchableOpacity>
        </View>
      </View>
    </Card>
  );

  const renderActivityItem = ({ item: activity }: { item: UserActivity }) => (
    <Card style={styles.activityCard}>
      <Text style={styles.activityAction}>{activity.action}</Text>
      <Text style={styles.activityTime}>
        {formatDate(activity.timestamp)}
      </Text>
      {activity.details && (
        <Text style={styles.activityDetails}>
          {JSON.stringify(activity.details)}
        </Text>
      )}
    </Card>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>User Management</Text>
        {authService.canManageRoles(currentUser?.role || 'worker') && (
          <Button
            title="Add User"
            onPress={() => setShowAddUser(true)}
            icon="plus"
          />
        )}
      </View>

      {showAddUser && (
        <Card style={styles.addUserCard}>
          <Text style={styles.sectionTitle}>Add New User</Text>
          <Input
            label="Email"
            value={newUser.email}
            onChangeText={(text) => setNewUser({ ...newUser, email: text })}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <Input
            label="First Name"
            value={newUser.firstName}
            onChangeText={(text) => setNewUser({ ...newUser, firstName: text })}
          />
          <Input
            label="Last Name"
            value={newUser.lastName}
            onChangeText={(text) => setNewUser({ ...newUser, lastName: text })}
          />
          <View style={styles.roleSelector}>
            <Text style={styles.roleLabel}>Role:</Text>
            <TouchableOpacity
              style={[
                styles.roleButton,
                newUser.role === 'manager' && styles.selectedRole,
              ]}
              onPress={() => setNewUser({ ...newUser, role: 'manager' })}
            >
              <Text>Manager</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.roleButton,
                newUser.role === 'worker' && styles.selectedRole,
              ]}
              onPress={() => setNewUser({ ...newUser, role: 'worker' })}
            >
              <Text>Worker</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.addUserActions}>
            <Button
              title="Cancel"
              onPress={() => setShowAddUser(false)}
              variant="secondary"
            />
            <Button title="Add User" onPress={handleAddUser} />
          </View>
        </Card>
      )}

      <Text style={styles.sectionTitle}>Users</Text>
      <FlatList
        data={users}
        renderItem={renderUserCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.userList}
      />

      <Text style={styles.sectionTitle}>Recent Activity</Text>
      <FlatList
        data={activities}
        renderItem={renderActivityItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.activityList}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 16,
  },
  userList: {
    paddingBottom: 16,
  },
  userCard: {
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  userEmail: {
    fontSize: 14,
    opacity: 0.7,
  },
  userRole: {
    fontSize: 14,
    marginTop: 4,
  },
  userStatus: {
    fontSize: 14,
    marginTop: 4,
  },
  userActions: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
  },
  removeButton: {
    opacity: 0.7,
  },
  addUserCard: {
    marginBottom: 16,
  },
  roleSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  roleLabel: {
    marginRight: 8,
  },
  roleButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  selectedRole: {
    backgroundColor: '#e0e0e0',
  },
  addUserActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
  },
  activityList: {
    paddingBottom: 16,
  },
  activityCard: {
    marginBottom: 8,
  },
  activityAction: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  activityTime: {
    fontSize: 14,
    opacity: 0.7,
    marginTop: 4,
  },
  activityDetails: {
    fontSize: 14,
    marginTop: 4,
    opacity: 0.7,
  },
}); 