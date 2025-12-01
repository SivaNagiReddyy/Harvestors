const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const auth = require('../middleware/auth');

// Get all dealers
router.get('/', auth, async (req, res) => {
  try {
    const { data: dealers, error } = await supabase
      .from('dealers')
      .select('*')
      .order('name');

    if (error) throw error;

    // Get all rentals to calculate pending and paid amounts
    const { data: rentals } = await supabase
      .from('machine_rentals')
      .select('dealer_id, total_amount_charged, advance_paid');

    // Get all rental payments
    const { data: payments } = await supabase
      .from('rental_payments')
      .select('dealer_id, amount');

    // Calculate totals per dealer
    const dealerTotals = {};
    const dealerPaid = {};

    rentals?.forEach(rental => {
      const dealerId = rental.dealer_id;
      const totalCharged = parseFloat(rental.total_amount_charged || 0);
      const advancePaid = parseFloat(rental.advance_paid || 0);
      
      dealerTotals[dealerId] = (dealerTotals[dealerId] || 0) + totalCharged;
      dealerPaid[dealerId] = (dealerPaid[dealerId] || 0) + advancePaid;
    });

    payments?.forEach(payment => {
      const dealerId = payment.dealer_id;
      const amount = parseFloat(payment.amount || 0);
      dealerPaid[dealerId] = (dealerPaid[dealerId] || 0) + amount;
    });

    // Enrich dealers with calculated totals
    const enrichedDealers = dealers.map(dealer => ({
      ...dealer,
      total_amount_charged: dealerTotals[dealer.id] || 0,
      total_amount_paid: dealerPaid[dealer.id] || 0,
      balance_amount: (dealerTotals[dealer.id] || 0) - (dealerPaid[dealer.id] || 0)
    }));

    res.json(enrichedDealers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get dealer by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const { data: dealer, error } = await supabase
      .from('dealers')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error) throw error;
    if (!dealer) {
      return res.status(404).json({ error: 'Dealer not found' });
    }

    res.json(dealer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create dealer
router.post('/', auth, async (req, res) => {
  try {
    const { data: dealer, error } = await supabase
      .from('dealers')
      .insert(req.body)
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(dealer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update dealer
router.put('/:id', auth, async (req, res) => {
  try {
    const { data: dealer, error } = await supabase
      .from('dealers')
      .update(req.body)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    if (!dealer) {
      return res.status(404).json({ error: 'Dealer not found' });
    }

    res.json(dealer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete dealer
router.delete('/:id', auth, async (req, res) => {
  try {
    const { error } = await supabase
      .from('dealers')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ message: 'Dealer deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
