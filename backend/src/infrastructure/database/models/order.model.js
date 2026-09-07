const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Order = sequelize.define('Order', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        quantity: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 1
        },
        price: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false
        },
        status: {
            type: DataTypes.ENUM('pending', 'completed', 'cancelled'),
            allowNull: false,
            defaultValue: 'pending'
        }
    }, {
        tableName: 'orders'
    });

    return Order;
};
