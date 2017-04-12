#! /usr/bin/env node

var argv = require('yargs').argv;
var from2 = require('from2');
var to2 = require('flush-write-stream');
var fs = require('fs');
var block = require('block-stream2');

var nmgr = require('./').nmgr;
var utility = require('./').utility;


if(argv.hasOwnProperty("serial")){
  var SerialPort = require("serialport").SerialPort
  var serial = require('./').serial;

  var port = new SerialPort(argv.serial, { baudRate: 115200 }, function(){
    goSerial(null, port);
  });

}else if(argv.hasOwnProperty("ble")){
  var noble = require('noble');
  var ble = require('./').ble;

  var options = {
    services: ['8d53dc1d1db74cd3868b8a527460aa84'],
    characteristics: ['da2e7828fbce4e01ae9e261174997c48'],
    name: argv.ble
  };
  ble.connect(options, goBle);
}


var goSerial = function(err, port){

  if(argv.hasOwnProperty("reset")){
    var dup = serial.duplex(port);
    from2.obj([nmgr.generateResetBuffer()])
      .pipe(serial.encode())
      .pipe(dup, {end: false}) //dont let from end our stream before we get response, this is why pull streams are better
      .pipe(serial.decode())
      .pipe(nmgr.decode())
      .pipe(to2.obj(function (data, enc, cb) {
        console.log(data);
        dup.end(); //since we blocked ending, manually end
        cb(); //callback writable
        }, process.exit)
      );
  }

  if(argv.hasOwnProperty("confirm")){
    var dup = serial.duplex(port);
    var cmd = {};
    cmd.confirm = true;
    cmd.hash = Buffer.from(argv.hash);
    from2.obj([nmgr.generateConfirmBuffer(cmd)])
      .pipe(serial.encode())
      .pipe(dup, {end: false}) //dont let from end our stream before we get response, this is why pull streams are better
      .pipe(serial.decode())
      .pipe(nmgr.decode())
      .pipe(to2.obj(function (data, enc, cb) {
        console.log(data);
        dup.end(); //since we blocked ending, manually end
        cb(); //callback writable
        }, process.exit)
      );
  }

  if(argv.hasOwnProperty("list")){
    var dup = serial.duplex(port);
    from2.obj([nmgr.generateListBuffer()])
      .pipe(serial.encode())
      .pipe(dup, {end: false}) //dont let from end our stream before we get response, this is why pull streams are better
      .pipe(serial.decode())
      .pipe(nmgr.decode())
      .pipe(utility.hashToStringTransform())
      .pipe(to2.obj(function (data, enc, cb) {
        console.log(data);
        dup.end(); //since we blocked ending, manually end
        cb(); //callback writable
        }, process.exit)
      );
  }

  if(argv.hasOwnProperty("confirm")){
    var cmd = {};
    cmd.confirm = false;
    cmd.hash = Buffer.from(argv.hash);
    from2.obj([nmgr.generateConfirmBuffer(cmd)])
      .pipe(serial.encode())
      .pipe(dup, {end: false}) //dont let from end our stream before we get response, this is why pull streams are better
      .pipe(serial.decode())
      .pipe(nmgr.decode())
      .pipe(to2.obj(function (data, enc, cb) {
        console.log(data);
        dup.end(); //since we blocked ending, manually end
        cb(); //callback writable
        }, process.exit)
      );
    }

  if(argv.hasOwnProperty("echo")){
    var cmd = {};
    cmd.echo = argv.echo;
    from2.obj([nmgr.generateEchoBuffer(cmd)])
      .pipe(serial.encode())
      .pipe(dup, {end: false}) //dont let from end our stream before we get response, this is why pull streams are better
      .pipe(serial.decode())
      .pipe(nmgr.decode())
      .pipe(to2.obj(function (data, enc, cb) {
        console.log(data);
        dup.end(); //since we blocked ending, manually end
        cb(); //callback writable
        }, process.exit)
      );
  }

  if(argv.hasOwnProperty("upload")){
    var fileSize = fs.statSync(argv.upload).size;

    //they set this to 64 for serial?! but were already fragmenting in serial, ive seen up to 424 on osx serial work here..
    var maxFrag = 424;

    var gate = utility.gater();
    var dup = serial.duplex(port);

    fs.createReadStream(argv.upload)
      .pipe(block({ size: maxFrag, zeroPadding: false }))
      .pipe(gate) //gate one block and thus one command at a time
      .pipe(nmgr.imageUploadTransform(fileSize))
      .pipe(serial.encode())
      .pipe(dup, {end: false}) //dont let fs end our stream before we get response, this is why pull streams are better
      .pipe(serial.decode())
      .pipe(nmgr.decode())
      .pipe(to2.obj(function (data, enc, cb) {
        gate.emit('next'); //response received emit next block upstream
        console.log(data);
        if(data.rc!=0){
          this.end(); //find proper early exit cleanup that doesnt leak
          return cb();
        }
        if(data.off === fileSize) //if this is last chunk flush fs
        {
          dup.end(); //since we blocked ending, manually end
        }
        cb(); //callback writable
        }, process.exit)
      );
  }


}

