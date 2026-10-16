import { events } from './events';
import { education, internships, work } from './experience';
import { helios, lumina, novaCare, selfHealing } from './projects';

/** Every draft the owner still has to confirm or edit, with where it shows on the page. */
export function drafts(): { where: string; note: string }[] {
  const list = [
    ...events.map((e) => ({ where: `Events · ${e.title}`, note: e.draft })),
    ...work.map((r) => ({ where: `Work · ${r.org}`, note: r.draft })),
    ...internships.map((e) => ({ where: `Internships · ${e.org}`, note: e.draft })),
    ...education.map((e) => ({ where: `Education · ${e.title}`, note: e.draft })),
    ...[selfHealing, helios, novaCare, lumina].map((p) => ({ where: `Projects · ${p.name}`, note: p.draft })),
  ];
  return list.filter((d): d is { where: string; note: string } => !!d.note);
}
