'use strict';
const MonogoDb = require('mongodb')
const mongoose = require('mongoose');

const { Double: DoubleType } = MonogoDb;

class Double extends mongoose.SchemaType {
  constructor(key, options) {
    super(key, options, 'Double');
    this.initConditionalHandlers();
  }

  initConditionalHandlers() {
    const self = this;
    Object.entries({
      '$lt': val => self.handleDouble(val),
      '$lte': val => self.handleDouble(val),
      '$gt': val => self.handleDouble(val),
      '$gte': (val) => self.handleDouble(val),
    }).forEach(([key, fn]) => {
      self.$conditionalHandlers[key] = fn;
    })
  }

  handleDouble(val) {
    const doubleBsonVal = new DoubleType(val);
    return doubleBsonVal;
  }

  cast(val) {
    if (val == null) {
      return val;
    }
    if (val._bsontype === 'Double') {
      return new DoubleType(val.value);
    }

    const _val = Number(val);
    if (isNaN(_val)) {
      throw new mongoose.SchemaType.CastError('Double',
        val + ' is not a valid double');
    }
    return new DoubleType(_val);
  }
}

mongoose.Schema.Types.Double = Double;
mongoose.Types.Double = DoubleType;

module.exports = {
  Double,
};
