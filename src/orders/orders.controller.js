const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /orders handlers needed to make the tests pass


function list(req, res) {
    const { dishId } = req.params;
    res.json({ data: orders.filter(dishId ? order => order.dishes.id == dishId : () => true) });
}



function bodyDataHasNotEmpty(propertyName) {
    return function (req, res, next) {
        const { data = {} } = req.body;
        if (data[propertyName]&&(data[propertyName]!=="")) {
            return next();
        }
        next({
            status: 400,
            message: `Order must include a ${propertyName}`
        });
    };
}


function dishesPropertyIsValid(req, res, next) {
    const { data: { dishes } = {} } = req.body;
    console.log("checking dishes property: ",dishes, " its length is ",dishes.length,
        "and its type is: ", typeof dishes);
    if (Array.isArray(dishes) && dishes.length > 0) {
        return next();
    }

    next({
        status: 400,
        message: `Order must include at least one dish`,
    });
}


function quantityIsValidNumber(req, res, next){
    console.log("in quatity check");
    const { data: { dishes }  = {} } = req.body;
    console.log("dishes ",dishes);
    const localDishes = [...dishes];
    console.log("local dishes: ",localDishes);
    let size = localDishes.length;
    let index=0;
    while(index<size){
        console.log("in quantityIsValid check, index is ",index,
            "quantity is: ",localDishes[index].quantity)
        if ((localDishes[index].quantity === null) || localDishes[index].quantity <= 0 || !Number.isInteger(localDishes[index].quantity)){
            return next({
                status: 400,
                message: `dish ${index} must have a quantity that is an integer greater than 0`
            });
        }
        index++;
    }
    next();
}
function create(req, res) {
    console.log("what we have in create body: ",req.body);
    const { data: { deliverTo, mobileNumber, dishes } = {} } = req.body;
    const id = nextId();
    const newOrder = {
        id, // Increment last id then assign as the current ID
        deliverTo,
        mobileNumber,
        dishes,

    };
    console.log("new order:", newOrder);
    orders.push(newOrder);
    res.status(201).json({ data: newOrder });
}
function orderIdMatches(req,res,next){
    const { orderId } = req.params;
    const { data: { id } = {} } = req.body;
    if((id===undefined)|| id ===orderId ||(id==="")||(id===null)){
        return next();
    }
    next({
        status: 404,
        message: `Order id does not match route id. Order: ${id}, Route: ${dishId}.`,
    });

}
function orderExists(req, res, next) {
    const { orderId } = req.params;
    const foundOrder = orders.find(order => order.id === orderId);
    console.log("checking if order exists, foundorder is: ",foundOrder);
    if (foundOrder) {
        res.locals.order = foundOrder;
        return next();
    }
    next({
        status: 404,
        message: `Order id not found: ${orderId}`,
    });
};

function read(req, res, next) {
    res.json({ data: res.locals.order });
};

function update(req, res) {
    const order = res.locals.order;
    console.log("in update, order from res.locarls.order: ",order);
    const { data: { deliverTo, mobileNumber, dishes } = {} } = req.body;

    // update the order
    order.deliverTo = deliverTo;
    order.mobileNumber = mobileNumber;
    order.dishes = dishes;

    res.json({ data: order });
}

function statusIsValidForUpdate(req, res, next) {
    const { data: { status } = {} } = req.body;
console.log(" checking if status is valid for update, status is: ",status);
console.log("what we have in  res.locals.order ",  res.locals.order)

    const validStatus = ["pending", "preparing","out-for-delivery","delivered"];
    if (status&&(status!=="")&& validStatus.includes(status)) {
        console.log("status is valid");
        return next();
    }
    if(status==="delivered"){
        next({
            status: 400,
            message: `A delivered order cannot be changed`,
        });
    }
    console.log("going to send an error about the status")
    next({
        status: 400,
        message: `Order must have a status of pending, preparing, out-for-delivery`,
    });
}
function orderIsNotPending (req,res){
    const order = res.locals.order;
    console.log("checking that order is not pending: ",order);
    if(order.status!=="Pending"){
        return next();
    }
    next({
        status: 400,
        message: `An order cannot be deleted unless it is pending`,
    });

}
function destroy(req, res) {
    const { orderId } = req.params;
    const index = orders.findIndex((order) => order.id === Number(orderId));
    // `splice()` returns an array of the deleted elements, even if it is one element
    const deletedOrders = orders.splice(index, 1);
    res.sendStatus(204);
}

module.exports = {
    create: [
        bodyDataHasNotEmpty("deliverTo"),
        bodyDataHasNotEmpty("mobileNumber"),
        bodyDataHasNotEmpty("dishes"),
        dishesPropertyIsValid,
        quantityIsValidNumber,
        create
    ],
    list,
    read: [orderExists, read],
    update: [
        orderExists,
        orderIdMatches,
        bodyDataHasNotEmpty("deliverTo"),
        bodyDataHasNotEmpty("mobileNumber"),
        bodyDataHasNotEmpty("dishes"),
        statusIsValidForUpdate,
        dishesPropertyIsValid,
        quantityIsValidNumber,
        update
    ],
    delete: [orderExists,orderIsNotPending, destroy],
};