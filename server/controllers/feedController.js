// Simple in-memory mock data with cursor pagination
const PAGE_SIZE_DEFAULT = 20;

const mockRecommendations = Array.from({ length: 200 }).map((_, i) => ({
  id: `rec_${i + 1}`,
  title: `Recommended item #${i + 1}`,
  createdAt: Date.now() - i * 60_000,
}));

const mockUpdates = Array.from({ length: 200 }).map((_, i) => ({
  id: `upd_${i + 1}`,
  type: i % 2 === 0 ? "info" : "group",
  summary: `Update #${i + 1}`,
  createdAt: Date.now() - i * 45_000,
}));

function paginate(list, cursor, limit) {
  const start = cursor ? parseInt(cursor, 10) : 0;
  const slice = list.slice(start, start + limit);
  const nextCursor = start + limit < list.length ? String(start + limit) : null;
  return { items: slice, nextCursor };
}

export const getRecommendations = (req, res) => {
  const limit = Math.min(parseInt(req.query.limit || PAGE_SIZE_DEFAULT, 10), 100);
  const { items, nextCursor } = paginate(mockRecommendations, req.query.cursor, limit);
  res.json({ success: true, data: { items, nextCursor } });
};

export const getUpdates = (req, res) => {
  const limit = Math.min(parseInt(req.query.limit || PAGE_SIZE_DEFAULT, 10), 100);
  const { items, nextCursor } = paginate(mockUpdates, req.query.cursor, limit);
  res.json({ success: true, data: { items, nextCursor } });
};

export default { getRecommendations, getUpdates };


