import fs from 'node:fs';
const checks = [
 ['src/components/ui/toast.jsx', 'Dismiss notification'],
 ['src/components/PdfPreviewModal.jsx', 'aria-modal="true"'],
 ['src/components/PdfPreviewModal.jsx', 'Zoom in'],
 ['src/components/PdfPreviewModal.jsx', 'Zoom out'],
 ['src/components/InteractiveDayScrubber.jsx', 'aria-label="Explore time of day"'],
 ['src/components/LocationSearch.jsx', 'aria-label="Search city or address"'],
 ['src/pages/MapPicker.jsx', 'aria-label="Search map location"'],
 ['src/components/SolarInfoPanel.jsx', 'aria-labelledby="today-sun-title"'],
 ['src/components/moon/MoonSheet.jsx', 'aria-labelledby="today-moon-title"'],
];
const issues=[];
for (const [file,needle] of checks) {
 const s=fs.readFileSync(file,'utf8');
 if (!s.includes(needle)) issues.push(`${file} missing accessibility marker: ${needle}`);
}
if (issues.length) { console.error('Accessibility validation failed:\n- '+issues.join('\n- ')); process.exit(1); }
console.log('Accessibility validation passed: dialogs, icon actions, scrubber, location search, and Sun/Moon sheets checked.');