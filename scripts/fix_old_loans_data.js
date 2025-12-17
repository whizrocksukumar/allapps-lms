
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
const envPath = path.resolve(process.cwd(), '.env');
const envConfig = dotenv.config({ path: envPath }).parsed || {};

const supabaseUrl = envConfig.VITE_SUPABASE_URL;
const supabaseKey = envConfig.VITE_SUPABASE_ANON_KEY; // Using Anon Key, hopefully enough permissions via RLS or lack thereof

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const OLD_LOANS = ['L10001', 'L10002', 'L10003', 'L10004', 'L10005'];

async function processLoan(loan, productMap) {
    console.log(`Processing ${loan.loan_number}...`);

    // 1. UPDATE LOAN METADATA
    // Defaulting to Monthly, 12 months for old loans as per plan
    const term = 'Monthly';
    const termPeriods = 12;
    const daysPerPeriod = 30;

    const startDateObj = new Date(loan.start_date);
    const endDate = new Date(startDateObj);
    endDate.setDate(endDate.getDate() + (daysPerPeriod * termPeriods)); // Simple calc

    // We need annual_interest_rate. If missing on loan, get from product or default.
    // L10002 has 6.00. others null.
    // If null, we'll assuming standard 12% or try to find product.
    // Actually, let's just use 12% if null for now, or 0? Handoff says L10002 is 6%.
    let interestRate = loan.annual_interest_rate;
    if (!interestRate && interestRate !== 0) {
        interestRate = 12.0; // Default fallback
    }

    const { error: updateError } = await supabase
        .from('loans')
        .update({
            term: term,
            instalments_due: termPeriods,
            end_date: endDate.toISOString().split('T')[0],
            annual_interest_rate: interestRate
        })
        .eq('id', loan.id);

    if (updateError) {
        console.error(`Failed to update loan ${loan.loan_number}:`, updateError.message);
        return;
    }
    console.log(`Updated metadata for ${loan.loan_number}`);

    // 2. CREATE LOAN BALANCE (if missing)
    // Check if exists
    const { data: existingBalance } = await supabase
        .from('loan_balances')
        .select('id')
        .eq('loan_id', loan.id)
        .single();

    if (!existingBalance) {
        // Calculation logic
        const loan_amount = loan.loan_amount;
        const establishment_fee = loan.establishment_fee || 0;

        // Recalculate interest/repayment roughly (for consistency)
        const dailyRate = interestRate / 365 / 100;
        const daysInLoan = daysPerPeriod * termPeriods;
        const totalInterest = loan_amount * dailyRate * daysInLoan;
        const totalRepayable = loan_amount + totalInterest + establishment_fee;

        const { error: balanceError } = await supabase
            .from('loan_balances')
            .insert({
                loan_id: loan.id,
                outstanding_principal: loan_amount, // Assuming unpaid
                outstanding_interest: 0,            // Accrued starts at 0? Or full? Handoff says: OutPrin=Loan, OutInt=0.
                unpaid_fees: establishment_fee,
                current_outstanding_balance: loan_amount + establishment_fee, // Handoff logic: Loan + fees. Waittt...
                // Handoff says: current_outstanding_balance = loan_amount + fees.
                // But total_repayable includes interest.
                // Let's stick to Handoff instruction: "current_outstanding_balance = loan_amount + fees"
                // And "outstanding_interest = 0".
                principal_paid: 0,
                interest_paid: 0,
                fees_paid: 0,
                next_payment_due_date: new Date(startDateObj.getTime() + daysPerPeriod * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            });

        if (balanceError) {
            console.error(`Failed to create balance for ${loan.loan_number}:`, balanceError.message);
        } else {
            console.log(`Created loan_balances for ${loan.loan_number}`);
        }
    } else {
        console.log(`Balance already exists for ${loan.loan_number}`);
    }

    // 3. CREATE REPAYMENT SCHEDULE (if missing)
    const { data: existingSchedule } = await supabase
        .from('repayment_schedule')
        .select('id')
        .eq('loan_id', loan.id)
        .limit(1);

    if (!existingSchedule || existingSchedule.length === 0) {
        // Generate schedule
        // Re-run calcs for correctness
        const loan_amount = loan.loan_amount;
        // const establishment_fee = loan.establishment_fee || 0;
        const dailyRate = interestRate / 365 / 100;
        const daysInLoan = daysPerPeriod * termPeriods;
        const totalInterest = loan_amount * dailyRate * daysInLoan;
        const totalRepayable = loan_amount + totalInterest + (loan.establishment_fee || 0); // Include fee in total?
        // Handoff logic: repaymentAmount = totalRepayable / termPeriods
        const repaymentAmount = totalRepayable / termPeriods;
        const principalPerPeriod = loan_amount / termPeriods;
        const interestPerPeriod = totalInterest / termPeriods;

        const schedule = [];
        for (let i = 1; i <= termPeriods; i++) {
            const paymentDate = new Date(startDateObj);
            paymentDate.setDate(paymentDate.getDate() + (daysPerPeriod * i));

            schedule.push({
                loan_id: loan.id,
                payment_number: i,
                due_date: paymentDate.toISOString().split('T')[0],
                scheduled_amount: Math.round(repaymentAmount * 100) / 100,
                principal_portion: Math.round(principalPerPeriod * 100) / 100,
                interest_portion: Math.round(interestPerPeriod * 100) / 100,
                paid_amount: null,
                paid_date: null,
                status: 'pending'
            });
        }

        const { error: scheduleError } = await supabase
            .from('repayment_schedule')
            .insert(schedule);

        if (scheduleError) {
            console.error(`Failed to create schedule for ${loan.loan_number}:`, scheduleError.message);
        } else {
            console.log(`Created repayment_schedule for ${loan.loan_number} (${schedule.length} items)`);
        }
    } else {
        console.log(`Schedule already exists for ${loan.loan_number}`);
    }
}

async function fixData() {
    console.log('Fetching old loans...');
    const { data: loans, error } = await supabase
        .from('loans')
        .select('*')
        .in('loan_number', OLD_LOANS);

    if (error) {
        console.error('Error fetching loans:', error.message);
        return;
    }

    console.log(`Found ${loans.length} old loans.`);

    for (const loan of loans) {
        await processLoan(loan);
    }
    console.log('Done.');
}

fixData();
