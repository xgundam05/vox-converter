// App Stuff
var gui = require('nw.gui');
var magicaVoxel = require('./scripts/voxel/magicaVoxel.js');
var stl = require('./scripts/stl.js');
var win = gui.Window.get();

// Page Stuffs
// ================================
var isDOMLoaded = false;
var renderer = undefined;
var worker = undefined;
var voxelModel = undefined;

window.onload = function(){
  new draggable(
    document.getElementById('controls'),
    true,
    document.getElementById('handle')
  );

  isDOMLoaded = true;
  Initialize();

  // Create the worker and process it's events
  worker = new Worker('scripts/geoGenerator.js');
  worker.addEventListener('message', function(e){
    var data = e.data;
    if (!data.hasOwnProperty('cmd'))
      return;

    switch(data.cmd){
      case 'geo':
        renderer.jobs.push({
          vertices: data.vertices,
          faces: data.faces,
          colors: data.colors
        });
        break;
      case 'status':
        break;
      default:
        console.log('default');
        console.log(data);
        break;
    }
  }, false);

  renderer.update();
};

function Initialize(){
  renderer = new voxRenderer({
    domElement: document.getElementById('canv')
  });
  renderer.init();

  document.getElementById('voxFile').addEventListener('change', handleFileOpen, false);
  document.getElementById('stlFile').addEventListener('change', handleFileSave, false);
  document.getElementById('voxelSize').addEventListener('change', updatePrintStats, false);
  document.getElementById('matSelect').addEventListener('change', updatePrintStats, false);
  document.getElementById('stlExport').addEventListener('click', function(e){
    var fout = document.getElementById('stlFile');
    fout.click();
  }, false);
}

function handleFileOpen(e){
  var filePath = this.value;
  var mdl = magicaVoxel.load(filePath);
  voxelModel = mdl;

  var buffer = mdl.getVoxelBuffer();

  // Clear the model
  renderer.clearModel();

  // Send the Job
  worker.postMessage({
    cmd: 'create',
    mdl: {
      width: mdl.width,
      height: mdl.zUp ? mdl.depth : mdl.height,
      depth: mdl.zUp ? mdl.height : mdl.depth,
    },
    buffer: buffer
  }, [buffer]);

  // Reset the camera and controls
  renderer.setCamera(
    mdl.width,
    mdl.zUp ? mdl.depth : mdl.height,
    mdl.zUp ? mdl.height : mdl.depth
  );

  updateDimensions();
  updatePrintStats();
}

function handleFileSave(e){
  var filePath = this.value;
  var scale = document.getElementById('voxelSize').value;
  if (voxelModel !== undefined &&
      scale !== undefined &&
      scale !== NaN &&
      scale > 0){
    var stlModel = stl.createFromVox(voxelModel, scale);
    //stl.writeToFile(stlModel, filePath + '.bin.stl');
    stl.writeASCII(stlModel, filePath + '.ascii.stl');
  }
}

function updateDimensions(){
  if (voxelModel){
    document.getElementById('dimW').dataset.value = voxelModel.width;
    document.getElementById('dimH').dataset.value = voxelModel.height;
    document.getElementById('dimD').dataset.value = voxelModel.depth;
  }
}

function updatePrintStats(){
  if (voxelModel){
    var volume = voxelModel.getVolume();
    var size = document.getElementById('voxelSize').value;
    if (size > 0){
      size = size * size * size;

      var material = document.getElementById('matSelect').value;
      var printVolume = volume * size;
      var mass = stl.calcSolidWeight(printVolume, material);

      document.getElementById('volume').dataset.value = printVolume.toFixed(2);
      document.getElementById('mass').dataset.value = mass.toFixed(2);
    }
    else {
      document.getElementById('volume').dataset.value = 0;
      document.getElementById('mass').dataset.value = 0;
    }
  }
}

// Create the Window Menu
// =============================================
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
  label: 'Export STL',
  click: function(){
    if (!isDOMLoaded) return;

    var fout = document.getElementById('stlFile');
    fout.click();
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
