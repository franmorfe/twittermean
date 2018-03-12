'use strict'

var mongoose = require('mongoose');
var app = require('./app');
var port = 3800;

// Conexión Database
mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost:27017/curso_mean_social')
        .then(() => {
          console.log("La conexión a la BBDD curso_mean_social se ha realizado correctamente");

          // crear servidor
          app.listen( port, () => {
            console.log("Servidor corriendo en http://localhost:" + port);
          })
        })
        .catch(err => console.log( err ));
