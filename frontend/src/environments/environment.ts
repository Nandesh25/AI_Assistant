export const environment = {
  production: false,
  apiUrl: '/api/v1',
  wsUrl: `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/ws`,
};
