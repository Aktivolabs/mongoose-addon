const mongoose = require('mongoose');
const _get = require('lodash/get');

const { Schema } = mongoose;

function mongooseIntl(schema, options) {
    if (!options || !options.languages || !Array.isArray(options.languages) || !options.languages.length) {
        throw new mongoose.Error('Required languages array is missing');
    }

    // plugin options to be set under schema options
    schema.options.mongooseIntl = {};
    var pluginOptions = schema.options.mongooseIntl;

    pluginOptions.languages = options.languages.slice(0);

    // the first available language will be used as default if it's not set or unknown value passed
    if (!options.defaultLanguage || pluginOptions.languages.indexOf(options.defaultLanguage) === -1) {
        pluginOptions.defaultLanguage = pluginOptions.languages[0];
    } else {
        pluginOptions.defaultLanguage = options.defaultLanguage.slice(0);
    }
    pluginOptions.fallback = 'fallback' in options ? options.fallback : false;

    schema.eachPath(function (path, schemaType) {
        if (schemaType.schema) { // propagate plugin initialization for sub-documents schemas
            schemaType.schema.plugin(mongooseIntl, pluginOptions);
            return;
        }

        if (!schemaType.options.intl) {
            return;
        }

        if (!(schemaType instanceof mongoose.Schema.Types.String)) {
            throw new mongoose.Error('Mongoose-intl plugin can be used with String type only');
        }

        const pathArray = path.split('.');
        const key = pathArray.pop();
        let prefix = pathArray.join('.');

        if (prefix) prefix += '.';

        // removing real path, it will be changed to virtual later
        schema.remove(path);

        // schema.remove removes path from paths object only, but doesn't update tree
        // sounds like a bug, removing item from the tree manually
        const tree = pathArray.reduce(function (mem, part) {
            return mem[part];
        }, schema.tree);
        delete tree[key];


        schema.virtual(path)
            .get(function (_value, _virtual, doc) {
                const lang = doc.getLanguage();

                const val = _get(doc._doc, path + '.' + lang);

                let retVal;
                if (!val && pluginOptions.fallback) {
                    const defaultLang = doc.getDefaultLanguage();
                    const defaultVal = _get(doc._doc, path + '.' + defaultLang);
                    retVal = defaultVal;
                } else {
                    // returning undefined takes original value.
                    // hence returning empty string for backward compatibility.
                    retVal = val || '';
                }

                return retVal;
            })
            .set(function (value, _virtual, doc) {
                // multiple languages are set as an object
                if (value.constructor.name === 'Object') {
                    const languages = doc.getLanguages();
                    languages.forEach(function (lang) {
                        if (!value[lang]) { return; }
                        // Set value to read in virtual get function
                        doc.$locals[path + '.' + lang] = value[lang];
                        // Set value for mongodb write
                        doc.$set(path + '.' + lang, value[lang]);
                    });
                } else {
                    const lang = doc.getLanguage();
                    // Set value to read in virtual get function
                    doc.$locals[path + '.' + lang] = value;
                    // Set value for mongodb write
                    doc.$set(path + '.' + lang, value);
                }
            });


        // intl option is not needed for the current path any more,
        // and is unwanted for all child lang-properties
        delete schemaType.options.intl;


        // For Example: 
        // const IntlSchema = new Schema({
        //     locales: {
        //         en: String,
        //         es: String
        //     }
        // });
        const IntlSchema = new Schema();
        const IntlSchemaProp = pluginOptions.languages.reduce(function (ret, lang) {
            ret[lang] = { type: String };
            return ret;
        }, {});
        IntlSchema.add({ [key]: IntlSchemaProp }, prefix);
        schema.add(IntlSchema);
    });

    // document methods to set the language for each model instance (document)
    schema.method({
        getLanguages: function () {
            return this.schema.options.mongooseIntl.languages;
        },
        getLanguage: function () {
            const currDoc = this;

            // Recursively traverse from nested document to root document
            const findTopDoc = (scope) => {
                const parentDoc = scope.ownerDocument ? scope.ownerDocument() : undefined;
                if (!parentDoc || (scope === parentDoc)) {
                    return scope.$locals.docLanguage;
                }
                return findTopDoc(parentDoc);
            };

            const selectedLang = findTopDoc(currDoc) || this.schema.options.mongooseIntl.defaultLanguage;

            return selectedLang;
        },
        setLanguage: function (lang) {
            if (lang && this.getLanguages().indexOf(lang) !== -1) {
                this.$locals.docLanguage = lang;
            }
        },
        unsetLanguage: function () {
            delete this.$locals.docLanguage;
        }
    });

    // model methods to set the language for the current schema
    schema.static({
        getLanguages: function () {
            return this.schema.options.mongooseIntl.languages;
        },
        getDefaultLanguage: function () {
            return this.schema.options.mongooseIntl.defaultLanguage;
        },
        setDefaultLanguage: function (lang) {

            function updateLanguage(schema, lang) {
                schema.options.mongooseIntl.defaultLanguage = lang.slice(0);

                // default language change for sub-documents schemas
                schema.eachPath(function (path, schemaType) {
                    if (schemaType.schema) {
                        updateLanguage(schemaType.schema, lang);
                    }
                });

            }
            if (lang && this.getLanguages().indexOf(lang) !== -1) {
                updateLanguage(this.schema, lang);
            }
        }
    });

    // Mongoose will emit 'init' event once the schema will be attached to the model
    schema.on('init', function (model) {
        // no actions are required in the global method is already defined
        if (model.db.setDefaultLanguage) {
            return;
        }

        // define a global method to change the language for all models (and their schemas)
        // created for the current mongo connection
        model.db.setDefaultLanguage = function (lang) {
            var model, modelName;
            for (modelName in this.models) {
                if (this.models.hasOwnProperty(modelName)) {
                    model = this.models[modelName];
                    model.setDefaultLanguage && model.setDefaultLanguage(lang);
                }
            }
        };

        // create an alias for the global change language method attached to the default connection
        if (!mongoose.setDefaultLanguage) {
            mongoose.setDefaultLanguage = mongoose.connection.setDefaultLanguage;
        }
    });
};

module.exports = exports = mongooseIntl;
