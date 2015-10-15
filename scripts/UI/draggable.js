function draggable(el, handle){
  this.el = el;
  this.handle = handle || el;
  this.ready = false;
  this.offset = {
    x: 0, y: 0
  };

  this.handle.addEventListener(
    'mousedown',
    this.startMove.bind(this));
  this.handle.addEventListener(
    'mouseup',
    this.stopMove.bind(this));
  window.addEventListener(
    'mousemove',
    this.moving.bind(this));
}

draggable.prototype = {
  startMove: function(e){
    this.ready = true;
    this.offset.x = e.pageX - this.el.offsetLeft;
    this.offset.y = e.pageY - this.el.offsetTop;
  },
  stopMove: function(e){
    this.ready = false;
  },
  moving: function(e){
    if (this.ready){
      this.el.style.top = (e.pageY - this.offset.y) + 'px';
      this.el.style.left = (e.pageX - this.offset.x) + 'px';
    }
  }
};
