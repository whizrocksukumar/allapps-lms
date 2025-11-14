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
//  CLIENTS (formerly customers)
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
    .select('*, clients!inner(code, name) AS client')
    .eq('client_id', clientId);

  if (error) return { success: false, message: error.message };
  return { success: true, data };
}

// ------------------------------------------------------------------
//  LOANS WITH CLIENT NAMES (used by other pages)
// ------------------------------------------------------------------
export async function getLoansWithClientNames() {
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

      if (clientError) throw clientError;

      const clientMap = {};
      clients.forEach(c => {
        clientMap[c.id] = c;
      });

      data.forEach(loan => {
        loan.client = clientMap[loan.client_id] || null;
      });
    }

    return { success: true, data };
  } catch (err) {
    console.error('getLoansWithClientNames error:', err);
    return { success: false, message: err.message };
  }
}

// ------------------------------------------------------------------
//  ADD NEW FUNCTIONS HERE AS NEEDED
// ------------------------------------------------------------------
// Example placeholder – you can delete or expand later
export async function getLoanDetails(loanId) {
  const { data, error } = await supabase
    .from('loans')
    .select('*')
    .eq('id', loanId)
    .single();

  if (error) return { success: false, message: error.message };
  return { success: true, data };
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