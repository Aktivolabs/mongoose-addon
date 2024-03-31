const mongoose = require('mongoose');
const { Intl } = require('../mongoose-intl');


const { Schema } = mongoose;

describe('Test: Mongoose Intl', () => {
  const d = 'testmongooseIntl';
  let db;

  beforeAll(async () => {
    db = await mongoose.connect(`mongodb://localhost/${d}`);
    await db.connection.dropDatabase(d);
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  beforeEach(() => { });

  it('should translate string at simple schema', async () => {
    const SimpleIntlSchema = new Schema({
      greetings: { type: String, required: true, intl: true },
    }, {
      toJSON: {
        virtuals: true,
      },
    });

    SimpleIntlSchema.plugin(Intl, {
      languages: ['en', 'zh', 'es'],
      defaultLanguage: 'en',
    });

    const SimpleIntl = mongoose.model('SimpleIntl', SimpleIntlSchema);

    const docId = await SimpleIntl.create({
      greetings: {
        en: 'Hello!',
        zh: '你好',
        es: '¡Hola!',
      },
    });

    const docFromDb = await SimpleIntl.findOne({ _id: docId });

    docFromDb.setLanguage('en');
    expect(docFromDb.greetings).toBe('Hello!');

    docFromDb.setLanguage('zh');
    expect(docFromDb.greetings).toBe('你好');

    docFromDb.setLanguage('es');
    expect(docFromDb.greetings).toBe('¡Hola!');
  });


  it('should translate string at nested schema', async () => {
    const NestedIntlSchema = new Schema({
      intro: {
        greetings: { type: String, required: true, intl: true },
      },
    }, {
      toJSON: {
        virtuals: true,
      },
    });

    NestedIntlSchema.plugin(Intl, {
      languages: ['en', 'zh', 'es'],
      defaultLanguage: 'en',
    });

    const NestedIntl = mongoose.model('NestedIntl', NestedIntlSchema);

    const docId = await NestedIntl.create({
      intro: {
        greetings: {
          en: 'Hello!',
          zh: '你好',
          es: '¡Hola!',
        },
      },
    });

    const docFromDb = await NestedIntl.findOne({ _id: docId });

    docFromDb.setLanguage('en');
    expect(docFromDb.intro.greetings).toBe('Hello!');

    docFromDb.setLanguage('zh');
    expect(docFromDb.intro.greetings).toBe('你好');

    docFromDb.setLanguage('es');
    expect(docFromDb.intro.greetings).toBe('¡Hola!');
  });


  it('should translate string at subdocument schema', async () => {
    const ChildIntlSchema = new Schema({
      greetings: { type: String, required: true, intl: true },
    }, {
      toJSON: {
        virtuals: true,
      },
    });

    const ParentIntlSchema = new Schema({
      intro: ChildIntlSchema,
    }, {
      toJSON: {
        virtuals: true,
      },
    });

    ParentIntlSchema.plugin(Intl, {
      languages: ['en', 'zh', 'es'],
      defaultLanguage: 'en',
    });

    const ParentIntl = mongoose.model('ParentIntl', ParentIntlSchema);

    const docId = await ParentIntl.create({
      intro: {
        greetings: {
          en: 'Hello!',
          zh: '你好',
          es: '¡Hola!',
        },
      },
    });

    const docFromDb = await ParentIntl.findOne({ _id: docId });

    docFromDb.setLanguage('en');
    expect(docFromDb.intro.greetings).toBe('Hello!');

    docFromDb.setLanguage('zh');
    expect(docFromDb.intro.greetings).toBe('你好');

    docFromDb.setLanguage('es');
    expect(docFromDb.intro.greetings).toBe('¡Hola!');
  });
});
