const mongo = require('mongoose');

const dish = new mongo.Schema({
    name: String,
    sweetness: Number,
    fruity: Boolean,
    vegetarian: Boolean,
    strength: Number,
    liquid: Boolean,
    smooth: Boolean,
    lactose: Boolean,
    gluten: Boolean,
    available: Boolean,
    offeredById: String
  });
  
  const Dish = mongo.model('Dish', dish);

module.exports = Dish;