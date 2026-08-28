const https = require('https');

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  let data = {};
  try {
    if (event.headers['content-type'] && event.headers['content-type'].includes('application/json')) {
      data = JSON.parse(event.body);
    } else {
      const params = new URLSearchParams(event.body);
      for (const [key, value] of params.entries()) {
        data[key] = value;
      }
    }
  } catch (err) {
    data = {};
  }

  // Extract fields
  const firstName = data['form_fields[form_free_consultation_first_name]'] || data['first_name'] || data['firstName'] || '';
  const lastName = data['form_fields[form_free_consultation_last_name]'] || data['last_name'] || data['lastName'] || '';
  const fullName = `${firstName} ${lastName}`.trim() || data['name'] || 'Not specified';
  const company = data['form_fields[form_free_consultation_company_name]'] || data['company'] || 'Not specified';
  const email = data['form_fields[form_free_consultation_email]'] || data['form_fields[email]'] || data['email'] || 'Not specified';
  const phone = data['form_fields[form_free_consultation_phone]'] || data['phone'] || 'Not specified';
  const service = data['form_fields[form_free_consultation_select_service]'] || data['service'] || 'General Inquiry';
  const message = data['form_fields[form_free_consultation_message]'] || data['message'] || 'No message provided';
  const pageUrl = data['page_url'] || data['referer_title'] || 'Craftsmen.it Website';

  // Telegram Config
  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

  if (!BOT_TOKEN || !CHAT_ID) {
    console.warn('Telegram environment variables are not configured.');
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, message: 'Form submitted.' })
    };
  }

  // Format message text
  let text = '';
  if (email !== 'Not specified' && fullName === 'Not specified' && message === 'No message provided') {
    // Newsletter Subscription
    text = `📬 *New Newsletter Subscriber — Craftsmen.it*\n\n` +
           `📧 *Email:* \`${email}\`\n` +
           `📄 *Source:* ${pageUrl}\n` +
           `⏰ *Date:* ${new Date().toUTCString()}`;
  } else {
    // Consultation Request
    text = `🚀 *New Consultation Request — Craftsmen.it*\n\n` +
           `👤 *Name:* ${fullName}\n` +
           `📧 *Email:* \`${email}\`\n` +
           `📱 *Phone:* \`${phone}\`\n` +
           `🏢 *Company:* ${company}\n` +
           `💼 *Service Needed:* ${service}\n\n` +
           `💬 *Client Message:*\n${message}\n\n` +
           `📄 *Submitted From:* ${pageUrl}\n` +
           `⏰ *Date:* ${new Date().toUTCString()}`;
  }

  // Send to Telegram
  try {
    const tgRes = await sendTelegramMessage(BOT_TOKEN, CHAT_ID, text);
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true, message: 'Message sent to Telegram bot successfully!', result: tgRes })
    };
  } catch (error) {
    console.error('Error sending Telegram message:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ success: false, error: error.message })
    };
  }
};

function sendTelegramMessage(botToken, chatId, text) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      chat_id: chatId,
      text: text,
      parse_mode: 'Markdown'
    });

    const options = {
      hostname: 'api.telegram.org',
      port: 443,
      path: `/bot${botToken}/sendMessage`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          if (json.ok) {
            resolve(json);
          } else {
            reject(new Error(json.description || 'Telegram API Error'));
          }
        } catch (e) {
          resolve(body);
        }
      });
    });

    req.on('error', (e) => reject(e));
    req.write(payload);
    req.end();
  });
}
