const MonogoDb = require('mongodb');
const Mongoose = require('mongoose');

const { Double: DoubleType } = MonogoDb;

class Double extends Mongoose.SchemaType {
  constructor(key, options) {
    super(key, options, 'Double');
    this.initConditionalHandlers();
  }

  initConditionalHandlers() {
    const _this = this;
    Object.entries({
      $lt: val => _this.handleDouble(val),
      $lte: val => _this.handleDouble(val),
      $gt: val => _this.handleDouble(val),
      $gte: (val) => _this.handleDouble(val),
    }).forEach(([key, fn]) => {
      _this.$conditionalHandlers[key] = fn;
    });
  }

  // eslint-disable-next-line class-methods-use-this
  handleDouble(val) {
    const doubleBsonVal = new DoubleType(val);
    return doubleBsonVal;
  }

  cast(val) {
    // return if `val` is wrapped Double bson value
    if (val._bsontype && val._bsontype === 'Double') {
      return val;
    }

    const doubleVal = Number(val);
    if (Number.isNaN(doubleVal)) {
      const err = new Mongoose.SchemaType.CastError(
        'Double',
        val,
        this.path,
        new Error(`Double: ${val} is not a valid number.`),
        this
      );
      throw err;
    }
    return doubleVal;
  }
}

Mongoose.Schema.Types.Double = Double;
Mongoose.Types.Double = Double;

module.exports = {
  Double,
};
