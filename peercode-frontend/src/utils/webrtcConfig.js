export const rtcConfig = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun.cloudflare.com:3478' },
    // TURN servers for symmetric NAT traversal
    // Replace with your TURN server credentials in production
    // {
    //   urls: 'turn:turn.example.com:3478?transport=udp',
    //   username: 'turn_username',
    //   credential: 'turn_password'
    // },
    // {
    //   urls: 'turn:turn.example.com:3478?transport=tcp',
    //   username: 'turn_username',
    //   credential: 'turn_password'
    // },
    // Free TURN options (for development):
    // { urls: 'turn:openrelay.metered.ca:80', username: 'openrelayproject', credential: 'openrelayproject' },
    // { urls: 'turn:openrelay.metered.ca:443', username: 'openrelayproject', credential: 'openrelayproject' },
    // { urls: 'turn:openrelay.metered.ca:443?transport=tcp', username: 'openrelayproject', credential: 'openrelayproject' },
  ]
}
