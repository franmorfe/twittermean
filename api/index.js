'use strict'

var mongoose = require('mongoose');

mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost:27017/curso_mean_social')
        .then(() => {
          console.log("La conexión a la BBDD curso_mean_social se ha realizado correctamente")
        })
        .catch(err => console.log( err ));
