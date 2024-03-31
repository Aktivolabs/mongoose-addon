const mongoose = require('mongoose');
const { Double } = require('../mongoose-double');


const { Schema } = mongoose;

describe('Test: Mongoose Double', () => {
  const d = 'testmongoosedouble';
  let db;
  let Test;
  beforeAll(async () => {
    db = await mongoose.connect(`mongodb://localhost/${d}`);

    const schema = new Schema({
      pi: { type: Double },
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
      pi: 3.141592653589793,
    });
    await doc.save();

    const docFromDb = await Test.findOne({});
    const docFromDbByType = await Test.findOne({ pi: { $type: 'double' } });

    expect(docFromDb.pi).toEqual(3.141592653589793);
    expect(docFromDbByType.pi).toEqual(3.141592653589793);
  });

  it('casting from strings and numbers', async () => {
    const schema = new Schema({
      pi1: {
        type: Double,
      },
      pi2: 'Double',
    });

    const Test2 = mongoose.model('Test2', schema);

    const doc = new Test2({
      pi1: 3.141592653589793,
      pi2: '3.141592653589793',
    });

    expect(doc.pi1).toEqual(3.141592653589793);
    expect(doc.pi2).toEqual(3.141592653589793);
  });

  it('handles cast errors', async () => {
    const schema = new Schema({
      pi: 'Double',
    });
    const TestCast = mongoose.model('TestCast', schema);
    const doc = new TestCast({
      pi: 'foo bar',
    });
    const err = await doc.validate().then(() => null, _err => _err);
    expect(err.message.includes('Cast to Double failed for value "foo bar" (type string) at path "pi"')).toBe(true);
  });

  it('supports required', async () => {
    const schema = new Schema({
      pi: {
        type: Double,
        required: true,
      },
    });
    const TestRequired = mongoose.model('TestRequired', schema);

    const doc = new TestRequired({
      pi: null,
    });

    const err = await doc.validate().then(() => null, _err => _err);

    expect(err).toBeInstanceOf(Error);
    expect(err.errors.pi.name).toBe('ValidatorError');
    expect(err.errors.pi.message).toBe('Path `pi` is required.');
  });
});
