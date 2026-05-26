import dotenv from 'dotenv';
dotenv.config();

const AZURE_TENANT_ID = process.env.AZURE_TENANT_ID;
const AZURE_CLIENT_ID = process.env.AZURE_CLIENT_ID;
const AZURE_CLIENT_SECRET = process.env.AZURE_CLIENT_SECRET;
const SENDER_EMAIL = process.env.AZURE_SENDER_EMAIL;

const recipients = [
  { email: "ganeshgummadidala8@gmail.com", fullName: "Ganesh Gummadidala" }
]

function buildEmailHtml(email, fullName) {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #333; line-height: 1.5; padding: 40px 20px; max-width: 600px; margin: 0 auto; }
      .logo-container { text-align: center; margin-bottom: 40px; }
      .credentials-box { margin: 25px 0; border-left: 3px solid #2C76FF; padding-left: 15px; }
      .footer { margin-top: 40px; border-top: 1px solid #eee; padding-top: 20px; }
      .footer-name { font-weight: 700; margin-bottom: 2px; }
      .footer-title { color: #666; font-size: 14px; }
    </style>
  </head>
  <body>
    <div class="logo-container">
      <img src="https://res.cloudinary.com/dpuziwnvl/image/upload/v1751357541/apply_wizz_logo_hrvtmm.jpg" alt="APPLY WIZZ" style="height: 60px; border-radius: 8px;">
    </div>

    <p>Hey ${fullName},</p>

    <p>Welcome to Applywizz! We've successfully set up your account in the Career Partner Community. You can now access your dashboard and explore job opportunities that fit your profile.</p>

    <p>Your login credentials are below:</p>

    <div class="credentials-box">
      <p style="margin: 0;"><strong>Email:</strong> ${email}</p>
      <p style="margin: 5px 0 0;"><strong>Password:</strong> Applywizz@2026</p>
    </div>

    <p>You can access your dashboard here: <a href="https://careerpartner.applywizz.ai/" style="color: #2C76FF; text-decoration: none; font-weight: 600;">careerpartner.applywizz.ai</a></p>

    <div class="footer">
      <div class="footer-name">Shyam Sankeerth,</div>
      <div class="footer-title">Co-Founder, ApplyWizz</div>
    </div>
  </body>
  </html>
  `
}

async function sendWelcomeEmails() {
  try {
    // 1. Get Microsoft Graph Access Token
    console.log("🔐 Fetching Microsoft Graph Access Token...")
    const tokenResponse = await fetch(
      `https://login.microsoftonline.com/${AZURE_TENANT_ID}/oauth2/v2.0/token`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: AZURE_CLIENT_ID,
          client_secret: AZURE_CLIENT_SECRET,
          grant_type: 'client_credentials',
          scope: 'https://graph.microsoft.com/.default'   // ← Graph scope (not ACS)
        })
      }
    )

    const tokenData = await tokenResponse.json()
    if (!tokenData.access_token) {
      console.error("❌ Token Error:", JSON.stringify(tokenData, null, 2))
      throw new Error(`Failed to get Graph token: ${tokenData.error_description || tokenData.error}`)
    }

    const accessToken = tokenData.access_token
    console.log("✅ Microsoft Graph Token acquired.\n")

    // 2. Send email to each recipient via Graph API
    for (const recipient of recipients) {
      const { email, fullName } = recipient
      console.log(`📧 Sending welcome email to: ${email}`)

      const emailPayload = {
        message: {
          subject: "Welcome to Applywizz!",
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
      }

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
      )

      // Graph API returns 202 Accepted (no body) on success
      if (sendResponse.status === 202) {
        console.log(`✅ Success! Email sent to ${email}\n`)
      } else {
        let errorBody = {}
        try { errorBody = await sendResponse.json() } catch (_) {}
        console.error(`❌ Failed for ${email}:`)
        console.error(`   HTTP Status: ${sendResponse.status} ${sendResponse.statusText}`)
        console.error(`   Error Body:`, JSON.stringify(errorBody, null, 2))
      }
    }

  } catch (error) {
    console.error('💥 Fatal Error:', error.message)
  }
}

sendWelcomeEmails()
