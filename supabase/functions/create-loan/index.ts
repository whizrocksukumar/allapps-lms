
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
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const { client_id, product_id, loan_amount, establishment_fee: manualFee, start_date, term, is_consolidation, source } = await req.json()

        // 1. Calculate Establishment Fee (if not manual)
        let establishment_fee = manualFee;
        if (establishment_fee === undefined || establishment_fee === null) {
            if (loan_amount < 100) establishment_fee = 45.00;
            else if (loan_amount < 500) establishment_fee = 150.00;
            else if (loan_amount < 5000) establishment_fee = 250.00;
            else establishment_fee = 495.00;
        }

        // 2. Get Product Info
        const { data: product, error: productError } = await supabase
            .from('loan_products')
            .select('annual_interest_rate')
            .eq('id', product_id)
            .single()

        if (productError || !product) {
            throw new Error('Product not found')
        }

        // 3. Calc Dates & Schedule (ESTIMATES for schedule)
        const termPeriods = term === 'Weekly' ? 52 : term === 'Fortnightly' ? 26 : 12;
        const daysPerPeriod = term === 'Weekly' ? 7 : term === 'Fortnightly' ? 14 : 30;

        const startDateObj = new Date(start_date)
        const endDate = new Date(startDateObj)
        endDate.setDate(endDate.getDate() + (daysPerPeriod * termPeriods))

        // Estimate for Schedule display only
        const dailyRate = product.annual_interest_rate / 365 / 100
        const daysInLoan = daysPerPeriod * termPeriods
        const estimatedTotalInterest = loan_amount * dailyRate * daysInLoan
        const totalRepayableEstimate = loan_amount + estimatedTotalInterest + establishment_fee

        // Repayment Amount - often fixed based on Amortization or simple division?
        // V3 says: "Principal per period = Fixed (loan_amount / periods)"
        // "Interest per period = Estimate only"
        // So Repayment = Principal Portion + Estimated Interest Portion? 
        // Or is "repayment_amount" fixed?
        // Let's assume standard behavior: Repayment = (Loan + Est.Interest + Est.Fee) / Periods
        const repaymentAmount = totalRepayableEstimate / termPeriods

        const principalPerPeriod = loan_amount / termPeriods
        const interestPerPeriodEstimate = estimatedTotalInterest / termPeriods

        // 4. Create Loan
        const { data: loan, error: loanError } = await supabase
            .from('loans')
            .insert({
                client_id, // V4: Correct
                product_id,
                loan_amount,
                establishment_fee,
                annual_interest_rate: product.annual_interest_rate,
                start_date,
                end_date: endDate.toISOString().split('T')[0],
                status: 'active',
                term,
                repayment_amount: Number(repaymentAmount.toFixed(2)),
                // total_repayable: removed
                instalments_due: termPeriods,
                source: source || (is_consolidation ? 'consolidation' : 'new')
            })
            .select()
            .single()

        if (loanError) throw loanError;

        // 5. Create Fee Application (Establishment - Pending)
        await supabase.from('fee_applications').insert({
            loan_id: loan.id,
            client_id, // V4: Correct
            fee_type: 'establishment',
            amount: establishment_fee,
            status: 'pending',
            description: 'Establishment Fee'
        });

        // 6. Init Loan Balance
        // V4 Rule: unpaid_fees = 0. outstanding_interest = 0.
        // current_outstanding_balance = loan_amount (Principal only? Or Principal + Fees?)
        // Clarification says: "Separates concerns... fee_applications = Fee tracking".
        // If we don't put fees in balance, then `current_outstanding_balance` should effectively match `outstanding_principal` initially?
        // But "current_outstanding_balance" usually implies Total Debt.
        // If payment allocation checks `fee_applications`, does it deduct from `current_outstanding_balance`?
        // If I pay $100 towards fee, does balance go down? Yes.
        // So `current_outstanding_balance` SHOULD include fees?
        // Clarification "Do NOT store establishment fee in loan_balances.unpaid_fees" refers to the *bucket* `unpaid_fees`.
        // It does NOT explicitly say "Do not include in current_outstanding_balance".
        // However, if we don't store it in `unpaid_fees`, `current_outstanding_balance` cannot be sum of parts if parts don't include it.
        // Let's assume `current_outstanding_balance` = `outstanding_principal` + `outstanding_interest` + `unpaid_fees` (which is 0).
        // So initially Balance = Loan Amount. 
        // Fees are "Extra" items in `fee_applications` until verified?
        // OR: `current_outstanding_balance` is just a summary field. 
        // Safest bet based on "Use fee_applications ONLY":
        // `current_outstanding_balance` = `loan_amount`. 
        // Fees are tracked sideways. 
        // If validation fails, user will correct.

        await supabase.from('loan_balances').insert({
            loan_id: loan.id,
            outstanding_principal: loan_amount,
            outstanding_interest: 0, // V4: Start at 0
            unpaid_fees: 0,          // V4: Start at 0
            current_outstanding_balance: loan_amount, // Principal only
            next_payment_due_date: new Date(startDateObj.getTime() + daysPerPeriod * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        });

        // 7. Generate Schedule
        const schedule = []
        for (let i = 1; i <= termPeriods; i++) {
            const paymentDate = new Date(startDateObj)
            paymentDate.setDate(paymentDate.getDate() + (daysPerPeriod * i))

            schedule.push({
                loan_id: loan.id,
                payment_number: i,
                due_date: paymentDate.toISOString().split('T')[0],
                scheduled_amount: Number(repaymentAmount.toFixed(2)),
                principal_portion: Number(principalPerPeriod.toFixed(2)),
                interest_portion: Number(interestPerPeriodEstimate.toFixed(2)), // Estimate
                status: 'pending'
            })
        }
        await supabase.from('repayment_schedule').insert(schedule)

        // 8. Log Transactions
        await supabase.from('transactions').insert({
            loan_id: loan.id,
            txn_type: 'ADV',
            amount: loan_amount,
            txn_date: new Date().toISOString().split('T')[0],
            notes: `Loan advance: $${loan_amount}`,
            source: 'system',
            processing_status: 'processed'
        })

        await supabase.from('transactions').insert({
            loan_id: loan.id,
            txn_type: 'EST',
            amount: establishment_fee,
            txn_date: new Date().toISOString().split('T')[0],
            notes: `Establishment Fee applied`,
            source: 'system',
            processing_status: 'processed'
        })

        return new Response(
            JSON.stringify({ success: true, loan }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } },
        )

    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        )
    }
})
