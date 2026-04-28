import fs from 'fs';
import csv from 'csv-parser';
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

// 1. Configuration
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Error: Missing Supabase URL or Service Role Key in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const TABLE_NAME = 'job_jobrole_sponsored_sync';
const BATCH_SIZE = 200; // Smaller batch size for better stability
const RETRY_ATTEMPTS = 3;
const DELAY_BETWEEN_BATCHES_MS = 500;

// Helper to fix invalid timestamps/dates
const fixValue = (val) => {
    if (val === 'null' || val === 'NULL' || val === '' || !val || val === 'NaN') return null;
    return val;
};

const delay = (ms) => new Promise(res => setTimeout(res, ms));

// 2. Main Import Function
async function startImport(filePath) {
    if (!filePath) {
        console.error('❌ Error: Please provide the path to your CSV file.');
        console.log('Usage: node scripts/bulk-import-jobs.mjs "C:/path/to/your/file.csv"');
        return;
    }

    console.log(`🚀 Starting resilient bulk import from: ${filePath}`);
    console.log(`📡 Target Table: ${TABLE_NAME}`);

    let batch = [];
    let rowCount = 0;
    let totalInserted = 0;
    let skippedCount = 0;
    let errorCount = 0;

    // Fetch existing URLs to avoid duplicates in batches
    console.log('🔍 Fetching all existing records to prevent duplicates...');
    const existingUrls = new Set();
    let page = 0;
    const pageSize = 1000;
    let hasMore = true;

    while (hasMore) {
        const { data, error: fetchError } = await supabase
            .from(TABLE_NAME)
            .select('url')
            .range(page * pageSize, (page + 1) * pageSize - 1);

        if (fetchError) {
            console.error('❌ Error fetching existing records:', fetchError.message);
            process.exit(1);
        }

        if (data && data.length > 0) {
            data.forEach(r => { if (r.url) existingUrls.add(r.url) });
            page++;
            hasMore = data.length === pageSize;
            process.stdout.write(`\r   Indexed ${existingUrls.size} existing URLs...`);
        } else {
            hasMore = false;
        }
    }
    console.log(`\n✅ Finished indexing. Will skip duplicates for ${existingUrls.size} records.`);

    const stream = fs.createReadStream(filePath)
        .pipe(csv());

    for await (const row of stream) {
        rowCount++;

        if (existingUrls.has(row.url)) {
            skippedCount++;
            continue;
        }

        const mappedRow = {
            title: fixValue(row.title),
            company: fixValue(row.company),
            location: fixValue(row.location),
            url: fixValue(row.url),
            description: fixValue(row.description),
            date_posted: fixValue(row.date_posted),
            years_exp_required: fixValue(row.years_exp_required),
            upload_date: fixValue(row.upload_date),
            job_role_name: fixValue(row.job_role_name),
            sponsored_job: fixValue(row.sponsored_job),
            country: fixValue(row.country) || 'United States of America',
            jobId: fixValue(row.jobId) || fixValue(row.id),
            assigned_to: fixValue(row.assigned_to),
            salary: fixValue(row.salary),
            wage_level: fixValue(row.wage_level) || 'Lv 2',
            wage_num: parseInt(fixValue(row.wage_num) || '2'),
            synced_at: new Date().toISOString()
        };

        batch.push(mappedRow);

        if (batch.length >= BATCH_SIZE) {
            const success = await insertBatchWithRetry(batch);
            if (success) {
                totalInserted += batch.length;
                console.log(`⏳ Progress: ${totalInserted} rows inserted successfully...`);
            } else {
                errorCount += batch.length;
                console.error(`🔴 Batch failed after ${RETRY_ATTEMPTS} attempts. Skipping ${batch.length} rows.`);
            }
            batch = [];
            await delay(DELAY_BETWEEN_BATCHES_MS);
        }
    }

    // Insert remaining rows
    if (batch.length > 0) {
        const success = await insertBatchWithRetry(batch);
        if (success) {
            totalInserted += batch.length;
        } else {
            errorCount += batch.length;
        }
    }

    console.log('\n========================================');
    console.log('✅ IMPORT COMPLETE!');
    console.log(`📊 Total rows processed in CSV: ${rowCount}`);
    console.log(`✨ Total rows inserted successfully: ${totalInserted}`);
    console.log(`⏭️ Total rows skipped (duplicates): ${skippedCount}`);
    console.log(`❌ Total rows failed (errors): ${errorCount}`);
    console.log('========================================');
}

async function insertBatchWithRetry(batch, attempt = 1) {
    try {
        const { error } = await supabase
            .from(TABLE_NAME)
            .insert(batch);

        if (error) {
            console.warn(`⚠️ Attempt ${attempt} failed: ${error.message}`);
            if (attempt < RETRY_ATTEMPTS) {
                const wait = attempt * 2000;
                console.log(`🔄 Retrying in ${wait / 1000}s...`);
                await delay(wait);
                return await insertBatchWithRetry(batch, attempt + 1);
            }
            return false;
        }
        return true;
    } catch (err) {
        console.error(`❌ Unexpected Error (Attempt ${attempt}):`, err.message);
        if (attempt < RETRY_ATTEMPTS) {
            await delay(attempt * 2000);
            return await insertBatchWithRetry(batch, attempt + 1);
        }
        return false;
    }
}

// 3. Execution
const filePath = process.argv[2];
startImport(filePath);
