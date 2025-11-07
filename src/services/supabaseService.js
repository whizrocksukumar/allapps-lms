import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase environment variables missing');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

export async function getLoansWithClientNames() {
  try {
    const { data, error } = await supabase.from('loans').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(loan => ({ ...loan, client_name: loan.customer_name || 'Unknown' }));
  } catch (error) {
    console.error('Error:', error);
    return [];
  }
}

export async function getClients() {
  try {
    const { data, error } = await supabase.from('clients').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error:', error);
    return [];
  }
}

export async function getClientById(clientId) {
  try {
    const { data, error } = await supabase.from('clients').select('*').eq('id', clientId).single();
    if (error) throw error;
    return data || null;
  } catch (error) {
    console.error('Error:', error);
    return null;
  }
}

export async function addLoan(loanData) {
  try {
    const { data, error } = await supabase.from('loans').insert([loanData]).select();
    if (error) throw error;
    return data?.[0] || null;
  } catch (error) {
    console.error('Error:', error);
    return null;
  }
}

export async function addClient(clientData) {
  try {
    const { data, error } = await supabase.from('clients').insert([clientData]).select();
    if (error) throw error;
    return data?.[0] || null;
  } catch (error) {
    console.error('Error:', error);
    return null;
  }
}

export async function updateLoan(loanId, updates) {
  try {
    const { data, error } = await supabase.from('loans').update(updates).eq('id', loanId).select();
    if (error) throw error;
    return data?.[0] || null;
  } catch (error) {
    console.error('Error:', error);
    return null;
  }
}

export async function updateClient(clientId, updates) {
  try {
    const { data, error } = await supabase.from('clients').update(updates).eq('id', clientId).select();
    if (error) throw error;
    return data?.[0] || null;
  } catch (error) {
    console.error('Error:', error);
    return null;
  }
}

export async function deleteClient(clientId) {
  try {
    const { error } = await supabase.from('clients').delete().eq('id', clientId);
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error:', error);
    return false;
  }
}

export async function deleteLoan(loanId) {
  try {
    const { error } = await supabase.from('loans').delete().eq('id', loanId);
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error:', error);
    return false;
  }
}

export async function getTransactionsForLoan(loanId) {
  try {
    const { data, error } = await supabase.from('transactions').select('*').eq('loan_id', loanId).order('date', { ascending: false }).limit(50);
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error:', error);
    return [];
  }
}

export async function getLoansForClient(clientId) {
  try {
    const { data, error } = await supabase.from('loans').select('*').eq('client_id', clientId).order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error:', error);
    return [];
  }
}

export async function generateLoanSchedule(loanId, principal, annualRate, termMonths) {
  try {
    const monthlyRate = annualRate / 12 / 100;
    const monthlyPayment = (principal * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -termMonths));
    const schedule = [];
    let balance = principal;
    
    for (let i = 1; i <= termMonths; i++) {
      const interestPayment = balance * monthlyRate;
      const principalPayment = monthlyPayment - interestPayment;
      balance -= principalPayment;
      schedule.push({
        loan_id: loanId,
        payment_number: i,
        due_date: new Date(Date.now() + i * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        principal: principalPayment,
        interest: interestPayment,
        balance: Math.max(0, balance)
      });
    }
    
    const { error } = await supabase.from('repayment_schedule').insert(schedule);
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error:', error);
    return false;
  }
}

export async function allocatePayment(loanId, paymentAmount) {
  try {
    const { data: loan, error: loanError } = await supabase.from('loans').select('*').eq('id', loanId).single();
    if (loanError) throw loanError;
    
    let remaining = paymentAmount;
    const allocation = { fees: 0, interest: 0, principal: 0 };
    
    if (loan.fees_due > 0) {
      const feePayment = Math.min(remaining, loan.fees_due);
      allocation.fees = feePayment;
      remaining -= feePayment;
    }
    
    if (remaining > 0 && loan.interest_due > 0) {
      const interestPayment = Math.min(remaining, loan.interest_due);
      allocation.interest = interestPayment;
      remaining -= interestPayment;
    }
    
    if (remaining > 0) {
      allocation.principal = remaining;
    }
    
    return allocation;
  } catch (error) {
    console.error('Error:', error);
    return { fees: 0, interest: 0, principal: 0 };
  }
}

export async function getLoanProducts() {
  try {
    const { data, error } = await supabase.from('loan_products').select('*').eq('active', true).order('interest_rate', { ascending: true });
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error:', error);
    return [];
  }
}

export async function createLoanProduct(productData) {
  try {
    const { data, error } = await supabase.from('loan_products').insert([{ ...productData, active: true, created_by: 'user' }]).select();
    if (error) throw error;
    return data?.[0] || null;
  } catch (error) {
    console.error('Error:', error);
    return null;
  }
}

export async function updateLoanProduct(productId, updates) {
  try {
    const { data, error } = await supabase.from('loan_products').update(updates).eq('id', productId).select();
    if (error) throw error;
    return data?.[0] || null;
  } catch (error) {
    console.error('Error:', error);
    return null;
  }
}

export async function getClientLoans(clientId) {
  try {
    const { data, error } = await supabase.from('loans').select('*').eq('client_id', clientId).order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error:', error);
    return [];
  }
}

export async function getNextLoanNumber() {
  try {
    const { data, error } = await supabase.from('loans').select('loan_number').order('loan_number', { ascending: false }).limit(1);
    if (error) throw error;
    
    if (!data || data.length === 0) return 'L10001';
    
    const lastNumber = parseInt(data[0].loan_number.replace('L', '')) + 1;
    return 'L' + lastNumber.toString().padStart(5, '0');
  } catch (error) {
    console.error('Error:', error);
    return 'L10001';
  }
}