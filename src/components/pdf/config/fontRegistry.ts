import { Font } from '@react-pdf/renderer';

// Register fonts for Turkish character support
// Using reliable CDN sources with TTF format for @react-pdf/renderer

/**
 * Registers all fonts used in PDF rendering
 * This function should be called once before rendering any PDF
 */
export const registerFonts = () => {
  // Roboto - Turkish character support
  Font.register({
    family: 'Roboto',
    fonts: [
      {
        src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-light-webfont.ttf',
        fontWeight: 'normal',
      },
      {
        src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf',
        fontWeight: 'bold',
      }
    ]
  });

  // Open Sans - Using jsDelivr CDN
  Font.register({
    family: 'Open Sans',
    fonts: [
      {
        src: 'https://cdn.jsdelivr.net/gh/google/fonts@main/apache/opensans/OpenSans-Regular.ttf',
        fontWeight: 'normal',
      },
      {
        src: 'https://cdn.jsdelivr.net/gh/google/fonts@main/apache/opensans/OpenSans-Bold.ttf',
        fontWeight: 'bold',
      }
    ]
  });

  // Lato - Using jsDelivr CDN
  Font.register({
    family: 'Lato',
    fonts: [
      {
        src: 'https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/lato/Lato-Regular.ttf',
        fontWeight: 'normal',
      },
      {
        src: 'https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/lato/Lato-Bold.ttf',
        fontWeight: 'bold',
      }
    ]
  });

  // Montserrat - Using jsDelivr CDN
  Font.register({
    family: 'Montserrat',
    fonts: [
      {
        src: 'https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/montserrat/Montserrat-Regular.ttf',
        fontWeight: 'normal',
      },
      {
        src: 'https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/montserrat/Montserrat-Bold.ttf',
        fontWeight: 'bold',
      }
    ]
  });

  // Inter - Using jsDelivr CDN
  Font.register({
    family: 'Inter',
    fonts: [
      {
        src: 'https://cdn.jsdelivr.net/gh/rsms/inter@v4.0.1/fonts/Inter-Regular.ttf',
        fontWeight: 'normal',
      },
      {
        src: 'https://cdn.jsdelivr.net/gh/rsms/inter@v4.0.1/fonts/Inter-Bold.ttf',
        fontWeight: 'bold',
      }
    ]
  });

  // Poppins - Using jsDelivr CDN
  Font.register({
    family: 'Poppins',
    fonts: [
      {
        src: 'https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/poppins/Poppins-Regular.ttf',
        fontWeight: 'normal',
      },
      {
        src: 'https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/poppins/Poppins-Bold.ttf',
        fontWeight: 'bold',
      }
    ]
  });

  // Nunito - Using jsDelivr CDN
  Font.register({
    family: 'Nunito',
    fonts: [
      {
        src: 'https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/nunito/Nunito-Regular.ttf',
        fontWeight: 'normal',
      },
      {
        src: 'https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/nunito/Nunito-Bold.ttf',
        fontWeight: 'bold',
      }
    ]
  });

  // Playfair Display (Serif) - Using jsDelivr CDN
  Font.register({
    family: 'Playfair Display',
    fonts: [
      {
        src: 'https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/playfairdisplay/PlayfairDisplay-Regular.ttf',
        fontWeight: 'normal',
      },
      {
        src: 'https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/playfairdisplay/PlayfairDisplay-Bold.ttf',
        fontWeight: 'bold',
      }
    ]
  });

  // Merriweather (Serif) - Using jsDelivr CDN
  Font.register({
    family: 'Merriweather',
    fonts: [
      {
        src: 'https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/merriweather/Merriweather-Regular.ttf',
        fontWeight: 'normal',
      },
      {
        src: 'https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/merriweather/Merriweather-Bold.ttf',
        fontWeight: 'bold',
      }
    ]
  });

  // Source Sans Pro - Using jsDelivr CDN
  Font.register({
    family: 'Source Sans Pro',
    fonts: [
      {
        src: 'https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/sourcesanspro/SourceSansPro-Regular.ttf',
        fontWeight: 'normal',
      },
      {
        src: 'https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/sourcesanspro/SourceSansPro-Bold.ttf',
        fontWeight: 'bold',
      }
    ]
  });

  // Helvetica, Times-Roman, Courier are built-in fonts in PDF, no need to register
};

// Auto-register fonts when module is imported
registerFonts();

