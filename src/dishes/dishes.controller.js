const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /dishes handlers needed to make the tests pass


function list(req, res) {
    const { dishId } = req.params;
    res.json({ data: dishes.filter(dishId ? dish => dish.id == dishId : () => true) });
}



// function bodyHasTextProperty(req, res, next) {
//     const { data: { text } = {} } = req.body;
//     if (text) {
//         return next();
//     }
//     next({
//         status: 400,
//         message: "A 'text' property is required.",
//     });
// }

function bodyDataHasNotEmpty(propertyName) {
    return function (req, res, next) {
        const { data = {} } = req.body;
        if (data[propertyName]&&(data[propertyName]!=="")) {
            return next();
        }
        next({ status: 400, message: `Dish must include a ${propertyName}` });
    };
}

function exposurePropertyIsValid(req, res, next) {
    const { data: { exposure } = {} } = req.body;
    const validExposure = ["private", "public"];
    if (validExposure.includes(exposure)) {
        return next();
    }
    next({
        status: 400,
        message: `Value of the 'exposure' property must be one of ${validExposure}. Received: ${exposure}`,
    });
}

function syntaxPropertyIsValid(req, res, next) {
    const { data: { syntax } = {} } = req.body;
    console.log("syntax is: ",syntax);
    const validSyntax = ["None", "Javascript", "Python", "Ruby", "Perl", "C", "Scheme"];
    if (validSyntax.includes(syntax)) {
        return next();
    }
    next({
        status: 400,
        message: `Value of the 'syntax' property must be one of ${validSyntax}. Received: ${syntax}`,
    });
}

function priceIsValidNumber(req, res, next){
    const { data: { price }  = {} } = req.body;
    if (price <= 0 || !Number.isInteger(price)){
        return next({
            status: 400,
            message: `Dish must have a price that is an integer greater than 0`
        });
    }
    next();
}



/*
"data": [
    {
      "id": "d351db2b49b69679504652ea1cf38241",
      "name": "Dolcelatte and chickpea spaghetti",
      "description": "Spaghetti topped with a blend of dolcelatte and fresh chickpeas",
      "price": 19,
      "image_url": "https://images.pexels.com/photos/1279330/pexels-photo-1279330.jpeg?h=530&w=350"
    }

 */
function create(req, res) {
    const { data: { name, description, price, image_url } = {} } = req.body;
    const newDish = {
        id: nextId(), // Increment last id then assign as the current ID
        name,
        description,
        price,
        image_url,

    };
    dishes.push(newDish);
    res.status(201).json({ data: newDish });
}

function dishExists(req, res, next) {
    const { dishId } = req.params;
 //   console.log("in dishExists, dishId from req.params: ", dishId);
    const foundDish = dishes.find(dish => dish.id === dishId);
    if (foundDish) {
  //      console.log("found dish: ",foundDish);
        res.locals.dish = foundDish;
  //      console.log("putting the dish on res.locals: ",res.locals.dish);
        return next();
    }
    next({
        status: 404,
        message: `Dish id not found: ${dishId}`,
    });
};

function update(req, res) {
    const dish = res.locals.dish;
  //  console.log("in update Dish, dish from  res.locals.dish is: ",dish);
    const { data: { name, description, price, image_url  } = {} } = req.body;

    // Update the paste
    dish.name = name;
    dish.description = description;
    dish.price = price;
    dish.image_url = image_url;

    res.json({ data: dish });

}

function read(req, res, next) {
    const dish = res.locals.dish;
 //   console.log("in read, dish is: ",dish);
    res.json({ data: dish });
};

function dishIdMatches(req,res,next){
    const { dishId } = req.params;
    const { data: { id } = {} } = req.body;
    if((id===undefined)|| id ===dishId||(id==="")||(id===null)){
        return next();
    }
    next({
        status: 400,
        message: `Dish id does not match route id. Dish: ${id}, Route: ${dishId}.`,
    });

}

function destroy(req, res) {
    const { dishId } = req.params;
    console.log("dish to destroy:",dishId);
    const index = dishes.findIndex((dish) => dish.id === dishId);
    // `splice()` returns an array of the deleted elements, even if it is one element
    const deletedDishes = dishes.splice(index, 1);
    res.sendStatus(204);
}
module.exports = {
    //  create: [bodyHasTextProperty, create],
    create: [
        bodyDataHasNotEmpty("name"),
        bodyDataHasNotEmpty("description"),
        bodyDataHasNotEmpty("price"),
        bodyDataHasNotEmpty("image_url"),
        //exposurePropertyIsValid,
        //syntaxPropertyIsValid,
        priceIsValidNumber,
        create,
    ],
    list,
    read: [dishExists, read],
    update: [
        dishExists,
        dishIdMatches,
        bodyDataHasNotEmpty("name"),
        bodyDataHasNotEmpty("description"),
        bodyDataHasNotEmpty("price"),
        bodyDataHasNotEmpty("image_url"),
        //exposurePropertyIsValid,
        //syntaxPropertyIsValid,
        priceIsValidNumber,
        update
    ],
    delete: [dishExists, destroy],
};






