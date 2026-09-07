const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const AgriculturalProduct = sequelize.define('AgriculturalProduct', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false
        },
        price: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false
        }
    }, {
        tableName: 'agricultural_products'
    });

    return AgriculturalProduct;
};
