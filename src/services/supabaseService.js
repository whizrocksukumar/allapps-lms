// src/services/supabaseService.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://lmbfsplimbwnycaawhta.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxtYmZzcGxpbWJ3bnljYWF3aHRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIxNjY2NTMsImV4cCI6MjA3Nzc0MjY1M30.x32wIbTOCP-5trobejkQKdowQL0U3hGlyge5lMQb2nM';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ============= LOANS FUNCTIONS =============

export const getLoansWithClientNames = async () => {
  try {
    const { data, error } = await supabase
      .from('loans')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    // If we have loans, fetch client names separately
    if (data && data.length > 0) {
      const clientIds = [...new Set(data.map(l => l.client_id))];
      const { data: clients, error: clientError } = await supabase
        .from('clients')
        .select('id, code, name')
        .in('id', clientIds);
      
      if (!clientError && clients) {
        const clientMap = {};
        clients.forEach(c => {
          clientMap[c.id] = c;
        });
        
        return data.map(loan => ({
          ...loan,
          client_name: clientMap[loan.client_id]?.name || 'Unknown',
          client_code: clientMap[loan.client_id]?.code || '',
        }));
      }
    }
    
    return data || [];
  } catch (error) {
    console.error('Error fetching loans:', error);
    return [];
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

export const getLoansForclient = async (clientId) => {
  try {
    const { data, error } = await supabase
      .from('loans')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching loans for client:', error);
    return [];
  }
};

// ============= CLIENT FUNCTIONS =============

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

// ============= LOAN SCHEDULE FUNCTIONS =============

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

// ============= PAYMENT FUNCTIONS =============

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

export const getPayments = async () => {
  try {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching payments:', error);
    return [];
  }
};

// ============= TRANSACTION FUNCTIONS =============

export const getTransactions = async () => {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return [];
  }
};

export const addTransaction = async (transactionData) => {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .insert([transactionData])
      .select();
    
    if (error) throw error;
    return data?.[0] || null;
  } catch (error) {
    console.error('Error adding transaction:', error);
    return null;
  }
};

// ============= INTEREST CALCULATION FUNCTIONS =============

export const getInterestCalculations = async () => {
  try {
    const { data, error } = await supabase
      .from('interest_calculations')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching interest calculations:', error);
    return [];
  }
};

export const addInterestCalculation = async (interestData) => {
  try {
    const { data, error } = await supabase
      .from('interest_calculations')
      .insert([interestData])
      .select();
    
    if (error) throw error;
    return data?.[0] || null;
  } catch (error) {
    console.error('Error adding interest calculation:', error);
    return null;
  }
};