var goBle = function(err, characteristic){

  if(argv.hasOwnProperty("reset")){
    var dup = ble.duplex(characteristic);
    from2.obj([nmgr.generateResetBuffer()])
    .pipe(dup, {end: false}) //dont let from end our stream before we get response, this is why pull streams are better
    .pipe(nmgr.decode())
    .pipe(to2.obj(function (data, enc, cb) {
      console.log(data);
      dup.end(); //since we blocked ending, manually end
      cb(); //callback writable
      }, process.exit)
    );
  }

  if(argv.hasOwnProperty("confirm")){
    var dup = ble.duplex(characteristic);
    var cmd = {};
    cmd.confirm = true;
    cmd.hash = Buffer.from(argv.hash);
    from2.obj([nmgr.generateConfirmBuffer(cmd)])
    .pipe(dup, {end: false}) //dont let from end our stream before we get response, this is why pull streams are better
    .pipe(nmgr.decode())
    .pipe(to2.obj(function (data, enc, cb) {
      console.log(data);
      dup.end(); //since we blocked ending, manually end
      cb(); //callback writable
      }, process.exit)
    );
  }

  if(argv.hasOwnProperty("list")){
    var dup = ble.duplex(characteristic);
    from2.obj([nmgr.generateListBuffer()])
    .pipe(dup, {end: false}) //dont let from end our stream before we get response, this is why pull streams are better
    .pipe(nmgr.decode())
    .pipe(utility.hashToStringTransform())
    .pipe(to2.obj(function (data, enc, cb) {
      console.log(data);
      dup.end(); //since we blocked ending, manually end
      cb(); //callback writable
      }, process.exit)
    );
  }

  if(argv.hasOwnProperty("test")){
    var dup = ble.duplex(characteristic);
    var cmd = {};
    cmd.confirm = false;
    cmd.hash = Buffer.from(argv.hash);
    from2.obj([nmgr.generateTestBuffer(cmd)])
    .pipe(dup, {end: false}) //dont let from end our stream before we get response, this is why pull streams are better
    .pipe(nmgr.decode())
    .pipe(to2.obj(function (data, enc, cb) {
      console.log(data);
      dup.end(); //since we blocked ending, manually end
      cb(); //callback writable
      }, process.exit)
    );
  }

  if(argv.hasOwnProperty("echo")){
    var dup = ble.duplex(characteristic);
    var cmd = {};
    cmd.echo = argv.echo;
    from2.obj([nmgr.generateEchoBuffer(cmd)])
    .pipe(dup, {end: false}) //dont let from end our stream before we get response, this is why pull streams are better
    .pipe(nmgr.decode())
    .pipe(to2.obj(function (data, enc, cb) {
      console.log(data);
      dup.end(); //since we blocked ending, manually end
      cb(); //callback writable
      }, process.exit)
    );
  }

  if(argv.hasOwnProperty("upload")){
    var dup = ble.duplex(characteristic);
    var fileSize = fs.statSync(argv.upload).size;

    //has to be 32 or larger or imgmgr returns rc: 3
    //they set this to 64 for serial?! but were already fragmenting in serial, ive seen up to 424 on osx serial work here..
    var maxFrag = 424;

    var gate = utility.gater();
    var dup = serial.duplex(port);

    fs.createReadStream(argv.upload)
      .pipe(block({ size: maxFrag, zeroPadding: false }))
      .pipe(gate) //gate one block and thus one command at a time
      .pipe(nmgr.imageUploadTransform(fileSize))
      .pipe(dup, {end: false}) //dont let fs end our stream before we get response, this is why pull streams are better
      .pipe(nmgr.decode())
      .pipe(to2.obj(function (data, enc, cb) {
        gate.emit('next'); //response received emit next block upstream
        console.log(data);
        if(data.rc!=0){
          this.end(); //find proper early exit cleanup that doesnt leak
          return cb();
        }
        if(data.off === fileSize) //if this is last chunk flush fs
        {
          dup.end(); //since we blocked ending, manually end
        }
        cb(); //callback writable
        }, process.exit)
      );
  }
}
