import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixWageData() {
    console.log('🛠️ Fixing wage_num data to ensure proper sorting...');

    try {
        // Set wage_num to 1 (lowest) for all records where it is currently NULL
        // This ensures they appear at the bottom when sorting DESC, instead of the top
        const { error, count } = await supabase
            .from('job_jobrole_sponsored_sync')
            .update({ wage_num: 1, wage_level: 'Lv 1' })
            .is('wage_num', null)
            .select('*', { count: 'exact' });

        if (error) {
            console.error('❌ Error updating NULL wage_num:', error);
        } else {
            console.log(`✅ Updated ${count || 0} records with default wage_num 1.`);
        }

        // Also ensure any records with 'Lv 2' strings have wage_num 2, etc.
        const levels = [
            { str: 'Lv 4', num: 4 },
            { str: 'Lv 3', num: 3 },
            { str: 'Lv 2', num: 2 },
            { str: 'Lv 1', num: 1 }
        ];

        for (const level of levels) {
            const { error: updateError } = await supabase
                .from('job_jobrole_sponsored_sync')
                .update({ wage_num: level.num })
                .eq('wage_level', level.str)
                .not('wage_num', 'eq', level.num);

            if (updateError) console.warn(`⚠️ Could not sync wage_num for ${level.str}`);
        }

        console.log('✅ Data fix completed.');
    } catch (err) {
        console.error('❌ Sync fix failed:', err);
    }
}

fixWageData();
