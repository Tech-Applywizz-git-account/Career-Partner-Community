import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

const STATE_MAP = {
    'AL': 'ALABAMA', 'AK': 'ALASKA', 'AZ': 'ARIZONA', 'AR': 'ARKANSAS', 'CA': 'CALIFORNIA',
    'CO': 'COLORADO', 'CT': 'CONNECTICUT', 'DE': 'DELAWARE', 'FL': 'FLORIDA', 'GA': 'GEORGIA',
    'HI': 'HAWAII', 'ID': 'IDAHO', 'IL': 'ILLINOIS', 'IN': 'INDIANA', 'IA': 'IOWA',
    'KS': 'KANSAS', 'KY': 'KENTUCKY', 'LA': 'LOUISIANA', 'ME': 'MAINE', 'MD': 'MARYLAND',
    'MA': 'MASSACHUSETTS', 'MI': 'MICHIGAN', 'MN': 'MINNESOTA', 'MS': 'MISSISSIPPI', 'MO': 'MISSOURI',
    'MT': 'MONTANA', 'NE': 'NEBRASKA', 'NV': 'NEVADA', 'NH': 'NEW HAMPSHIRE', 'NJ': 'NEW JERSEY',
    'NM': 'NEW MEXICO', 'NY': 'NEW YORK', 'NC': 'NORTH CAROLINA', 'ND': 'NORTH DAKOTA', 'OH': 'OHIO',
    'OK': 'OKLAHOMA', 'OR': 'OREGON', 'PA': 'PENNSYLVANIA', 'RI': 'RHODE ISLAND', 'SC': 'SOUTH CAROLINA',
    'SD': 'SOUTH DAKOTA', 'TN': 'TENNESSEE', 'TX': 'TEXAS', 'UT': 'UTAH', 'VT': 'VERMONT',
    'VA': 'VIRGINIA', 'WA': 'WASHINGTON', 'WV': 'WEST VIRGINIA', 'WI': 'WISCONSIN', 'WY': 'WYOMING',
    'DC': 'DISTRICT OF COLUMBIA', 'PR': 'PUERTO RICO'
};

