import React from 'react';
import { Text } from '@react-pdf/renderer';

/**
 * Safe text rendering function for Turkish characters
 * Returns space character for null/undefined to avoid React-PDF errors
 */
export const safeText = (text: string | undefined | null): string => {
  if (!text) return ' '; // Boş string yerine boşluk (React-PDF requires non-empty string in Text)
  // Ensure text is properly encoded
  const normalized = text.toString().normalize('NFC');
  // Return space if normalized result is empty
  return normalized.trim() === '' ? ' ' : normalized;
};

/**
 * Parse HTML-like formatting tags and return React-PDF Text components
 * Supports <b>, <i>, <u> tags
 */
export const parseFormattedText = (text: string, baseStyle: any): React.ReactElement => {
  if (!text || text.trim() === '') return <Text style={baseStyle}> </Text>;
  
  // Eğer hiç tag yoksa, doğrudan text döndür
  if (!/<(b|i|u)>.*?<\/\1>/g.test(text)) {
    return <Text style={baseStyle}>{safeText(text)}</Text>;
  }
  
  const parts: React.ReactNode[] = [];
  
  // Match all formatting tags: <b>, <i>, <u>
  const tagRegex = /<(b|i|u)>(.*?)<\/\1>/g;
  let match;
  const matches: Array<{ start: number; end: number; tag: string; content: string }> = [];
  
  while ((match = tagRegex.exec(text)) !== null) {
    matches.push({
      start: match.index,
      end: match.index + match[0].length,
      tag: match[1].toLowerCase(),
      content: match[2],
    });
  }
  
  // Sort matches by start position
  matches.sort((a, b) => a.start - b.start);
  
  // Build parts array - içerik olarak string ekleyeceğiz, Text component değil
  let lastIndex = 0;
  
  matches.forEach((m) => {
    // Add text before the tag
    if (m.start > lastIndex) {
      const beforeText = text.substring(lastIndex, m.start);
      if (beforeText) {
        parts.push(beforeText);
      }
    }
    
    // Add formatted text as nested Text component
    const style: any = { ...baseStyle };
    if (m.tag === 'b') style.fontWeight = 'bold';
    if (m.tag === 'i') style.fontStyle = 'italic';
    if (m.tag === 'u') style.textDecoration = 'underline';
    
    parts.push(
      <Text key={m.start} style={style}>
        {m.content || ' '}
      </Text>
    );
    
    lastIndex = m.end;
  });
  
  // Add remaining text
  if (lastIndex < text.length) {
    const remainingText = text.substring(lastIndex);
    if (remainingText) {
      parts.push(remainingText);
    }
  }
  
  // If parts array is empty, return space
  if (parts.length === 0) {
    return <Text style={baseStyle}> </Text>;
  }
  
  // Tüm parts'ları tek bir Text içinde render et
  return <Text style={baseStyle}>{parts.map((part, idx) => 
    typeof part === 'string' ? safeText(part) : part
  )}</Text>;
};

