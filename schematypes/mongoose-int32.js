'use strict';
const MonogoDb = require('mongodb')
const mongoose = require('mongoose');

const { Int32: Int32Type } = MonogoDb;

class Int32 extends mongoose.SchemaType {
  constructor(key, options) {
    super(key, options, 'Int32');
    this.initConditionalHandlers();
  }

  initConditionalHandlers() {
    const self = this;
    Object.entries({
      '$lt': val => self.handleInt32(val),
      '$lte': val => self.handleInt32(val),
      '$gt': val => self.handleInt32(val),
      '$gte': (val) => self.handleInt32(val),
    }).forEach(([key, fn]) => {
      self.$conditionalHandlers[key] = fn;
    })
  }

  handleInt32(val) {
    const doubleBsonVal = new Int32Type(val);
    return doubleBsonVal;
  }

  cast(val) {
    console.log(val);
    if (val == null) {
      return val;
    }

    if (val._bsontype === 'Int32') {
      return new Int32Type(val.value);
    }

    const _val = Number(val);
    if (isNaN(_val)) {
      throw new mongoose.SchemaType.CastError('Double',
        val + ' is not a valid double');
    }
    return new Int32Type(_val);
  }
}

mongoose.Schema.Types.Int32 = Int32;
mongoose.Types.Int32 = Int32Type;

module.exports = Int32;
