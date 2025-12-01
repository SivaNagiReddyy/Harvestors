// Not used in Supabase implementation, but keeping for reference
// Machines are linked to Machine Owners
// Each machine has its own driver and details

const MachineSchema = {
  id: 'UUID',
  machineOwnerId: 'UUID',
  machineType: 'String',
  machineNumber: 'String',
  ratePerHour: 'Number',
  driverName: 'String',
  driverPhone: 'String',
  totalAmountPending: 'Number',
  totalAmountPaid: 'Number',
  status: 'String'
};

module.exports = MachineSchema;
