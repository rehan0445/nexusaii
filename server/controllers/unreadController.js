// Returns unread counters for arena, campus, companion
export const getUnread = (req, res) => {
  // For now, return static numbers to unblock client; later wire to DB
  res.json({ success: true, data: { arena: 3, campus: 1, companion: 2 } });
};

export default { getUnread };


