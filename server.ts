import express from 'express';
import { createServer as createViteServer } from 'vite';
import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // GitHub OAuth URL Construction
  app.get('/api/auth/github/url', (req, res) => {
    const clientId = process.env.GITHUB_CLIENT_ID;
    if (!clientId) {
      return res.status(500).json({ error: 'GITHUB_CLIENT_ID is not configured' });
    }

    const params = new URLSearchParams({
      client_id: clientId,
      scope: 'repo user',
      allow_signup: 'true',
    });

    res.json({ url: `https://github.com/login/oauth/authorize?${params.toString()}` });
  });

  // GitHub Repo Proxy
  app.get('/api/github/repos', async (req, res) => {
    const { token } = req.query;
    if (!token) return res.status(400).json({ error: 'Missing token' });

    try {
      const response = await axios.get('https://api.github.com/user/repos', {
        headers: { 
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github.v3+json'
        },
        params: {
          sort: 'updated',
          per_page: 50
        }
      });
      res.json(response.data);
    } catch (error: any) {
      console.error('GitHub API error:', error.response?.data || error.message);
      res.status(error.response?.status || 500).json(error.response?.data || { message: 'Internal Server Error' });
    }
  });

  // GitHub OAuth Callback
  app.get(['/auth/callback', '/auth/callback/'], async (req, res) => {
    const { code } = req.query;

    if (!code) {
      return res.status(400).send('Missing code');
    }

    try {
      // Exchange code for token
      const tokenResponse = await axios.post('https://github.com/login/oauth/access_token', {
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
      }, {
        headers: { Accept: 'application/json' }
      });

      const accessToken = tokenResponse.data.access_token;

      if (!accessToken) {
        throw new Error('Failed to obtain access token');
      }

      // Fetch user info
      const userResponse = await axios.get('https://api.github.com/user', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      const userData = {
        token: accessToken,
        username: userResponse.data.login,
        avatarUrl: userResponse.data.avatar_url,
        id: userResponse.data.id,
      };

      // Send success message to parent window and close popup
      // We pass the userData back to the frontend
      res.send(`
        <html>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({ 
                  type: 'GITHUB_AUTH_SUCCESS', 
                  payload: ${JSON.stringify(userData)} 
                }, '*');
                window.close();
              } else {
                window.location.href = '/settings';
              }
            </script>
            <p>Authentication successful. You can close this window if it doesn't close automatically.</p>
          </body>
        </html>
      `);
    } catch (error: any) {
      console.error('GitHub OAuth error:', error.response?.data || error.message);
      res.status(500).send('Authentication failed');
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

startServer();
