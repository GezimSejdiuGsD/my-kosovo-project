// lib/utils.ts
export function generateSlots(start: string, end: string, duration: number) {
  const slots = [];
  let current = new Date(`2026-01-01T${start}:00`);
  const stop = new Date(`2026-01-01T${end}:00`);

  while (current < stop) {
    slots.push(current.toLocaleTimeString('sq-AL', { hour: '2-digit', minute: '2-digit' }));
    current.setMinutes(current.getMinutes() + duration);
  }
  return slots;
}