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
            // Fetch loans with related data using JOINS
            // Note: Requires FK relationship between loans and loan_balances
            const { data, error: loansError } = await supabase
                .from('loans')
                .select(`
                    id,
                    loan_number,
                    loan_amount,
                    establishment_fee,
                    annual_interest_rate,
                    start_date,
                    end_date,
                    status,
                    term,
                    instalments_due,
                    repayment_amount,
                    total_repayable,
                    product_id,
                    client_id,
                    clients (
                        id,
                        first_name,
                        last_name,
                        client_code
                    ),
                    loan_balances (
                        current_outstanding_balance,
                        outstanding_principal,
                        outstanding_interest,
                        unpaid_fees,
                        last_payment_date,
                        next_payment_due_date
                    )
                `)
                .order('created_at', { ascending: false });

            if (loansError) throw loansError;

            // Transform data structure for UI
            const formattedLoans = data.map(loan => {
                const balance = loan.loan_balances ? loan.loan_balances : {};
                // Handle 1:1 or 1:many (though should be 1:1 or 1:0)
                // If 1:Many (array), take first. If 1:1 (object), take it.
                // Supabase returns object for single relation if defined as such, but usually array unless specified?
                // Actually, standard select returns array for child tables unless "single()" is used or relationship is 1:1 unique.
                // FK is not unique on child side usually? Wait. loan_id is unique in loan_balances? 
                // We checked data, it is unique. But supabase might return array.
                const balanceData = Array.isArray(balance) ? (balance[0] || {}) : balance;
                const clientData = loan.clients || {}; // Alias was 'clients' (table name)

                return {
                    ...loan,
                    client_id: { // Keep structure expected by UI
                        id: loan.client_id,
                        first_name: clientData.first_name || '',
                        last_name: clientData.last_name || '',
                        client_code: clientData.client_code || ''
                    },
                    current_outstanding_balance: balanceData.current_outstanding_balance || 0,
                    outstanding_principal: balanceData.outstanding_principal || 0,
                    outstanding_interest: balanceData.outstanding_interest || 0,
                    unpaid_fees: balanceData.unpaid_fees || 0,
                    last_payment_date: balanceData.last_payment_date,
                    next_payment_due_date: balanceData.next_payment_due_date
                };
            });

            setLoans(formattedLoans);
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