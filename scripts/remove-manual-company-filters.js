#!/usr/bin/env node

/**
 * Remove Manual company_id Filters Script
 * RLS aktif olduğu için manuel company_id filtrelerine gerek yok
 * 
 * Kullanım: node scripts/remove-manual-company-filters.js [--dry-run]
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Renkli output için
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
};

// İstatistikler
const stats = {
  totalFiles: 0,
  modifiedFiles: 0,
  totalReplacements: 0,
  skippedFiles: [],
  errors: [],
};

// Dry run mode
const isDryRun = process.argv.includes('--dry-run');

console.log(`${colors.cyan}🔄 Remove Manual company_id Filters Script${colors.reset}`);
console.log('==============================================');
console.log('');
if (isDryRun) {
  console.log(`${colors.yellow}⚠️  DRY RUN MODE - Dosyalar değiştirilmeyecek${colors.reset}`);
  console.log('');
}

// Yedek dizini
const backupDir = `.company-filter-backup-${Date.now()}`;

/**
 * Dosyaları recursive olarak bul
 */
function findFiles(dir, extensions = ['.ts', '.tsx']) {
  let results = [];
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      // node_modules, dist, build gibi dizinleri atla
      if (!['node_modules', 'dist', 'build', '.git', '.console-migration-backup-1768122301911'].includes(file) && !file.startsWith('.company-filter-backup')) {
        results = results.concat(findFiles(filePath, extensions));
      }
    } else {
      const ext = path.extname(file);
      if (extensions.includes(ext)) {
        results.push(filePath);
      }
    }
  }

  return results;
}

/**
 * Manuel company_id filtrelerini kaldır
 * 
 * Patterns:
 * - .eq('company_id', ...)
 * - .eq("company_id", ...)
 */
function removeCompanyIdFilters(content) {
  let modified = content;
  let replacements = 0;

  // Pattern 1: Tek satırda .eq('company_id', ...) ve sonraki method chain
  // Örnek: .eq('company_id', companyId).select('*')
  const singleLinePattern = /\.eq\(['"]company_id['"],\s*[^)]+\)(?=\s*\.)/g;
  const singleLineMatches = (modified.match(singleLinePattern) || []).length;
  modified = modified.replace(singleLinePattern, '');
  replacements += singleLineMatches;

  // Pattern 2: Tek satırda .eq('company_id', ...) ve satır sonu
  // Örnek: .eq('company_id', companyId);
  const singleLineEndPattern = /\.eq\(['"]company_id['"],\s*[^)]+\);/g;
  const singleLineEndMatches = (modified.match(singleLineEndPattern) || []).length;
  modified = modified.replace(singleLineEndPattern, ';');
  replacements += singleLineEndMatches;

  // Pattern 3: Çok satırlı pattern - .eq satırı ve bir sonraki satırın girişini koru
  // Örnek:
  //   .eq('company_id', companyId)
  //   .select('*')
  const multiLinePattern = /\s*\.eq\(['"]company_id['"],\s*[^)]+\)\n/g;
  const multiLineMatches = (modified.match(multiLinePattern) || []).length;
  modified = modified.replace(multiLinePattern, '\n');
  replacements += multiLineMatches;

  return { modified, replacements };
}

/**
 * Dosyayı işle
 */
function processFile(filePath) {
  stats.totalFiles++;
  
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // company_id kullanımı var mı kontrol et
    if (!content.match(/\.eq\(['"]company_id['"]/)) {
      return;
    }
    
    console.log(`📝 İşleniyor: ${filePath}`);
    
    const { modified, replacements } = removeCompanyIdFilters(content);
    
    if (replacements > 0) {
      if (!isDryRun) {
        // Yedek al
        if (!fs.existsSync(backupDir)) {
          fs.mkdirSync(backupDir, { recursive: true });
        }
        
        const relativePath = path.relative(process.cwd(), filePath);
        const backupPath = path.join(backupDir, relativePath);
        const backupDirPath = path.dirname(backupPath);
        
        if (!fs.existsSync(backupDirPath)) {
          fs.mkdirSync(backupDirPath, { recursive: true });
        }
        
        fs.copyFileSync(filePath, backupPath);
        
        // Değişiklikleri yaz
        fs.writeFileSync(filePath, modified, 'utf8');
      }
      
      stats.modifiedFiles++;
      stats.totalReplacements += replacements;
      console.log(`   ✅ Tamamlandı (${replacements} filtre kaldırıldı)`);
    }
  } catch (error) {
    console.error(`${colors.red}   ❌ Hata: ${error.message}${colors.reset}`);
    stats.errors.push({ file: filePath, error: error.message });
  }
}

/**
 * Ana fonksiyon
 */
async function main() {
  console.log('🔍 Dosyalar taranıyor...');
  console.log('');
  
  // src/ altındaki dosyaları bul
  const files = findFiles('src', ['.ts', '.tsx']);
  console.log(`📂 ${files.length} dosya bulundu`);
  console.log('');
  
  // Her dosyayı işle
  for (const file of files) {
    processFile(file);
  }
  
  // Özet
  console.log('');
  console.log('==============================================');
  console.log('📊 Özet');
  console.log('==============================================');
  console.log(`${colors.green}✅ Taranan dosya: ${stats.totalFiles}${colors.reset}`);
  console.log(`${colors.green}✅ Değiştirilen dosya: ${stats.modifiedFiles}${colors.reset}`);
  console.log(`${colors.green}✅ Toplam filtre kaldırıldı: ${stats.totalReplacements}${colors.reset}`);
  
  if (stats.errors.length > 0) {
    console.log(`${colors.red}❌ Hata sayısı: ${stats.errors.length}${colors.reset}`);
    console.log('');
    console.log('Hatalar:');
    stats.errors.forEach(({ file, error }) => {
      console.log(`  - ${file}: ${error}`);
    });
  }
  
  if (!isDryRun) {
    console.log(`${colors.yellow}📦 Yedek dizini: ${backupDir}${colors.reset}`);
  }
  
  console.log('');
  console.log('⚠️  DİKKAT:');
  console.log('  1. Değişiklikleri kontrol edin: git diff');
  console.log('  2. Build çalıştırın: npm run build');
  console.log('  3. Admin dosyalarını manuel kontrol edin');
  console.log('');
  
  if (isDryRun) {
    console.log('Gerçek migration için: node scripts/remove-manual-company-filters.js');
  }
  console.log('');
}

// Scripti çalıştır
main().catch(error => {
  console.error(`${colors.red}❌ Fatal error: ${error.message}${colors.reset}`);
  process.exit(1);
});
