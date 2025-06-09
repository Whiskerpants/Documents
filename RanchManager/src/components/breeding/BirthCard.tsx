import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { Birth } from '../../store/types/breeding';

interface BirthCardProps {
  birth: Birth;
  onPress?: (birth: Birth) => void;
  onEdit?: (birth: Birth) => void;
  onViewDam?: (damId: string) => void;
  onViewCalf?: (calfId: string) => void;
  onAddHealthRecord?: (animalId: string) => void;
}

export const BirthCard: React.FC<BirthCardProps> = ({
  birth,
  onPress,
  onEdit,
  onViewDam,
  onViewCalf,
  onAddHealthRecord,
}) => {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const [animation] = useState(new Animated.Value(0));

  const toggleExpand = () => {
    const toValue = expanded ? 0 : 1;
    Animated.spring(animation, {
      toValue,
      useNativeDriver: false,
      friction: 8,
      tension: 40,
    }).start();
    setExpanded(!expanded);
  };

  const getBirthStatusColor = () => {
    if (birth.complications.length > 0) return '#F44336'; // Red for complicated
    if (birth.assistanceRequired) return '#FFA500'; // Orange for assisted
    return '#4CAF50'; // Green for normal
  };

  const getBirthStatusText = () => {
    if (birth.complications.length > 0) return t('breeding.birth.status.complicated');
    if (birth.assistanceRequired) return t('breeding.birth.status.assisted');
    return t('breeding.birth.status.normal');
  };

  const getGenderCount = () => {
    const males = birth.calfDetails.filter(calf => calf.gender === 'male').length;
    const females = birth.calfDetails.filter(calf => calf.gender === 'female').length;
    return { males, females };
  };

  const genderCount = getGenderCount();

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.header}
        onPress={toggleExpand}
        activeOpacity={0.7}
      >
        <View style={styles.headerContent}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>
              {t('breeding.birth.card.title', { dam: birth.damName })}
            </Text>
            <TouchableOpacity
              onPress={() => onViewDam?.(birth.damId)}
              style={styles.damLink}
            >
              <Text style={styles.damId}>#{birth.damId}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.statusContainer}>
            <View
              style={[
                styles.statusIndicator,
                { backgroundColor: getBirthStatusColor() },
              ]}
            />
            <Text style={styles.statusText}>{getBirthStatusText()}</Text>
          </View>
        </View>

        <View style={styles.summaryRow}>
          <View style={styles.dateTimeContainer}>
            <Icon name="calendar" size={16} color="#666" />
            <Text style={styles.dateTime}>
              {format(birth.birthDate, 'MMM dd, yyyy')} {birth.birthTime}
            </Text>
          </View>

          <View style={styles.calfCountContainer}>
            <View style={styles.genderCount}>
              <Icon name="gender-male" size={16} color="#2196F3" />
              <Text style={styles.countText}>{genderCount.males}</Text>
            </View>
            <View style={styles.genderCount}>
              <Icon name="gender-female" size={16} color="#E91E63" />
              <Text style={styles.countText}>{genderCount.females}</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>

      <Animated.View
        style={[
          styles.details,
          {
            maxHeight: animation.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 500],
            }),
            opacity: animation,
          },
        ]}
      >
        <View style={styles.detailsContent}>
          <View style={styles.locationContainer}>
            <Icon name="map-marker" size={16} color="#666" />
            <Text style={styles.location}>{birth.location}</Text>
          </View>

          {birth.assistanceRequired && (
            <View style={styles.assistanceContainer}>
              <Text style={styles.assistanceLabel}>
                {t('breeding.birth.card.assistanceType')}:
              </Text>
              <Text style={styles.assistanceValue}>
                {t(`breeding.birth.assistance.${birth.assistanceType}`)}
              </Text>
            </View>
          )}

          {birth.complications.length > 0 && (
            <View style={styles.complicationsContainer}>
              <Text style={styles.complicationsLabel}>
                {t('breeding.birth.card.complications')}:
              </Text>
              {birth.complications.map((complication, index) => (
                <Text key={index} style={styles.complication}>
                  • {complication}
                </Text>
              ))}
            </View>
          )}

          <View style={styles.calvesContainer}>
            <Text style={styles.calvesTitle}>
              {t('breeding.birth.card.calves')}
            </Text>
            {birth.calfDetails.map((calf) => (
              <TouchableOpacity
                key={calf.id}
                style={styles.calfItem}
                onPress={() => onViewCalf?.(calf.id)}
              >
                <View style={styles.calfInfo}>
                  <Icon
                    name={calf.gender === 'male' ? 'gender-male' : 'gender-female'}
                    size={16}
                    color={calf.gender === 'male' ? '#2196F3' : '#E91E63'}
                  />
                  <Text style={styles.calfId}>#{calf.tagNumber}</Text>
                  <Text style={styles.calfWeight}>
                    {calf.weight} {t('common.kg')}
                  </Text>
                </View>
                {calf.notes && (
                  <Text style={styles.calfNotes}>{calf.notes}</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>

          {birth.notes && (
            <View style={styles.notesContainer}>
              <Text style={styles.notes}>{birth.notes}</Text>
            </View>
          )}

          <View style={styles.actionsContainer}>
            {onAddHealthRecord && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => onAddHealthRecord(birth.damId)}
              >
                <Icon name="medical-bag" size={20} color="#2196F3" />
                <Text style={styles.actionText}>
                  {t('breeding.birth.card.addDamHealth')}
                </Text>
              </TouchableOpacity>
            )}
            {onEdit && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => onEdit(birth)}
              >
                <Icon name="pencil" size={20} color="#666" />
                <Text style={styles.actionText}>
                  {t('common.edit')}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginVertical: 8,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  header: {
    padding: 16,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  titleContainer: {
    flex: 1,
    marginRight: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  damLink: {
    marginTop: 4,
  },
  damId: {
    fontSize: 12,
    color: '#2196F3',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    color: '#666',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateTime: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  calfCountContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  genderCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  countText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  details: {
    overflow: 'hidden',
  },
  detailsContent: {
    padding: 16,
    paddingTop: 0,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  location: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  assistanceContainer: {
    marginBottom: 12,
  },
  assistanceLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  assistanceValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  complicationsContainer: {
    marginBottom: 12,
  },
  complicationsLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  complication: {
    fontSize: 14,
    color: '#F44336',
    marginLeft: 8,
    marginBottom: 2,
  },
  calvesContainer: {
    marginBottom: 12,
  },
  calvesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  calfItem: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
  },
  calfInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  calfId: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  calfWeight: {
    fontSize: 14,
    color: '#666',
  },
  calfNotes: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    marginLeft: 24,
  },
  notesContainer: {
    marginBottom: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#EEE',
  },
  notes: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#EEE',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionText: {
    fontSize: 14,
    color: '#666',
  },
}); 