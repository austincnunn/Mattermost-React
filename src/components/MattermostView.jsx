import React, { useRef, useEffect, useState } from 'react';

function MattermostView({ serverUrl, onOpenSettings }) {
  const webviewRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const webview = webviewRef.current;
    if (!webview) return;

    const handleDomReady = () => {
      // Inject notification bridge script
      if (window.notificationBridge) {
        const script = window.notificationBridge.getInjectionScript();
        webview.executeJavaScript(script).catch(console.error);
      }
    };

    const handleDidFinishLoad = () => {
      setIsLoading(false);
      setError(null);
    };

    const handleDidFailLoad = (event) => {
      if (event.errorCode !== -3) { // Ignore aborted loads
        setIsLoading(false);
        setError(`Failed to load: ${event.errorDescription}`);
      }
    };

    const handleConsoleMessage = (event) => {
      // Handle messages from injected script
      if (event.message.includes('mattermost-notification') ||
          event.message.includes('mattermost-unread-count')) {
        try {
          const data = JSON.parse(event.message);
          handleWebviewMessage(data);
        } catch {
          // Not a JSON message, ignore
        }
      }
    };

    const handleIpcMessage = (event) => {
      handleWebviewMessage(event.channel === 'message' ? event.args[0] : null);
    };

    const handleNewWindow = (event) => {
      event.preventDefault();
      // Open external links in system browser
      window.open(event.url, '_blank');
    };

    webview.addEventListener('dom-ready', handleDomReady);
    webview.addEventListener('did-finish-load', handleDidFinishLoad);
    webview.addEventListener('did-fail-load', handleDidFailLoad);
    webview.addEventListener('console-message', handleConsoleMessage);
    webview.addEventListener('ipc-message', handleIpcMessage);
    webview.addEventListener('new-window', handleNewWindow);

    return () => {
      webview.removeEventListener('dom-ready', handleDomReady);
      webview.removeEventListener('did-finish-load', handleDidFinishLoad);
      webview.removeEventListener('did-fail-load', handleDidFailLoad);
      webview.removeEventListener('console-message', handleConsoleMessage);
      webview.removeEventListener('ipc-message', handleIpcMessage);
      webview.removeEventListener('new-window', handleNewWindow);
    };
  }, [serverUrl]);

  // Listen for menu navigation commands
  useEffect(() => {
    if (!window.electronAPI) return;

    window.electronAPI.onNavigateToSettings(() => {
      onOpenSettings();
    });

    window.electronAPI.onWebviewGoBack(() => {
      webviewRef.current?.goBack();
    });

    window.electronAPI.onWebviewGoForward(() => {
      webviewRef.current?.goForward();
    });

    window.electronAPI.onWebviewReload(() => {
      setIsLoading(true);
      setError(null);
      webviewRef.current?.reload();
    });
  }, [onOpenSettings]);

  // Listen for messages from webview
  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data && event.data.type) {
        handleWebviewMessage(event.data);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleWebviewMessage = (data) => {
    if (!data) return;

    if (data.type === 'mattermost-notification' && window.electronAPI) {
      window.electronAPI.showNotification(data.title, data.body);
    }

    if (data.type === 'mattermost-unread-count' && window.electronAPI) {
      window.electronAPI.setBadge(data.count);
    }
  };

  const handleReload = () => {
    setIsLoading(true);
    setError(null);
    webviewRef.current?.reload();
  };

  return (
    <div className="mattermost-view">
      {isLoading && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <p>Loading Mattermost...</p>
        </div>
      )}

      {error && (
        <div className="error-overlay">
          <p>{error}</p>
          <button onClick={handleReload}>Retry</button>
        </div>
      )}

      <webview
        ref={webviewRef}
        src={serverUrl}
        className="webview"
        allowpopups="true"
        partition="persist:mattermost"
      />
    </div>
  );
}

export default MattermostView;
