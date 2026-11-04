const express  = require('express');
const router   = express.Router();
const axios    = require('axios');
const Payroll  = require('../models/Payroll');
const Attendance = require('../models/Attendance');
const { protect, authorize } = require('../middleware/authMiddleware');
const getChapaSecretKey = require('../utils/chapaConfig');

const MGMT   = ['owner', 'admin', 'office_manager'];
const VIEWER = ['owner', 'admin', 'office_manager', 'farmer', 'labor'];

// ── GET /api/payroll — list payroll records ───────────────────────────────
router.get('/', protect, authorize(...VIEWER), async (req, res) => {
  try {
    const { farmId, period, userId } = req.query;
    const query = {};

    if (farmId)  query.farmId = farmId;
    if (period)  query.period = period;

    // Labour only see their own records
    const role = req.user.assignedRole || req.user.role;
    if (role === 'labor') {
      query.userId = req.user._id;
    } else if (userId) {
      query.userId = userId;
    }

    const records = await Payroll.find(query)
      .populate('userId', 'name email assignedRole role')
      .populate('farmId', 'name')
      .populate('processedBy', 'name email')
      .populate('approvedBy',  'name email')
      .sort({ period: -1, createdAt: -1 });

    res.json(records);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch payroll', details: err.message });
  }
});

// ── GET /api/payroll/:id ──────────────────────────────────────────────────
router.get('/:id', protect, authorize(...MGMT, 'labor'), async (req, res) => {
  try {
    const record = await Payroll.findById(req.params.id)
      .populate('userId', 'name email role')
      .populate('farmId', 'name')
      .populate('processedBy', 'name email');
    if (!record) return res.status(404).json({ error: 'Payroll record not found' });

    // Labour may only view their own
    if ((req.user.assignedRole || req.user.role) === 'labor' &&
        record.userId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Access denied' });
    }
    res.json(record);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch payroll record', details: err.message });
  }
});

// ── POST /api/payroll — create a payroll record ───────────────────────────
router.post('/', protect, authorize(...MGMT), async (req, res) => {
  try {
    const { userId, farmId, period, baseSalary, bonus, deductions, notes } = req.body;
    if (!userId || !farmId || !period || baseSalary == null) {
      return res.status(400).json({ error: 'userId, farmId, period and baseSalary are required' });
    }

    const User = require('../models/User');
    const targetUser = await User.findById(userId);
    if (!targetUser) return res.status(404).json({ error: 'User not found' });
    if (targetUser.assignedRole === 'owner' || targetUser.role === 'owner') {
      return res.status(403).json({ error: 'Cannot create payroll for the owner' });
    }

    // Auto-fill attendance stats for the period from Attendance collection
    const attendanceRecords = await Attendance.find({
      userId, farmId,
      date: { $regex: `^${period}` },
    }).lean();

    const daysPresent = attendanceRecords.filter(r => r.status !== 'absent').length;
    const hoursWorked = parseFloat(
      attendanceRecords.reduce((s, r) => s + (r.hoursWorked || 0), 0).toFixed(2)
    );

    const record = await Payroll.create({
      userId, farmId, period,
      baseSalary: Number(baseSalary),
      bonus:      Number(bonus      || 0),
      deductions: Number(deductions || 0),
      hoursWorked,
      daysPresent,
      notes,
      processedBy: req.user._id,
    });

    await record.populate([
      { path: 'userId', select: 'name email' },
      { path: 'farmId', select: 'name' },
    ]);
    res.status(201).json(record);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: `Payroll for this worker in period ${req.body.period} already exists` });
    }
    res.status(500).json({ error: 'Failed to create payroll', details: err.message });
  }
});

