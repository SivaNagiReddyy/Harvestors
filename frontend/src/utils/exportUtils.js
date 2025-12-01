// Utility function to convert data to CSV and download
export const exportToCSV = (data, filename) => {
  if (!data || data.length === 0) {
    alert('No data to export');
    return;
  }

  // Get all unique keys from all objects (handles nested objects)
  const flattenObject = (obj, prefix = '') => {
    return Object.keys(obj).reduce((acc, key) => {
      const value = obj[key];
      const newKey = prefix ? `${prefix}_${key}` : key;
      
      if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
        Object.assign(acc, flattenObject(value, newKey));
      } else if (Array.isArray(value)) {
        acc[newKey] = value.join('; ');
      } else {
        acc[newKey] = value;
      }
      return acc;
    }, {});
  };

  // Flatten all data
  const flattenedData = data.map(item => flattenObject(item));
  
  // Get all unique headers
  const headers = [...new Set(flattenedData.flatMap(item => Object.keys(item)))];
  
  // Create CSV content
  const csvContent = [
    headers.join(','), // Header row
    ...flattenedData.map(item =>
      headers.map(header => {
        const value = item[header];
        if (value === null || value === undefined) return '';
        // Escape quotes and wrap in quotes if contains comma, newline, or quote
        const stringValue = String(value);
        if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      }).join(',')
    )
  ].join('\n');

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Format data for specific pages
export const formatDataForExport = (data, type) => {
  switch (type) {
    case 'jobs':
      return data.map(job => ({
        Job_ID: job.id,
        Farmer_Name: job.farmers?.name,
        Farmer_Village: job.farmers?.village,
        Farmer_Phone: job.farmers?.phone,
        Machine_Number: job.machines?.machine_number,
        Driver_Name: job.machines?.driver_name,
        Owner_Name: job.machines?.machine_owners?.name,
        Work_Date: job.work_date,
        Scheduled_Date: job.scheduled_date,
        Acres: job.acres,
        Rate_Per_Hour: job.rate_per_hour,
        Total_Hours: job.total_hours,
        Total_Amount: job.total_amount,
        Amount_Paid: job.amount_paid,
        Pending_Amount: job.pending_amount,
        Discount_From_Owner: job.discount_from_owner,
        Discount_To_Farmer: job.discount_to_farmer,
        Status: job.status,
        Notes: job.notes
      }));
    
    case 'payments':
      return data.map(payment => ({
        Payment_ID: payment.id,
        Job_ID: payment.job_id,
        Farmer_Name: payment.jobs?.farmers?.name,
        Farmer_Village: payment.jobs?.farmers?.village,
        Machine_Number: payment.jobs?.machines?.machine_number,
        Driver_Name: payment.jobs?.machines?.driver_name,
        Amount: payment.amount,
        Payment_Date: payment.payment_date,
        Payment_Method: payment.payment_method,
        Notes: payment.notes
      }));
    
    case 'expenses':
      return data.map(expense => ({
        Expense_ID: expense.id,
        Machine_Number: expense.machines?.machine_number,
        Driver_Name: expense.machines?.driver_name,
        Owner_Name: expense.machines?.machine_owners?.name,
        Amount: expense.amount,
        Expense_Date: expense.expense_date,
        Notes: expense.notes
      }));
    
    case 'farmers':
      return data.map(farmer => ({
        Farmer_ID: farmer.id,
        Name: farmer.name,
        Village: farmer.village,
        Phone: farmer.phone,
        Total_Jobs: farmer.totalJobs,
        Total_Amount: farmer.totalAmount,
        Amount_Paid: farmer.amountPaid,
        Pending_Amount: farmer.pendingAmount,
        Total_Discounts_Received: farmer.totalDiscounts
      }));
    
    case 'machines':
      return data.map(machine => ({
        Machine_ID: machine.id,
        Machine_Number: machine.machine_number,
        Driver_Name: machine.driver_name,
        Owner_Name: machine.machine_owners?.name,
        Owner_Phone: machine.machine_owners?.phone,
        Total_Jobs: machine.totalJobs,
        Total_Revenue: machine.totalRevenue,
        Total_Expenses: machine.totalExpenses,
        Net_Profit: machine.netProfit,
        Total_Discounts_Given: machine.totalDiscounts
      }));
    
    case 'machineOwners':
      return data.map(owner => ({
        Owner_ID: owner.id,
        Name: owner.name,
        Phone: owner.phone,
        Total_Machines: owner.totalMachines,
        Total_Jobs: owner.totalJobs,
        Total_Revenue: owner.totalRevenue,
        Total_Expenses: owner.totalExpenses,
        Net_Profit: owner.netProfit
      }));
    
    case 'advances':
      return data.map(advance => ({
        Advance_ID: advance.id,
        Job_ID: advance.job_id,
        Farmer_Name: advance.jobs?.farmers?.name,
        Farmer_Village: advance.jobs?.farmers?.village,
        Machine_Number: advance.jobs?.machines?.machine_number,
        Amount: advance.amount,
        Advance_Date: advance.advance_date,
        Notes: advance.notes
      }));
    
    case 'discounts':
      return data.map(job => ({
        Job_ID: job.id,
        Farmer_Name: job.farmers?.name,
        Farmer_Village: job.farmers?.village,
        Machine_Number: job.machines?.machine_number,
        Driver_Name: job.machines?.driver_name,
        Owner_Name: job.machines?.machine_owners?.name,
        Work_Date: job.work_date,
        Discount_From_Owner: job.discount_from_owner,
        Discount_To_Farmer: job.discount_to_farmer,
        Total_Amount: job.total_amount
      }));
    
    case 'rentals':
      return data.map(rental => ({
        Rental_ID: rental.id,
        Machine_Number: rental.machines?.machine_number,
        Driver_Name: rental.machines?.driver_name,
        Owner_Name: rental.machines?.machine_owners?.name,
        Dealer_Name: rental.dealers?.name,
        Dealer_Village: rental.dealers?.village,
        Start_Date: rental.start_date,
        End_Date: rental.end_date,
        Rate_Per_Day: rental.rate_per_day,
        Total_Days: rental.total_days,
        Total_Amount: rental.total_amount,
        Amount_Paid: rental.amount_paid,
        Pending_Amount: rental.pending_amount,
        Status: rental.status
      }));
    
    case 'rentalPayments':
      return data.map(payment => ({
        Payment_ID: payment.id,
        Rental_ID: payment.rental_id,
        Machine_Number: payment.rentals?.machines?.machine_number,
        Dealer_Name: payment.rentals?.dealers?.name,
        Amount: payment.amount,
        Payment_Date: payment.payment_date,
        Payment_Method: payment.payment_method,
        Notes: payment.notes
      }));
    
    case 'dealers':
      return data.map(dealer => ({
        Dealer_ID: dealer.id,
        Name: dealer.name,
        Village: dealer.village,
        Phone: dealer.phone,
        Total_Rentals: dealer.totalRentals,
        Total_Amount: dealer.totalAmount,
        Amount_Paid: dealer.amountPaid,
        Pending_Amount: dealer.pendingAmount
      }));
    
    default:
      return data;
  }
};
