// src/hooks/useLoans.js
// Updated: 21-DEC-2025 - Removed product_id reference, added annual_interest_rate
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
            // NOTE: annual_interest_rate is now directly on loans table (no more loan_products)
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
                    term_months,
                    repayment_frequency,
                    loan_type,
                    client_id,
                    clients (
                        id,
                        first_name,
                        last_name,
                        client_code,
                        company_name
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
            const formattedLoans = (data || []).map(loan => {
                const balance = loan.loan_balances ? loan.loan_balances : {};
                // Handle 1:1 relationship - loan_balances should be an object or array with one item
                const balanceData = Array.isArray(balance) ? (balance[0] || {}) : balance;
                const clientData = loan.clients || {};

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