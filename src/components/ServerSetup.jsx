import React, { useState } from 'react';

function ServerSetup({ onServerSet, initialUrl }) {
  const [url, setUrl] = useState(initialUrl || '');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const validateUrl = (urlString) => {
    try {
      const parsed = new URL(urlString);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  };

  const normalizeUrl = (urlString) => {
    let normalized = urlString.trim();

    // Add https:// if no protocol specified
    if (!normalized.match(/^https?:\/\//i)) {
      normalized = 'https://' + normalized;
    }

    // Remove trailing slash
    normalized = normalized.replace(/\/$/, '');

    return normalized;
  };

  const testConnection = async (serverUrl) => {
    try {
      // Try to fetch the server's API endpoint
      const response = await fetch(`${serverUrl}/api/v4/system/ping`, {
        method: 'GET',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      return response.ok;
    } catch {
      // If CORS blocks us, we still consider it valid since the webview will handle it
      return true;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const normalizedUrl = normalizeUrl(url);

    if (!validateUrl(normalizedUrl)) {
      setError('Please enter a valid URL');
      setLoading(false);
      return;
    }

    try {
      const isValid = await testConnection(normalizedUrl);
      if (isValid) {
        onServerSet(normalizedUrl);
      } else {
        setError('Could not connect to the Mattermost server. Please check the URL.');
      }
    } catch (err) {
      setError('Failed to connect. Please check the URL and try again.');
    }

    setLoading(false);
  };

  return (
    <div className="server-setup">
      <div className="server-setup-container">
        <div className="server-setup-header">
          <img
            src="/icon.png"
            alt="Mattermost"
            className="server-setup-logo"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
          <h1>Welcome to Mattermost</h1>
          <p>Enter your Mattermost server URL to get started</p>
        </div>

        <form onSubmit={handleSubmit} className="server-setup-form">
          <div className="input-group">
            <label htmlFor="server-url">Server URL</label>
            <input
              id="server-url"
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://your-server.mattermost.com"
              disabled={loading}
              autoFocus
            />
            {error && <span className="error-message">{error}</span>}
          </div>

          <button type="submit" disabled={loading || !url.trim()}>
            {loading ? 'Connecting...' : 'Connect'}
          </button>
        </form>

        <div className="server-setup-help">
          <p>
            Don't have a server?{' '}
            <a
              href="https://mattermost.com/download/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Learn more
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default ServerSetup;
