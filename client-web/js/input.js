const Input = {
  joystick: {
    active: false,
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    direction: { x: 0, y: 0 },
    element: null,
    handle: null,
    baseElement: null,
    maxRadius: 40
  },
  keys: {},
  initialized: false,

  init: function() {
    if (this.initialized) return;
    this.initialized = true;

    this.joystick.baseElement = document.getElementById("joystickBase");
    this.joystick.handle = document.getElementById("joystickThumb");

    var canvas = document.getElementById("gameCanvas");
    if (!canvas) return;

    var self = this;

    canvas.addEventListener("touchstart", function(e) {
      e.preventDefault();
      self.handleTouchStart(e);
    }, { passive: false });

    canvas.addEventListener("touchmove", function(e) {
      e.preventDefault();
      self.handleTouchMove(e);
    }, { passive: false });

    canvas.addEventListener("touchend", function(e) {
      e.preventDefault();
      self.handleTouchEnd(e);
    }, { passive: false });

    canvas.addEventListener("touchcancel", function(e) {
      e.preventDefault();
      self.handleTouchEnd(e);
    }, { passive: false });

    canvas.addEventListener("mousedown", function(e) {
      self.handleMouseDown(e);
    });

    canvas.addEventListener("mousemove", function(e) {
      self.handleMouseMove(e);
    });

    canvas.addEventListener("mouseup", function(e) {
      self.handleMouseUp(e);
    });

    document.addEventListener("keydown", function(e) {
      self.keys[e.key] = true;
      self.handleKeyDown(e);
    });

    document.addEventListener("keyup", function(e) {
      self.keys[e.key] = false;
    });

    var skillBtns = document.querySelectorAll(".skill-btn");
    for (var i = 0; i < skillBtns.length; i++) {
      (function(btn, idx) {
        btn.addEventListener("click", function(e) {
          if (typeof Game !== "undefined" && Game.player && Game.state === "playing") {
            var skillId = Game.player.skillBar[idx] || null;
            if (skillId) {
              Game.useSkill(idx);
            }
          }
        });
        btn.addEventListener("touchstart", function(e) {
          e.preventDefault();
          e.stopPropagation();
          if (typeof Game !== "undefined" && Game.player && Game.state === "playing") {
            var skillId = Game.player.skillBar[idx] || null;
            if (skillId) {
              Game.useSkill(idx);
            }
          }
        }, { passive: false });
      })(skillBtns[i], i);
    }

    var hpPotionBtn = document.getElementById("hpPotionBtn");
    if (hpPotionBtn) {
      hpPotionBtn.addEventListener("click", function() {
        if (typeof Game !== "undefined" && Game.player && Game.state === "playing") {
          Game.usePotion("hp");
        }
      });
      hpPotionBtn.addEventListener("touchstart", function(e) {
        e.preventDefault();
        e.stopPropagation();
        if (typeof Game !== "undefined" && Game.player && Game.state === "playing") {
          Game.usePotion("hp");
        }
      }, { passive: false });
    }

    var mpPotionBtn = document.getElementById("mpPotionBtn");
    if (mpPotionBtn) {
      mpPotionBtn.addEventListener("click", function() {
        if (typeof Game !== "undefined" && Game.player && Game.state === "playing") {
          Game.usePotion("mp");
        }
      });
      mpPotionBtn.addEventListener("touchstart", function(e) {
        e.preventDefault();
        e.stopPropagation();
        if (typeof Game !== "undefined" && Game.player && Game.state === "playing") {
          Game.usePotion("mp");
        }
      }, { passive: false });
    }

    var chatSendBtn = document.getElementById("chatSendBtn");
    if (chatSendBtn) {
      chatSendBtn.addEventListener("click", function() {
        self.sendChat();
      });
    }

    var chatInput = document.getElementById("chatInput");
    if (chatInput) {
      chatInput.addEventListener("keydown", function(e) {
        if (e.key === "Enter") {
          e.preventDefault();
          self.sendChat();
        }
      });
    }

    var chatToggle = document.getElementById("chatToggle");
    if (chatToggle) {
      chatToggle.addEventListener("click", function() {
        var box = document.getElementById("chatBox");
        if (box) box.classList.toggle("collapsed");
      });
    }
  },

  sendChat: function() {
    var input = document.getElementById("chatInput");
    if (!input) return;
    var text = input.value.trim();
    if (text.length > 0) {
      Network.send("CHAT", { message: text });
      if (typeof Game !== "undefined" && Game.addChatMessage) {
        Game.addChatMessage("Tú: " + text, "player");
      }
      input.value = "";
    }
  },

  handleTouchStart: function(e) {
    var touch = e.touches[0];
    if (!touch) return;
    var rect = this.joystick.baseElement ? this.joystick.baseElement.getBoundingClientRect() : null;
    if (rect) {
      var cx = rect.left + rect.width / 2;
      var cy = rect.top + rect.height / 2;
      var dx = touch.clientX - cx;
      var dy = touch.clientY - cy;
      var dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < rect.width * 0.8) {
        this.joystick.active = true;
        this.joystick.startX = cx;
        this.joystick.startY = cy;
        this.joystick.currentX = touch.clientX;
        this.joystick.currentY = touch.clientY;
        this.updateJoystick();
        return;
      }
    }
  },

  handleTouchMove: function(e) {
    if (!this.joystick.active) return;
    var touch = e.touches[0];
    if (!touch) return;
    this.joystick.currentX = touch.clientX;
    this.joystick.currentY = touch.clientY;
    this.updateJoystick();
  },

  handleTouchEnd: function(e) {
    this.joystick.active = false;
    this.joystick.direction = { x: 0, y: 0 };
    this.joystick.currentX = this.joystick.startX;
    this.joystick.currentY = this.joystick.startY;
    this.updateJoystick();
  },

  handleMouseDown: function(e) {
    var rect = this.joystick.baseElement ? this.joystick.baseElement.getBoundingClientRect() : null;
    if (rect) {
      var cx = rect.left + rect.width / 2;
      var cy = rect.top + rect.height / 2;
      var dx = e.clientX - cx;
      var dy = e.clientY - cy;
      var dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < rect.width * 0.8) {
        this.joystick.active = true;
        this.joystick.startX = cx;
        this.joystick.startY = cy;
        this.joystick.currentX = e.clientX;
        this.joystick.currentY = e.clientY;
        this.updateJoystick();
        return;
      }
    }
    var world = Renderer.screenToWorld(e.clientX, e.clientY);
    if (typeof Game !== "undefined" && Game.handleClick) {
      Game.handleClick(e.clientX, e.clientY, world.x, world.y);
    }
  },

  handleMouseMove: function(e) {
    if (!this.joystick.active) return;
    this.joystick.currentX = e.clientX;
    this.joystick.currentY = e.clientY;
    this.updateJoystick();
  },

  handleMouseUp: function(e) {
    this.joystick.active = false;
    this.joystick.direction = { x: 0, y: 0 };
    this.joystick.currentX = this.joystick.startX;
    this.joystick.currentY = this.joystick.startY;
    this.updateJoystick();
  },

  handleKeyDown: function(e) {
    var chatInput = document.getElementById("chatInput");
    if (chatInput && document.activeElement === chatInput) {
      return;
    }
    if (e.key >= "1" && e.key <= "6") {
      var idx = parseInt(e.key) - 1;
      if (typeof Game !== "undefined" && Game.player && Game.state === "playing") {
        Game.useSkill(idx);
      }
    }
    if (e.key === "i" || e.key === "I") {
      if (typeof Game !== "undefined") Game.toggleInventory();
    }
    if (e.key === "c" || e.key === "C") {
      if (typeof Game !== "undefined") Game.toggleCharacterPanel();
    }
    if (e.key === "Enter") {
      var chatInput = document.getElementById("chatInput");
      if (chatInput) {
        chatInput.focus();
      }
    }
  },

  updateJoystick: function() {
    if (!this.joystick.handle) return;
    if (!this.joystick.active) {
      this.joystick.handle.style.transform = "translate(0, 0)";
      return;
    }

    var dx = this.joystick.currentX - this.joystick.startX;
    var dy = this.joystick.currentY - this.joystick.startY;
    var dist = Math.sqrt(dx * dx + dy * dy);
    var maxR = this.joystick.maxRadius;

    if (dist > maxR) {
      dx = (dx / dist) * maxR;
      dy = (dy / dist) * maxR;
    }

    this.joystick.handle.style.transform = "translate(" + dx + "px, " + dy + "px)";

    if (dist < 5) {
      this.joystick.direction = { x: 0, y: 0 };
      return;
    }

    var normX = dx / (dist || 1);
    var normY = dy / (dist || 1);
    this.joystick.direction = { x: normX, y: normY };
  },

  getJoystickDirection: function() {
    return this.joystick.direction;
  },

  isJoystickActive: function() {
    return this.joystick.active;
  },

  getKeyboardDirection: function() {
    var x = 0;
    var y = 0;
    if (this.keys["w"] || this.keys["W"] || this.keys["ArrowUp"]) y = -1;
    if (this.keys["s"] || this.keys["S"] || this.keys["ArrowDown"]) y = 1;
    if (this.keys["a"] || this.keys["A"] || this.keys["ArrowLeft"]) x = -1;
    if (this.keys["d"] || this.keys["D"] || this.keys["ArrowRight"]) x = 1;
    return { x: x, y: y };
  }
};
