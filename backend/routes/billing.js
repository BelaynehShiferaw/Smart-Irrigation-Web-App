const express = require('express');
const router = express.Router();
const axios = require('axios');
const Invoice = require('../models/Invoice');
const { protect, authorize } = require('../middleware/authMiddleware');
const getChapaSecretKey = require('../utils/chapaConfig');

// ── GET /api/billing — List invoices for the user or farm ──────────────
router.get('/', protect, async (req, res) => {
  try {
    const role = req.user.assignedRole || req.user.role;
    let query = {};
    
    // Admins and Office Managers can see all invoices. Owners/Farmers see only invoices billed to them.
    if (role !== 'admin' && role !== 'office_manager') {
      query.billedTo = req.user._id;
    }
    
    const invoices = await Invoice.find(query)
      .populate('farmId', 'name location')
      .populate('billedTo', 'name email')
      .sort({ createdAt: -1 });
      
    res.json(invoices);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch invoices', details: err.message });
  }
});

// ── POST /api/billing — Create a new invoice (Admin/System only) ───────
router.post('/', protect, authorize('office_manager'), async (req, res) => {
  try {
    const { farmId, billedTo, amount, purpose, dueDate } = req.body;
    if (!farmId || !billedTo || !amount || !purpose) {
      return res.status(400).json({ error: 'farmId, billedTo, amount, and purpose are required' });
    }
    
    const invoice = new Invoice({
      farmId, billedTo, amount, purpose, dueDate
    });
    
    await invoice.save();
    try {
      const Notification = require('../models/Notification');
      const _n = await Notification.create({ userId: billedTo, farmId: farmId, type: 'info', priority: 'normal', message: `New Invoice Generated: ETB ${amount} for ${purpose}`, sourceRef: { kind: 'Expense', item: invoice._id } });
      if (req.app) req.app.get('io')?.emit('system:alert', _n);
    } catch(e) { console.error('Notification error:', e); }

    res.status(201).json(invoice);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create invoice', details: err.message });
  }
});

  // ── POST /api/billing/:id/pay — Initiate Chapa Payment ─────────────────
router.post('/:id/pay', protect, async (req, res) => {
  try {
    const role = req.user.assignedRole || req.user.role;
    const invoice = await Invoice.findById(req.params.id).populate('billedTo', 'name email');
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    if (invoice.status === 'paid') return res.status(400).json({ error: 'Invoice is already paid' });
    
    // Only the person billed, an admin, or an office manager can pay it
    if (invoice.billedTo._id.toString() !== req.user._id.toString() && role !== 'admin' && role !== 'office_manager') {
      return res.status(403).json({ error: 'You are not authorized to pay this invoice' });
    }

    const tx_ref = `tx-invoice-${invoice._id}-${Date.now()}`;
    const amount = invoice.amount;
    const email = invoice.billedTo.email || 'customer@example.com';
    const first_name = invoice.billedTo.name.split(' ')[0];
    const last_name = invoice.billedTo.name.split(' ').slice(1).join(' ') || 'Customer';

    const chapaPayload = {
      amount: amount.toString(),
      currency: 'ETB',
      email: email,
      first_name: first_name,
      last_name: last_name,
      tx_ref: tx_ref,
      callback_url: `http://localhost:5173/billing?verify=${tx_ref}`,
      return_url: `http://localhost:5173/billing?verify=${tx_ref}`,
      customization: {
        title: 'SmartIrrigate',
        description: invoice.purpose.replace(/[^a-zA-Z0-9\s\-_.]/g, '')
      }
    };

    const CHAPA_SECRET_KEY = getChapaSecretKey();
    if (!CHAPA_SECRET_KEY) {
      return res.status(503).json({ error: 'Chapa payments are not configured' });
    }

    const response = await axios.post('https://api.chapa.co/v1/transaction/initialize', chapaPayload, {
      headers: {
        Authorization: `Bearer ${CHAPA_SECRET_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.data.status === 'success') {
      res.json({ checkout_url: response.data.data.checkout_url, tx_ref });
    } else {
      res.status(400).json({ error: 'Failed to initialize Chapa payment', details: response.data });
    }
  } catch (err) {
    const chapaError = err.response?.data?.message || err.response?.data || err.message;
    res.status(500).json({ error: 'Failed to initiate payment', details: chapaError });
  }
});

// ── GET /api/billing/verify-payment/:tx_ref — Verify Chapa Payment ─────
router.get('/verify-payment/:tx_ref', protect, async (req, res) => {
  try {
    const { tx_ref } = req.params;
    const CHAPA_SECRET_KEY = getChapaSecretKey();
    if (!CHAPA_SECRET_KEY) {
      return res.status(503).json({ error: 'Chapa payments are not configured' });
    }

    const response = await axios.get(`https://api.chapa.co/v1/transaction/verify/${tx_ref}`, {
        headers: {
          Authorization: `Bearer ${CHAPA_SECRET_KEY}`
        }
      });
    const isSuccess = response.data.status === 'success';
    if (!isSuccess) {
      return res.status(400).json({ error: 'Payment verification failed', details: response.data });
    }

    const parts = tx_ref.split('-');
    const invoiceId = parts[2];
      
      const invoice = await Invoice.findById(invoiceId);
      if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
      
      if (invoice.status !== 'paid') {
        invoice.status = 'paid';
        invoice.paidAt = new Date();
        invoice.tx_ref = tx_ref;
        await invoice.save();
        try {
          const Notification = require('../models/Notification');
          const User = require('../models/User');
          const managers = await User.find({ $or: [{ role: 'owner' }, { role: 'admin' }, { role: 'office_manager' }] });
          for (const m of managers) {
            const _n = await Notification.create({
              userId: m._id,
              farmId: invoice.farmId,
              type: 'success',
              priority: 'normal',
              message: `Invoice Paid: ETB ${invoice.amount} for ${invoice.purpose}`,
              sourceRef: { kind: 'Expense', item: invoice._id }
            });
            if (req.app) req.app.get('io')?.emit('system:alert', _n);
          }
        } catch(e) { console.error('Notification error:', e); }
      }

    res.json({ message: 'Payment verified successfully', invoice });
  } catch (err) {
    res.status(500).json({ error: 'Failed to verify payment', details: err.message });
  }
});

module.exports = router;
