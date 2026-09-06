const DB_SILENCE = -96;
const DB_RANGE = 96;
const DB_OFFSET = 6;

export function obsFaderToDb(deflection: number) {
  if (deflection <= 0) return -100;
  if (deflection >= 1) return 0;
  return -(DB_RANGE + DB_OFFSET) * Math.pow((DB_RANGE + DB_OFFSET) / DB_OFFSET, -deflection) + DB_OFFSET;
}

export function obsDbToFader(db: number) {
  if (db <= DB_SILENCE) return 0;
  if (db >= 0) return 1;
  return Math.log((DB_RANGE + DB_OFFSET) / (DB_OFFSET - db)) / Math.log((DB_RANGE + DB_OFFSET) / DB_OFFSET);
}

export const formatObsDb = (db: number) => db <= DB_SILENCE ? '−∞ dB' : `${db.toFixed(1)} dB`;
