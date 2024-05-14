import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: (queryInterface: QueryInterface) => {
    return queryInterface.createTable("Hubsoft", {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      client_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: null
      },
      host: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null
      },
      client_secret: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null
      },
      username: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null
      },
      password: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null
      },
      grant_type: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null
      },
      access_token: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: null
      },
      refresh_token: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: null
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false
      }
    });
  },

  down: (queryInterface: QueryInterface) => {
    return queryInterface.dropTable("Hubsoft");
  }
};
