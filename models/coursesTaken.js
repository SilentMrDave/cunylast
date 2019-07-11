module.exports = function(sequelize, DataTypes)
{
    var CoursesTaken = sequelize.define('coursesTaken',
    {
        userId:
        {
            type: DataTypes.INTEGER,
            references: {model: 'users', key: 'id'}
        },
        courseId:
        {
            type: DataTypes.INTEGER,
            references: {model: 'courses', key: 'id'}
        }
    });
    return CoursesTaken;
};