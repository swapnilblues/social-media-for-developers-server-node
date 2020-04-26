const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  username:{
    type: String
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
                                         image: {
                                           type: String
                                         },
  password: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  address: {
      city: {
        type: String
      },
      zipcode:{
        type: String
      }
  },
  phone: {
      type: String
  },
  role: {
    type: Number,
    default: 0
  }
}
);

module.exports = User = mongoose.model('user', UserSchema);
