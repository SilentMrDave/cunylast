module.exports = function(sequelize, DataTypes)
{
    var Users = sequelize.define('users',
    {
        username: DataTypes.STRING,
        firstName: DataTypes.STRING,
        lastName: DataTypes.STRING,
        email: DataTypes.STRING,
        password: DataTypes.STRING
    });
    return Users;
};