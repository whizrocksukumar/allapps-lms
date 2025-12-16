// src/hooks/useLoans.js
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabaseService';

export const useLoans = () => {
    const [loans, setLoans] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchLoans = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const { data, error } = await supabase
                .from('loans')
                .select(`
                  id,
                  loan_number,
                  loan_amount,
                  status,
                  start_date,
                  end_date,
                  term,
                  annual_interest_rate,
                  instalments_due,
                  repayment_amount,
                  establishment_fee,
                  client_id(id, first_name, last_name, client_code),
                  product_id,
                  loan_balances(
                    current_outstanding_balance,
                    outstanding_principal,
                    outstanding_interest,
                    unpaid_fees,
                    last_payment_date,
                    next_payment_due_date
                  )
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setLoans(data || []);
        } catch (err) {
            console.error('Loans fetch error:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchLoans();
    }, [fetchLoans]);

    return {
        loans,
        loading,
        error,
        refetch: fetchLoans
    };
};
