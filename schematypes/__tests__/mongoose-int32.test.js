const mongoose = require('mongoose');
const { Int32 } = require('../mongoose-int32');


const { Schema } = mongoose;

describe('Test: Mongoose Int32', () => {
  const d = 'testmongooseint32';
  let db;
  let Test;

  beforeAll(async () => {
    db = await mongoose.connect(`mongodb://localhost/${d}`);

    const schema = new Schema({
      population: { type: Int32 },
    });
    db.deleteModel(/Test/);
    Test = mongoose.model('Test', schema);
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  beforeEach(() => Test.deleteMany({}));

  it('is a valid schema type', async () => {
    const doc = new Test({
      population: 2147483647,
    });
    await doc.save();

    const docFromDb = await Test.findOne({});
    const docFromDbByType = await Test.findOne({ population: { $type: 'int' } });

    expect(docFromDb.population).toEqual(2147483647);
    expect(docFromDbByType.population).toEqual(2147483647);
  });

  it('casting from strings and numbers', async () => {
    const schema = new Schema({
      pi1: {
        type: Int32,
      },
      pi2: 'Int32',
    });

    const Test2 = mongoose.model('Test2', schema);

    const doc = new Test2({
      pi1: -2147483647,
      pi2: '-2147483647',
    });

    expect(doc.pi1).toEqual(-2147483647);
    expect(doc.pi2).toEqual(-2147483647);
  });

  it('handles cast errors', async () => {
    const schema = new Schema({
      population: 'Int32',
    });
    const TestCast = mongoose.model('TestCast', schema);
    const doc = new TestCast({
      population: 'foo bar',
    });
    const err = await doc.validate().then(() => null, _err => _err);
    expect(err.message.includes('Cast to Int32 failed for value "foo bar" (type string) at path "population"')).toBe(true);
  });

  it('supports required', async () => {
    const schema = new Schema({
      population: {
        type: Int32,
        required: true,
      },
    });
    const TestRequired = mongoose.model('TestRequired', schema);

    const doc = new TestRequired({
      population: null,
    });

    const err = await doc.validate().then(() => null, _err => _err);

    expect(err).toBeInstanceOf(Error);
    expect(err.errors.population.name).toBe('ValidatorError');
    expect(err.errors.population.message).toBe('Path `population` is required.');
  });

  it('throw error when integer value < -(2^31)', async () => {
    const schema = new Schema({
      population: {
        type: Int32,
        required: true,
      },
    });
    const TestIntMin = mongoose.model('TestIntMin', schema);

    const doc = new TestIntMin({
      population: -2147483649,
    });

    const err = await doc.validate().then(() => null, _err => _err);

    expect(err).toBeInstanceOf(Error);
    expect(err.errors.population.name).toBe('CastError');
    expect(err.errors.population.message).toBe('Cast to Int32 failed for value "-2147483649" (type number) at path "population"');
  });

  it('throw error when integer value > (2^31-1)', async () => {
    const schema = new Schema({
      population: {
        type: Int32,
        required: true,
      },
    });
    const TestIntMax = mongoose.model('TestIntMax', schema);

    const doc = new TestIntMax({
      population: 2147483648,
    });

    const err = await doc.validate().then(() => null, (_err) => _err);

    expect(err).toBeInstanceOf(Error);
    expect(err.errors.population.name).toBe('CastError');
    expect(err.errors.population.message).toBe('Cast to Int32 failed for value "2147483648" (type number) at path "population"');
  });
});
