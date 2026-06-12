const Network = {
  ws: null,
  connected: false,
  serverUrl: "ws://localhost:8899/ws",
  reconnectTimer: null,
  messageHandlers: {},

  connect: function(url) {
    if (this.ws) {
      this.disconnect();
    }
    this.serverUrl = url || this.serverUrl;
    try {
      this.ws = new WebSocket(this.serverUrl);
    } catch (e) {
      console.error("WebSocket connection error:", e);
      this.scheduleReconnect();
      return;
    }

    this.ws.onopen = function() {
      Network.connected = true;
      if (Network.reconnectTimer) {
        clearTimeout(Network.reconnectTimer);
        Network.reconnectTimer = null;
      }
      console.log("Connected to server:", Network.serverUrl);
      if (typeof Game !== "undefined" && Game.onConnected) {
        Game.onConnected();
      }
    };

    this.ws.onclose = function(e) {
      Network.connected = false;
      console.log("Disconnected from server. Code:", e.code);
      if (typeof Game !== "undefined" && Game.onDisconnected) {
        Game.onDisconnected();
      }
      Network.scheduleReconnect();
    };

    this.ws.onmessage = function(e) {
      try {
        var msg = JSON.parse(e.data);
        Network.handleMessage(msg);
      } catch (err) {
        console.error("Failed to parse server message:", err);
      }
    };

    this.ws.onerror = function(e) {
      console.error("WebSocket error:", e);
    };
  },

  scheduleReconnect: function() {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(function() {
      Network.reconnectTimer = null;
      if (!Network.connected) {
        console.log("Reconnecting to:", Network.serverUrl);
        Network.connect(Network.serverUrl);
      }
    }, 3000);
  },

  send: function(type, data) {
    if (!this.connected || !this.ws) {
      console.warn("Cannot send message, not connected:", type);
      return;
    }
    var msg = JSON.stringify(Object.assign({ type: type }, data || {}));
    try {
      this.ws.send(msg);
    } catch (e) {
      console.error("Failed to send message:", e);
    }
  },

  registerHandler: function(type, callback) {
    if (!this.messageHandlers[type]) {
      this.messageHandlers[type] = [];
    }
    this.messageHandlers[type].push(callback);
  },

  handleMessage: function(msg) {
    var type = msg.type;
    var data = msg.data || {};
    var handlers = this.messageHandlers[type];
    if (handlers) {
      for (var i = 0; i < handlers.length; i++) {
        try {
          handlers[i](data);
        } catch (err) {
          console.error("Handler error for type '" + type + "':", err);
        }
      }
    }
    if (typeof Game !== "undefined" && Game.handleServerMessage) {
      Game.handleServerMessage(type, data);
    }
  },

  disconnect: function() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.connected = false;
      try {
        this.ws.close();
      } catch (e) {}
      this.ws = null;
    }
  }
};
