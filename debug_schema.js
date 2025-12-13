import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import fs from 'fs';

// Load env vars manually since we're running with node, not vite
const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, '.env');
const envConfig = dotenv.parse(fs.readFileSync(envPath));

const supabase = createClient(envConfig.VITE_SUPABASE_URL, envConfig.VITE_SUPABASE_ANON_KEY);

async function inspectSchema() {
    let output = "";
    output += "--- INSPECTING CLIENTS ---\n";
    const { data: clients, error: clientError } = await supabase.from('clients').select('*').limit(1);
    if (clientError) output += JSON.stringify(clientError) + "\n";
    else if (clients.length) output += JSON.stringify(Object.keys(clients[0]), null, 2) + "\n";
    else output += "No clients found\n";

    output += "\n--- INSPECTING LOANS ---\n";
    const { data: loans, error: loanError } = await supabase.from('loans').select('*').limit(1);
    if (loanError) output += JSON.stringify(loanError) + "\n";
    else if (loans.length) output += JSON.stringify(Object.keys(loans[0]), null, 2) + "\n";
    else output += "No loans found\n";

    fs.writeFileSync('schema_dump.txt', output);
    console.log("Schema dumped to schema_dump.txt");
}

inspectSchema();
