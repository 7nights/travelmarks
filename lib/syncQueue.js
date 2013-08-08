function syncQueue() {
  this._queue = [];
  this._index = 0;
}
syncQueue.prototype = {
  push: function (fn){
    this._queue.push(fn);
    return this;
  },
  exec: function (args){
    var next = function (err) {
      next.index++;
      if(err) {
        while(next.index < next.queue.length) {
          if(next.queue[next.index]) {
            return next.queue[next.index](err, args, next);
          }
          next.index++;
        }
        throw err;
      } else {
        var argLength = next.queue[next.index].length;
        if(argLength === 2) {
          next.queue[next.index](args, next);
        } else if(argLength === 3) {
          next.queue[next.index](null, args, next);
        }
      }
    };
    next.index = 0;
    next.queue = this._queue;
  }
};


module.exports = syncQueue;
