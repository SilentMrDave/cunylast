module.exports = function(sequelize, DataTypes)
{
    var Courses = sequelize.define('courses',
    {
        code: DataTypes.STRING,
        name: DataTypes.STRING,
        description: DataTypes.STRING,
        time: DataTypes.STRING
    });
    return Courses;
};