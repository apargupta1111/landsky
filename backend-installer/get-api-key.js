const axios = require('axios');

async function getTokens() {
  try {
    // Some TTS instances allow login via Identity Server
    // Let's try to get a list of API keys for the app or create one
    // But we need a Bearer token. We can try to use Basic Auth?
    // Basic auth is supported by TTS for some endpoints, but typically we need to create an API key.

    const encodedCreds = Buffer.from('admin:Hbeonlabs123').toString('base64');
    const authHeader = `Basic ${encodedCreds}`;

    console.log("Trying to fetch applications...");
    const res = await axios.get('http://13.205.43.53:1885/api/v3/applications', {
      headers: { Authorization: authHeader }
    });
    console.log("Applications:", res.data);

    // Get API Keys for the application
    try {
      const keysRes = await axios.get('http://13.205.43.53:1885/api/v3/applications/hbeon-app-001/api-keys', {
        headers: { Authorization: authHeader }
      });
      console.log("API Keys:", keysRes.data);
    } catch (e) {
      console.log("Could not fetch API keys:", e.response?.data || e.message);
      
      // Let's try to create one
      const createRes = await axios.post('http://13.205.43.53:1885/api/v3/applications/hbeon-app-001/api-keys', {
        name: "backend-key",
        rights: [
          "RIGHT_APPLICATION_ALL"
        ]
      }, {
        headers: { Authorization: authHeader }
      });
      console.log("Created API Key:", createRes.data);
    }

  } catch (error) {
    console.error("Error:", error.response?.data || error.message);
  }
}

getTokens();
