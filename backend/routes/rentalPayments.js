const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const auth = require('../middleware/auth');

// Get all rental payments
router.get('/', auth, async (req, res) => {
  try {
    const { data: payments, error } = await supabase
      .from('rental_payments')
      .select(`
        *,
        rental:machine_rentals(*, machine:machines(*)),
        dealer:dealers(*)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(payments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get payments by rental
router.get('/rental/:rentalId', auth, async (req, res) => {
  try {
    const { data: payments, error } = await supabase
      .from('rental_payments')
      .select(`
        *,
        rental:machine_rentals(*, machine:machines(*)),
        dealer:dealers(*)
      `)
      .eq('rental_id', req.params.rentalId);

    if (error) throw error;
    res.json(payments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get payments by dealer
router.get('/dealer/:dealerId', auth, async (req, res) => {
  try {
    const { data: payments, error } = await supabase
      .from('rental_payments')
      .select(`
        *,
        rental:machine_rentals(*, machine:machines(*)),
        dealer:dealers(*)
      `)
      .eq('dealer_id', req.params.dealerId);

    if (error) throw error;
    res.json(payments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create payment
router.post('/', auth, async (req, res) => {
  try {
    const { data: payment, error: paymentError } = await supabase
      .from('rental_payments')
      .insert(req.body)
      .select(`
        *,
        rental:machine_rentals(*, machine:machines(*)),
        dealer:dealers(*)
      `)
      .single();

    if (paymentError) throw paymentError;

    // Update dealer's pending and paid amounts
    const { data: dealer } = await supabase
      .from('dealers')
      .select('total_amount_paid, total_amount_pending')
      .eq('id', req.body.dealer_id)
      .single();

    if (dealer) {
      await supabase
        .from('dealers')
        .update({
          total_amount_paid: (dealer.total_amount_paid || 0) + payment.amount,
          total_amount_pending: Math.max(0, (dealer.total_amount_pending || 0) - payment.amount)
        })
        .eq('id', req.body.dealer_id);
    }

    res.status(201).json(payment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update payment
router.put('/:id', auth, async (req, res) => {
  try {
    const { data: payment, error } = await supabase
      .from('rental_payments')
      .update(req.body)
      .eq('id', req.params.id)
      .select(`
        *,
        rental:machine_rentals(*, machine:machines(*)),
        dealer:dealers(*)
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
      .from('rental_payments')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (getError) throw getError;
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    // Revert dealer amounts
    const { data: dealer } = await supabase
      .from('dealers')
      .select('total_amount_paid, total_amount_pending')
      .eq('id', payment.dealer_id)
      .single();

    if (dealer) {
      await supabase
        .from('dealers')
        .update({
          total_amount_paid: Math.max(0, (dealer.total_amount_paid || 0) - payment.amount),
          total_amount_pending: (dealer.total_amount_pending || 0) + payment.amount
        })
        .eq('id', payment.dealer_id);
    }

    // Delete payment
    const { error: deleteError } = await supabase
      .from('rental_payments')
      .delete()
      .eq('id', req.params.id);

    if (deleteError) throw deleteError;
    res.json({ message: 'Payment deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
