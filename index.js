const { Double } = require('./schematypes/mongoose-double');
const { Int32 } = require('./schematypes/mongoose-int32');
const  Intl = require('./plugins/mongoose-intl');


module.exports = {
    Plugins: {
        Intl: Intl
    },
    SchemaType: {
        Double,
        Int32,
    },
};
