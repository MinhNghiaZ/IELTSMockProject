import * as signalR from '@microsoft/signalr';

export const createSignalRConnection = (token: string): signalR.HubConnection => {
  const connection = new signalR.HubConnectionBuilder()
    .withUrl('http://localhost:5234/chathub', {
      accessTokenFactory: () => token,
      // Also send token in query string for WebSocket upgrade
      skipNegotiation: false
    })
    .withAutomaticReconnect()
    .configureLogging(signalR.LogLevel.Information)
    .build();
  
  return connection;
};

export const startConnection = async (connection: signalR.HubConnection) => {
  try {
    if (connection.state === signalR.HubConnectionState.Disconnected) {
      await connection.start();
      console.log('✅ SignalR Connected successfully');
    } else {
      console.log('SignalR already connected, state:', connection.state);
    }
  } catch (err) {
    console.error('❌ SignalR Connection Error: ', err);
    // Retry after 5 seconds
    setTimeout(() => startConnection(connection), 5000);
  }
};

export const stopConnection = async (connection: signalR.HubConnection | null) => {
  if (connection) {
    try {
      if (connection.state !== signalR.HubConnectionState.Disconnected) {
        await connection.stop();
        console.log('🔌 SignalR Disconnected');
      }
    } catch (err) {
      console.error('Error stopping SignalR connection:', err);
    }
  }
};
