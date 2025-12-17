
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

        const { record } = await req.json()
        const loan_id = record?.loan_id || (await req.json()).loan_id;

        if (!loan_id) throw new Error("Missing loan_id");

        const DISHONOR_FEE_AMOUNT = 5.00;

        // 1. Get Loan & Client
        const { data: loan, error: loanError } = await supabaseClient
            .from('loans')
            .select('client_id, loan_number') // V4: Correct
            .eq('id', loan_id)
            .single()

        if (loanError || !loan) throw new Error("Loan not found")

        // 2. Insert Fee Application
        const { error: feeError } = await supabaseClient
            .from('fee_applications')
            .insert({
                loan_id: loan_id,
                client_id: loan.client_id, // V4: Correct
                fee_type: 'dishonor',
                amount: DISHONOR_FEE_AMOUNT,
                status: 'pending',
                description: 'Dishonor Fee for Failed Payment'
            })

        if (feeError) throw feeError

        // 3. Log Transaction
        await supabaseClient.from('transactions').insert({
            loan_id: loan_id,
            txn_type: 'DISH', // Dishonor
            amount: DISHONOR_FEE_AMOUNT,
            txn_date: new Date().toISOString().split('T')[0],
            notes: 'Dishonor Fee applied ($5.00)',
            source: 'system',
            processing_status: 'processed'
        })

        // 4. Update Balances? 
        // V4: "Use fee_applications ONLY... DO NOT store in loan_balances.unpaid_fees".
        // Removed update logic.

        return new Response(
            JSON.stringify({ success: true, message: `Dishonor fee applied to ${loan.loan_number}` }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        )
    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        )
    }
})
