var app = require('app');  // Module to control application life.
var BrowserWindow = require('browser-window');  // Module to create native browser window.

// Report crashes to our server.
require('crash-reporter').start();

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
var mainWindow = null;

// Quit when all windows are closed.
app.on('window-all-closed', function() {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform != 'darwin') {
    app.quit();
  }
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.on('ready', function() {
  // Create the browser window.
  mainWindow = new BrowserWindow({width: 960, height: 800, title: "Tumblr"});

  // and load the index.html of the app.
  mainWindow.loadUrl('file://' + __dirname + '/index.html');

  // Open the DevTools.

   mainWindow.openDevTools();

   var Menu = require("menu");

var template = [{
    label: "Desktop Tumblr Client v1",
    submenu: [
        { label: "Info", selector: "orderFrontStandardAboutPanel:" },
        { type: "separator" },
        { label: "Quit", accelerator: "Command+Q", click: function() { app.quit(); }}
    ]}, {
    label: "Switch Account",
    submenu: [
        { label: "Account #1", selector: "orderFrontStandardAboutPanel:" },
        { label: "Account #2", selector: "orderFrontStandardAboutPanel:" },
        { label: "Account #3", selector: "orderFrontStandardAboutPanel:" },
        { label: "Account #4", selector: "orderFrontStandardAboutPanel:" },
        { label: "Account #5", selector: "orderFrontStandardAboutPanel:" },
        { type: "separator" },
        { label: "Log out of all accounts", accelerator: "", click: function() { javascript.function.here() }}
    ]}, {
    label: "Edit",
    submenu: [
        { label: "Undo", accelerator: "Command+Z", selector: "undo:" },
        { label: "Redo", accelerator: "Shift+Command+Z", selector: "redo:" },
        { type: "separator" },
        { label: "Cut", accelerator: "Command+X", selector: "cut:" },
        { label: "Copy", accelerator: "Command+C", selector: "copy:" },
        { label: "Paste", accelerator: "Command+V", selector: "paste:" },
        { label: "Select All", accelerator: "Command+A", selector: "selectAll:" }
    ]}
];

Menu.setApplicationMenu(Menu.buildFromTemplate(template));

  // Emitted when the window is closed.
  mainWindow.on('closed', function() {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
  });
});
