const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const auth = require('../middleware/auth');

// Get all advances
router.get('/', auth, async (req, res) => {
  try {
    const { data: advances, error } = await supabase
      .from('daily_advances')
      .select(`
        *,
        machines(*, machine_owners(*))
      `)
      .order('advance_date', { ascending: false });

    if (error) throw error;
    res.json(advances);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get advances by machine
router.get('/machine/:machineId', auth, async (req, res) => {
  try {
    const { data: advances, error } = await supabase
      .from('daily_advances')
      .select(`
        *,
        machines(*, machine_owners(*))
      `)
      .eq('machine_id', req.params.machineId)
      .order('advance_date', { ascending: false });

    if (error) throw error;
    res.json(advances);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single advance
router.get('/:id', auth, async (req, res) => {
  try {
    const { data: advance, error } = await supabase
      .from('daily_advances')
      .select(`
        *,
        machines(*, machine_owners(*))
      `)
      .eq('id', req.params.id)
      .single();

    if (error) throw error;
    if (!advance) {
      return res.status(404).json({ error: 'Advance not found' });
    }
    res.json(advance);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create advance
router.post('/', auth, async (req, res) => {
  try {
    const { machineId, amount, advanceDate, paidBy, notes } = req.body;

    // Insert advance
    const { data: advance, error: advanceError } = await supabase
      .from('daily_advances')
      .insert({
        machine_id: machineId,
        amount: parseFloat(amount),
        advance_date: advanceDate || new Date().toISOString().split('T')[0],
        paid_by: paidBy || 'Owner',
        notes: notes
      })
      .select()
      .single();

    if (advanceError) throw advanceError;

    // Update machine total_advances_given
    const { data: machineData } = await supabase
      .from('machines')
      .select('total_advances_given')
      .eq('id', machineId)
      .single();
    
    if (machineData) {
      await supabase
        .from('machines')
        .update({ 
          total_advances_given: (machineData.total_advances_given || 0) + parseFloat(amount) 
        })
        .eq('id', machineId);
    }

    // Fetch complete advance with relations
    const { data: completeAdvance, error: fetchError } = await supabase
      .from('daily_advances')
      .select(`
        *,
        machines(*, machine_owners(*))
      `)
      .eq('id', advance.id)
      .single();

    if (fetchError) throw fetchError;
    res.status(201).json(completeAdvance);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update advance
router.put('/:id', auth, async (req, res) => {
  try {
    const { machineId, amount, advanceDate, paidBy, notes } = req.body;
    
    // Get old advance to calculate difference
    const { data: oldAdvance } = await supabase
      .from('daily_advances')
      .select('amount, machine_id')
      .eq('id', req.params.id)
      .single();

    const updateData = {
      ...(machineId && { machine_id: machineId }),
      ...(amount && { amount: parseFloat(amount) }),
      ...(advanceDate && { advance_date: advanceDate }),
      ...(paidBy && { paid_by: paidBy }),
      notes: notes || null
    };

    const { data: advance, error } = await supabase
      .from('daily_advances')
      .update(updateData)
      .eq('id', req.params.id)
      .select(`
        *,
        machines(*, machine_owners(*))
      `)
      .single();

    if (error) throw error;
    if (!advance) {
      return res.status(404).json({ error: 'Advance not found' });
    }

    // Update machine total_advances_given if amount changed
    if (oldAdvance && amount && parseFloat(amount) !== oldAdvance.amount) {
      const difference = parseFloat(amount) - oldAdvance.amount;
      const { data: machineData } = await supabase
        .from('machines')
        .select('total_advances_given')
        .eq('id', oldAdvance.machine_id)
        .single();
      
      if (machineData) {
        await supabase
          .from('machines')
          .update({ 
            total_advances_given: (machineData.total_advances_given || 0) + difference 
          })
          .eq('id', oldAdvance.machine_id);
      }
    }

    res.json(advance);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete advance
router.delete('/:id', auth, async (req, res) => {
  try {
    // Get advance details first
    const { data: advance, error: getError } = await supabase
      .from('daily_advances')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (getError) throw getError;
    if (!advance) {
      return res.status(404).json({ error: 'Advance not found' });
    }

    // Update machine total_advances_given
    const { data: machineData } = await supabase
      .from('machines')
      .select('total_advances_given')
      .eq('id', advance.machine_id)
      .single();
    
    if (machineData) {
      await supabase
        .from('machines')
        .update({ 
          total_advances_given: Math.max(0, (machineData.total_advances_given || 0) - advance.amount) 
        })
        .eq('id', advance.machine_id);
    }

    // Delete advance
    const { error: deleteError } = await supabase
      .from('daily_advances')
      .delete()
      .eq('id', req.params.id);

    if (deleteError) throw deleteError;
    res.json({ message: 'Advance deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
