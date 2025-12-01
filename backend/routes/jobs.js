const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const auth = require('../middleware/auth');

// Get all jobs
router.get('/', auth, async (req, res) => {
  try {
    const { data: jobs, error } = await supabase
      .from('harvesting_jobs')
      .select(`
        *,
        farmers(*),
        machines(*, machine_owners(*))
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get jobs by machine
router.get('/machine/:machineId', auth, async (req, res) => {
  try {
    const { data: jobs, error } = await supabase
      .from('harvesting_jobs')
      .select(`
        *,
        farmers(*),
        machines(*, machine_owners(*))
      `)
      .eq('machine_id', req.params.machineId);

    if (error) throw error;
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get jobs by farmer
router.get('/farmer/:farmerId', auth, async (req, res) => {
  try {
    const { data: jobs, error } = await supabase
      .from('harvesting_jobs')
      .select(`
        *,
        farmers(*),
        machines(*, machine_owners(*))
      `)
      .eq('farmer_id', req.params.farmerId);

    if (error) throw error;
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single job
router.get('/:id', auth, async (req, res) => {
  try {
    const { data: job, error } = await supabase
      .from('harvesting_jobs')
      .select(`
        *,
        farmers(*),
        machines(*, machine_owners(*))
      `)
      .eq('id', req.params.id)
      .single();

    if (error) throw error;
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    res.json(job);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create job
router.post('/', auth, async (req, res) => {
  try {
    const { farmer, machine, workDate, hours, ratePerHour, advanceFromFarmer, expensesGiven, totalAmount, status, notes, discountFromOwner, discountToFarmer } = req.body;

    const calculatedTotal = totalAmount || (parseFloat(hours) * parseFloat(ratePerHour));
    const advance = parseFloat(advanceFromFarmer) || 0;
    const expenses = parseFloat(expensesGiven) || 0;
    const ownerDiscount = parseFloat(discountFromOwner) || 0;
    const farmerDiscount = parseFloat(discountToFarmer) || 0;

    console.log('Creating job with total:', calculatedTotal);

    // Get machine data first to calculate owner amount
    const { data: machineData, error: machineError } = await supabase
      .from('machines')
      .select('total_amount_pending, machine_owner_id, owner_rate_per_hour')
      .eq('id', machine)
      .single();
    
    if (machineError) throw machineError;

    // Calculate owner amount using machine's owner_rate_per_hour
    const grossOwnerAmount = parseFloat(hours) * parseFloat(machineData.owner_rate_per_hour || 0);
    const netOwnerAmount = grossOwnerAmount - ownerDiscount;
    const netFarmerAmount = calculatedTotal - farmerDiscount;

    // Validate discounts
    if (ownerDiscount < 0 || ownerDiscount > grossOwnerAmount) {
      return res.status(400).json({ error: 'Owner discount must be between 0 and gross owner amount' });
    }
    if (farmerDiscount < 0 || farmerDiscount > calculatedTotal) {
      return res.status(400).json({ error: 'Farmer discount must be between 0 and total amount' });
    }

    // Insert job
    const { data: job, error: jobError } = await supabase
      .from('harvesting_jobs')
      .insert({
        farmer_id: farmer,
        machine_id: machine,
        scheduled_date: workDate,
        hours: parseFloat(hours),
        rate_per_hour: parseFloat(ratePerHour),
        total_amount: calculatedTotal,
        advance_from_farmer: advance,
        expenses_given: expenses,
        discount_from_owner: ownerDiscount,
        discount_to_farmer: farmerDiscount,
        net_amount_to_owner: netOwnerAmount,
        net_amount_from_farmer: netFarmerAmount,
        acres: 0, // Default value since we use hours now
        status: status || 'Completed',
        notes: notes
      })
      .select()
      .single();

    if (jobError) throw jobError;

    // Update machine pending amount (using net amount after discount)
    
    if (machineData) {
      const newMachinePending = (machineData.total_amount_pending || 0) + netOwnerAmount;
      console.log('Updating machine pending with net amount:', machineData.total_amount_pending, '->', newMachinePending, '(gross:', grossOwnerAmount, '- discount:', ownerDiscount, ')');
      
      await supabase
        .from('machines')
        .update({ total_amount_pending: newMachinePending })
        .eq('id', machine);
      
      // Also update machine owner's pending amount
      const { data: ownerData } = await supabase
        .from('machine_owners')
        .select('total_amount_pending')
        .eq('id', machineData.machine_owner_id)
        .single();
      
      if (ownerData) {
        const newOwnerPending = (ownerData.total_amount_pending || 0) + netOwnerAmount;
        console.log('Updating owner pending with net amount:', ownerData.total_amount_pending, '->', newOwnerPending);
        
        await supabase
          .from('machine_owners')
          .update({ total_amount_pending: newOwnerPending })
          .eq('id', machineData.machine_owner_id);
      }
    }

    // Update farmer pending amount (using net amount after discount)
    const { data: farmerData } = await supabase
      .from('farmers')
      .select('total_amount_pending')
      .eq('id', farmer)
      .single();
    
    if (farmerData) {
      const newFarmerPending = (farmerData.total_amount_pending || 0) + netFarmerAmount;
      console.log('Updating farmer pending with net amount:', farmerData.total_amount_pending, '->', newFarmerPending, '(gross:', calculatedTotal, '- discount:', farmerDiscount, ')');
      
      await supabase
        .from('farmers')
        .update({ total_amount_pending: newFarmerPending })
        .eq('id', farmer);
    }

    // Fetch complete job with relations
    const { data: completeJob, error: fetchError } = await supabase
      .from('harvesting_jobs')
      .select(`
        *,
        farmers(*),
        machines(*, machine_owners(*))
      `)
      .eq('id', job.id)
      .single();

    if (fetchError) throw fetchError;
    res.status(201).json(completeJob);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update job
router.put('/:id', auth, async (req, res) => {
  try {
    const { farmer, machine, workDate, hours, ratePerHour, advanceFromFarmer, status, notes } = req.body;
    
    const updateData = {
      ...(farmer && { farmer_id: farmer }),
      ...(machine && { machine_id: machine }),
      ...(workDate && { scheduled_date: workDate }),
      ...(hours !== undefined && { hours: parseFloat(hours) }),
      ...(ratePerHour !== undefined && { rate_per_hour: parseFloat(ratePerHour) }),
      ...(advanceFromFarmer !== undefined && { advance_from_farmer: parseFloat(advanceFromFarmer) || 0 }),
      ...(status && { status }),
      ...(notes !== undefined && { notes: notes || null })
    };
    
    const { data: job, error } = await supabase
      .from('harvesting_jobs')
      .update(updateData)
      .eq('id', req.params.id)
      .select('*')
      .single();
    
    if (error) throw error;
    
    res.json(job);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete job
router.delete('/:id', auth, async (req, res) => {
  try {
    // Get job details first
    const { data: job, error: getError } = await supabase
      .from('harvesting_jobs')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (getError) throw getError;
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Revert machine pending amount (using machine's owner_rate_per_hour)
    const { data: machineData } = await supabase
      .from('machines')
      .select('total_amount_pending, machine_owner_id, owner_rate_per_hour')
      .eq('id', job.machine_id)
      .single();
    
    if (machineData) {
      // Calculate owner amount that was added using machine's owner_rate_per_hour
      const ownerAmount = parseFloat(job.hours || 0) * parseFloat(machineData.owner_rate_per_hour || 0);
      
      await supabase
        .from('machines')
        .update({ total_amount_pending: Math.max(0, (machineData.total_amount_pending || 0) - ownerAmount) })
        .eq('id', job.machine_id);
      
      // Also update machine owner's pending amount
      const { data: ownerData } = await supabase
        .from('machine_owners')
        .select('total_amount_pending')
        .eq('id', machineData.machine_owner_id)
        .single();
      
      if (ownerData) {
        await supabase
          .from('machine_owners')
          .update({ total_amount_pending: Math.max(0, (ownerData.total_amount_pending || 0) - ownerAmount) })
          .eq('id', machineData.machine_owner_id);
      }
    }

    // Revert farmer pending amount
    const { data: farmerData } = await supabase
      .from('farmers')
      .select('total_amount_pending')
      .eq('id', job.farmer_id)
      .single();
    
    if (farmerData) {
      await supabase
        .from('farmers')
        .update({ total_amount_pending: Math.max(0, (farmerData.total_amount_pending || 0) - job.total_amount) })
        .eq('id', job.farmer_id);
    }

    // Delete job
    const { error: deleteError } = await supabase
      .from('harvesting_jobs')
      .delete()
      .eq('id', req.params.id);

    if (deleteError) throw deleteError;
    res.json({ message: 'Job deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
