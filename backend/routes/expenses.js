const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const auth = require('../middleware/auth');

// Get all expenses
router.get('/', auth, async (req, res) => {
  try {
    const { data: expenses, error } = await supabase
      .from('daily_expenses')
      .select(`
        *,
        machines(*, machine_owners(*))
      `)
      .order('expense_date', { ascending: false });

    if (error) throw error;
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get expenses by machine
router.get('/machine/:machineId', auth, async (req, res) => {
  try {
    const { data: expenses, error } = await supabase
      .from('daily_expenses')
      .select(`
        *,
        machines(*, machine_owners(*))
      `)
      .eq('machine_id', req.params.machineId)
      .order('expense_date', { ascending: false });

    if (error) throw error;
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get expenses by machine owner
router.get('/owner/:ownerId', auth, async (req, res) => {
  try {
    // First get all machines for this owner
    const { data: machines, error: machinesError } = await supabase
      .from('machines')
      .select('id')
      .eq('machine_owner_id', req.params.ownerId);

    if (machinesError) throw machinesError;

    const machineIds = machines.map(m => m.id);

    // Then get all expenses for these machines
    const { data: expenses, error } = await supabase
      .from('daily_expenses')
      .select(`
        *,
        machines(*, machine_owners(*))
      `)
      .in('machine_id', machineIds)
      .order('expense_date', { ascending: false });

    if (error) throw error;
    res.json(expenses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single expense
router.get('/:id', auth, async (req, res) => {
  try {
    const { data: expense, error } = await supabase
      .from('daily_expenses')
      .select(`
        *,
        machines(*, machine_owners(*))
      `)
      .eq('id', req.params.id)
      .single();

    if (error) throw error;
    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }
    res.json(expense);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create expense
router.post('/', auth, async (req, res) => {
  try {
    const { machine, expenseDate, amount, notes } = req.body;

    console.log('Creating expense:', { machine, expenseDate, amount, notes });

    const { data: expense, error } = await supabase
      .from('daily_expenses')
      .insert({
        machine_id: machine,
        expense_date: expenseDate,
        amount: parseFloat(amount),
        notes: notes || null
      })
      .select(`
        *,
        machines(*, machine_owners(*))
      `)
      .single();

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }
    res.status(201).json(expense);
  } catch (error) {
    console.error('Error creating expense:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update expense
router.put('/:id', auth, async (req, res) => {
  try {
    const { machine, expenseDate, amount, notes } = req.body;

    const updateData = {
      ...(machine && { machine_id: machine }),
      ...(expenseDate && { expense_date: expenseDate }),
      ...(amount !== undefined && { amount: parseFloat(amount) }),
      notes: notes || null
    };

    const { data: expense, error } = await supabase
      .from('daily_expenses')
      .update(updateData)
      .eq('id', req.params.id)
      .select(`
        *,
        machines(*, machine_owners(*))
      `)
      .single();

    if (error) throw error;
    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    res.json(expense);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete expense
router.delete('/:id', auth, async (req, res) => {
  try {
    const { error } = await supabase
      .from('daily_expenses')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get expense summary by machine
router.get('/summary/by-machine', auth, async (req, res) => {
  try {
    const { data: expenses, error } = await supabase
      .from('daily_expenses')
      .select(`
        machine_id,
        amount,
        machines(machine_type, machine_number, driver_name, machine_owners(name))
      `);

    if (error) throw error;

    // Group by machine and calculate totals
    const summary = expenses.reduce((acc, exp) => {
      const machineId = exp.machine_id;
      if (!acc[machineId]) {
        acc[machineId] = {
          machine_id: machineId,
          machine: exp.machines,
          total_expenses: 0,
          count: 0
        };
      }
      acc[machineId].total_expenses += parseFloat(exp.amount || 0);
      acc[machineId].count += 1;
      return acc;
    }, {});

    res.json(Object.values(summary));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get expense summary by owner
router.get('/summary/by-owner', auth, async (req, res) => {
  try {
    const { data: expenses, error } = await supabase
      .from('daily_expenses')
      .select(`
        machine_id,
        amount,
        machines(machine_owner_id, machine_owners(name))
      `);

    if (error) throw error;

    // Group by owner and calculate totals
    const summary = expenses.reduce((acc, exp) => {
      const ownerId = exp.machines?.machine_owner_id;
      if (!ownerId) return acc;
      
      if (!acc[ownerId]) {
        acc[ownerId] = {
          owner_id: ownerId,
          owner_name: exp.machines?.machine_owners?.name,
          total_expenses: 0,
          count: 0
        };
      }
      acc[ownerId].total_expenses += parseFloat(exp.amount || 0);
      acc[ownerId].count += 1;
      return acc;
    }, {});

    res.json(Object.values(summary));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
