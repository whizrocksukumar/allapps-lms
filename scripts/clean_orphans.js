
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

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

async function cleanOrphans() {
    console.log('Checking for orphaned loan_balances...');

    // 1. Get all loan IDs
    const { data: loans, error: loansError } = await supabase
        .from('loans')
        .select('id');

    if (loansError) {
        console.error('Error fetching loans:', loansError);
        return;
    }

    const validLoanIds = new Set(loans.map(l => l.id));

    // 2. Get all balances
    const { data: balances, error: balancesError } = await supabase
        .from('loan_balances')
        .select('id, loan_id');

    if (balancesError) {
        console.error('Error fetching balances:', balancesError);
        return;
    }

    // 3. Find orphans
    const orphans = balances.filter(b => !validLoanIds.has(b.loan_id));

    if (orphans.length === 0) {
        console.log('No orphaned balances found.');
        return;
    }

    console.log(`Found ${orphans.length} orphaned balances. Deleting...`);
    orphans.forEach(o => console.log(` - Deleting balance ${o.id} (loan_id: ${o.loan_id})`));

    // 4. Delete orphans
    const orphanIds = orphans.map(o => o.id);
    const { error: deleteError } = await supabase
        .from('loan_balances')
        .delete()
        .in('id', orphanIds);

    if (deleteError) {
        console.error('Failed to delete orphans:', deleteError.message);
    } else {
        console.log('Successfully deleted orphans.');
    }
}

cleanOrphans();
