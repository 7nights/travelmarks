var express = require( 'express' ),
    app = express();

app.get( '/', function (req, res) {
   
   res.header({
    'Content-type': 'application/json'
   });
   res.write('12345');

   res.end();
});

app.listen(3000);