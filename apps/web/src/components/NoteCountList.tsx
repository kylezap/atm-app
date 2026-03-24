import type { NoteCounts } from "@atm/shared";

interface NoteCountListProps {
  notes: NoteCounts;
}

export function NoteCountList({ notes }: NoteCountListProps) {
  return (
    <ul className="atm-bullet-list">
      <li>£20 notes: {notes[20]}</li>
      <li>£10 notes: {notes[10]}</li>
      <li>£5 notes: {notes[5]}</li>
    </ul>
  );
}
