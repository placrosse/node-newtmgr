var chai = require("chai");
var sinon = require("sinon");
var sinonChai = require("sinon-chai");
var expect = chai.expect;
chai.use(sinonChai);

var from2 = require('from2');
var to2 = require('flush-write-stream');
var cbor = require('borc');

var nmgr = require('../').nmgr;


var testCmd = {};
testCmd.hash = Buffer.from([0x41, 0x17, 0xdf, 0x7c, 0x1d, 0xc4, 0x0f, 0x54, 0xf3, 0xee, 0xbf, 0x85, 0x11, 0x73, 0xf9, 0x11, 0x41, 0xce, 0x6f, 0x92, 0x20, 0xfa, 0x1e, 0x83, 0xe2, 0x93, 0x62, 0x34, 0xd3, 0xa0, 0x5a, 0xca]);
testCmd.confirm = false;

var imageTestCommandSerialized = new Buffer([2, 0, 0, 49, 0, 1, 0, 0, 162, 100, 104, 97, 115, 104, 88, 32, 65, 23, 223, 124, 29, 196, 15, 84, 243, 238, 191, 133, 17, 115, 249, 17, 65, 206, 111, 146, 32, 250, 30, 131, 226, 147, 98, 52, 211, 160, 90, 202, 103, 99, 111, 110, 102, 105, 114, 109, 244]);

var listResponseSerialDecoded = new Buffer([0x01, 0x00, 0x00, 0xf4, 0x00, 0x01, 0x00, 0x00, 0xbf, 0x66, 0x69, 0x6d, 0x61, 0x67, 0x65, 0x73, 0x9f, 0xbf, 0x64, 0x73, 0x6c, 0x6f, 0x74, 0x00, 0x67, 0x76, 0x65, 0x72, 0x73, 0x69, 0x6f, 0x6e, 0x65, 0x30, 0x2e, 0x30, 0x2e, 0x30, 0x64, 0x68, 0x61, 0x73, 0x68, 0x58, 0x20, 0x04, 0x5a, 0x74, 0xef, 0xc7, 0xd9, 0x51, 0x7d, 0xf1, 0xf0, 0xc1, 0x57, 0xf3, 0x18, 0x00, 0x42, 0xcf, 0x97, 0x1b, 0xfb, 0x79, 0x30, 0xeb, 0x71, 0x11, 0x08, 0x7a, 0x82, 0xf0, 0x72, 0xcd, 0x7a, 0x68, 0x62, 0x6f, 0x6f, 0x74, 0x61, 0x62, 0x6c, 0x65, 0xf5, 0x67, 0x70, 0x65, 0x6e, 0x64, 0x69, 0x6e, 0x67, 0xf4, 0x69, 0x63, 0x6f, 0x6e, 0x66, 0x69, 0x72, 0x6d, 0x65, 0x64, 0xf5, 0x66, 0x61, 0x63, 0x74, 0x69, 0x76, 0x65, 0xf5, 0x69, 0x70, 0x65, 0x72, 0x6d, 0x61, 0x6e, 0x65, 0x6e, 0x74, 0xf4, 0xff, 0xbf, 0x64, 0x73, 0x6c, 0x6f, 0x74, 0x01, 0x67, 0x76, 0x65, 0x72, 0x73, 0x69, 0x6f, 0x6e, 0x65, 0x30, 0x2e, 0x30, 0x2e, 0x30, 0x64, 0x68, 0x61, 0x73, 0x68, 0x58, 0x20, 0x41, 0x17, 0xdf, 0x7c, 0x1d, 0xc4, 0x0f, 0x54, 0xf3, 0xee, 0xbf, 0x85, 0x11, 0x73, 0xf9, 0x11, 0x41, 0xce, 0x6f, 0x92, 0x20, 0xfa, 0x1e, 0x83, 0xe2, 0x93, 0x62, 0x34, 0xd3, 0xa0, 0x5a, 0xca, 0x68, 0x62, 0x6f, 0x6f, 0x74, 0x61, 0x62, 0x6c, 0x65, 0xf4, 0x67, 0x70, 0x65, 0x6e, 0x64, 0x69, 0x6e, 0x67, 0xf4, 0x69, 0x63, 0x6f, 0x6e, 0x66, 0x69, 0x72, 0x6d, 0x65, 0x64, 0xf4, 0x66, 0x61, 0x63, 0x74, 0x69, 0x76, 0x65, 0xf4, 0x69, 0x70, 0x65, 0x72, 0x6d, 0x61, 0x6e, 0x65, 0x6e, 0x74, 0xf4, 0xff, 0xff, 0x6b, 0x73, 0x70, 0x6c, 0x69, 0x74, 0x53, 0x74, 0x61, 0x74, 0x75, 0x73, 0x02, 0xff]);

