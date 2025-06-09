import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { getSize } from 'react-native-image-size';
import { PerformanceService } from './performanceService';

interface ImageMetadata {
  width: number;
  height: number;
  size: number;
  format: string;
  uri: string;
}

interface ThumbnailOptions {
  width: number;
  height: number;
  quality?: number;
  format?: SaveFormat;
}

interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: SaveFormat;
}

export class ImageOptimizationService {
  private static instance: ImageOptimizationService;
  private cache: Map<string, string> = new Map();
  private thumbnailCache: Map<string, string> = new Map();
  private perfService: PerformanceService;
  private readonly CACHE_DIR = `${FileSystem.cacheDirectory}images/`;
  private readonly THUMBNAIL_DIR = `${FileSystem.cacheDirectory}thumbnails/`;

  private constructor() {
    this.perfService = PerformanceService.getInstance();
    this.initializeCacheDirectories();
  }

  static getInstance(): ImageOptimizationService {
    if (!ImageOptimizationService.instance) {
      ImageOptimizationService.instance = new ImageOptimizationService();
    }
    return ImageOptimizationService.instance;
  }

  private async initializeCacheDirectories() {
    try {
      await FileSystem.makeDirectoryAsync(this.CACHE_DIR, { intermediates: true });
      await FileSystem.makeDirectoryAsync(this.THUMBNAIL_DIR, { intermediates: true });
    } catch (error) {
      console.error('Error initializing cache directories:', error);
    }
  }

  // Progressive Image Loading
  async loadProgressiveImage(uri: string): Promise<string> {
    return this.perfService.measureAsync('progressive_image_load', async () => {
      try {
        // Check cache first
        const cachedUri = this.cache.get(uri);
        if (cachedUri) {
          return cachedUri;
        }

        // Generate low-quality placeholder
        const placeholder = await this.generateThumbnail(uri, {
          width: 20,
          height: 20,
          quality: 0.1,
        });

        // Load full image in background
        const fullImage = await this.loadAndCacheImage(uri);
        
        // Cache the result
        this.cache.set(uri, fullImage);
        
        return fullImage;
      } catch (error) {
        console.error('Error loading progressive image:', error);
        return uri;
      }
    });
  }

  // Image Compression
  async compressImage(uri: string, options: CompressionOptions = {}): Promise<string> {
    return this.perfService.measureAsync('image_compression', async () => {
      try {
        const {
          maxWidth = 1920,
          maxHeight = 1080,
          quality = 0.8,
          format = SaveFormat.JPEG,
        } = options;

        const metadata = await this.getImageMetadata(uri);
        
        // Calculate new dimensions while maintaining aspect ratio
        const { width, height } = this.calculateDimensions(
          metadata.width,
          metadata.height,
          maxWidth,
          maxHeight
        );

        const result = await manipulateAsync(
          uri,
          [{ resize: { width, height } }],
          { compress: quality, format }
        );

        return result.uri;
      } catch (error) {
        console.error('Error compressing image:', error);
        return uri;
      }
    });
  }

  // Thumbnail Generation
  async generateThumbnail(uri: string, options: ThumbnailOptions): Promise<string> {
    return this.perfService.measureAsync('thumbnail_generation', async () => {
      try {
        const {
          width,
          height,
          quality = 0.7,
          format = SaveFormat.JPEG,
        } = options;

        // Check thumbnail cache
        const cacheKey = `${uri}_${width}x${height}`;
        const cachedThumbnail = this.thumbnailCache.get(cacheKey);
        if (cachedThumbnail) {
          return cachedThumbnail;
        }

        const result = await manipulateAsync(
          uri,
          [{ resize: { width, height } }],
          { compress: quality, format }
        );

        // Cache the thumbnail
        this.thumbnailCache.set(cacheKey, result.uri);
        
        return result.uri;
      } catch (error) {
        console.error('Error generating thumbnail:', error);
        return uri;
      }
    });
  }

  // Lazy Loading
  async lazyLoadImage(uri: string, viewport: { x: number; y: number; width: number; height: number }): Promise<string> {
    return this.perfService.measureAsync('lazy_image_load', async () => {
      try {
        // Check if image is in viewport
        const metadata = await this.getImageMetadata(uri);
        const isInViewport = this.isInViewport(metadata, viewport);

        if (!isInViewport) {
          // Return low-quality placeholder
          return this.generateThumbnail(uri, {
            width: 50,
            height: 50,
            quality: 0.1,
          });
        }

        // Load full image if in viewport
        return this.loadProgressiveImage(uri);
      } catch (error) {
        console.error('Error lazy loading image:', error);
        return uri;
      }
    });
  }

  // Cache Management
  async preloadImages(uris: string[]): Promise<void> {
    return this.perfService.measureAsync('image_preload', async () => {
      try {
        await Promise.all(
          uris.map(uri => this.loadAndCacheImage(uri))
        );
      } catch (error) {
        console.error('Error preloading images:', error);
      }
    });
  }

  async clearCache(): Promise<void> {
    try {
      await FileSystem.deleteAsync(this.CACHE_DIR, { idempotent: true });
      await FileSystem.deleteAsync(this.THUMBNAIL_DIR, { idempotent: true });
      this.cache.clear();
      this.thumbnailCache.clear();
      await this.initializeCacheDirectories();
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }

  // Helper Methods
  private async loadAndCacheImage(uri: string): Promise<string> {
    try {
      const filename = uri.split('/').pop() || 'image';
      const cachePath = `${this.CACHE_DIR}${filename}`;
      
      // Check if already cached
      const fileInfo = await FileSystem.getInfoAsync(cachePath);
      if (fileInfo.exists) {
        return cachePath;
      }

      // Download and cache
      await FileSystem.downloadAsync(uri, cachePath);
      return cachePath;
    } catch (error) {
      console.error('Error loading and caching image:', error);
      return uri;
    }
  }

  private async getImageMetadata(uri: string): Promise<ImageMetadata> {
    try {
      const size = await getSize(uri);
      const fileInfo = await FileSystem.getInfoAsync(uri);
      
      return {
        width: size.width,
        height: size.height,
        size: fileInfo.exists ? (fileInfo as any).size || 0 : 0,
        format: uri.split('.').pop() || 'unknown',
        uri,
      };
    } catch (error) {
      console.error('Error getting image metadata:', error);
      throw error;
    }
  }

  private calculateDimensions(
    width: number,
    height: number,
    maxWidth: number,
    maxHeight: number
  ): { width: number; height: number } {
    const aspectRatio = width / height;

    if (width > maxWidth) {
      return {
        width: maxWidth,
        height: maxWidth / aspectRatio,
      };
    }

    if (height > maxHeight) {
      return {
        width: maxHeight * aspectRatio,
        height: maxHeight,
      };
    }

    return { width, height };
  }

  private isInViewport(
    metadata: ImageMetadata,
    viewport: { x: number; y: number; width: number; height: number }
  ): boolean {
    // Implement viewport intersection logic here
    // This is a simplified version - you might want to add more sophisticated logic
    return true;
  }
} 