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
    const doubleVal = Number(val);
    if (isNaN(doubleVal)) {
      throw new Error(`Double: ${val} is not a valid integer.`);
    }
    return doubleVal;  
  }
}

mongoose.Schema.Types.Double = Double;
mongoose.Types.Double = Double;

module.exports = {
  Double,
};