// ── PUT /api/payroll/:id — update / mark paid ────────────────────────────
router.put('/:id', protect, authorize(...MGMT), async (req, res) => {
  try {
    const record = await Payroll.findById(req.params.id);
    if (!record) return res.status(404).json({ error: 'Payroll record not found' });

    const allowed = ['baseSalary', 'bonus', 'deductions', 'paymentStatus', 'notes'];
    allowed.forEach(f => { if (req.body[f] !== undefined) record[f] = req.body[f]; });

    if (req.body.paymentStatus === 'paid' && !record.paidAt) {
      record.paidAt      = new Date();
      record.processedBy = req.user._id;
    }

    await record.save(); // triggers pre-save netPay computation
    await record.populate([
      { path: 'userId', select: 'name email' },
      { path: 'farmId', select: 'name' },
      { path: 'processedBy', select: 'name email' },
    ]);
    res.json(record);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update payroll', details: err.message });
  }
});

// ── POST /api/payroll/:id/submit — OM submits for owner approval ────────
// Spec §32: Office Manager prepares → submits → Owner reviews → approves
router.post('/:id/submit', protect, authorize('office_manager', 'admin'), async (req, res) => {
  try {
    const record = await Payroll.findById(req.params.id);
    if (!record) return res.status(404).json({ error: 'Payroll record not found' });
    if (record.paymentStatus !== 'pending') {
      return res.status(400).json({ error: `Payroll is already ${record.paymentStatus}` });
    }
    record.paymentStatus = 'submitted';
    record.processedBy   = req.user._id;
    await record.save();
    res.json({ message: 'Payroll submitted for owner approval', record });
  } catch (err) {
    res.status(500).json({ error: 'Failed to submit payroll', details: err.message });
  }
});

// ── POST /api/payroll/:id/approve — Owner gives final approval ───────────
// Spec §17, §60: Only the Owner can give final payroll approval
router.post('/:id/approve', protect, authorize('owner'), async (req, res) => {
  try {
    const record = await Payroll.findById(req.params.id);
    if (!record) return res.status(404).json({ error: 'Payroll record not found' });
    if (!['submitted','pending'].includes(record.paymentStatus)) {
      return res.status(400).json({ error: `Payroll is already ${record.paymentStatus}` });
    }

    record.paymentStatus = 'approved';
    record.approvedBy    = req.user._id;
    await record.save();

    await record.populate([
      { path: 'userId', select: 'name email' },
      { path: 'farmId', select: 'name' },
    ]);

    // Notify the worker
    try {
      const notifSvc = require('../services/notificationService');
      if (record.userId?.email) {
        await notifSvc.sendAlertEmail(
          record.userId.email,
          `Salary Approved — ${record.period}`,
          `Your salary for <strong>${record.period}</strong> of <strong>ETB ${record.netPay?.toLocaleString()}</strong> has been approved and is pending payment.`
        );
      }
    } catch {}

    res.json({ message: 'Payroll approved and pending payment', record });
  } catch (err) {
    res.status(500).json({ error: 'Failed to approve payroll', details: err.message });
  }
});

// ── POST /api/payroll/:id/reject — Owner rejects payroll ─────────────────
router.post('/:id/reject', protect, authorize('owner'), async (req, res) => {
  try {
    const record = await Payroll.findById(req.params.id);
    if (!record) return res.status(404).json({ error: 'Payroll record not found' });

    record.paymentStatus = 'pending'; // return to pending for OM to revise
    record.notes = (record.notes ? record.notes + '\n' : '') +
      `[Rejected by Owner ${new Date().toLocaleDateString()}: ${req.body.reason || 'No reason given'}]`;
    await record.save();
    res.json({ message: 'Payroll rejected. Office Manager must revise.', record });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reject payroll', details: err.message });
  }
});

// ── DELETE /api/payroll/:id — admin only ─────────────────────────────────
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const record = await Payroll.findByIdAndDelete(req.params.id);
    if (!record) return res.status(404).json({ error: 'Payroll record not found' });
    res.json({ message: 'Payroll record deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete payroll', details: err.message });
  }
});

