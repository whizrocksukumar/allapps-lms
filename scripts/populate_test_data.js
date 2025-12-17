
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

async function updateClients() {
    console.log('Populating Client Test Data...');

    // 1. General Update (Phones, Company, Type) for specific clients
    const clientsToUpdate = ['Dwinder', 'Lila', 'Anna', 'Raj'];

    // Fetch IDs for these clients (fuzzy match on first name)
    const { data: clients, error: fetchError } = await supabase
        .from('clients')
        .select('id, first_name');

    if (fetchError) {
        console.error('Error fetching clients:', fetchError.message);
        return;
    }

    // Filter locally to match logic safety
    const targetClients = clients.filter(c =>
        clientsToUpdate.some(name => c.first_name.includes(name))
    );

    console.log(`Found ${targetClients.length} clients to update with generic info.`);

    for (const client of targetClients) {
        const { error } = await supabase
            .from('clients')
            .update({
                mobile_phone: '021234567',
                work_phone: '02 123 4567',
                home_phone: '04 987 6543',
                company_name: `Test Company ${client.first_name}`,
                client_type: 'individual'
            })
            .eq('id', client.id);

        if (error) console.error(`Failed to update ${client.first_name}:`, error.message);
        else console.log(`Updated contact info for ${client.first_name}`);
    }

    // 2. Specific Credit Ratings
    // Dwinder = 750
    await updateRating('Dwinder', 750);
    // Lila = 680
    await updateRating('Lila', 680);
    // Anna = 720
    await updateRating('Anna', 720);
    // Raj% = 780
    await updateRating('Raj', 780); // Will match Raj Kumar and Raj Rani if fuzzy

    console.log('Done.');
}

async function updateRating(namePattern, rating) {
    // Find ID first to be safe or use like if supported in update (Supabase update doesn't support 'like' on column in filter chain easily without ID, usually better to select then update or use simple eq if exact)
    // We already fetched clients, let's look up.
    // Re-fetch to be clean or use previous list.
    const { data: clients } = await supabase
        .from('clients')
        .select('id, first_name')
        .ilike('first_name', `${namePattern}%`);

    if (!clients || clients.length === 0) return;

    for (const c of clients) {
        const { error } = await supabase
            .from('clients')
            .update({ credit_rating: rating })
            .eq('id', c.id);

        if (error) console.error(`Failed to set rating for ${c.first_name}:`, error.message);
        else console.log(`Set credit rating ${rating} for ${c.first_name}`);
    }
}

updateClients();
