import { Sun, Cloud, CloudRain, CloudSnow, CloudLightning, CloudFog } from 'lucide-react';

export const WMO_CODES = {
  0:  { label: 'Clear',              labelHe: 'בהיר',            emoji: '☀️',  cloudy: false, Icon: Sun },
  1:  { label: 'Mostly Clear',       labelHe: 'בהיר ברובו',      emoji: '🌤️',  cloudy: false, Icon: Sun },
  2:  { label: 'Partly Cloudy',      labelHe: 'מעונן חלקית',     emoji: '⛅',  cloudy: true,  Icon: Cloud },
  3:  { label: 'Overcast',           labelHe: 'מעונן',           emoji: '☁️',  cloudy: true,  Icon: Cloud },
  45: { label: 'Fog',                labelHe: 'ערפיל',           emoji: '🌫️',  cloudy: true,  Icon: CloudFog },
  48: { label: 'Rime Fog',           labelHe: 'ערפיל כפור',      emoji: '🌫️',  cloudy: true,  Icon: CloudFog },
  51: { label: 'Light Drizzle',      labelHe: 'רסס קל',         emoji: '🌦️',  cloudy: true,  Icon: CloudRain },
  53: { label: 'Drizzle',            labelHe: 'רסס',            emoji: '🌦️',  cloudy: true,  Icon: CloudRain },
  55: { label: 'Heavy Drizzle',      labelHe: 'רסס כבד',        emoji: '🌧️',  cloudy: true,  Icon: CloudRain },
  56: { label: 'Freezing Drizzle',   labelHe: 'רסס קפוא',       emoji: '🌧️',  cloudy: true,  Icon: CloudRain },
  57: { label: 'Freezing Drizzle',   labelHe: 'רסס קפוא',       emoji: '🌧️',  cloudy: true,  Icon: CloudRain },
  61: { label: 'Light Rain',         labelHe: 'גשם קל',         emoji: '🌦️',  cloudy: true,  Icon: CloudRain },
  63: { label: 'Rain',               labelHe: 'גשם',            emoji: '🌧️',  cloudy: true,  Icon: CloudRain },
  65: { label: 'Heavy Rain',         labelHe: 'גשם כבד',        emoji: '🌧️',  cloudy: true,  Icon: CloudRain },
  66: { label: 'Freezing Rain',      labelHe: 'גשם קפוא',       emoji: '🌧️',  cloudy: true,  Icon: CloudRain },
  67: { label: 'Freezing Rain',      labelHe: 'גשם קפוא',       emoji: '🌧️',  cloudy: true,  Icon: CloudRain },
  71: { label: 'Light Snow',         labelHe: 'שלג קל',         emoji: '🌨️',  cloudy: true,  Icon: CloudSnow },
  73: { label: 'Snow',               labelHe: 'שלג',            emoji: '❄️',  cloudy: true,  Icon: CloudSnow },
  75: { label: 'Heavy Snow',         labelHe: 'שלג כבד',        emoji: '❄️',  cloudy: true,  Icon: CloudSnow },
  77: { label: 'Snow Grains',        labelHe: 'גרגרי שלג',     emoji: '🌨️',  cloudy: true,  Icon: CloudSnow },
  80: { label: 'Light Showers',      labelHe: 'ממטרים קלים',    emoji: '🌦️',  cloudy: true,  Icon: CloudRain },
  81: { label: 'Showers',            labelHe: 'ממטרים',         emoji: '🌧️',  cloudy: true,  Icon: CloudRain },
  82: { label: 'Violent Showers',    labelHe: 'ממטרים עזים',    emoji: '⛈️',  cloudy: true,  Icon: CloudRain },
  85: { label: 'Snow Showers',       labelHe: 'ממטרי שלג',     emoji: '🌨️',  cloudy: true,  Icon: CloudSnow },
  86: { label: 'Heavy Snow Showers', labelHe: 'ממטרי שלג כבדים', emoji: '❄️', cloudy: true,  Icon: CloudSnow },
  95: { label: 'Thunderstorm',       labelHe: 'סופת רעמים',     emoji: '⛈️',  cloudy: true,  Icon: CloudLightning },
  96: { label: 'Thunderstorm + Hail', labelHe: 'רעמים וברד',   emoji: '⛈️',  cloudy: true,  Icon: CloudLightning },
  99: { label: 'Thunderstorm + Hail', labelHe: 'רעמים וברד',   emoji: '⛈️',  cloudy: true,  Icon: CloudLightning },
};

export function getWeatherInfo(code) {
  return WMO_CODES[code] || WMO_CODES[0];
}

export function labelToCode(label) {
  const l = (label || '').toLowerCase();
  if (l.includes('partly')) return 2;
  if (l.includes('overcast') || l.includes('cloud')) return 3;
  if (l.includes('fog') || l.includes('mist')) return 45;
  if (l.includes('drizzle')) return 51;
  if (l.includes('rain') && l.includes('light')) return 61;
  if (l.includes('rain')) return 63;
  if (l.includes('snow') && l.includes('light')) return 71;
  if (l.includes('snow')) return 73;
  if (l.includes('thunder')) return 95;
  if (l.includes('shower')) return 81;
  if (l.includes('clear') || l.includes('sunny')) return 0;
  return 1;
}