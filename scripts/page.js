// App Stuff
var gui = require('nw.gui');
var magicaVoxel = require('./scripts/magicaVoxel.js');
var stl = require('./scripts/stl.js');
var win = gui.Window.get();

// Page Stuffs
var isDOMLoaded = false;
window.onload = function(){
  new draggable(
    document.getElementById('controls'),
    document.getElementById('handle')
  );

  isDOMLoaded = true;
}

// Create the Window Menu
var winMenu = new gui.Menu({type: 'menubar'});

// File Menu
var fileMenu = new gui.Menu();
fileMenu.append(new gui.MenuItem({
  label: 'Open',
  click: function(){
    if (!isDOMLoaded) return;

    var fin = document.getElementById('voxFile');
    fin.click();
  }
}));
fileMenu.append(new gui.MenuItem({
  type: 'separator'
}));
fileMenu.append(new gui.MenuItem({
  label: 'Exit',
  click: gui.App.quit
}));

winMenu.append(new gui.MenuItem({
  label: 'File',
  submenu: fileMenu
}));
win.menu = winMenu;
