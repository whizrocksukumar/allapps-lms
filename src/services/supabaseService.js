// src/services/supabaseService.js (updated)
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

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

export { supabase };

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

export const getLoansByClient = async (clientId) => {
  try {
    const { data, error } = await supabase
      .from('loans')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { success: true, data: data || [] };
  } catch (error) {
    console.error('Error fetching loans for client:', error);
    return { success: false, message: error.message };
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

export const addRepayment = async (repaymentData) => {
  try {
    const { loan_id, date, amount, reference, notes } = repaymentData;

    const { data, error } = await supabase
      .from('payments')
      .insert([{
        loan_id,
        payment_date: date,
        amount,
        reference,
        notes,
        created_at: new Date().toISOString()
      }])
      .select();

    if (error) throw error;
    return { success: true, data: data?.[0] };
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