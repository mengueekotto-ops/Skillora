const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Payment = sequelize.define('Payment', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        amount: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false
        }
    }, {
        tableName: 'payments'
    });

    return Payment;
};
