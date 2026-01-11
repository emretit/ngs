import { logger } from '@/utils/logger';

/**
 * Convert image URL to base64 data URL
 * Handles WebP -> JPG conversion for @react-pdf/renderer compatibility
 */
export async function convertImageToBase64(imageUrl: string): Promise<string | null> {
  try {
    const response = await fetch(imageUrl);
    
    if (!response.ok) {
      logger.warn(`Image fetch failed: ${response.status} ${response.statusText}`);
      return imageUrl; // Fallback to URL
    }

    const blob = await response.blob();
    
    // WebP to JPG conversion
    if (blob.type === 'image/webp' || imageUrl.toLowerCase().endsWith('.webp')) {
      return await convertWebPToJpg(blob);
    }
    
    // Direct base64 conversion for JPG/PNG/GIF
    return await blobToBase64(blob);
  } catch (error) {
    logger.warn(`Image conversion error: ${error}`);
    return imageUrl; // Fallback to URL
  }
}

/**
 * Convert WebP blob to JPG base64
 */
async function convertWebPToJpg(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context could not be created'));
          return;
        }
        
        ctx.drawImage(img, 0, 0);
        const base64 = canvas.toDataURL('image/jpeg', 0.9);
        resolve(base64);
        
        // Cleanup
        URL.revokeObjectURL(img.src);
      } catch (error) {
        reject(error);
      }
    };
    
    img.onerror = () => {
      reject(new Error('Image could not be loaded'));
      URL.revokeObjectURL(img.src);
    };
    
    img.src = URL.createObjectURL(blob);
  });
}

/**
 * Convert blob to base64 data URL
 */
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.readAsDataURL(blob);
  });
}

/**
 * Batch convert multiple product images to base64
 */
export async function batchConvertProductImages(
  productIds: string[],
  productsData: Array<{ id: string; image_url?: string; name?: string }>
): Promise<Map<string, string | null>> {
  const imageMap = new Map<string, string | null>();
  
  const imagePromises = productsData.map(async (product) => {
    if (product?.image_url) {
      const base64 = await convertImageToBase64(product.image_url);
      imageMap.set(product.id, base64);
      
      if (process.env.NODE_ENV === 'development') {
        logger.debug(`✅ Image converted for ${product.name}: ${base64?.substring(0, 50)}...`);
      }
    }
  });
  
  await Promise.all(imagePromises);
  return imageMap;
}



