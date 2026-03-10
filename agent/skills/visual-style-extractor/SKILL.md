---
name: visual-style-extractor
description: Analiza activos visuales (mockups, capturas, guías de estilo) para extraer tokens de diseño (colores, tipografía, espaciado) y generar variables de CSS, Tailwind o configuraciones de tema.
---

# Visual Style Extractor

## Objective
Transformar activos visuales estáticos en tokens de diseño programáticos y deterministas para asegurar la paridad entre el diseño y la implementación en código.

## Activation Logic
Se activa cuando el usuario solicita:
* "Extraer colores de estas imágenes"
* "Generar el tema de Tailwind basándose en el mockup"
* "Analizar la jerarquía tipográfica de la carpeta /design"
* "Convertir capturas de pantalla en variables de CSS"

## Processing Workflow

### 1. Asset Scanning
* **Input:** `source_dir` (ej. `./design`, `./assets/mockups`).
* **Action:** Indexar archivos `.png`, `.jpg`, `.jpeg`, y `.svg`. 
* **Note:** Priorizar archivos `.svg` para valores exactos de color y vectores.

### 2. Token Extraction
* **Color Palette:** Identificar Hex/RGB de colores primarios, secundarios, de fondo y estados (success/error).
* **Typography:** Inferir `font-family`, `font-weight`, `line-height` y escalas de `font-size` (h1-h6, body).
* **UI Components:** Detectar `border-radius`, `box-shadow`, y niveles de opacidad.
* **Layout/Spacing:** Medir proporciones de `padding` y `margin` consistentes para definir una escala de espaciado.

### 3. Mapping & Output
* Traducir hallazgos al `output_format` solicitado:
    * **TailwindConfig:** Objeto JSON para `tailwind.config.js`.
    * **CSS_Variables:** Root variables (`--color-primary`, etc.).
    * **Theme_TS:** Interfaces de TypeScript para sistemas de diseño.

## Constraints & Rules
* **No Guessing:** Si un valor es ambiguo en un raster (pixelado), redondear al valor estándar más cercano (ej. 15.8px -> 16px).
* **Naming Convention:** Usar nomenclatura semántica (ej. `brand-primary` en lugar de `blue-dark`).
* **Script Usage:** Para análisis masivo de frecuencia de píxeles en imágenes, invocar `scripts/analyze_pixels.py` si está disponible.

## Few-Shot Example
**User:** "Extrae los estilos de ./design/landing.png para Tailwind"
**Agent:** 1. Analizando `landing.png`...
2. Colores detectados: #0F172A (bg), #38BDF8 (primary).
3. Radios detectados: 8px (rounded-lg).
4. **Output:** ```json
{
  "theme": {
    "extend": {
      "colors": {
        "brand-bg": "#0F172A",
        "brand-primary": "#38BDF8"
      },
      "borderRadius": {
        "brand": "8px"
      }
    }
  }
}