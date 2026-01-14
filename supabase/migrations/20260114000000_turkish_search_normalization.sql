-- Türkçe karakterleri ve aksanlı karakterleri normalize eden fonksiyon
-- "o" yazınca "ö", "ô", "ó" gibi karakterler de bulunur
-- "i" yazınca "ı", "İ", "I", "î", "ï" gibi karakterler de bulunur
CREATE OR REPLACE FUNCTION normalize_turkish_text(input_text text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  result text;
BEGIN
  IF input_text IS NULL THEN
    RETURN NULL;
  END IF;

  result := input_text;

  -- Önce küçük harfe çevir
  result := lower(result);

  -- Türkçe karakterleri normalize et
  result := translate(result,
    'ıİğĞüÜşŞöÖçÇ',
    'iigguussoocc'
  );

  -- Aksanlı karakterleri normalize et
  result := translate(result,
    'àáâãäåāăąèéêëēĕėęěìíîïĩīĭįıòóôõöøōŏőùúûüũūŭůűųýÿŷñńņňçćĉċčďđĝğġģĥħĵķĺļľŀłñńņňŕŗřśŝşšţťŧŵẁẃẅỳýŷÿźżž',
    'aaaaaaaaaaeeeeeeeeeiiiiiiiiiooooooooouuuuuuuuuuyyynnnncccccdddgggghhjklllllnnnrrrssssstttwwwwyyyyzzzz'
  );

  RETURN result;
END;
$$;

-- Index oluşturmayı kolaylaştırmak için bir yardımcı fonksiyon
COMMENT ON FUNCTION normalize_turkish_text(text) IS
'Türkçe ve aksanlı karakterleri normalize eder. Arama işlemlerinde kullanılır. Örnek: "YALI" → "yali", "çığır" → "cigir"';

-- Örnek kullanım:
-- SELECT * FROM products WHERE normalize_turkish_text(name) LIKE '%' || normalize_turkish_text('yalı') || '%';
-- SELECT * FROM suppliers WHERE normalize_turkish_text(company) LIKE '%' || normalize_turkish_text('çiğdem') || '%';
