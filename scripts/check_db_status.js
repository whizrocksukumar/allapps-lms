
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load environment variables
const envPath = path.resolve(process.cwd(), '.env');
const envConfig = dotenv.config({ path: envPath }).parsed || {};

const supabaseUrl = envConfig.VITE_SUPABASE_URL;
const supabaseKey = envConfig.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testJoinQuery() {
    console.log('Testing JOIN query (loans + loan_balances)...');
    const { data, error } = await supabase
        .from('loans')
        .select(`
            id,
            loan_balances (
                current_outstanding_balance
            )
        `)
        .limit(1);

    if (error) {
        console.error('JOIN Query Failed:', error.message);
        if (error.message.includes('relationship')) {
            console.log('--> DIAGNOSIS: Foreign key relationship missing between loans and loan_balances.');
        }
    } else {
        console.log('JOIN Query Success! Data:', JSON.stringify(data, null, 2));
    }
}

async function checkOrphansAndDuplicates() {
    console.log('\nChecking for orphans and duplicates...');

    // FETCH ALL LOANS
    const { data: loans, error: loansError } = await supabase.from('loans').select('id, loan_number');
    if (loansError) {
        console.error('Error fetching loans:', loansError.message);
        return;
    }
    console.log(`Total Loans: ${loans.length}`);

    // FETCH ALL BALANCES
    const { data: balances, error: balancesError } = await supabase.from('loan_balances').select('id, loan_id');
    if (balancesError) {
        console.error('Error fetching balances:', balancesError.message);
        return;
    }
    console.log(`Total Balances: ${balances.length}`);

    // CHECK FOR DUPLICATES (More than 1 balance per loan)
    const balanceCounts = {};
    balances.forEach(b => {
        balanceCounts[b.loan_id] = (balanceCounts[b.loan_id] || 0) + 1;
    });

    const duplicates = Object.entries(balanceCounts).filter(([id, count]) => count > 1);
    if (duplicates.length > 0) {
        console.error(`WARNING: Found ${duplicates.length} loans with multiple balance records:`, duplicates);
    } else {
        console.log('OK: No duplicate balance records found.');
    }

    // CHECK FOR MISSING BALANCES
    const loansWithNoBalance = loans.filter(l => !balanceCounts[l.id]);
    if (loansWithNoBalance.length > 0) {
        console.log(`WARNING: Found ${loansWithNoBalance.length} loans with NO balance record:`);
        loansWithNoBalance.forEach(l => console.log(` - ${l.loan_number} (${l.id})`));
    } else {
        console.log('OK: All loans have a balance record.');
    }
}

async function run() {
    await testJoinQuery();
    await checkOrphansAndDuplicates();
}

run();
