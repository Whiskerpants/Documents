declare module '@react-native-community/datetimepicker' {
  import { Component } from 'react';
  import { ViewStyle } from 'react-native';

  export interface DateTimePickerProps {
    value: Date;
    mode?: 'date' | 'time' | 'datetime';
    display?: 'default' | 'spinner' | 'calendar' | 'clock';
    onChange?: (event: DateTimePickerEvent, date?: Date) => void;
    minimumDate?: Date;
    maximumDate?: Date;
    timeZoneOffsetInMinutes?: number;
    timeZoneOffsetInSeconds?: number;
    dayOfWeekFormat?: string;
    is24Hour?: boolean;
    style?: ViewStyle;
  }

  export interface DateTimePickerEvent {
    type: string;
    nativeEvent: {
      timestamp?: number;
    };
  }

  export default class DateTimePicker extends Component<DateTimePickerProps> {}
}

declare module '@react-native-picker/picker' {
  import { Component } from 'react';
  import { ViewStyle, TextStyle } from 'react-native';

  export interface PickerProps {
    selectedValue?: string | number;
    onValueChange?: (itemValue: string | number, itemIndex: number) => void;
    enabled?: boolean;
    mode?: 'dialog' | 'dropdown';
    itemStyle?: TextStyle;
    style?: ViewStyle;
    children?: React.ReactNode;
  }

  export interface PickerItemProps {
    label: string;
    value: string | number;
    color?: string;
    enabled?: boolean;
  }

  export class Picker extends Component<PickerProps> {
    static Item: Component<PickerItemProps>;
  }
}

declare module 'react-native-image-picker' {
  export interface ImagePickerOptions {
    mediaType?: 'photo' | 'video' | 'mixed';
    quality?: number;
    maxWidth?: number;
    maxHeight?: number;
    includeBase64?: boolean;
    includeExtra?: boolean;
  }

  export interface ImagePickerResponse {
    didCancel?: boolean;
    errorCode?: string;
    errorMessage?: string;
    assets?: Array<{
      uri?: string;
      width?: number;
      height?: number;
      type?: string;
      fileName?: string;
      fileSize?: number;
      base64?: string;
    }>;
  }

  export function launchCamera(
    options: ImagePickerOptions,
    callback: (response: ImagePickerResponse) => void
  ): void;

  export function launchImageLibrary(
    options: ImagePickerOptions,
    callback: (response: ImagePickerResponse) => void
  ): void;
}

declare module '@react-native-community/netinfo' {
  export interface NetInfoState {
    isConnected: boolean | null;
    isInternetReachable: boolean | null;
    type: string;
    details: any;
  }

  export function addEventListener(
    listener: (state: NetInfoState) => void
  ): () => void;

  export function fetch(): Promise<NetInfoState>;
} 