import config from 'config';
import Sequelize from 'sequelize';
import moment from 'moment';
import bcryptjs from 'bcryptjs';
import jwt from "jwt-simple";
import sqlGlobals from './utils/sequelize-globals';
import deepAssign from 'assign-deep';
import { snowflake } from '../../helpers/index.mjs';

export default function (sequelize) {
  const User = sequelize.define('user', {
    id: {
      type: Sequelize.STRING(25),
      primaryKey: true
    },

    username: {
      type: Sequelize.STRING(25),
      unique: true,
      allowNull: false,
      isAlphanumeric: true
    },
    password: {
      type: Sequelize.STRING,
      allowNull: false
    }
  }, {
    hooks: {
      beforeValidate(user, options) {
        return user.encryptPassword();
      }
    },
    ...sqlGlobals.defaultOptions
  });

  User.associate = function (models) {
    this.belongsToMany(models.track, {
      through: 'user_track'
    });

    this.belongsToMany(models.playlist, {
      through: 'user_playlist',
      scope: 'owner'
    });
  };

  User.encryptPassword = function (password) {
    return bcryptjs.hash(password, 10);
  };

  User.prototype.encryptPassword = async function () {
    this.password = await User.encryptPassword(this.password);
  };

  User.prototype.comparePassword = function (password) {
    return bcryptjs.compare(password, this.password);
  };

  User.prototype.newJwtToken = async function () {
    let expires = moment().utc().add({ days: 7 }).unix();
    let token = jwt.encode({
      exp: expires,
      iss: config.yokinu.auth.jwt.iss,
      sub: this.id,
      aud: config.yokinu.auth.jwt.aud,
      jti: await snowflake.getId()
    }, config.yokinu.auth.jwt.secret);

    return {
      token: token,
      expires: moment.unix(expires).format(),
      user: this.id
    };
  };

  User.getValidationSchema = function (...extras) {
    return deepAssign({
      username: {
        isLength: {
          options: {
            min: 3,
            max: 25
          }
        },
        isAlphanumeric: true,
        trim: true
      },
      password: {
        isLength: {
          options: {
            min: 3,
            max: 25
          }
        },
        isAlphanumeric: true,
        trim: true
      }
    }, ...extras);
  };


  return User;
}