var listResponseNmrObject = 
{ Op: 1,
  Flags: 0,
  Len: 244,
  Group: 1,
  Seq: 0,
  Id: 0,
  Data: new Buffer([0xbf, 0x66, 0x69, 0x6d, 0x61, 0x67, 0x65, 0x73, 0x9f, 0xbf, 0x64, 0x73, 0x6c, 0x6f, 0x74, 0x00, 0x67, 0x76, 0x65, 0x72, 0x73, 0x69, 0x6f, 0x6e, 0x65, 0x30, 0x2e, 0x30, 0x2e, 0x30, 0x64, 0x68, 0x61, 0x73, 0x68, 0x58, 0x20, 0x04, 0x5a, 0x74, 0xef, 0xc7, 0xd9, 0x51, 0x7d, 0xf1, 0xf0, 0xc1, 0x57, 0xf3, 0x18, 0x00, 0x42, 0xcf, 0x97, 0x1b, 0xfb, 0x79, 0x30, 0xeb, 0x71, 0x11, 0x08, 0x7a, 0x82, 0xf0, 0x72, 0xcd, 0x7a, 0x68, 0x62, 0x6f, 0x6f, 0x74, 0x61, 0x62, 0x6c, 0x65, 0xf5, 0x67, 0x70, 0x65, 0x6e, 0x64, 0x69, 0x6e, 0x67, 0xf4, 0x69, 0x63, 0x6f, 0x6e, 0x66, 0x69, 0x72, 0x6d, 0x65, 0x64, 0xf5, 0x66, 0x61, 0x63, 0x74, 0x69, 0x76, 0x65, 0xf5, 0x69, 0x70, 0x65, 0x72, 0x6d, 0x61, 0x6e, 0x65, 0x6e, 0x74, 0xf4, 0xff, 0xbf, 0x64, 0x73, 0x6c, 0x6f, 0x74, 0x01, 0x67, 0x76, 0x65, 0x72, 0x73, 0x69, 0x6f, 0x6e, 0x65, 0x30, 0x2e, 0x30, 0x2e, 0x30, 0x64, 0x68, 0x61, 0x73, 0x68, 0x58, 0x20, 0x41, 0x17, 0xdf, 0x7c, 0x1d, 0xc4, 0x0f, 0x54, 0xf3, 0xee, 0xbf, 0x85, 0x11, 0x73, 0xf9, 0x11, 0x41, 0xce, 0x6f, 0x92, 0x20, 0xfa, 0x1e, 0x83, 0xe2, 0x93, 0x62, 0x34, 0xd3, 0xa0, 0x5a, 0xca, 0x68, 0x62, 0x6f, 0x6f, 0x74, 0x61, 0x62, 0x6c, 0x65, 0xf4, 0x67, 0x70, 0x65, 0x6e, 0x64, 0x69, 0x6e, 0x67, 0xf4, 0x69, 0x63, 0x6f, 0x6e, 0x66, 0x69, 0x72, 0x6d, 0x65, 0x64, 0xf4, 0x66, 0x61, 0x63, 0x74, 0x69, 0x76, 0x65, 0xf4, 0x69, 0x70, 0x65, 0x72, 0x6d, 0x61, 0x6e, 0x65, 0x6e, 0x74, 0xf4, 0xff, 0xff, 0x6b, 0x73, 0x70, 0x6c, 0x69, 0x74, 0x53, 0x74, 0x61, 0x74, 0x75, 0x73, 0x02, 0xff]) };

describe('nmgr', function () {

  it('should serialize test command', function (done) {

    var encoded = cbor.encode(testCmd);
    var imageTestCommand = {};
    imageTestCommand.Data = encoded;
    imageTestCommand.Op = 2;
    imageTestCommand.Flags = 0;
    imageTestCommand.Len = encoded.length;
    imageTestCommand.Group = 1;
    imageTestCommand.Seq = 0;
    imageTestCommand.Id = 0;

    var cmd = nmgr._serialize(imageTestCommand);

    expect(cmd).to.deep.equal(imageTestCommandSerialized);
    done();
  });


  it('should generate test command', function (done) {

    var complete = function(data) {
      expect(data).to.deep.equal(imageTestCommandSerialized);
      done();
    };

    from2([nmgr.generateImageTestBuffer(testCmd)])
      .pipe(to2(complete));
  });


  it('should deserialize a response', function (done) {

    var nmr = nmgr._deserialize(listResponseSerialDecoded);
    expect(nmr).to.deep.equal(listResponseNmrObject);
    done();
  });


  it('should accumulate', function (done) {

    var complete = function(data) {
      expect(data).to.deep.equal(listResponseNmrObject);
      done();
    };

    from2([listResponseSerialDecoded])
      .pipe(nmgr._accumulate())
      .pipe(to2.obj(complete));
  });


  it('should decode', function (done) {

    var listResponseCborObject =
      { images: 
        [ 
          { slot: 0,
            version: '0.0.0',
            hash: new Buffer([0x04, 0x5a, 0x74, 0xef, 0xc7, 0xd9, 0x51, 0x7d, 0xf1, 0xf0, 0xc1, 0x57, 0xf3, 0x18, 0x00, 0x42, 0xcf, 0x97, 0x1b, 0xfb, 0x79, 0x30, 0xeb, 0x71, 0x11, 0x08, 0x7a, 0x82, 0xf0, 0x72, 0xcd, 0x7a]),
            bootable: true,
            pending: false,
            confirmed: true,
            active: true,
            permanent: false },
          { slot: 1,
            version: '0.0.0',
            hash: new Buffer([0x41, 0x17, 0xdf, 0x7c, 0x1d, 0xc4, 0x0f, 0x54, 0xf3, 0xee, 0xbf, 0x85, 0x11, 0x73, 0xf9, 0x11, 0x41, 0xce, 0x6f, 0x92, 0x20, 0xfa, 0x1e, 0x83, 0xe2, 0x93, 0x62, 0x34, 0xd3, 0xa0, 0x5a, 0xca]),
            bootable: false,
            pending: false,
            confirmed: false,
            active: false,
            permanent: false
          }
       ],
       splitStatus: 2
     };

    var complete = function(data) {
      expect(data).to.deep.equal(listResponseCborObject);
      done();
    };

    from2([listResponseSerialDecoded])
      .pipe(nmgr.decode())
      .pipe(to2.obj(complete));
  });
});