// ── POST /api/payroll/:id/pay — Initiate Chapa Transfer (Payout) ─────────────
// Spec: Office Manager pays using Chapa on payroll page
router.post('/:id/pay', protect, authorize('office_manager', 'admin', 'owner'), async (req, res) => {
  try {
    const record = await Payroll.findById(req.params.id).populate('userId');
    if (!record) return res.status(404).json({ error: 'Payroll record not found' });
    if (record.paymentStatus !== 'approved') {
      return res.status(400).json({ error: `Payroll is ${record.paymentStatus}, needs to be 'approved' to pay.` });
    }
    const role = record.userId.assignedRole || record.userId.role;
    if (role === 'owner') {
      return res.status(403).json({ error: 'Owners cannot receive payroll payments.' });
    }

    if (!record.userId.bankCode || !record.userId.accountNumber) {
      return res.status(400).json({ 
        error: 'Employee missing bank details. Please update their profile with a Chapa bank code and account number.' 
      });
    }

    const tx_ref = `pr-${record._id.toString()}-${Date.now().toString().slice(-7)}`;
    const amount = record.netPay;

    const chapaPayload = {
      account_name: record.userId.accountName || record.userId.name,
      account_number: record.userId.accountNumber,
      amount: amount.toString(),
      currency: 'ETB',
      reference: tx_ref,
      bank_code: record.userId.bankCode
    };

    const CHAPA_SECRET_KEY = getChapaSecretKey();
    if (!CHAPA_SECRET_KEY) {
      return res.status(503).json({ error: 'Chapa payments are not configured' });
    }

    // Call Chapa Transfers API
    const response = await axios.post('https://api.chapa.co/v1/transfers', chapaPayload, {
      headers: {
        Authorization: `Bearer ${CHAPA_SECRET_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.data.status === 'success') {
      res.json({ message: 'Transfer initiated successfully', transfer_id: response.data.data.id, tx_ref });
    } else {
      res.status(400).json({ error: 'Failed to initialize Chapa transfer', details: response.data });
    }
  } catch (err) {
    const chapaError = err.response?.data?.message || err.response?.data || err.message;
    res.status(500).json({ error: 'Failed to initiate transfer', details: chapaError });
  }
});

// ── GET /api/payroll/verify-payment/:tx_ref — Verify Chapa Transfer ─────────
router.get('/verify-payment/:tx_ref', protect, authorize('office_manager', 'admin', 'owner'), async (req, res) => {
  try {
    const { tx_ref } = req.params;
    const CHAPA_SECRET_KEY = getChapaSecretKey();
    if (!CHAPA_SECRET_KEY) {
      return res.status(503).json({ error: 'Chapa payments are not configured' });
    }

    let isSuccess = false;

    {
      try {
        const response = await axios.get(`https://api.chapa.co/v1/transfers/verify/${tx_ref}`, {
          headers: {
            Authorization: `Bearer ${CHAPA_SECRET_KEY}`
          }
        });
        isSuccess = response.data.status === 'success';
      } catch (err) {
         // Some versions of Chapa API don't have a direct verify for transfers, relying on webhooks.
         // If it fails, we will throw.
         throw err;
      }
    }

    if (isSuccess) {
      // Extract payroll ID from tx_ref: tx-payroll-<id>-<timestamp>
      const parts = tx_ref.split('-');
      const payrollId = parts[1];
      
      const record = await Payroll.findById(payrollId).populate('userId');
      if (!record) return res.status(404).json({ error: 'Payroll record not found' });
      
      if (record.paymentStatus !== 'paid') {
        record.paymentStatus = 'paid';
        record.paidAt = new Date();
        record.processedBy = req.user._id;
        await record.save();

        // Notify the worker
        try {
          const notifSvc = require('../services/notificationService');
          if (record.userId?.email) {
            await notifSvc.sendAlertEmail(
              record.userId.email,
              `Salary Paid — ${record.period}`,
              `Your salary for <strong>${record.period}</strong> of <strong>ETB ${record.netPay?.toLocaleString()}</strong> has been successfully transferred to your account via Chapa.`
            );
          }
        } catch {}
      }

      res.json({ message: 'Transfer verified successfully', record });
    } else {
       res.status(400).json({ error: 'Transfer verification failed' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to verify transfer', details: err.message });
  }
});

module.exports = router;
