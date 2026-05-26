// send-domain-emails.js
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables from .env
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const AZURE_TENANT_ID = process.env.AZURE_TENANT_ID;
const AZURE_CLIENT_ID = process.env.AZURE_CLIENT_ID;
const AZURE_CLIENT_SECRET = process.env.AZURE_CLIENT_SECRET;
const SENDER_EMAIL = process.env.AZURE_SENDER_EMAIL;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("❌ Missing Supabase URL or Service Role Key in .env file.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function buildEmailHtml(email, fullName) {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1E1E1E; line-height: 1.6; padding: 40px 20px; max-width: 600px; margin: 0 auto; background-color: #fafafa; }
      .card { background-color: #ffffff; border-radius: 16px; border: 1px solid #f0f0f0; padding: 36px; box-shadow: 0 4px 12px rgba(0,0,0,0.03); }
      .logo-container { text-align: center; margin-bottom: 30px; }
      .btn-container { text-align: center; margin: 35px 0; }
      .btn-primary { background-color: #2C76FF; color: #ffffff !important; font-weight: bold; padding: 14px 28px; border-radius: 10px; text-decoration: none; display: inline-block; font-size: 15px; box-shadow: 0 4px 12px rgba(44,118,255,0.2); }
      .footer { margin-top: 40px; border-top: 1px solid #f0f0f0; padding-top: 20px; font-size: 13px; color: #666666; }
      .footer-name { font-weight: 700; margin-bottom: 2px; }
    </style>
  </head>
  <body>
    <div class="card">
      <div class="logo-container">
        <img src="https://res.cloudinary.com/dpuziwnvl/image/upload/v1751357541/apply_wizz_logo_hrvtmm.jpg" alt="APPLY WIZZ" style="height: 50px; border-radius: 8px;">
      </div>

      <p>Hey ${fullName},</p>

      <p>We've added an exciting new feature to <strong>Applywizz Career Partner Community</strong>! You can now specify your domain/technology directly inside your profile page.</p>

      <p>To help us personalise and tailor your automated job searches and matching recommendations specifically to your expertise, please take 10 seconds to enter your domain.</p>

      <div class="btn-container">
        <a href="https://careerpartner.applywizz.ai/" class="btn-primary" style="color: #ffffff !important;">Update Your Domain Now</a>
      </div>

      <p style="font-size: 13px; color: #666666; font-style: italic;">Note: A quick popup will automatically ask you to set your domain as soon as you log in next time.</p>

      <div class="footer">
        <div class="footer-name">Shyam Sankeerth,</div>
        <div class="footer-title">Co-Founder, ApplyWizz</div>
      </div>
    </div>
  </body>
  </html>
  `;
}

async function blastDomainEmails() {
  try {
    // 1. Fetch profiles where domain is null or empty
    console.log("📡 Querying profiles table for users with missing domains...");
    const { data: profiles, error: dbError } = await supabase
      .from('profiles')
      .select('email, full_name, domain');

    if (dbError) {
      throw new Error(`Database error: ${dbError.message}`);
    }

    const pendingUsers = (profiles || []).filter(p => !p.domain || p.domain.toString().trim() === '');

    if (pendingUsers.length === 0) {
      console.log("✅ All users already have a domain set. No emails needed!");
      return;
    }

    console.log(`🎯 Found ${pendingUsers.length} users with missing domain details. Starting blast...`);

    // 2. Fetch Microsoft Graph Access Token
    console.log("🔐 Fetching Microsoft Graph Access Token...");
    const tokenResponse = await fetch(
      `https://login.microsoftonline.com/${AZURE_TENANT_ID}/oauth2/v2.0/token`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: AZURE_CLIENT_ID,
          client_secret: AZURE_CLIENT_SECRET,
          grant_type: 'client_credentials',
          scope: 'https://graph.microsoft.com/.default'
        })
      }
    );

    const tokenData = await tokenResponse.json();
    if (!tokenData.access_token) {
      console.error("❌ Token Error:", JSON.stringify(tokenData, null, 2));
      throw new Error(`Failed to get Graph token: ${tokenData.error_description || tokenData.error}`);
    }

    const accessToken = tokenData.access_token;
    console.log("✅ Microsoft Graph Token acquired.\n");

    // 3. Send emails
    for (const recipient of pendingUsers) {
      const email = recipient.email;
      const fullName = recipient.full_name || "Member";

      if (!email) continue;

      console.log(`📧 Sending domain notification to: ${email}`);

      const emailPayload = {
        message: {
          subject: "Action Required: Please update your domain on Applywizz",
          body: {
            contentType: "HTML",
            content: buildEmailHtml(email, fullName)
          },
          toRecipients: [
            {
              emailAddress: {
                address: email,
                name: fullName
              }
            }
          ]
        },
        saveToSentItems: false
      };

      const sendResponse = await fetch(
        `https://graph.microsoft.com/v1.0/users/${SENDER_EMAIL}/sendMail`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(emailPayload)
        }
      );

      if (sendResponse.status === 202) {
        console.log(`✅ Success! Email sent to ${email}\n`);
      } else {
        let errorBody = {};
        try { errorBody = await sendResponse.json(); } catch (_) {}
        console.error(`❌ Failed for ${email}:`);
        console.error(`   HTTP Status: ${sendResponse.status} ${sendResponse.statusText}`);
        console.error(`   Error Body:`, JSON.stringify(errorBody, null, 2));
      }
    }

    console.log("✨ All notification emails processed successfully!");

  } catch (error) {
    console.error('💥 Fatal Error:', error.message);
  }
}

blastDomainEmails();
