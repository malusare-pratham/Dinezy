const IST_OFFSET_MINUTES = 5 * 60 + 30;

export const getISTDateKey = (date = new Date()) => {
  const d = date instanceof Date ? date : new Date(date);
  if(Number.isNaN(d.getTime())) return null;

  const utcMs = d.getTime() + d.getTimezoneOffset() * 60 * 1000;
  const istMs = utcMs + IST_OFFSET_MINUTES * 60 * 1000;
  const istDate = new Date(istMs);

  const y = istDate.getUTCFullYear();
  const m = String(istDate.getUTCMonth() + 1).padStart(2,'0');
  const day = String(istDate.getUTCDate()).padStart(2,'0');

  return `${y}-${m}-${day}`;
};

export const getUtcRangeForISTDateKey = (dateKey) => {
  const key = String(dateKey || '').trim();
  const m = key.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if(!m) return null;

  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);

  if(!Number.isFinite(y) || !Number.isFinite(mo) || !Number.isFinite(d)){
    return null;
  }

  const startUtcMs =
    Date.UTC(y, mo - 1, d, 0, 0, 0, 0) - (IST_OFFSET_MINUTES * 60 * 1000);

  const endUtcMs = startUtcMs + 24 * 60 * 60 * 1000;

  return {
    start:new Date(startUtcMs),
    end:new Date(endUtcMs)
  };
};

