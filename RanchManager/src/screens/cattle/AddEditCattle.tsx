import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  TextStyle,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import Icon from 'react-native-vector-icons/MaterialIcons';
import * as ImagePicker from 'react-native-image-picker';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { CattleFormData, AddEditCattleScreenProps, CattleBreed, CattleStatus, WeightUnit } from '../../types/cattle';

// Add type definitions for picker values
type BreedType = 'angus' | 'hereford' | 'brahman' | 'charolais' | 'limousin' | 'simmental';
type GenderType = 'male' | 'female';
type StatusType = 'active' | 'sold' | 'deceased' | 'quarantine';
type WeightUnitType = 'kg' | 'lb';

const AddEditCattle: React.FC<AddEditCattleScreenProps> = ({ route, navigation }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const isEditMode = !!route.params?.cattleId;
  const [isOnline, setIsOnline] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [formData, setFormData] = useState<CattleFormData>({
    tagNumber: '',
    name: '',
    breed: 'angus',
    gender: 'male',
    birthDate: new Date(),
    weight: 0,
    weightUnit: 'kg',
    status: 'active',
    location: '',
    notes: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof CattleFormData, string>>>({});

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      setIsOnline(state.isConnected ?? false);
    });

    if (isEditMode) {
      // TODO: Load existing cattle data
      // dispatch(fetchCattle(route.params.cattleId));
    }

    return () => unsubscribe();
  }, [isEditMode, route.params?.cattleId]);

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof CattleFormData, string>> = {};

    if (!formData.tagNumber.trim()) {
      newErrors.tagNumber = t('cattle.addEdit.validation.required', { field: t('cattle.addEdit.tagNumber') });
    }

    if (!formData.name.trim()) {
      newErrors.name = t('cattle.addEdit.validation.required', { field: t('cattle.addEdit.name') });
    }

    if (formData.weight <= 0) {
      newErrors.weight = t('cattle.addEdit.validation.invalidWeight');
    }

    if (!formData.location.trim()) {
      newErrors.location = t('cattle.addEdit.validation.required', { field: t('cattle.addEdit.location') });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      if (isEditMode) {
        // TODO: Update cattle
        // await dispatch(updateCattle({ id: route.params.cattleId, ...formData }));
      } else {
        // TODO: Add new cattle
        // await dispatch(addCattle(formData));
      }
      navigation.goBack();
    } catch (error) {
      Alert.alert(t('cattle.addEdit.offline.error'));
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoAction = () => {
    Alert.alert(
      t('cattle.addEdit.photo'),
      '',
      [
        {
          text: t('cattle.addEdit.photoOptions.takePhoto'),
          onPress: () => {
            ImagePicker.launchCamera({
              mediaType: 'photo',
              quality: 0.8,
            }, (response: ImagePicker.ImagePickerResponse) => {
              if (response.assets?.[0]?.uri) {
                setFormData(prev => ({ ...prev, photo: response.assets[0].uri }));
              }
            });
          },
        },
        {
          text: t('cattle.addEdit.photoOptions.choosePhoto'),
          onPress: () => {
            ImagePicker.launchImageLibrary({
              mediaType: 'photo',
              quality: 0.8,
            }, (response: ImagePicker.ImagePickerResponse) => {
              if (response.assets?.[0]?.uri) {
                setFormData(prev => ({ ...prev, photo: response.assets[0].uri }));
              }
            });
          },
        },
        {
          text: t('cattle.addEdit.photoOptions.removePhoto'),
          onPress: () => setFormData(prev => ({ ...prev, photo: undefined })),
          style: 'destructive',
        },
        {
          text: t('cattle.addEdit.cancel'),
          style: 'cancel',
        },
      ],
    );
  };

  const handleDateChange = (event: DateTimePickerEvent, date?: Date) => {
    setShowDatePicker(false);
    if (date) {
      setFormData(prev => ({ ...prev, birthDate: date }));
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.form}>
        <View style={styles.field}>
          <Text style={styles.label}>{t('cattle.addEdit.tagNumber')} *</Text>
          <TextInput
            style={[styles.input, errors.tagNumber ? styles.inputError : null]}
            value={formData.tagNumber}
            onChangeText={(text) => setFormData(prev => ({ ...prev, tagNumber: text }))}
            placeholder={t('cattle.addEdit.tagNumber')}
          />
          {errors.tagNumber && <Text style={styles.errorText}>{errors.tagNumber}</Text>}
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>{t('cattle.addEdit.name')} *</Text>
          <TextInput
            style={[styles.input, errors.name ? styles.inputError : null]}
            value={formData.name}
            onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
            placeholder={t('cattle.addEdit.name')}
          />
          {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>{t('cattle.addEdit.breed')}</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={formData.breed}
              onValueChange={(value: CattleBreed) => setFormData(prev => ({ ...prev, breed: value }))}
              style={styles.picker}
            >
              {Object.entries(t('cattle.addEdit.breedOptions', { returnObjects: true })).map(([key, value]) => (
                <Picker.Item key={key} label={value as string} value={key} />
              ))}
            </Picker>
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>{t('cattle.addEdit.gender')}</Text>
          <View style={styles.radioGroup}>
            <TouchableOpacity
              style={[styles.radioButton, formData.gender === 'male' && styles.radioButtonSelected]}
              onPress={() => setFormData(prev => ({ ...prev, gender: 'male' }))}
            >
              <Text style={[styles.radioText, formData.gender === 'male' && styles.radioTextSelected]}>
                {t('cattle.details.male')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.radioButton, formData.gender === 'female' && styles.radioButtonSelected]}
              onPress={() => setFormData(prev => ({ ...prev, gender: 'female' }))}
            >
              <Text style={[styles.radioText, formData.gender === 'female' && styles.radioTextSelected]}>
                {t('cattle.details.female')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>{t('cattle.addEdit.birthDate')}</Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowDatePicker(true)}
          >
            <Text>{formData.birthDate.toLocaleDateString()}</Text>
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={formData.birthDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleDateChange}
            />
          )}
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>{t('cattle.addEdit.weight')}</Text>
          <View style={styles.weightContainer}>
            <TextInput
              style={[styles.weightInput, errors.weight ? styles.inputError : null]}
              value={formData.weight.toString()}
              onChangeText={(text) => {
                const weight = parseFloat(text) || 0;
                setFormData(prev => ({ ...prev, weight }));
              }}
              keyboardType="numeric"
              placeholder="0"
            />
            <View style={styles.weightUnitContainer}>
              <Picker
                selectedValue={formData.weightUnit}
                onValueChange={(value: WeightUnit) => setFormData(prev => ({ ...prev, weightUnit: value }))}
                style={styles.weightUnitPicker}
              >
                <Picker.Item label={t('cattle.addEdit.weightUnit.kg')} value="kg" />
                <Picker.Item label={t('cattle.addEdit.weightUnit.lb')} value="lb" />
              </Picker>
            </View>
          </View>
          {errors.weight && <Text style={styles.errorText}>{errors.weight}</Text>}
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>{t('cattle.addEdit.status')}</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={formData.status}
              onValueChange={(value: CattleStatus) => setFormData(prev => ({ ...prev, status: value }))}
              style={styles.picker}
            >
              {Object.entries(t('cattle.addEdit.statusOptions', { returnObjects: true })).map(([key, value]) => (
                <Picker.Item key={key} label={value as string} value={key} />
              ))}
            </Picker>
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>{t('cattle.addEdit.location')} *</Text>
          <TextInput
            style={[styles.input, errors.location ? styles.inputError : null]}
            value={formData.location}
            onChangeText={(text) => setFormData(prev => ({ ...prev, location: text }))}
            placeholder={t('cattle.addEdit.location')}
          />
          {errors.location && <Text style={styles.errorText}>{errors.location}</Text>}
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>{t('cattle.addEdit.notes')}</Text>
          <TextInput
            style={[styles.input, styles.notesInput]}
            value={formData.notes}
            onChangeText={(text) => setFormData(prev => ({ ...prev, notes: text }))}
            placeholder={t('cattle.addEdit.notes')}
            multiline
            numberOfLines={4}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>{t('cattle.addEdit.photo')}</Text>
          <TouchableOpacity style={styles.photoButton} onPress={handlePhotoAction}>
            <Icon name="camera-alt" size={24} color="#3B7302" />
            <Text style={styles.photoButtonText}>
              {formData.photo ? t('cattle.addEdit.photoOptions.removePhoto') : t('cattle.addEdit.photoOptions.takePhoto')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.cancelButton]}
          onPress={() => navigation.goBack()}
          disabled={loading}
        >
          <Text style={styles.buttonText}>{t('cattle.addEdit.cancel')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.saveButton]}
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>{t('cattle.addEdit.save')}</Text>
          )}
        </TouchableOpacity>
      </View>

      {!isOnline && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineText}>{t('cattle.addEdit.offline.saving')}</Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  form: {
    padding: 16,
  },
  field: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  inputError: {
    borderColor: '#F44336',
  } as TextStyle,
  errorText: {
    color: '#F44336',
    fontSize: 12,
    marginTop: 4,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  radioGroup: {
    flexDirection: 'row',
    marginTop: 8,
  },
  radioButton: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    marginRight: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  radioButtonSelected: {
    backgroundColor: '#3B7302',
    borderColor: '#3B7302',
  },
  radioText: {
    color: '#333',
  },
  radioTextSelected: {
    color: '#fff',
  },
  dateButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
  },
  weightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  weightInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginRight: 8,
  },
  weightUnitContainer: {
    width: 120,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    overflow: 'hidden',
  },
  weightUnitPicker: {
    height: 50,
  },
  notesInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  photoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#3B7302',
    borderRadius: 8,
    padding: 12,
  },
  photoButtonText: {
    color: '#3B7302',
    marginLeft: 8,
    fontSize: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  button: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
    marginRight: 8,
  },
  saveButton: {
    backgroundColor: '#3B7302',
    marginLeft: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  offlineBanner: {
    backgroundColor: '#FFA000',
    padding: 8,
    alignItems: 'center',
  },
  offlineText: {
    color: '#fff',
    fontSize: 14,
  },
});

export default AddEditCattle; 