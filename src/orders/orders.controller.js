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
    if(dishes.isArray && dishes.length>0){
        return next();
    }
    next({
        status: 400,
        message: `Order must include at least one dish`,
    });
}


function create(req, res) {
    const { data: { deliverTo, mobileNumber, dishes } = {} } = req.body;
    const newOrder = {
        id: nextId(), // Increment last id then assign as the current ID
        deliverTo: deliverTo,
        mobileNumber: mobileNumber,
        dishes: dishes,

    };
    orders.push(newOrder);
    res.status(201).json({ data: newOrder });
}
function orderIdMatches(req,res,next){
    const { orderId } = req.params;
    const { data: { id } = {} } = req.body;
    if((id===undefined)|| id ===orderId){
        return next();
    }
    next({
        status: 404,
        message: `Order id does not match route id. Order: ${id}, Route: ${dishId}.`,
    });

}
function orderExists(req, res, next) {
    const { orderId } = req.params;
    const foundOrder = orders.find(order => order.id === Number(orderId));
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
    const { data: { deliverTo, mobileNumber, dishes } = {} } = req.body;

    // update the order
    order.deliverTo = deliverTo;
    order.mobileNumber = mobileNumber;
    order.dishes = dishes;

    res.json({ data: order });
}

function statusIsValidForUpdate(req, res, next) {
    const { data: { status } = {} } = req.body;

    if (data[status]&&(data[status]!=="")) {
        return next();
    }

    const validStatus = ["pending", "preparing","out-for-delivery","delivered"];
    if (data[status]&&(data[status]!=="")&& validStatus.includes(status)) {
        return next();
    }
    if(status==="delivered"){
        next({
            status: 400,
            message: `A delivered order cannot be changed`,
        });
    }
    next({
        status: 400,
        message: `Order must have a status of pending, preparing, out-for-delivery`,
    });
}
function orderIsNotPending (req,res){
    const order = res.locals.order;
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
        update
    ],
    delete: [orderExists,orderIsNotPending, destroy],
};