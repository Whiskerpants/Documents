import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ScrollView,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { format, differenceInDays, addDays } from 'date-fns';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { PregnancyCheck } from '../../store/types/breeding';

const GESTATION_PERIOD = 283; // Typical cattle gestation period in days
const TRIMESTER_LENGTH = Math.floor(GESTATION_PERIOD / 3);

interface GestationTimelineProps {
  conceptionDate: Date;
  dueDate: Date;
  pregnancyChecks?: PregnancyCheck[];
  onMilestonePress?: (milestone: Milestone) => void;
  onAddCheck?: () => void;
  showDevelopmentStages?: boolean;
}

interface Milestone {
  id: string;
  name: string;
  description: string;
  daysFromConception: number;
  type: 'trimester' | 'development' | 'warning';
}

export const GestationTimeline: React.FC<GestationTimelineProps> = ({
  conceptionDate,
  dueDate,
  pregnancyChecks = [],
  onMilestonePress,
  onAddCheck,
  showDevelopmentStages = false,
}) => {
  const { t } = useTranslation();
  const { width: screenWidth } = Dimensions.get('window');

  const milestones = useMemo(() => {
    const baseMilestones: Milestone[] = [
      {
        id: 'trimester1',
        name: t('breeding.gestation.trimester1'),
        description: t('breeding.gestation.trimester1Desc'),
        daysFromConception: 0,
        type: 'trimester',
      },
      {
        id: 'trimester2',
        name: t('breeding.gestation.trimester2'),
        description: t('breeding.gestation.trimester2Desc'),
        daysFromConception: TRIMESTER_LENGTH,
        type: 'trimester',
      },
      {
        id: 'trimester3',
        name: t('breeding.gestation.trimester3'),
        description: t('breeding.gestation.trimester3Desc'),
        daysFromConception: TRIMESTER_LENGTH * 2,
        type: 'trimester',
      },
      {
        id: 'viability',
        name: t('breeding.gestation.viability'),
        description: t('breeding.gestation.viabilityDesc'),
        daysFromConception: 180,
        type: 'warning',
      },
    ];

    if (showDevelopmentStages) {
      baseMilestones.push(
        {
          id: 'organogenesis',
          name: t('breeding.gestation.organogenesis'),
          description: t('breeding.gestation.organogenesisDesc'),
          daysFromConception: 45,
          type: 'development',
        },
        {
          id: 'rapidGrowth',
          name: t('breeding.gestation.rapidGrowth'),
          description: t('breeding.gestation.rapidGrowthDesc'),
          daysFromConception: 150,
          type: 'development',
        }
      );
    }

    return baseMilestones.sort((a, b) => a.daysFromConception - b.daysFromConception);
  }, [t, showDevelopmentStages]);

  const currentProgress = useMemo(() => {
    const today = new Date();
    const daysPregnant = differenceInDays(today, conceptionDate);
    const daysRemaining = differenceInDays(dueDate, today);
    const progress = Math.min(100, Math.max(0, (daysPregnant / GESTATION_PERIOD) * 100));
    const trimester = Math.floor(daysPregnant / TRIMESTER_LENGTH) + 1;

    return {
      daysPregnant,
      daysRemaining,
      progress,
      trimester,
      isOverdue: daysRemaining < 0,
    };
  }, [conceptionDate, dueDate]);

  const getMilestonePosition = (daysFromConception: number) => {
    return (daysFromConception / GESTATION_PERIOD) * 100;
  };

  const getMilestoneColor = (type: Milestone['type']) => {
    switch (type) {
      case 'trimester':
        return '#4CAF50';
      case 'development':
        return '#2196F3';
      case 'warning':
        return '#FFA500';
      default:
        return '#666';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.progressInfo}>
          <Text style={styles.progressText}>
            {t('breeding.gestation.progress', {
              percent: Math.round(currentProgress.progress),
            })}
          </Text>
          <Text style={styles.trimesterText}>
            {t('breeding.gestation.trimester', {
              number: currentProgress.trimester,
            })}
          </Text>
        </View>
        <View style={styles.dateInfo}>
          <Text style={styles.dateText}>
            {t('breeding.gestation.dueDate', {
              date: format(dueDate, 'MMM dd, yyyy'),
            })}
          </Text>
          <Text
            style={[
              styles.daysRemaining,
              currentProgress.isOverdue && styles.overdue,
            ]}
          >
            {currentProgress.isOverdue
              ? t('breeding.gestation.overdue', {
                  days: Math.abs(currentProgress.daysRemaining),
                })
              : t('breeding.gestation.daysRemaining', {
                  days: currentProgress.daysRemaining,
                })}
          </Text>
        </View>
      </View>

      <View style={styles.timelineContainer}>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${currentProgress.progress}%` },
            ]}
          />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.milestonesContainer}
        >
          {milestones.map((milestone) => (
            <TouchableOpacity
              key={milestone.id}
              style={[
                styles.milestone,
                {
                  left: `${getMilestonePosition(milestone.daysFromConception)}%`,
                },
              ]}
              onPress={() => onMilestonePress?.(milestone)}
            >
              <View
                style={[
                  styles.milestoneDot,
                  { backgroundColor: getMilestoneColor(milestone.type) },
                ]}
              />
              <Text style={styles.milestoneLabel}>{milestone.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.checksContainer}>
        <View style={styles.checksHeader}>
          <Text style={styles.checksTitle}>
            {t('breeding.gestation.pregnancyChecks')}
          </Text>
          {onAddCheck && (
            <TouchableOpacity
              style={styles.addCheckButton}
              onPress={onAddCheck}
            >
              <Icon name="plus" size={16} color="#2196F3" />
              <Text style={styles.addCheckText}>
                {t('breeding.gestation.addCheck')}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {pregnancyChecks.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {pregnancyChecks.map((check) => (
              <View key={check.id} style={styles.checkCard}>
                <View style={styles.checkHeader}>
                  <Text style={styles.checkDate}>
                    {format(check.date, 'MMM dd, yyyy')}
                  </Text>
                  <View
                    style={[
                      styles.checkResult,
                      {
                        backgroundColor:
                          check.result === 'positive'
                            ? '#4CAF50'
                            : check.result === 'negative'
                            ? '#F44336'
                            : '#FFA500',
                      },
                    ]}
                  >
                    <Text style={styles.checkResultText}>
                      {t(`breeding.pregnancy.check.result.${check.result}`)}
                    </Text>
                  </View>
                </View>
                <Text style={styles.checkMethod}>
                  {t(`breeding.pregnancy.check.method.${check.method}`)}
                </Text>
                {check.notes && (
                  <Text style={styles.checkNotes}>{check.notes}</Text>
                )}
              </View>
            ))}
          </ScrollView>
        ) : (
          <Text style={styles.noChecks}>
            {t('breeding.gestation.noChecks')}
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  progressInfo: {
    flex: 1,
  },
  progressText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#333',
  },
  trimesterText: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  dateInfo: {
    alignItems: 'flex-end',
  },
  dateText: {
    fontSize: 14,
    color: '#666',
  },
  daysRemaining: {
    fontSize: 14,
    color: '#4CAF50',
    marginTop: 4,
  },
  overdue: {
    color: '#F44336',
  },
  timelineContainer: {
    marginBottom: 24,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 4,
  },
  milestonesContainer: {
    marginTop: 16,
    height: 60,
  },
  milestone: {
    position: 'absolute',
    alignItems: 'center',
    width: 80,
    marginLeft: -40,
  },
  milestoneDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginBottom: 4,
  },
  milestoneLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  checksContainer: {
    marginTop: 16,
  },
  checksHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  checksTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  addCheckButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addCheckText: {
    fontSize: 14,
    color: '#2196F3',
  },
  checkCard: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    marginRight: 12,
    width: 200,
  },
  checkHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  checkDate: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  checkResult: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  checkResultText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  checkMethod: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  checkNotes: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  noChecks: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 16,
  },
}); 