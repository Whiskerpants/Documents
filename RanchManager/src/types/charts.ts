export interface ChartData {
  type: string;
  data: any;
  options?: ChartOptions;
  metadata?: {
    title?: string;
    description?: string;
    source?: string;
    lastUpdated?: Date;
  };
}

export interface ChartOptions {
  responsive?: boolean;
  maintainAspectRatio?: boolean;
  animation?: {
    duration?: number;
    easing?: string;
  };
  layout?: {
    padding?: {
      top?: number;
      right?: number;
      bottom?: number;
      left?: number;
    };
  };
  scales?: {
    x?: ScaleOptions;
    y?: ScaleOptions;
  };
  plugins?: {
    legend?: {
      display?: boolean;
      position?: 'top' | 'bottom' | 'left' | 'right';
    };
    tooltip?: {
      enabled?: boolean;
      mode?: 'index' | 'dataset' | 'point' | 'nearest' | 'x' | 'y';
    };
  };
  theme?: {
    mode?: 'light' | 'dark';
    colors?: {
      background?: string;
      text?: string;
      grid?: string;
      border?: string;
    };
  };
}

interface ScaleOptions {
  type?: 'linear' | 'logarithmic' | 'time' | 'category';
  display?: boolean;
  position?: 'left' | 'right' | 'top' | 'bottom';
  min?: number;
  max?: number;
  ticks?: {
    beginAtZero?: boolean;
    stepSize?: number;
    callback?: (value: any) => string;
  };
  grid?: {
    display?: boolean;
    color?: string;
    lineWidth?: number;
  };
} 