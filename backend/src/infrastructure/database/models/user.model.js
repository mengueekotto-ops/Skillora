const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');

module.exports = (sequelize) => {
    const User = sequelize.define('User', {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            validate: {
                isEmail: true
            },
            set(value) {
                // Ensure email is saved in lowercase and trimmed
                this.setDataValue('email', value.toLowerCase().trim());
            }
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false
        },
        name: {
            type: DataTypes.STRING,
            allowNull: true
        },
        dob: {
            type: DataTypes.DATEONLY,
            field: 'dob',
            allowNull: true
        },
        phone_number: {
            type: DataTypes.STRING,
            allowNull: true
        },
        role: {
            type: DataTypes.ENUM('admin', 'customer', 'farmer', 'supplier', 'delivery_guy', 'advisor', 'investor'),
            allowNull: false,
            defaultValue: 'customer'
        },
        status: {
            type: DataTypes.ENUM('active', 'suspended'),
            allowNull: false,
            defaultValue: 'active'
        },
        rating: {
            type: DataTypes.DECIMAL(3, 2),
            allowNull: true
        },
        profession: {
            type: DataTypes.STRING,
            allowNull: true
        }
    }, {
        tableName: 'users',
        hooks: {
            beforeCreate: async (user) => {
                if (user.password) {
                    const salt = await bcrypt.genSalt(10);
                    user.password = await bcrypt.hash(user.password, salt);
                }
            },
            beforeUpdate: async (user) => {
                if (user.changed('password')) {
                    const salt = await bcrypt.genSalt(10);
                    user.password = await bcrypt.hash(user.password, salt);
                }
            }
        }
    });

    // Instance method to check password validity
    User.prototype.validatePassword = async function (password) {
        return bcrypt.compare(password, this.password);
    };

    return User;
};
