
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // 1. Get all active loans
        const { data: loans, error: loansError } = await supabaseClient
            .from('loans')
            .select('id, loan_number, client_id')
            .eq('status', 'active')

        if (loansError) throw loansError

        const results = {
            processed: 0,
            management_fees: 0,
            admin_fees: 0,
            errors: []
        }

        // Start of week calculation
        const today = new Date();
        const startOfWeek = new Date(today);
        const day = startOfWeek.getDay() || 7;
        if (day !== 1) startOfWeek.setHours(-24 * (day - 1));
        else startOfWeek.setHours(0, 0, 0, 0);
        const startOfWeekIso = startOfWeek.toISOString();

        for (const loan of loans) {
            // 2. CHECK MANAGEMENT FEE ($25)
            const { data: mgmtCheck } = await supabaseClient
                .from('fee_applications')
                .select('id')
                .eq('loan_id', loan.id)
                .eq('fee_type', 'management')
                .gte('created_at', startOfWeekIso)
                .limit(1)

            if (!mgmtCheck || mgmtCheck.length === 0) {
                // Apply Management Fee
                const { error: mgmtError } = await supabaseClient
                    .from('fee_applications')
                    .insert({
                        loan_id: loan.id,
                        client_id: loan.client_id, // V4: Correct
                        fee_type: 'management',
                        amount: 25.00,
                        status: 'pending',
                        description: 'Weekly Management Fee'
                    })

                if (!mgmtError) {
                    results.management_fees++
                    // Log Transaction
                    await supabaseClient.from('transactions').insert({
                        loan_id: loan.id,
                        txn_type: 'MGMT',
                        amount: 25.00,
                        txn_date: new Date().toISOString().split('T')[0],
                        notes: 'Weekly Management Fee applied',
                        source: 'system',
                        processing_status: 'processed'
                    })
                    // V4: DO NOT update loan_balances.unpaid_fees. Tracked in fee_applications only.
                } else {
                    results.errors.push({ loan: loan.loan_number, error: mgmtError.message })
                }
            }

            // 3. CHECK ADMIN FEE ($2)
            const { data: adminCheck } = await supabaseClient
                .from('fee_applications')
                .select('id')
                .eq('loan_id', loan.id)
                .eq('fee_type', 'admin')
                .gte('created_at', startOfWeekIso)
                .limit(1)

            if (!adminCheck || adminCheck.length === 0) {
                // Apply Admin Fee
                const { error: adminError } = await supabaseClient
                    .from('fee_applications')
                    .insert({
                        loan_id: loan.id,
                        client_id: loan.client_id, // V4: Correct
                        fee_type: 'admin',
                        amount: 2.00,
                        status: 'pending',
                        description: 'Weekly Admin Fee'
                    })

                if (!adminError) {
                    results.admin_fees++
                    // Log Transaction
                    await supabaseClient.from('transactions').insert({
                        loan_id: loan.id,
                        txn_type: 'FACC',
                        amount: 2.00,
                        txn_date: new Date().toISOString().split('T')[0],
                        notes: 'Weekly Admin Fee applied',
                        source: 'system',
                        processing_status: 'processed'
                    })
                    // V4: DO NOT update loan_balances.unpaid_fees
                }
            }

            results.processed++
        }

        return new Response(
            JSON.stringify(results),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        )
    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        )
    }
})
