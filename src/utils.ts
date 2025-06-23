export function getRGB(color: RGB | RGBA): RGB {
  return { r: color.r, g: color.g, b: color.b };
}

export function relativeLuminance(rgb: RGB): number {
  const sRGB = (c: number) => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  const R = sRGB(rgb.r * 255);
  const G = sRGB(rgb.g * 255);
  const B = sRGB(rgb.b * 255);
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

export function contrastRatio(lum1: number, lum2: number): number {
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return (lighter + 0.05) / (darker + 0.05);
} 