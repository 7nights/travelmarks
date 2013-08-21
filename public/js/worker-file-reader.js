addEventListener('message', function (e) {
  var file = e.data.file,
      method = e.data.method;
  var fr = new FileReader();
  fr.onload = function () {
    postMessage(fr.result);
  };
  fr[method](file);
});