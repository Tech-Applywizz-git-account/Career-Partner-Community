/**
 * H1B Wage Data Excel Importer
 * ----------------------------
 * This script reads the Excel file with 2 lakh H1B wage records
 * and uploads them to Supabase in batches.
 * 
 * Usage:
 *   node scripts/import-h1b-wages.mjs <path-to-excel-file>
 * 
 * Prerequisites:
 *   npm install xlsx @supabase/supabase-js dotenv
 * 
 * Excel columns expected:
 *   Data Series | Collection | Occupation | State | Area Type | Area | Wage Level | Hourly | Yearly
 */

import XLSX from 'xlsx';
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';
import { existsSync } from 'fs';

// Load environment variables
config({ path: resolve(process.cwd(), '.env') });

// --- Configuration ---
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const BATCH_SIZE = 500; // Records per batch insert
const TABLE_NAME = 'h1b_wage_data';

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('❌ Missing Supabase credentials. Set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

/**
 * The DB column names match the Excel headers exactly:
 * "Data Series", "Collection", "Occupation", "State", "Area Type", "Area", "Wage Level", "Hourly", "Yearly"
 * So no column mapping is needed — we pass the Excel rows directly.
 */

/**
 * Transform an Excel row to a database record
 * Column names are kept exactly as in the Excel file
 */
function transformRow(row) {
    const record = {};

    // Copy only the expected columns
    const expectedColumns = ['Data Series', 'Collection', 'Occupation', 'State', 'Area Type', 'Area', 'Wage Level', 'Hourly', 'Yearly'];

    for (const col of expectedColumns) {
        if (row[col] !== undefined && row[col] !== null) {
            record[col] = String(row[col]).trim();
        } else {
            record[col] = null;
        }
    }

    // Validate: Occupation is required
    if (!record['Occupation']) return null;

    return record;
}

/**
 * Main import function
 */
async function importExcel(filePath) {
    console.log('📊 H1B Wage Data Importer');
    console.log('========================');
    console.log(`📁 File: ${filePath}`);
    console.log(`🔗 DB: ${SUPABASE_URL}`);
    console.log(`📋 Table: ${TABLE_NAME}`);
    console.log('');

    // Verify file exists
    if (!existsSync(filePath)) {
        console.error(`❌ File not found: ${filePath}`);
        process.exit(1);
    }

    // Read Excel file
    console.log('📖 Reading Excel file...');
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    console.log(`📄 Using sheet: "${sheetName}"`);

    const sheet = workbook.Sheets[sheetName];
    const rawData = XLSX.utils.sheet_to_json(sheet);

    console.log(`📊 Total rows in Excel: ${rawData.length.toLocaleString()}`);
    console.log(`📋 Columns found: ${Object.keys(rawData[0] || {}).join(', ')}`);
    console.log('');

    // Transform rows
    console.log('🔄 Transforming data...');
    const records = rawData
        .map(transformRow)
        .filter(r => r !== null);

    console.log(`✅ Valid records: ${records.length.toLocaleString()}`);
    console.log(`⏭️ Skipped: ${(rawData.length - records.length).toLocaleString()}`);
    console.log('');

    if (records.length === 0) {
        console.error('❌ No valid records found. Check your column names.');
        console.log('Expected columns: Data Series, Collection, Occupation, State, Area Type, Area, Wage Level, Hourly, Yearly');
        process.exit(1);
    }

    // Show sample record
    console.log('📋 Sample record:');
    console.log(JSON.stringify(records[0], null, 2));
    console.log('');

    // Optional: Clear existing data
    console.log('🗑️ Clearing existing data...');
    const { error: clearError } = await supabase
        .from(TABLE_NAME)
        .delete()
        .neq('id', 0); // This deletes all rows

    if (clearError) {
        console.warn('⚠️ Could not clear existing data (table may be empty):', clearError.message);
    }

    // Insert in batches
    console.log(`📤 Inserting ${records.length.toLocaleString()} records in batches of ${BATCH_SIZE}...`);
    console.log('');

    let totalInserted = 0;
    let totalErrors = 0;
    const totalBatches = Math.ceil(records.length / BATCH_SIZE);

    for (let i = 0; i < records.length; i += BATCH_SIZE) {
        const batchNum = Math.floor(i / BATCH_SIZE) + 1;
        const batch = records.slice(i, i + BATCH_SIZE);

        const { error: insertError } = await supabase
            .from(TABLE_NAME)
            .insert(batch);

        if (insertError) {
            console.error(`❌ Batch ${batchNum}/${totalBatches} failed:`, insertError.message);
            totalErrors += batch.length;

            // Try inserting one by one for this batch to find the problem record
            if (batch.length <= 50) {
                for (const record of batch) {
                    const { error: singleError } = await supabase
                        .from(TABLE_NAME)
                        .insert([record]);

                    if (!singleError) {
                        totalInserted++;
                        totalErrors--;
                    }
                }
            }
        } else {
            totalInserted += batch.length;
            const progress = ((totalInserted / records.length) * 100).toFixed(1);
            process.stdout.write(`\r   Progress: ${progress}% (${totalInserted.toLocaleString()}/${records.length.toLocaleString()}) - Batch ${batchNum}/${totalBatches}`);
        }
    }

    console.log('\n');
    console.log('========================');
    console.log('📊 Import Complete!');
    console.log(`✅ Inserted: ${totalInserted.toLocaleString()}`);
    console.log(`❌ Errors: ${totalErrors.toLocaleString()}`);
    console.log('========================');

    // Verify count in database
    const { count } = await supabase
        .from(TABLE_NAME)
        .select('*', { count: 'exact', head: true });

    console.log(`\n📊 Total records in DB: ${(count || 0).toLocaleString()}`);
}

// --- Run ---
const filePath = process.argv[2];

if (!filePath) {
    console.log('Usage: node scripts/import-h1b-wages.mjs <path-to-excel-file>');
    console.log('');
    console.log('Example:');
    console.log('  node scripts/import-h1b-wages.mjs "C:/Users/data/h1b_wages.xlsx"');
    process.exit(1);
}

importExcel(resolve(filePath)).catch(err => {
    console.error('❌ Fatal error:', err);
    process.exit(1);
});
