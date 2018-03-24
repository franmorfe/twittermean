'use strict'

var bcrypt = require('bcrypt-nodejs');
var mongoosePaginate = require('mongoose-pagination');
var User = require('../models/user');
var jwt = require('../services/jwt');
var fs = require('fs');
var path = require('path');

// Métodos de prueba
function home(req, res){
  res.status(200).send({
    message: 'Hola Mundo desde el servidor de NodeJs'
  });
}

function pruebas(req, res){
  res.status(200).send({
    message: 'Acción de pruebas en el servidor de NodeJs'
  });
}

// Regirtro nuevo usuario
function saveUser(req, res){
  var params = req.body;
  var user = new User();

  if(params.name && params.surname && params.nick && params.email && params.password){

    user.name = params.name;
    user.surname = params.surname;
    user.nick = params.nick;
    user.email = params.email;
    user.role = 'ROLE_USER';
    user.image = null;

    // Control de usuarios duplicados
    User.find({ $or: [
                { email: user.email.toLowerCase() },
                { nick: user.nick.toLowerCase() }
              ]}).exec(( err, users ) => {

                if(err) return res.status(500).send({ message: 'Error en la petición de usuario' });

                if(users && users.length >= 1){
                  return res.status(200).send({ message: 'El usuario ya existe' });
                } else {
                  // Cifrado de password y guardado de datos
                  bcrypt.hash(params.password, null, null, ( err, hash ) => {
                    user.password = hash;

                    user.save(( err, userStored ) => {

                      if( err ) return res.status(500).send({ message: 'Error al guardar el usuario' });

                      if( userStored ){
                        res.status(200).send({ user: userStored });
                      } else {
                        res.status(404).send({ message: 'No se ha registrado el usuario' });
                      }
                    });
                  });
                }
          });
  } else {
    res.status(200).send({
      message: '¡¡Envia todos los campos necesarios!!'
    });
  }
}

// Login del usuario
function loginUser(req, res){
  var params = req.body;

  var email = params.email;
  var password = params.password;

  User.findOne({ email: email }, (err, user) => {
    if(err) return res.status(500).send({ message: 'Error en la petición' });

    if(user){
      bcrypt.compare(password, user.password, (err, check) => {
        if(check){
          if(params.gettoken){
            // generar y devolver token
            return res.status(200).send({
              token: jwt.createToken(user)
            })
          } else {
            // devolver datos de usuario ocultando la password
            user.password = undefined;
            return res.status(200).send({ user });
          }
        } else {
            return res.status(404).send({ message: 'Password incorrecta!!' });
        }
      });
    } else {
        return res.status(404).send({ message: 'Usuario incorrecto!!' });
    }
  });
}

// Recuperar datos de un usuario
function getUser(req, res){
  var userId = req.params.id;

  User.findById(userId, (err, user) => {
    if(err) return res.status(500).send({ message: 'Error en la petición' });

    if(!user) return res.status(404).send({ message: 'El usuario no existe' });

    return res.status(200).send({ user });
  });
}

// Listado de usuarios paginado
function getUsers(req, res){
  var identity_user_id = req.user.sub;

  var page = 1;
  if(req.params.page){
    var page = req.params.page;
  }

  var itemsPerPage = 5;

  User.find().sort('_id').paginate(page, itemsPerPage, (err, users, total) => {
    if(err) return res.status(500).send({ message: 'Error en la petición' });

      if(!users) return res.status(404).send({ message: 'No hay usuarios disponibles' });

      return res.status(200).send({
        users,
        total,
        pages: Math.ceil(total/itemsPerPage)
      });
  });
}

// Actualizar datos de un usuarios
function updateUser(req, res){
  var userId = req.params.id;
  var update = req.body;

  delete update.password;

  if(userId != req.user.sub){
    return res.status(500).send({ message: 'Actualización de datos denegada' });
  }

  User.findByIdAndUpdate(userId, update, {new:true}, (err, userUpdated) => {
    if(err) return res.status(500).send({ message: 'Error en la petición' });

    if(!userUpdated) return res.status(404).send({ message: 'No se han podido actualizar los datos' });

    return res.status(200).send({ user: userUpdated });
  })
}

// Subir archivos de imagen/avatar de usuarios
function uploadImage(req, res){
  var userId = req.params.id;

  if(req.files){
    var file_path = req.files.image.path;
    var file_split = file_path.split('/')
    var file_name = file_split[2];

    var ext_split = file_name.split('.');
    var file_ext = ext_split[1];
    console.log(file_name);
    console.log(file_ext);

    if(userId != req.user.sub){
      return removeFilesOfUploads(res, file_path, 'Actualización de datos denegada');
    }

    if(file_ext == 'png' || file_ext == 'jpg' || file_ext == 'jpeg'){
      User.findByIdAndUpdate(userId, {image: file_name}, {new:true}, (err, userUpdated) => {
        if(err) return res.status(500).send({ message: 'Error en la petición' });

        if(!userUpdated) return res.status(404).send({ message: 'No se han podido actualizar los datos' });

        return res.status(200).send({ user: userUpdated });
      })
    }else{
      return removeFilesOfUploads(res, file_path, 'Extensión no válida');
    }
  } else {
    return res.status(200).send({ message: 'No se ha podido subir la imagen' });
  }
}

function getImageFile(req, res){
  var image_file = req.params.imageFile;
  var path_file = './uploads/users/'+image_file;

  fs.exists(path_file, (exists) =>{
    if(exists){
      res.sendFile(path.resolve(path_file));
    }else{
      res.status(200).send({ message: 'No existe la imagen' })
    }
  });

}

function removeFilesOfUploads(res, file_path, message){
  fs.unlink(file_path, (err) => {
    return res.status(200).send({ message: message })
  });
}

module.exports = {
  home,
  pruebas,
  saveUser,
  loginUser,
  getUser,
  getUsers,
  updateUser,
  uploadImage,
  getImageFile
}
