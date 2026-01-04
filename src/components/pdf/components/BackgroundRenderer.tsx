import React from 'react';
import { View, Svg, Circle, Rect, Path, Polygon } from '@react-pdf/renderer';
import { TemplateSchema } from '@/types/pdf-template';

interface BackgroundRendererProps {
  schema: TemplateSchema;
}

export const BackgroundRenderer: React.FC<BackgroundRendererProps> = ({ schema }) => {
  const style = schema.page.backgroundStyle || 'none';
  const opacity = (schema.page.backgroundOpacity ?? 5) / 100; // Çok düşük varsayılan opacity (5%)
  const accentColor = schema.page.backgroundStyleColor || '#4F46E5';
  
  if (style === 'none') {
    return null;
  }
  
  // Tüm arka plan stilleri için çok düşük opacity - yazıların arkasında kalması için
  const containerStyle = {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: opacity * 0.3, // Çok silik - toplam opacity çok düşük olacak
    zIndex: 0, // Arka planda kalması için
    pointerEvents: 'none' as const,
  };

  switch (style) {
    case 'corner-wave':
      // Modern dalga köşe tasarımı
      return (
        <View style={containerStyle}>
          <Svg style={{ width: '100%', height: '100%' }}>
            {/* Sağ alt köşede büyük dalga */}
            <Path
              d="M 450 600 Q 500 550 600 600 L 600 842 L 450 842 Z"
              fill={accentColor}
            />
            <Path
              d="M 400 650 Q 450 600 550 650 Q 600 680 600 750 L 600 842 L 400 842 Z"
              fill={accentColor}
            />
          </Svg>
        </View>
      );

    case 'side-gradient':
      // Sağ tarafta gradient - çok silik
      return (
        <View style={containerStyle}>
          <Svg style={{ width: '100%', height: '100%' }}>
            <Rect x="450" y="0" width="150" height="842" fill={accentColor} />
            <Rect x="400" y="0" width="50" height="842" fill={accentColor} />
            <Rect x="350" y="0" width="50" height="842" fill={accentColor} />
          </Svg>
        </View>
      );

    case 'bottom-shapes':
      // Alt kısımda modern şekiller
      return (
        <View style={containerStyle}>
          <Svg style={{ width: '100%', height: '100%' }}>
            {/* Büyük üçgen */}
            <Polygon
              points="500,700 650,842 350,842"
              fill={accentColor}
            />
            {/* Küçük daire */}
            <Circle cx="420" cy="750" r="40" fill={accentColor} />
            {/* Dikdörtgen */}
            <Rect x="0" y="780" width="300" height="62" fill={accentColor} />
          </Svg>
        </View>
      );

    case 'top-circles':
      // Üst kısımda daireler
      return (
        <View style={containerStyle}>
          <Svg style={{ width: '100%', height: '100%' }}>
            <Circle cx="500" cy="60" r="80" fill={accentColor} />
            <Circle cx="100" cy="80" r="50" fill={accentColor} />
            <Circle cx="300" cy="40" r="30" fill={accentColor} />
          </Svg>
        </View>
      );

    case 'diagonal-bands':
      // Çapraz bantlar
      return (
        <View style={containerStyle}>
          <Svg style={{ width: '100%', height: '100%' }}>
            <Polygon
              points="550,0 600,0 150,842 100,842"
              fill={accentColor}
            />
            <Polygon
              points="350,0 400,0 0,842 0,792"
              fill={accentColor}
            />
          </Svg>
        </View>
      );

    case 'corner-triangles':
      // Köşelerde üçgenler
      return (
        <View style={containerStyle}>
          <Svg style={{ width: '100%', height: '100%' }}>
            {/* Sağ üst */}
            <Polygon points="600,0 600,150 450,0" fill={accentColor} />
            {/* Sol alt */}
            <Polygon points="0,842 0,692 150,842" fill={accentColor} />
            {/* Sağ alt */}
            <Polygon points="600,842 600,742 500,842" fill={accentColor} />
          </Svg>
        </View>
      );

    case 'side-curves':
      // Yanlarda eğriler
      return (
        <View style={containerStyle}>
          <Svg style={{ width: '100%', height: '100%' }}>
            {/* Sol taraf eğri */}
            <Path
              d="M 0 200 Q 100 300 0 400 L 0 200 Z"
              fill={accentColor}
            />
            {/* Sağ taraf eğri */}
            <Path
              d="M 600 400 Q 500 500 600 600 L 600 400 Z"
              fill={accentColor}
            />
            {/* Alt eğri */}
            <Path
              d="M 200 842 Q 300 750 400 842 L 200 842 Z"
              fill={accentColor}
            />
          </Svg>
        </View>
      );

    default:
      return null;
  }
};

