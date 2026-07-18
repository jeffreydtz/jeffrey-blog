# Sonido de página — dónde soltar el asset

La infraestructura de sonido (T08) está lista pero **el archivo no se shipea**:
no hay foley CC0 local digno y el sitio jamás usa sonido sintético (DESIGN.md).

## Cómo activarlo

1. Conseguir un foley real de vuelta de página que cumpla la spec de abajo.
2. Guardarlo en esta carpeta con el nombre **exacto**: `page-turn.mp3`
3. Rebuild/redeploy. La detección es en build (`lib/sound.ts`): con el archivo
   presente aparece el toggle de sonido en el header; sin archivo no se
   renderiza nada y el navegador nunca pide la URL (cero 404s).

## Spec del asset

| Atributo | Valor |
| --- | --- |
| Nombre de archivo | `page-turn.mp3` (exacto) |
| Duración | ≤ 300 ms |
| Contenido | foley **real** de papel (vuelta de página / hoja deslizando) — nunca sintetizado, nunca "whoosh" digital |
| Nivel | discreto, ~-12 dBFS de pico; el player además reproduce a volumen 0.35 |
| Formato | MP3, mono está bien, < 30 KB |
| Licencia | CC0 / dominio público (sin atribución requerida) |

## Fuentes CC0 sugeridas

- **freesound.org** — buscar "page turn" con el filtro de licencia **Creative Commons 0**: <https://freesound.org/search/?q=page+turn&license=Creative+Commons+0>
- **kenney.nl** — packs de audio CC0 (ver "Interface Sounds" / "Foley"): <https://kenney.nl/assets?q=audio>
- **pixabay.com** — efectos de sonido libres de regalías: <https://pixabay.com/sound-effects/search/page-turn/>

Si el clip viene largo o fuerte, recortar/normalizar (ej. Audacity) antes de
exportar a MP3.
