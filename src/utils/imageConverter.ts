/**
 * Görsel formatını JPG'ye çevirir
 * @react-pdf/renderer WebP formatını desteklemediği için tüm görselleri JPG'ye çeviriyoruz
 * 
 * Desteklenen formatlar: WebP, PNG, GIF → JPG'ye çevrilir
 * JPG/JPEG formatları olduğu gibi döndürülür
 */
export async function convertImageToJpg(file: File): Promise<File> {
  // Zaten JPG/JPEG ise çevirme
  if (file.type === 'image/jpeg' || file.type === 'image/jpg') {
    return file;
  }

  // WebP, PNG, GIF gibi formatları JPG'ye çevir
  // Özellikle WebP formatı @react-pdf/renderer tarafından desteklenmediği için zorunlu

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        // Canvas oluştur
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        
        // Beyaz arka plan (transparency için)
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context oluşturulamadı'));
          return;
        }
        
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Görseli çiz
        ctx.drawImage(img, 0, 0);
        
        // JPG'ye çevir
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Blob oluşturulamadı'));
              return;
            }
            
            // Yeni dosya adı oluştur
            const originalName = file.name.replace(/\.[^/.]+$/, '');
            const newFile = new File([blob], `${originalName}.jpg`, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            
            resolve(newFile);
          },
          'image/jpeg',
          0.92 // Kalite: 0-1 arası (0.92 = %92 kalite)
        );
      };
      
      img.onerror = () => {
        reject(new Error('Görsel yüklenemedi'));
      };
      
      img.src = e.target?.result as string;
    };
    
    reader.onerror = () => {
      reject(new Error('Dosya okunamadı'));
    };
    
    reader.readAsDataURL(file);
  });
}

/**
 * Görsel boyutunu optimize eder (maksimum genişlik/yükseklik)
 */
export async function optimizeImageSize(
  file: File,
  maxWidth: number = 1920,
  maxHeight: number = 1920
): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        let { width, height } = img;
        
        // Eğer görsel zaten küçükse, resize etme
        if (width <= maxWidth && height <= maxHeight) {
          resolve(file);
          return;
        }
        
        // Aspect ratio'yu koru
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }
        
        // Canvas oluştur
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context oluşturulamadı'));
          return;
        }
        
        // Beyaz arka plan
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        
        // Görseli resize ederek çiz
        ctx.drawImage(img, 0, 0, width, height);
        
        // JPG'ye çevir
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Blob oluşturulamadı'));
              return;
            }
            
            const newFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            
            resolve(newFile);
          },
          'image/jpeg',
          0.92
        );
      };
      
      img.onerror = () => {
        reject(new Error('Görsel yüklenemedi'));
      };
      
      img.src = e.target?.result as string;
    };
    
    reader.onerror = () => {
      reject(new Error('Dosya okunamadı'));
    };
    
    reader.readAsDataURL(file);
  });
}
