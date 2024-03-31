const MonogoDb = require('mongodb');
const Mongoose = require('mongoose');

const { Int32: Int32Type } = MonogoDb;
const { SchemaType: { CastError } } = Mongoose;

// 1-bit for sign and remaining 31-bit for value.
// Positive values range [1 to 2147483647]
// Negative values range [-2147483648 to -1]
// No value or 0
const Int32Max = 2 ** 31 - 1; // Value range is [1 to 2147483647] 
const Int32Min = -(2 ** 31); // Value range is [-2147483648 to -1] 

class Int32 extends Mongoose.SchemaType {
  constructor(key, options) {
    super(key, options, 'Int32');
    this.initConditionalHandlers();
  }

  initConditionalHandlers() {
    const _this = this;
    Object.entries({
      $lt: val => _this.handleInt32(val),
      $lte: val => _this.handleInt32(val),
      $gt: val => _this.handleInt32(val),
      $gte: (val) => _this.handleInt32(val),
    }).forEach(([key, fn]) => {
      _this.$conditionalHandlers[key] = fn;
    });
  }

  // eslint-disable-next-line class-methods-use-this
  handleInt32(val) {
    const intBsonVal = new Int32Type(val);
    return intBsonVal;
  }

  // Sign: cast(val, doc, init, opt)
  cast(val) {
    // return if `val` is wrapped Int32 bson value
    if (val._bsontype && val._bsontype === 'Int32') {
      return val;
    }

    const intVal = parseInt(val, 10);

    // throw error when `val` is not a number.
    if (Number.isNaN(intVal)) {
      const err = new CastError(
        'Int32',
        val,
        this.path,
        new Error(`Int32: ${val} is not a valid integer.`),
        this
      );
      throw err;
    }

    // throw error if `val` falls out of 32-bit integer range.
    if (intVal < Int32Min || intVal > Int32Max) {
      const err = new CastError(
        'Int32',
        val,
        this.path,
        new Error(`Int32: ${val} falls out of range -${Int32Min} to ${Int32Max}.`),
        this
      );
      throw err;
    }

    return intVal;
  }
}

Mongoose.Schema.Types.Int32 = Int32;
Mongoose.Types.Int32 = Int32;

module.exports = {
  Int32,
};
