import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { AuthService } from '../../services/AuthService';
import { Text } from '../common/Text';

interface RoleBasedAccessProps {
  feature: string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export const RoleBasedAccess: React.FC<RoleBasedAccessProps> = ({
  feature,
  fallback,
  children,
}) => {
  const { user } = useAuth();
  const authService = AuthService.getInstance();

  if (!user) {
    return fallback ? <>{fallback}</> : null;
  }

  const hasAccess = authService.canAccessFeature(user, feature);

  if (!hasAccess) {
    return fallback ? (
      <>{fallback}</>
    ) : (
      <View style={styles.restricted}>
        <Text style={styles.restrictedText}>
          You don't have permission to access this feature.
        </Text>
      </View>
    );
  }

  return <>{children}</>;
};

const styles = StyleSheet.create({
  restricted: {
    padding: 16,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    margin: 8,
  },
  restrictedText: {
    color: '#666',
    textAlign: 'center',
  },
}); 