var CodeUpdate = _.def({
  init: function () {
    var that = this;

    this.editor = CodeMirror($(".code")[0], {
      lineNumbers: true,
      matchBrackets: true,

      onFocus: _.bind(this._onEditorFocus, this, true),
      onBlur: _.bind(this._onEditorFocus, this, false),

      onChange: _.bind(this._onEditorChange, this),

      onCursorActivity: function () {
        if(!that.editorFocused) { return; }
        that._removePreviousDialog();
        var c = that.editor.getCursor()
        var token = that.editor.getTokenAt(c);

        if(token.className === "number") {
          that._createSliderDialog(c, token);
        }

        if(token.className === "atom" && (token.string === "true" || token.string === "false")) {
          that._createToggleDialog(c, token);
        }
      }
    });
    editor = this.editor;
  },

  reload: function (str) {
    var that = this;
    clearTimeout(this.reloadTimer);
    this.reloadTimer = setTimeout(function () {
      try {
        var code = _.evalModule(str);
        var old = that.c;
        that.c = code;
        that.c.run();
        if(that.socket) {
          that.socket.emit("code-update", str);
        }

        setTimeout(function () {
          if(old) { old.stop(); }        
        }, 10); 
      } catch(e) {}
    }, 1);
  },
  
  codeUpdate: function (str, socket) {
    if(this.str && this.str === str) { return; }
    this.str = str;
   
    this.editor.setValue(str);
    this.reload(str);
    this.socket = socket;
  },

  _onEditorFocus: function (focus) {
    this.editorFocused = focus;
  },
  _onEditorChange: function () {
    if(this._disabledChange) { return; }
    this.reload(this.editor.getValue());
  },

  _replaceToken: function (c, t, val) {
    this.editor.replaceRange(val, {line: c.line, ch: t.start}, {line: c.line, ch: t.end});
    t.end = t.start + val.length;
  },

  _removePreviousDialog: function () {
    if(this.dialog) {
      var d = this.dialog;
      if(d.find("#lock-button").hasClass("locked")) { return; }

      this.dialog = undefined;
      d.fadeOut(600, function () { d.remove(); });
    }
  },

  _addLockHandler: function (d) {
    d.find("#remove-button").click(function () {
      d.fadeOut(600, function () { d.remove(); });
    })
    d.find("#lock-button").click(function () {
      $(this).toggleClass("locked");
    });
  },

  _createDialog: function (c, token) {
    var d = $($("#dialog-template").text());
    this._addLockHandler(d);
    $("#dialogs").prepend(d);
    var line = editor.getLine(c.line);
    d.title = _.template(
      (c.line+1) + ":" + line.slice(0, token.start) + 
      "<b><%= val %></b>" +
      line.slice(token.end));

    d.find(".code-line").html(d.title({val: token.string}));
    this.dialog = d;
    return d;
  },

  _createToggleDialog: function (c, token) {
    var d = this._createDialog(c, token);
    var toggle = d.find("#content").html($("#toggle-template").text());
    toggle.find("#"+token.string).attr("checked", "checked");
    toggle.buttonset();

    var that = this;
    toggle.change(function () {
      var val = $(this).find("#true").is(":checked").toString();
      d.find(".code-line").html(d.title({val: val}));
      that._replaceToken(c, token, val);            
    });
  },

  _createSliderDialog: function (c, token) {
    var d = this._createDialog(c, token);
    var slider = d.find("#content");

    var v = parseFloat(token.string);
    var dx = 50, step = 1;
    if(token.string.indexOf(".0") !== -1) {
      dx = 1; step = 0.01;
    } else if(token.string.indexOf(".") !== -1) {
      dx = 10; step = 0.1;
    }

    var that = this;
    slider.slider({
      min: v-dx, max: v+dx, step: step,
      value: v,
      slide: function (event, ui) {
        var val = ui.value.toString();
        d.find(".code-line").html(d.title({val: val}));
        that._replaceToken(c, token, val);    
      }
    });
  }
});

window.s = [];

exports = new CodeUpdate();
window.token = function () {
  var c = editor.getCursor()
  return editor.getTokenAt(c);
}
