import React, { useEffect } from 'react';
import { Calendar, CloudSun, MapPin, Moon, RotateCcw, Search, Settings, TableProperties } from 'lucide-react';
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandShortcut } from '@/components/ui/command';

export default function DesktopCommandPalette({ open, onOpenChange, actions }) {
  useEffect(() => {
    const handler = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        onOpenChange(!open);
      }
      if (!event.ctrlKey && !event.metaKey && !event.altKey && !['INPUT','TEXTAREA'].includes(document.activeElement?.tagName)) {
        const key = event.key.toLowerCase();
        if (key === '/' ) { event.preventDefault(); actions.search?.(); }
        else if (key === 'c') actions.calendar?.();
        else if (key === 'm') actions.moon?.();
        else if (key === 's') actions.settings?.();
        else if (event.key === 'ArrowLeft') actions.prevDay?.();
        else if (event.key === 'ArrowRight') actions.nextDay?.();
        else if (key === 't') actions.today?.();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onOpenChange, actions]);

  const run = (fn) => { onOpenChange(false); requestAnimationFrame(() => fn?.()); };
  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search SolarZmanim commands…" aria-label="Search SolarZmanim commands" />
      <CommandList>
        <CommandEmpty>No matching command.</CommandEmpty>
        <CommandGroup heading="Navigation">
          <CommandItem onSelect={() => run(actions.today)}><RotateCcw/>Today<CommandShortcut>T</CommandShortcut></CommandItem>
          <CommandItem onSelect={() => run(actions.calendar)}><Calendar/>Calendar<CommandShortcut>C</CommandShortcut></CommandItem>
          <CommandItem onSelect={() => run(actions.monthly)}><TableProperties/>Monthly Zmanim</CommandItem>
          <CommandItem onSelect={() => run(actions.location)}><MapPin/>Locations</CommandItem>
        </CommandGroup>
        <CommandGroup heading="Tools">
          <CommandItem onSelect={() => run(actions.search)}><Search/>Search location/date/time<CommandShortcut>/</CommandShortcut></CommandItem>
          <CommandItem onSelect={() => run(actions.weather)}><CloudSun/>Weather</CommandItem>
          <CommandItem onSelect={() => run(actions.moon)}><Moon/>Sun &amp; Moon<CommandShortcut>M</CommandShortcut></CommandItem>
          <CommandItem onSelect={() => run(actions.settings)}><Settings/>Settings<CommandShortcut>S</CommandShortcut></CommandItem>
        </CommandGroup>
        <CommandGroup heading="Date">
          <CommandItem onSelect={() => run(actions.prevDay)}>Previous day<CommandShortcut>←</CommandShortcut></CommandItem>
          <CommandItem onSelect={() => run(actions.today)}><RotateCcw/>Today<CommandShortcut>T</CommandShortcut></CommandItem>
          <CommandItem onSelect={() => run(actions.nextDay)}>Next day<CommandShortcut>→</CommandShortcut></CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}