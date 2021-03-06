// implements https://mynewt.apache.org/v1_0_0/os/modules/split/split/#split-apps
// node examples/ble-upload-scripted.js --app_name=nimble-blesplit --bootloader_name=nimble-bleprph --file_name=../newt/bin/targets/split-microbit/app/apps/blesplit/blesplit.img
var argv = require('yargs').argv;
var utility = require('../').utility;
var async = require("async");
var fs = require('fs');
var noble = require('noble');
var transport = require('../').transport.ble;
var clone = require('clone');

var options = {
  services: ['8d53dc1d1db74cd3868b8a527460aa84'],
  characteristics: ['da2e7828fbce4e01ae9e261174997c48'],
};

var char;
var periph;

var fileBuffer = fs.readFileSync(argv.file_name);

var print = function(err, obj){
  if(err){
    console.log(err.toString());
  }

  var obj2 = clone(obj);
  if (obj2){
    utility.prettyList(obj2);
    utility.prettyError(obj2);
    console.log(JSON.stringify(obj2, null, '\t'));
  }
};


async.series([

  function(callback) {
    console.log("waiting for bluetooth");
    noble.once('stateChange', function(state){
      if (state === 'poweredOn') {
        callback();
      }
    });
  },

  function(callback) {
    console.log("scanning for ble device ", argv.app_name);
    options.name = argv.app_name;
    transport.scanAndConnect(noble, options, function(err, peripheral, characteristic){
      periph = peripheral;
      char = characteristic;
      console.log("connected and found characteristic");
      callback();
    });
  },

  function(callback) {
    console.log("checking image state");
    transport.image.list(char, 5000, function(err, obj){
      print(err, obj);
      var app = utility.findApp(obj);
      if(app.active){
        var bootable = utility.findBootable(obj);
        console.log("get out of app");
        transport.image.test(char, bootable.hash, 5000, function(err, obj){
          print(err, obj);
          callback();
        });
      }else{
        callback();
      }
    });
  },

  function(callback){
    transport.image.list(char, 5000, function(err, obj){
      print(err, obj);
      callback();
    });
  },

  function(callback) {
    console.log("resetting");
    periph.once('disconnect', callback);
    transport.reset(char, 5000, function(){});
  },

  function(callback){
    console.log("reconnecting after bootloader reset");
    options.name = argv.bootloader_name;
    transport.scanAndConnect(noble, options, function(err, peripheral, characteristic){
      periph = peripheral;
      char = characteristic;
      console.log("reconnected and found characteristic");
      callback();
    });
  },

  function(callback) {
    console.log("confirm bootloader");
    transport.image.list(char, 5000, function(err, obj){
      print(err, obj);
      transport.image.confirm(char, null, 5000, function(err, obj){
        print(err, obj);
        callback();
      });
    });
  },

  function(callback) {
    console.log("erasing app");
    periph.once('disconnect', callback);
    transport.image.erase(char, 5000, function(){});
  },

  function(callback){
    console.log("reconnecting after erase");
    options.name = argv.bootloader_name;
    transport.scanAndConnect(noble, options, function(err, peripheral, characteristic){
      periph = peripheral;
      char = characteristic;
      console.log("reconnected and found characteristic");
      callback();
    });
  },

  function(callback){
    console.log("scripting image_upload command", fileBuffer.length, "bytes");
    var printStatus = function(obj){
      console.log(utility.prettyError(obj));
    }
    var status;
    status = transport.image.upload(char, fileBuffer, 30000, function(){
    status.removeListener('status', printStatus);
      callback();
    });
    status.on('status', printStatus);
  },

  function(callback){
    console.log("testing new app", fileBuffer.length, "bytes");
    transport.image.list(char, 5000, function(err, obj){
      var app = utility.findApp(obj);
      transport.image.test(char, app.hash, 5000, function(err, obj){
        print(err, obj);
        callback();
      });
    });
  },

  function(callback){
    console.log("resetting");
    periph.once('disconnect', callback);
    transport.reset(char, 5000, function(){});
  },

  function(callback){
    console.log("reconnecting after reset");
    options.name = argv.app_name;
    transport.scanAndConnect(noble, options, function(err, peripheral, characteristic){
      periph = peripheral;
      char = characteristic;
      console.log("reconnected and found characteristic");
      callback();
    });
  },

  function(callback){
    console.log("confirming new app");
    transport.image.list(char, 5000, function(err, obj){
      var app = utility.findApp(obj);
      transport.image.confirm(char, app.hash, 5000, function(err, obj){
        print(err, obj);
        callback();
      });
    });
  },

  process.exit
]);
