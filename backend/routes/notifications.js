const express      = require('express');
const router       = express.Router();
const Notification = require('../models/Notification');
const { protect }  = require('../middleware/authMiddleware');

/**
 * Build the MongoDB query for a user based on their role.
 */
async function buildQuery(user) {
  // We simply scope the query to this user's own notifications.
  // The backend business logic (taskController, server.js, billing.js)
  // is now responsible for deciding exactly who receives which notification 
  // by assigning it to their userId when creating it.
  return { userId: user._id };
}

// ── GET /api/notifications — role-filtered list ────────────────────────────
router.get('/', protect, async (req, res) => {
  try {
    const query = await buildQuery(req.user);
    const notifications = await Notification.find(query)
      .sort({ timestamp: -1 })
      .limit(100);
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// ── GET /api/notifications/unread-count ────────────────────────────────────
router.get('/unread-count', protect, async (req, res) => {
  try {
    const query = await buildQuery(req.user);
    query.read  = false;
    const count = await Notification.countDocuments(query);
    res.json({ count });
  } catch (err) {
    res.status(500).json({ error: 'Failed to count notifications' });
  }
});

// ── PUT /api/notifications/:id/read — mark one as read ────────────────────
router.put('/:id/read', protect, async (req, res) => {
  try {
    await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { $set: { read: true } }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to mark as read' });
  }
});

// ── PUT /api/notifications/read-all — mark all as read ────────────────────
router.put('/read-all', protect, async (req, res) => {
  try {
    const query = await buildQuery(req.user);
    await Notification.updateMany({ ...query, read: false }, { $set: { read: true } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to mark all as read' });
  }
});

// ── DELETE /api/notifications/:id ─────────────────────────────────────────
router.delete('/:id', protect, async (req, res) => {
  try {
    await Notification.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete notification' });
  }
});

// ── DELETE /api/notifications — clear all read notifications ──────────────
router.delete('/', protect, async (req, res) => {
  try {
    const query = await buildQuery(req.user);
    await Notification.deleteMany({ ...query, read: true });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to clear notifications' });
  }
});

module.exports = router;