function getSOCKeyword(titleStr) {
    if (!titleStr) return null;
    const t = titleStr.toLowerCase();
    if (t.match(/data\s*scien/)) return 'Data Scientists';
    if (t.match(/machine\s*learn|deep\s*learn|artificial\s*intel|nlp|llm|ml\s*engin/)) return 'Software Developers';
    if (t.match(/software|frontend|back.?end|full.?stack|web\s*dev|mobile\s*dev|ios|android|react|angular|vue|java|python|node|dotnet|\.net|c#|golang|scala|ruby|php/)) return 'Software Developers';
    if (t.match(/cloud|devops|sre|platform\s*engin|infrastructure|kubernetes|docker|terraform|aws|gcp|azure/)) return 'Software Developers';
    if (t.match(/data\s*engin|etl|pipeline|spark|kafka|hadoop|databricks|airflow/)) return 'Software Developers';
    if (t.match(/data\s*analy|business\s*intel|bi\s*dev|tableau|power\s*bi|looker/)) return 'Computer Occupations';
    if (t.match(/network\s*engin|network\s*admin|cisco|firewall|vpn/)) return 'Network';
    if (t.match(/security|cyber|infosec|penetration/)) return 'Security';
    if (t.match(/database|dba|sql\s*dev/)) return 'Database';
    if (t.match(/product\s*manager|project\s*manager|program\s*manager|scrum/)) return 'Computer Occupations';
    if (t.match(/system\s*analy|business\s*analy|functional\s*analy/)) return 'Systems Analysts';
    if (t.match(/qa|quality\s*assur|test\s*engin|sdet|automation\s*test/)) return 'Software Developers';
    if (t.match(/mechanical\s*engin/)) return 'Mechanical Engineers';
    if (t.match(/electrical\s*engin/)) return 'Electrical Engineers';
    if (t.match(/civil\s*engin/)) return 'Civil Engineers';
    if (t.match(/chemical\s*engin/)) return 'Chemical Engineers';
    if (t.match(/accountant|accounting|cpa/)) return 'Accountants';
    if (t.match(/financial\s*analy|finance|investment/)) return 'Financial';
    if (t.match(/nurse|nursing|rn\b/)) return 'Registered Nurses';
    if (t.match(/physician|doctor|md\b/)) return 'Physicians';
    if (t.match(/pharmacist/)) return 'Pharmacists';
    if (t.match(/supply\s*chain/)) return 'Supply Chain';
    if (t.match(/marketing/)) return 'Marketing';
    if (t.match(/researcher|research\s*scien|postdoc/)) return 'Research';
    if (t.match(/engin/)) return 'Software Developers';
    return null;
}

function parseLocation(locationStr) {
    if (!locationStr) return { city: null, state: null };
    const parts = locationStr.split(',').map(p => p.trim());
    if (parts.length >= 2) {
        const rawState = parts[parts.length - 1].toUpperCase().trim();
        const stateAbbr = rawState.slice(0, 2);
        const stateFull = STATE_MAP[stateAbbr] || rawState;
        const city = parts[0].toUpperCase();
        return { city, state: stateFull };
    }
    return { city: parts[0]?.toUpperCase() || null, state: null };
}

function getOccupationKeyword(titleStr) {
    if (!titleStr) return null;
    const lower = titleStr.toLowerCase();
    // Check multi-word phrases first
    for (const [kw, occ] of Object.entries(OCCUPATION_KEYWORDS_MAP)) {
        if (lower.includes(kw)) return occ;
    }
    return null;
}

function parseSalary(salaryStr) {
    if (!salaryStr) return null;
    // Handle range like "$79,400.00/yr - $137,000.00/yr" — take the midpoint
    const cleaned = salaryStr.replace(/[^0-9.,\-]/g, ' ').trim();
    const nums = cleaned.split(/[-–]/).map(s => {
        const n = parseFloat(s.replace(/,/g, '').trim());
        return isNaN(n) ? null : n;
    }).filter(n => n !== null && n > 1000); // Must be > $1000 (yearly, not hourly)
    if (nums.length === 0) return null;
    return nums.reduce((a, b) => a + b, 0) / nums.length; // Midpoint
}

function mapRomanToNum(l) {
    if (!l) return null;
    const val = l.toString().trim().toUpperCase();
    if (val.includes('MEAN')) return null;
    if (val.includes('IV') || val === '4') return 4;
    if (val.includes('III') || val === '3') return 3;
    if (val.includes('II') || val === '2') return 2;
    if (val === 'I' || val === '1') return 1;
    const num = parseInt(val.match(/\d/)?.[0]);
    return isNaN(num) ? null : num;
}

/**
 * Core comparison logic:
 * 1. Find all wage tiers for this occupation in this state/area
 * 2. Compare the job's salary against wage thresholds
 * 3. Return the correct wage tier
 */
async function determineWageLevel(job) {
    const title = job.title || job.job_role_name;
    const socKeyword = getSOCKeyword(title);
    if (!socKeyword) return null;

    const { city, state } = parseLocation(job.location);
    const salary = job.salary ? (() => {
        const nums = job.salary.replace(/[^0-9.,\-]/g, ' ').split(/[-–]/)
            .map(s => parseFloat(s.replace(/,/g, '').trim()))
            .filter(n => !isNaN(n) && n > 1000);
        return nums.length > 0 ? nums.reduce((a, b) => a + b, 0) / nums.length : null;
    })() : null;

    // Query h1b_wage_data
    const runQuery = async (st = null, city = null) => {
        let q = supabase
            .from('h1b_wage_data')
            .select('"Wage Level", "Hourly", "Yearly"')
            .ilike('Occupation', `%${socKeyword}%`)
            .not('Wage Level', 'ilike', '%MEAN%');
        if (st) q = q.ilike('State', `%${st}%`);
        if (city) q = q.ilike('Area', `%${city}%`);
        const { data } = await q.limit(20);
        return data || [];
    };

    let results = [];
    if (state && city) results = await runQuery(state, city);
    if (results.length === 0 && state) results = await runQuery(state, null);
    if (results.length === 0) results = await runQuery(null, null);
    if (results.length === 0) return null;

    // Build sorted tier list: I < II < III < IV
    const tiers = results
        .map(r => ({ level: mapRomanToNum(r['Wage Level']), yearly: parseSalary(r['Yearly']), hourly: parseSalary(r['Hourly']) }))
        .filter(r => r.level !== null)
        .sort((a, b) => a.level - b.level);

    if (tiers.length === 0) return null;

    // If we have the job's salary, compare it against the tiers
    if (salary && salary > 1000) { // yearly salary
        // Find which tier's yearly salary is closest to the job salary
        let bestTier = tiers[0];
        let bestDiff = Math.abs(salary - (tiers[0].yearly || 0));

        for (const tier of tiers) {
            const diff = Math.abs(salary - (tier.yearly || 0));
            if (diff < bestDiff) {
                bestDiff = diff;
                bestTier = tier;
            }
        }
        return { label: `Lv ${bestTier.level}`, num: bestTier.level };
    }

    // No salary — use title seniority to pick tier
    const titleLower = title.toLowerCase();
    let preferredLevel = 2;
    if (titleLower.match(/\blead\b|\bstaff\b|\bprincipal\b|\bdirector\b|\bvp\b|\b iv\b/)) preferredLevel = 4;
    else if (titleLower.match(/\bsenior\b|\bsr\b|\b iii\b/)) preferredLevel = 3;
    else if (titleLower.match(/\bjunior\b|\bjr\b|\bentry\b|\bintern\b/)) preferredLevel = 1;
    else if (titleLower.match(/\b ii\b/)) preferredLevel = 2;

    // Pick closest tier to preferred level
    let best = tiers[0];
    let bestDist = Math.abs(tiers[0].level - preferredLevel);
    for (const t of tiers) {
        const dist = Math.abs(t.level - preferredLevel);
        if (dist < bestDist || (dist === bestDist && t.level > best.level)) {
            bestDist = dist;
            best = t;
        }
    }

    return { label: `Lv ${best.level}`, num: best.level };
}

async function repairAll() {
    console.log('🚀 Starting Smart Wage Level Repair (Salary + Location Comparison)...\n');

    let offset = 0;
    const BATCH = 50;
    let totalChecked = 0;
    let totalFixed = 0;
    let totalNoMatch = 0;
    const MAX = 25000;

    while (offset < MAX) {
        const { data: jobs, error } = await supabase
            .from('job_jobrole_sponsored_sync')
            .select('id, title, job_role_name, location, salary, wage_level')
            .eq('wage_level', 'Lv 2')
            .range(offset, offset + BATCH - 1);

        if (error) { console.error('Fetch error:', error.message); break; }
        if (!jobs || jobs.length === 0) { console.log('\n✅ No more Lv 2 jobs to check!'); break; }

        const updates = [];
        for (const job of jobs) {
            const result = await determineWageLevel(job);
            if (result && result.label !== 'Lv 2') {
                updates.push({ id: job.id, wage_level: result.label, wage_num: result.num });
            } else {
                totalNoMatch++;
            }
        }

        if (updates.length > 0) {
            const { error: upErr } = await supabase
                .from('job_jobrole_sponsored_sync')
                .upsert(updates, { onConflict: 'id' });
            if (upErr) console.error('Update error:', upErr.message);
            else totalFixed += updates.length;
        }

        totalChecked += jobs.length;
        process.stdout.write(`\r  Checked: ${totalChecked} | Fixed: ${totalFixed} | No Match: ${totalNoMatch}`);

        // If no fixes in this batch, advance offset (all are genuinely Lv2)
        if (updates.length === 0) {
            offset += BATCH;
        }
        // If we fixed some, the list shifts — re-query from same offset
    }

    console.log('\n\n═══════════════════════════════════════');
    console.log('✅ Repair Complete!');
    console.log(`   Checked:  ${totalChecked}`);
    console.log(`   Fixed:    ${totalFixed}`);
    console.log(`   No Match: ${totalNoMatch}`);
    console.log('═══════════════════════════════════════');
}

repairAll();
