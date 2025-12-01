const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const auth = require('../middleware/auth');

// Get all payments
router.get('/', auth, async (req, res) => {
  try {
    const { data: payments, error } = await supabase
      .from('payments')
      .select(`
        *,
        machine_owner:machine_owners(*),
        farmer:farmers(*),
        job:harvesting_jobs(*)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(payments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get payments by type
router.get('/type/:type', auth, async (req, res) => {
  try {
    const { data: payments, error } = await supabase
      .from('payments')
      .select(`
        *,
        machine_owner:machine_owners(*),
        farmer:farmers(*),
        job:harvesting_jobs(*)
      `)
      .eq('type', req.params.type);

    if (error) throw error;
    res.json(payments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get payments by machine owner
router.get('/machine-owner/:ownerId', auth, async (req, res) => {
  try {
    const { data: payments, error } = await supabase
      .from('payments')
      .select(`
        *,
        machine_owner:machine_owners(*),
        job:harvesting_jobs(*)
      `)
      .eq('machine_owner_id', req.params.ownerId);

    if (error) throw error;
    res.json(payments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get payments by farmer
router.get('/farmer/:farmerId', auth, async (req, res) => {
  try {
    const { data: payments, error } = await supabase
      .from('payments')
      .select(`
        *,
        farmer:farmers(*),
        job:harvesting_jobs(*)
      `)
      .eq('farmer_id', req.params.farmerId);

    if (error) throw error;
    res.json(payments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create payment
router.post('/', auth, async (req, res) => {
  try {
    const { machine, machineOwner, farmer, job, businessSource, amount, discountAmount, ...paymentData } = req.body;

    const grossAmount = parseFloat(amount) || 0;
    const discount = parseFloat(discountAmount) || 0;
    const netAmount = grossAmount - discount;

    // Validate discount
    if (discount < 0 || discount > grossAmount) {
      return res.status(400).json({ error: 'Discount must be between 0 and gross amount' });
    }

    // Insert payment
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        ...paymentData,
        amount: netAmount,
        gross_amount: grossAmount,
        discount_amount: discount,
        machine_id: machine || null,
        machine_owner_id: machineOwner || null,
        farmer_id: farmer || null,
        job_id: job || null,
        business_source: businessSource || 'harvesting'
      })
      .select()
      .single();

    if (paymentError) throw paymentError;

    // Update machine owner or farmer amounts (using net amount after discount)
    if (payment.type === 'To Machine Owner' && machineOwner) {
      const { data: owner } = await supabase
        .from('machine_owners')
        .select('total_amount_paid, total_amount_pending')
        .eq('id', machineOwner)
        .single();

      await supabase
        .from('machine_owners')
        .update({
          total_amount_paid: (owner.total_amount_paid || 0) + netAmount,
          total_amount_pending: (owner.total_amount_pending || 0) - netAmount
        })
        .eq('id', machineOwner);
    } else if (payment.type === 'From Farmer' && farmer) {
      const { data: farmerData } = await supabase
        .from('farmers')
        .select('total_amount_paid, total_amount_pending')
        .eq('id', farmer)
        .single();

      await supabase
        .from('farmers')
        .update({
          total_amount_paid: (farmerData.total_amount_paid || 0) + netAmount,
          total_amount_pending: (farmerData.total_amount_pending || 0) - netAmount
        })
        .eq('id', farmer);
    }

    // Fetch complete payment with relations
    const { data: completePayment, error: fetchError } = await supabase
      .from('payments')
      .select(`
        *,
        machine_owner:machine_owners(*),
        farmer:farmers(*),
        job:harvesting_jobs(*)
      `)
      .eq('id', payment.id)
      .single();

    if (fetchError) throw fetchError;
    res.status(201).json(completePayment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update payment
router.put('/:id', auth, async (req, res) => {
  try {
    const { machine, machineOwner, farmer, job, ...paymentData } = req.body;
    
    const updateData = {
      ...paymentData,
      ...(machine && { machine_id: machine }),
      ...(machineOwner && { machine_owner_id: machineOwner }),
      ...(farmer && { farmer_id: farmer }),
      ...(job && { job_id: job })
    };

    const { data: payment, error } = await supabase
      .from('payments')
      .update(updateData)
      .eq('id', req.params.id)
      .select(`
        *,
        machine_owner:machine_owners(*),
        farmer:farmers(*),
        job:harvesting_jobs(*)
      `)
      .single();

    if (error) throw error;
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    res.json(payment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete payment
router.delete('/:id', auth, async (req, res) => {
  try {
    // Get payment details first
    const { data: payment, error: getError } = await supabase
      .from('payments')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (getError) throw getError;
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    // Revert amounts
    if (payment.type === 'To Machine Owner' && payment.machine_owner_id) {
      const { data: owner } = await supabase
        .from('machine_owners')
        .select('total_amount_paid, total_amount_pending')
        .eq('id', payment.machine_owner_id)
        .single();

      await supabase
        .from('machine_owners')
        .update({
          total_amount_paid: (owner.total_amount_paid || 0) - payment.amount,
          total_amount_pending: (owner.total_amount_pending || 0) + payment.amount
        })
        .eq('id', payment.machine_owner_id);
    } else if (payment.type === 'From Farmer' && payment.farmer_id) {
      const { data: farmerData } = await supabase
        .from('farmers')
        .select('total_amount_paid, total_amount_pending')
        .eq('id', payment.farmer_id)
        .single();

      await supabase
        .from('farmers')
        .update({
          total_amount_paid: (farmerData.total_amount_paid || 0) - payment.amount,
          total_amount_pending: (farmerData.total_amount_pending || 0) + payment.amount
        })
        .eq('id', payment.farmer_id);
    }

    // Delete payment
    const { error: deleteError } = await supabase
      .from('payments')
      .delete()
      .eq('id', req.params.id);

    if (deleteError) throw deleteError;
    res.json({ message: 'Payment deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
