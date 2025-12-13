// src/services/supabaseService.js
import { createClient } from '@supabase/supabase-js';

// ------------------------------------------------------------------
//  SUPABASE CLIENT INITIALISATION
// ------------------------------------------------------------------
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ------------------------------------------------------------------
//  CLIENTS
// ------------------------------------------------------------------
export async function getClients() {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) return { success: false, message: error.message };
  return { success: true, data };
}

export async function getClientById(clientId) {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', clientId)
    .single();
  if (error) return { success: false, message: error.message };
  return { success: true, data };
}

export async function updateClient(id, updates) {
  const { data, error } = await supabase
    .from('clients')
    .update(updates)
    .eq('id', id)
    .select();
  if (error) return { success: false, message: error.message };
  return { success: true, data: data[0] };
}

// ------------------------------------------------------------------
//  LOANS
// ------------------------------------------------------------------
export async function getLoansByClient(clientId) {
  const { data, error } = await supabase
    .from('loans')
    .select('*, clients!inner(code, first_name, last_name)')
    .eq('client_id', clientId);
  if (error) return { success: false, message: error.message };
  return { success: true, data };
}

export async function getLoanDetails(loanId) {
  const { data, error } = await supabase
    .from('loans')
    .select('*')
    .eq('id', loanId)
    .single();
  if (error) return { success: false, message: error.message };
  return { success: true, data };
}

export async function getLoansWithClientNames() {
  try {
    const { data, error } = await supabase
      .from('loans')
      .select(`
        id,
        loan_number,
        current_balance,
        status,
        instalments_due,
        clients!inner (
          id,
          first_name,
          last_name,
          city,
          region
        )
      `)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return {
      success: true,
      data: data || [],
      message: 'Loans loaded successfully'
    };
  } catch (err) {
    console.error('getLoansWithClientNames error:', err);
    return {
      success: false,
      data: [],
      message: err.message || 'Failed to load loans'
    };
  }
}

export async function getRepayments(loanId) {
  const { data, error } = await supabase
    .from('repayment_schedule')
    .select('*')
    .eq('loan_id', loanId)
    .order('due_date', { ascending: true });
  if (error) return { success: false, message: error.message };
  return { success: true, data };
}

export async function getNextRepayment(loanId) {
  const { data, error } = await supabase
    .from('repayment_schedule')
    .select('*')
    .eq('loan_id', loanId)
    .eq('status', 'pending')
    .order('due_date', { ascending: true })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 is "The result contains 0 rows"
    return { success: false, message: error.message };
  }
  return { success: true, data: data || null };
}

export async function getLoanStatistics(loanId) {
  const { data, error } = await supabase
    .from('repayment_schedule')
    .select('*')
    .eq('loan_id', loanId);

  if (error) return { success: false, message: error.message };

  const totalPaymentsMade = data.filter(r => r.status === 'paid').length;

  // Calculate overdue amount: sum of amount_due for pending items where due_date < today
  const today = new Date().toISOString().split('T')[0];
  const overdueAmount = data
    .filter(r => r.status === 'pending' && r.due_date < today)
    .reduce((sum, r) => sum + (r.amount_due || 0), 0);

  return { success: true, data: { totalPaymentsMade, overdueAmount } };
}

export async function allocatePayment(loanId, paymentAmount) {
  try {
    const { data: loan, error: loanError } = await supabase
      .from('loans')
      .select('current_balance, principal_outstanding, interest_accrued, fees_outstanding')
      .eq('id', loanId)
      .single();

    if (loanError) throw loanError;

    let remaining = paymentAmount;
    const allocation = { fees: 0, interest: 0, principal: 0 };

    // 1. Pay Fees
    if (loan.fees_outstanding > 0) {
      allocation.fees = Math.min(remaining, loan.fees_outstanding);
      remaining -= allocation.fees;
    }

    // 2. Pay Interest
    if (remaining > 0 && loan.interest_accrued > 0) {
      allocation.interest = Math.min(remaining, loan.interest_accrued);
      remaining -= allocation.interest;
    }

    // 3. Pay Principal
    if (remaining > 0) {
      allocation.principal = Math.min(remaining, loan.principal_outstanding);
      remaining -= allocation.principal;
    }

    // 4. Update loan
    const newBalance = Math.max(0, loan.current_balance - paymentAmount);
    const updates = {
      current_balance: newBalance,
      fees_outstanding: Math.max(0, loan.fees_outstanding - allocation.fees),
      interest_accrued: Math.max(0, loan.interest_accrued - allocation.interest),
      principal_outstanding: Math.max(0, loan.principal_outstanding - allocation.principal),
    };

    const { error: updateError } = await supabase
      .from('loans')
      .update(updates)
      .eq('id', loanId);

    if (updateError) throw updateError;

    // 5. Log transaction
    await supabase.from('transactions').insert({
      loan_id: loanId,
      type: 'payment',
      amount: paymentAmount,
      allocation: JSON.stringify(allocation),
      status: 'completed'
    });

    return { success: true, allocation, newBalance };
  } catch (error) {
    console.error('Payment allocation error:', error);
    return { success: false, message: error.message };
  }
}

// ------------------------------------------------------------------
//  ADD REPAYMENT (Payment Entry Page)
// ------------------------------------------------------------------
export async function addRepayment({ loan_id, date, amount, reference, notes }) {
  try {
    // 1. Record payment
    const { error: paymentError } = await supabase
      .from('payment_reconciliation')
      .insert({
        loan_id,
        payment_date: date,
        amount,
        reference,
        notes,
        status: 'allocated'
      });

    if (paymentError) throw paymentError;

    // 2. Allocate payment
    const allocationResult = await allocatePayment(loan_id, amount);
    if (!allocationResult.success) throw new Error(allocationResult.message);

    return { success: true, message: 'Payment recorded and allocated' };
  } catch (err) {
    console.error('addRepayment error:', err);
    return { success: false, message: err.message };
  }
}

// ------------------------------------------------------------------
//  LOAN PRODUCTS (for Calculator)
// ------------------------------------------------------------------
export async function getLoanProducts() {
  const { data, error } = await supabase
    .from('loan_products')
    .select('id, product_name, annual_interest_rate');
  if (error) return { success: false, message: error.message };
  return { success: true, data };
}