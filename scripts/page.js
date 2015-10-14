// App Stuff
var gui = require('nw.gui');
var magicaVoxel = require('./scripts/magicaVoxel.js');
var stl = require('./scripts/stl.js');
var win = gui.Window.get();

// Page Stuffs
// ================================
var isDOMLoaded = false;
var jobs = [];
var scene, camera, renderer, clock, controls;
var worker;

// Handle unloading of models and such
var models = [];

// Colors
var lite = 0xffffff;
var mid = 0xa7a7a7;
var dark = 0x505050;

window.onload = function(){
  new draggable(
    document.getElementById('controls'),
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
        jobs.push({
          id: data.modelId,
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

  Update();
};

function Update(){
  var frameTime = 0;
  clock.getDelta();
  while (jobs.length > 0 && (frameTime += clock.getDelta()) < 0.016){
    var data = jobs.shift();

    var geo = new THREE.Geometry();
    var vBuffer = new Float32Array(data.vertices);
    var fBuffer = new Int32Array(data.faces);
    var cBuffer = new Uint8Array(data.colors);

    for (var i = 0; i < vBuffer.length; i += 3){
      geo.vertices.push(
        new THREE.Vector3(
          vBuffer[i],
          vBuffer[i + 1],
          vBuffer[i + 2]
        )
      );
    }

    for (var i = 0; i < fBuffer.length; i += 3){
      geo.faces.push(
        new THREE.Face3(
          fBuffer[i],
          fBuffer[i + 1],
          fBuffer[i + 2]
        )
      );

      var index = geo.faces.length - 1;

      var color;
      color = cBuffer[i] == 0 ? lite : cBuffer[i] == 1 ? mid : dark;
      geo.faces[index].vertexColors[0] = new THREE.Color(color);

      color = cBuffer[i + 1] == 0 ? lite : cBuffer[i + 1] == 1 ? mid : dark;
      geo.faces[index].vertexColors[1] = new THREE.Color(color);

      color = cBuffer[i + 2] == 0 ? lite : cBuffer[i + 2] == 1 ? mid : dark;
      geo.faces[index].vertexColors[2] = new THREE.Color(color);
    }

    // Compute normals
    geo.computeFaceNormals();
    geo.computeBoundingBox();
    geo.computeBoundingSphere();

    var mat = new THREE.MeshLambertMaterial({
      color: 0x5c79a9//vertexColors: THREE.VertexColors
    });

    var mesh = new THREE.Mesh(geo, mat);

    if (models[data.id] === undefined)
      models[data.id] = [];
    models[data.id].push(mesh);

    scene.add(mesh);
    Render();
  }

  controls.update();
  requestAnimationFrame(Update);
}

function Render(){
  renderer.render(scene, camera);
}

function Initialize(){
  clock = new THREE.Clock();
  scene = new THREE.Scene();

  var fov, width, height, aspect, near, far;
  width = window.innerWidth;
  height = window.innerHeight;
  fov = Math.atan(height / (2 * 482.84)) * 360 / Math.PI;
  aspect = width / height;
  near = 0.1;
  far = 10000;

  // Camera
  camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
  camera.position.set(0, 10, 10);
  camera.lookAt(new THREE.Vector3(0, 0, 0));

  // Controls
  controls = new THREE.OrbitControls(camera, document.getElementById('canv'));
  controls.addEventListener('change', function(){
    Render();
  });
  controls.target.set(0, 0, 0);

  // lights
  var dLight = new THREE.DirectionalLight(0xffffff, 0.7);
  var aLight = new THREE.AmbientLight(0xa0a0a0);
  dLight.position.set(3, 4, 5);
  scene.add(dLight);
  scene.add(aLight);

  // Renderer
  renderer = new THREE.WebGLRenderer({
    canvas: document.getElementById('canv'),
    alpha: true
  });
  renderer.setSize(width, height);

  window.addEventListener('resize', function(e){
    var h = window.innerHeight;
    var w = window.innerWidth;

    var fov = Math.atan(h / (2 * 482.84)) * 360 / Math.PI;
    camera.aspect = w / h;
    camera.fov = fov;
    camera.updateProjectionMatrix();

    renderer.setSize(w, h);
  }, false);

  document.getElementById('voxFile').addEventListener('change', handleFileOpen, false);
  document.getElementById('stlFile').addEventListener('change', handleFileSave, false);
}

function handleFileOpen(e){
  var filePath = this.value;
  var mdl = magicaVoxel.load(filePath);

  var buffer = new ArrayBuffer(mdl.width * mdl.height * mdl.depth);
  var view = new Uint8Array(buffer);

  if (mdl.zUp){
    for (var z = 0; z < mdl.depth; z++){
      for (var y = 0; y < mdl.height; y++){
        for (var x = 0; x < mdl.width; x++){
          var tmp = mdl.data[x + (y * mdl.width) + (z * mdl.width * mdl.height)];
          var index = x + (z * mdl.width) + ((mdl.height - 1 - y) * mdl.width * mdl.depth);
          view[index] = tmp;
        }
      }
    }
  }
  else {
    for (var i = 0; i < mdl.data.length; i++){
      view[i] = mdl.data[i];
    }
  }

  var id = models.length;
  worker.postMessage({
    cmd: 'create',
    mdl: {
      id: id,
      width: mdl.width,
      height: mdl.zUp ? mdl.depth : mdl.height,
      depth: mdl.zUp ? mdl.height : mdl.depth,
    },
    buffer: buffer
  }, [buffer]);

  camera.position.set(
    mdl.width / 2,
    mdl.zUp ? mdl.depth * 2 : mdl.height * 2,
    mdl.zUp ? mdl.height * 2 : mdl.depth * 2
  );

  controls.target.set(
    mdl.width / 2,
    mdl.zUp ? mdl.depth / 2 : mdl.height / 2,
    mdl.zUp ? mdl.height / 2 : mdl.depth / 2
  );

  ClearModelsTo(id);
}

function handleFileSave(e){
  // TODO
}

function ClearModelsTo(index){
  for (var i = 0; i < index; i++){
    var chunks = models[i];
    if (chunks !== undefined)
    for (var j = 0; j < chunks.length; j++){
      scene.remove(chunks[j]);
      chunks[j] = undefined;
    }

    models[i] = undefined;
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
