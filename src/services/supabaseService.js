// src/services/supabaseService.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const supabase = createClient(supabaseUrl, supabaseKey);

// ============================================================================
// CLIENTS
// ============================================================================

export const getClients = async () => {
  try {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching clients:', error);
    return [];
  }
};

export const getClientById = async (clientId) => {
  try {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching client:', error);
    return null;
  }
};

export const addClient = async (clientData) => {
  try {
    const { data, error } = await supabase
      .from('clients')
      .insert([clientData])
      .select();

    if (error) throw error;
    return data?.[0] || null;
  } catch (error) {
    console.error('Error adding client:', error);
    return null;
  }
};

export const updateClient = async (id, clientData) => {
  try {
    const { data, error } = await supabase
      .from('clients')
      .update(clientData)
      .eq('id', id)
      .select();

    if (error) throw error;
    return data?.[0] || null;
  } catch (error) {
    console.error('Error updating client:', error);
    return null;
  }
};

export const deleteClient = async (id) => {
  try {
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting client:', error);
    return false;
  }
};

// ============================================================================
// LOANS
// ============================================================================

export const getLoansWithClientNames = async () => {
  try {
    const { data, error } = await supabase
      .from('loans')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    if (data && data.length > 0) {
      const clientIds = [...new Set(data.map(l => l.client_id))];
      const { data: clients, error: clientError } = await supabase
        .from('clients')
        .select('id, client_code, first_name, last_name')
        .in('id', clientIds);

      if (!clientError && clients) {
        const clientMap = {};
        clients.forEach(c => {
          clientMap[c.id] = c;
        });

        return data.map(loan => ({
          ...loan,
          client_name: `${clientMap[loan.client_id]?.first_name || ''} ${clientMap[loan.client_id]?.last_name || ''}`.trim() || 'Unknown',
          client_code: clientMap[loan.client_id]?.client_code || '',
        }));
      }
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching loans:', error);
    return [];
  }
};

export const getLoansByClient = async (clientId) => {
  try {
    const { data, error } = await supabase
      .from('loans')
      .select('*, loan_balances(current_outstanding_balance)')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const loans = (data || []).map(l => ({
      ...l,
      current_balance: l.loan_balances?.[0]?.current_outstanding_balance
        ?? l.loan_balances?.current_outstanding_balance
        ?? 0
    }));

    return { success: true, data: loans };
  } catch (error) {
    console.error('Error fetching loans for client:', error);
    return { success: false, message: error.message };
  }
};

export const addLoan = async (loanData) => {
  try {
    const { data, error } = await supabase
      .from('loans')
      .insert([loanData])
      .select();

    if (error) throw error;
    return data?.[0] || null;
  } catch (error) {
    console.error('Error adding loan:', error);
    return null;
  }
};

export const generateLoanSchedule = async (loanId, principal, rate, term) => {
  try {
    const schedule = [];
    const monthlyRate = rate / 100 / 12;
    const monthlyPayment = (principal * monthlyRate * Math.pow(1 + monthlyRate, term)) / (Math.pow(1 + monthlyRate, term) - 1);

    let balance = principal;
    for (let i = 1; i <= term; i++) {
      const interestPayment = balance * monthlyRate;
      const principalPayment = monthlyPayment - interestPayment;
      balance -= principalPayment;

      schedule.push({
        loan_id: loanId,
        month: i,
        payment_amount: monthlyPayment,
        principal_payment: principalPayment,
        interest_payment: interestPayment,
        remaining_balance: Math.max(0, balance),
      });
    }

    return schedule;
  } catch (error) {
    console.error('Error generating loan schedule:', error);
    return [];
  }
};

// ============================================================================
// REPAYMENTS & PAYMENTS
// ============================================================================

export const addRepayment = async (repaymentData) => {
  try {
    const { loan_id, client_id, date, amount, reference, notes } = repaymentData;
    const paymentAmount = parseFloat(amount);

    // 1. Get Current Balance
    const { data: balanceData, error: balanceError } = await supabase
      .from('loan_balances')
      .select('*')
      .eq('loan_id', loan_id)
      .single();

    if (balanceError || !balanceData) throw new Error("Could not find loan balance info.");

    // 2. Calculate Allocation
    let remaining = paymentAmount;

    const feesPaid = Math.min(remaining, balanceData.unpaid_fees || 0);
    remaining -= feesPaid;

    const interestPaid = Math.min(remaining, balanceData.outstanding_interest || 0);
    remaining -= interestPaid;

    const principalPaid = remaining;

    // 3. Insert Transaction
    const transactionPayload = {
      loan_id,
      client_id,
      transaction_date: date,
      transaction_type: 'PAY',
      txn_type: 'PAY',
      txn_date: date,
      amount: paymentAmount,
      notes: reference ? `Payment: ${reference}` : (notes || 'Payment received'),
      fees_applied: feesPaid,
      interest_applied: interestPaid,
      principal_applied: principalPaid,
      allocation_breakdown: {
        establishment_fee: 0,
        fees: feesPaid,
        interest: interestPaid,
        principal: principalPaid
      },
      balance_after_transaction: (balanceData.current_outstanding_balance - paymentAmount),
      balance: (balanceData.current_outstanding_balance - paymentAmount),
      reference_number: reference,
      payment_method: 'manual_entry',
      source: 'manual_entry',
      processing_status: 'processed',
      created_at: new Date().toISOString()
    };

    const { data: txn, error: txnError } = await supabase
      .from('transactions')
      .insert([transactionPayload])
      .select()
      .single();

    if (txnError) throw txnError;

    // 4. Update Loan Balance
    const newFees = (balanceData.unpaid_fees || 0) - feesPaid;
    const newInterest = (balanceData.outstanding_interest || 0) - interestPaid;
    const newPrincipal = (balanceData.outstanding_principal || 0) - principalPaid;
    const newTotal = newFees + newInterest + newPrincipal;

    const { error: updateError } = await supabase
      .from('loan_balances')
      .update({
        unpaid_fees: newFees,
        outstanding_interest: newInterest,
        outstanding_principal: newPrincipal,
        current_outstanding_balance: newTotal,
        last_payment_date: date,
        updated_at: new Date().toISOString()
      })
      .eq('loan_id', loan_id);

    if (updateError) throw updateError;

    return { success: true, data: txn };

  } catch (error) {
    console.error('Error adding repayment:', error);
    return { success: false, message: error.message };
  }
};

export const allocatePayment = async (paymentData) => {
  try {
    const { data, error } = await supabase
      .from('payments')
      .insert([paymentData])
      .select();

    if (error) throw error;
    return data?.[0] || null;
  } catch (error) {
    console.error('Error allocating payment:', error);
    return null;
  }
};

export const getNextRepayment = async (loanId) => {
  try {
    const { data, error } = await supabase
      .from('repayment_schedule')
      .select('due_date, scheduled_amount')
      .eq('loan_id', loanId)
      .eq('status', 'pending')
      .order('due_date', { ascending: true })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    return {
      data: data ? {
        due_date: data.due_date,
        amount_due: data.scheduled_amount
      } : null
    };
  } catch (error) {
    console.error('Error fetching next repayment:', error);
    return { data: null };
  }
};

export const getLoanStatistics = async (loanId) => {
  try {
    const { data, error } = await supabase
      .from('repayment_schedule')
      .select('scheduled_amount, status, due_date')
      .eq('loan_id', loanId);

    if (error) throw error;

    let totalPaymentsMade = 0;
    let overdueAmount = 0;
    const now = new Date();

    if (data) {
      data.forEach(r => {
        if (r.status === 'paid') {
          totalPaymentsMade++;
        } else if (r.status === 'pending') {
          const dueDate = new Date(r.due_date);
          if (dueDate < now) {
            overdueAmount += r.scheduled_amount;
          }
        }
      });
    }

    return {
      data: {
        totalPaymentsMade,
        overdueAmount
      }
    };
  } catch (error) {
    console.error('Error fetching loan statistics:', error);
    return { data: { totalPaymentsMade: 0, overdueAmount: 0 } };
  }
};

// ============================================================================
// LOAN WAIVERS (Edge Functions)
// ============================================================================

export const createLoanWaiver = async (waiverData) => {
  const response = await fetch(
    `${supabaseUrl}/functions/v1/create-loan-waiver`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(waiverData),
    }
  );
  return response.json();
};

export const approveLoanWaiver = async (waiverData) => {
  const response = await fetch(
    `${supabaseUrl}/functions/v1/approve-loan-waiver`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(waiverData),
    }
  );
  return response.json();
};

export const applyLoanWaiver = async (waiverData) => {
  const response = await fetch(
    `${supabaseUrl}/functions/v1/apply-loan-waiver`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(waiverData),
    }
  );
  return response.json();
};

export const rejectLoanWaiver = async (waiverData) => {
  const response = await fetch(
    `${supabaseUrl}/functions/v1/reject-loan-waiver`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(waiverData),
    }
  );
  return response.json();
};

export const rescheduleLoan = async (waiverData) => {
  const response = await fetch(
    `${supabaseUrl}/functions/v1/reschedule-loan`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(waiverData),
    }
  );
  return response.json();
};

export const writeOffLoan = async (waiverData) => {
  const response = await fetch(
    `${supabaseUrl}/functions/v1/write-off-loan`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(waiverData),
    }
  );
  return response.json();
};