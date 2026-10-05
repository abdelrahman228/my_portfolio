// Contrast Ratio and WCAG AA verification script
function hexToRgb(hex) {
  hex = hex.replace('#', '');
  if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
  const num = parseInt(hex, 16);
  return [num >> 16, (num >> 8) & 255, num & 255];
}

function sRGBtoLin(colorChannel) {
  colorChannel = colorChannel / 255;
  return colorChannel <= 0.04045
    ? colorChannel / 12.92
    : Math.pow((colorChannel + 0.055) / 1.055, 2.4);
}

function getLuminance(hex) {
  const [r, g, b] = hexToRgb(hex);
  return 0.2126 * sRGBtoLin(r) + 0.7152 * sRGBtoLin(g) + 0.0722 * sRGBtoLin(b);
}

function getContrastRatio(hex1, hex2) {
  const lum1 = getLuminance(hex1);
  const lum2 = getLuminance(hex2);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
}

const colors = {
  bg: '#0A0F1A',
  surface: '#111B2E',
  border: '#1E2A40',
  text: '#F1F5F9',
  muted: '#94A3B8',
  primary: '#F5A524',
  secondary: '#3B82F6',
  success: '#34D399',
  danger: '#F87171'
};

const pairs = [
  ['--text (#F1F5F9) on --bg (#0A0F1A)', colors.text, colors.bg, 4.5],
  ['--text (#F1F5F9) on --surface (#111B2E)', colors.text, colors.surface, 4.5],
  ['--muted (#94A3B8) on --bg (#0A0F1A)', colors.muted, colors.bg, 4.5],
  ['--muted (#94A3B8) on --surface (#111B2E)', colors.muted, colors.surface, 4.5],
  ['Button Text (#0A0F1A) on --primary (#F5A524)', colors.bg, colors.primary, 4.5],
  ['--primary (#F5A524) on --bg (#0A0F1A) [UI/Headings]', colors.primary, colors.bg, 3.0],
  ['--secondary (#3B82F6) on --bg (#0A0F1A) [Code/Highlights]', colors.secondary, colors.bg, 4.5],
  ['--secondary (#3B82F6) on --surface (#111B2E)', colors.secondary, colors.surface, 4.5],
  ['--success (#34D399) on --bg (#0A0F1A)', colors.success, colors.bg, 4.5],
  ['--danger (#F87171) on --bg (#0A0F1A)', colors.danger, colors.bg, 4.5]
];

console.log('=== WCAG AA CONTRAST RATIO AUDIT ===\n');
let allPassed = true;

pairs.forEach(([name, c1, c2, threshold]) => {
  const ratio = getContrastRatio(c1, c2);
  const passed = ratio >= threshold;
  if (!passed) allPassed = false;
  console.log(`[${passed ? 'PASS' : 'FAIL'}] ${name}`);
  console.log(`       Ratio: ${ratio.toFixed(2)}:1 (Required: >= ${threshold}:1)\n`);
});

if (allPassed) {
  console.log('ALL COLOR PAIRS MEET WCAG AA REQUIREMENTS PERFECTLY.');
} else {
  console.error('SOME COLOR PAIRS FAILED WCAG AA.');
  process.exit(1);
}
