var Promise = window.Promise;
if (!Promise) {
  Promise = require('es6-promise').Promise;
}

var requestAnimationFrame = window.requestAnimationFrame;
if (!requestAnimationFrame) {
  var vendors = ['ms', 'moz', 'webkit', 'o'];
  for (var x = 0; x < vendors.length; x++) {
    requestAnimationFrame = window[vendors[x] + 'RequestAnimationFrame'];
  }
}
if (!requestAnimationFrame) {
  var lastTime = 0;
  requestAnimationFrame = function(callback, element) {
    var currTime = new Date().getTime();
    var timeToCall = Math.max(0, 16 - (currTime - lastTime));
    var id = window.setTimeout(function() {
      callback(currTime + timeToCall);
    }, timeToCall);
    lastTime = currTime + timeToCall;
    return id;
  };
}

var ResourceLoader = function() {
  this.resources = {};
  this.queue = [];

  this.loading = false;
};

ResourceLoader.prototype.get = function(name) {
  return this.resources[name];
};

ResourceLoader.prototype.load = function() {
  if (this.queue.length > 0) {
    this.loading = true;

    var target = this.queue.shift();
    var name = target[0];
    var src = target[1];
    this.loadOne(name, src).then((function() {
      this.load();
    }).bind(this));;
  } else {
    this.loading = false;
  }
};

ResourceLoader.prototype.loadOne = function(name, src) {
  return new Promise((function (resolve, reject) {
    var img = new Image;
    img.src = src;
    img.onload = (function() {
      this.resources[name] = img;
      resolve(img);
    }).bind(this);
    img.onerror = function() {
      reject(new Error("Faild to load an image"));;
    };
  }).bind(this));
};

ResourceLoader.prototype.add = function(name, src) {
  this.queue.push([name, src]);

  if (!this.loading) {
    this.load();
  }
};


var MotionPlayer = function(src) {
  this.src = src;

  this.el = this.canvas = document.createElement('canvas');
  this.ctx = this.canvas.getContext('2d');

  this.canvas.width = 320;
  this.canvas.height = 180;

  this.paused = false;
  this.time = 0;
  this.frame = 0;
  this.imageFrame = 0;
  this.currentImageIndex = 0;
  this.resourceLoader = new ResourceLoader();
};

MotionPlayer.prototype.play = function() {
  this.paused = false;
  var then = Date.now();

  var processFrame = (function() {
    var now = Date.now();
    var delta = now - then;
    var interval = 1000/this.video.framerate;

    if (this.frame >= this.video.numFrames) {
      this.time = 0;
      this.frame = 0;
      this.imageFrame = 0;
      this.currentImageIndex = 0;
    }

    var frameImageInfo = this.video.images[this.currentImageIndex];
    if (this.imageFrame > frameImageInfo.numFrames) {
      this.imageFrame = 0;
      this.currentImageIndex++;
    }

    if (delta > interval) {
      then = now - (delta % interval);
      if (!this.paused) {
        var image = this.resourceLoader.get(frameImageInfo.name);
        if (image) {
          this.ctx.drawImage(
            image,
            0, this.imageFrame*this.video.height, this.video.width, this.video.height,
            0, 0, this.canvas.width, this.canvas.height
          );
          this.time += interval;
          this.frame++;
          this.imageFrame++;
        }
      }
    }
    requestAnimationFrame(processFrame);
  }).bind(this);

  if (this.video) {
    requestAnimationFrame(processFrame);
  } else {
    this.fetch().then((function(data){
      this.video = JSON.parse(data);
      for (var i = 0; i < this.video.images.length; i++) {
        var image = this.video.images[i];
        var imageSrc = this.src.split('/').slice(0, -1).join('/') + '/' + image.name;
        this.resourceLoader.add(image.name, imageSrc);
      }
      requestAnimationFrame(processFrame);
    }).bind(this));
  }
};

MotionPlayer.prototype.pause = function() {
  this.paused = true;
};

MotionPlayer.prototype.fetch = function() {
  return new Promise((function (resolve, reject) {
    var req = new XMLHttpRequest();
    req.open('GET', this.src, true);
    req.onload = function () {
      if (req.status === 200) {
        resolve(req.responseText);
      } else {
        reject(new Error(req.statusText));
      }
    };
    req.onerror = function () {
      reject(new Error(req.statusText));
    };
    req.send();
  }).bind(this));
};


module.exports = MotionPlayer;
