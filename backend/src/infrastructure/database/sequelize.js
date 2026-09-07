const { Sequelize } = require('sequelize');
const config = require('../../config');

const sequelize = new Sequelize(config.db.name, config.db.user, config.db.pass, {
    host: config.db.host,
    port: config.db.port,
    dialect: 'mysql',
    logging: false,
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
    }
});

// Initialize models
const User = require('./models/user.model')(sequelize);
const AgriculturalProduct = require('./models/agricultural-product.model')(sequelize);
const IndustrialProduct = require('./models/industrial-product.model')(sequelize);
const Order = require('./models/order.model')(sequelize);
const Payment = require('./models/payment.model')(sequelize);
const Invoice = require('./models/invoice.model')(sequelize);
const Notification = require('./models/notification.model')(sequelize);

// Set up associations

// User <-> AgriculturalProduct (Farmer owns agricultural products/crops)
User.hasMany(AgriculturalProduct, { as: 'crops', foreignKey: 'farmerId', onDelete: 'CASCADE' });
AgriculturalProduct.belongsTo(User, { as: 'farmer', foreignKey: 'farmerId' });

// User <-> IndustrialProduct (Supplier owns/supplies industrial products)
User.hasMany(IndustrialProduct, { as: 'supplies', foreignKey: 'supplierId', onDelete: 'CASCADE' });
IndustrialProduct.belongsTo(User, { as: 'supplier', foreignKey: 'supplierId' });

// User <-> Order (Customer/Farmer purchases products)
User.hasMany(Order, { as: 'orders', foreignKey: 'buyerId', onDelete: 'CASCADE' });
Order.belongsTo(User, { as: 'buyer', foreignKey: 'buyerId' });

// Order <-> AgriculturalProduct / IndustrialProduct
AgriculturalProduct.hasMany(Order, { as: 'orders', foreignKey: 'agriculturalProductId', onDelete: 'SET NULL' });
Order.belongsTo(AgriculturalProduct, { as: 'agriculturalProduct', foreignKey: 'agriculturalProductId' });

IndustrialProduct.hasMany(Order, { as: 'orders', foreignKey: 'industrialProductId', onDelete: 'SET NULL' });
Order.belongsTo(IndustrialProduct, { as: 'industrialProduct', foreignKey: 'industrialProductId' });

// Order <-> Payment
Order.hasOne(Payment, { as: 'payment', foreignKey: 'orderId', onDelete: 'CASCADE' });
Payment.belongsTo(Order, { as: 'order', foreignKey: 'orderId' });

// User <-> Payment (Customer makes payment)
User.hasMany(Payment, { as: 'payments', foreignKey: 'customerId', onDelete: 'CASCADE' });
Payment.belongsTo(User, { as: 'customer', foreignKey: 'customerId' });

// Payment <-> Invoice
Payment.hasOne(Invoice, { as: 'invoice', foreignKey: 'paymentId', onDelete: 'CASCADE' });
Invoice.belongsTo(Payment, { as: 'payment', foreignKey: 'paymentId' });

// User <-> Notification (Customer receives notifications)
User.hasMany(Notification, { as: 'notifications', foreignKey: 'userId', onDelete: 'CASCADE' });
Notification.belongsTo(User, { as: 'user', foreignKey: 'userId' });

async function testConnection() {
    try {
        await sequelize.authenticate();
        return { connected: true, message: 'Database connection established successfully.' };
    } catch (error) {
        return { connected: false, message: `Database connection failed (MySQL server might not be running yet): ${error.message}` };
    }
}

module.exports = {
    sequelize,
    testConnection,
    User,
    AgriculturalProduct,
    IndustrialProduct,
    Order,
    Payment,
    Invoice,
    Notification
};
