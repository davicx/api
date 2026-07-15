const ToDo = require('../functions/classes/ToDo');
const toDoFunctions = require('../functions/toDoFunctions');
const Functions = require('../../functions/functions');

/*
FUNCTIONS A: All Functions Related to To Dos
    1) Function A1: Create To Do
    2) Function A2: Edit To Do
    3) Function A3: Delete To Do

FUNCTIONS B: All Functions Related to Getting To Dos
    1) Function B1: Get All To Dos
    2) Function B2: Get To Do by ID
    3) Function B3: Get To Dos by Stage
    4) Function B4: Get Open To Dos
    5) Function B5: Get Completed To Dos

FUNCTIONS C: All Functions Related to To Do Actions
    1) Function C1: Mark To Do Complete
    2) Function C2: Mark To Do Open

*/

//FUNCTIONS A: All Functions Related to To Dos
//Function A1: Create To Do
async function createTodo(req, res) {
    const currentUser = req.body.currentUser || req.body.requestedByUserName || req.body.messageFrom;

    var headerMessage = "HEADER: Create To Do";
    Functions.addHeader(headerMessage);

    var todoOutcome = toDoFunctions.buildTodoResponse(currentUser);

    //STEP 1: Check Required Fields
    console.log("STEP 1: Check Required Fields");
    const organizationID = req.body.organizationID || req.body.organization_id;
    const title = req.body.title;

    if (!organizationID || !title) {
        todoOutcome.message = "organizationID and title are required";
        todoOutcome.statusCode = 400;
        Functions.addFooter();
        return res.json(todoOutcome);
    }

    //STEP 2: Create To Do in Database
    console.log("STEP 2: Create To Do in Database");
    var newTodoOutcome = await ToDo.createTodo(req);

    //STEP 3: New To Do Outcome
    console.log("STEP 3: New To Do Outcome");
    if (newTodoOutcome.outcome == 200) {
        todoOutcome.data = newTodoOutcome.newTodo;
        todoOutcome.message = "You created a To Do!";
        todoOutcome.statusCode = 200;
        todoOutcome.success = true;
    } else {
        todoOutcome.message = "There was a problem creating your To Do!";
        todoOutcome.statusCode = 500;
        todoOutcome.errors = newTodoOutcome.errors;
    }

    Functions.addFooter();
    res.json(todoOutcome);
}

//Function A2: Edit To Do
async function editTodo(req, res) {
    const currentUser = req.body.currentUser || req.body.requestedByUserName || req.body.messageFrom;
    const todoID = req.body.todoID || req.body.todo_id;

    var headerMessage = "HEADER: Edit To Do: " + todoID;
    Functions.addHeader(headerMessage);

    var editTodoOutcome = toDoFunctions.buildTodoResponse(currentUser);

    //STEP 1: Check if To Do Exists
    console.log("STEP 1: Check if To Do Exists");
    const todoExistsOutcome = await toDoFunctions.checkTodoExists(todoID);

    //STEP 2: Update To Do
    console.log("STEP 2: Update To Do");
    if (todoExistsOutcome.todoExists == true) {
        const updateTodoOutcome = await ToDo.editTodo(req);

        if (updateTodoOutcome.success == true) {
            editTodoOutcome.data = { todoID: todoID };
            editTodoOutcome.success = true;
            editTodoOutcome.statusCode = 200;
            editTodoOutcome.message = updateTodoOutcome.message;
        } else {
            editTodoOutcome.message = updateTodoOutcome.message;
            editTodoOutcome.statusCode = 400;
            editTodoOutcome.errors = updateTodoOutcome.errors;
        }
    } else {
        editTodoOutcome.message = "To Do not found";
        editTodoOutcome.statusCode = 404;
    }

    //STEP 3: Edit To Do Outcome
    console.log("STEP 3: Edit To Do Outcome");
    Functions.addFooter();
    res.json(editTodoOutcome);
}

//Function A3: Delete To Do
async function deleteTodo(req, res) {
    const currentUser = req.body.currentUser || req.body.requestedByUserName || req.body.messageFrom;
    const todoID = req.body.todoID || req.body.todo_id;

    var headerMessage = "HEADER: Delete To Do: " + todoID;
    Functions.addHeader(headerMessage);

    var deleteTodoOutcome = toDoFunctions.buildTodoResponse(currentUser);

    //STEP 1: Check if To Do Exists
    console.log("STEP 1: Check if To Do Exists");
    const todoExistsOutcome = await toDoFunctions.checkTodoExists(todoID);

    //STEP 2: Delete To Do
    console.log("STEP 2: Delete To Do");
    if (todoExistsOutcome.todoExists == true) {
        const deleteOutcome = await ToDo.deleteTodo(todoID);

        if (deleteOutcome.success == true) {
            deleteTodoOutcome.data = { todoID: todoID, currentUser: currentUser };
            deleteTodoOutcome.success = true;
            deleteTodoOutcome.statusCode = 200;
            deleteTodoOutcome.message = deleteOutcome.message;
        } else {
            deleteTodoOutcome.message = deleteOutcome.message;
            deleteTodoOutcome.statusCode = 400;
            deleteTodoOutcome.errors = deleteOutcome.errors;
        }
    } else {
        deleteTodoOutcome.message = "To Do not found";
        deleteTodoOutcome.statusCode = 404;
    }

    //STEP 3: Delete To Do Outcome
    console.log("STEP 3: Delete To Do Outcome");
    Functions.addFooter();
    res.json(deleteTodoOutcome);
}

//FUNCTIONS B: All Functions Related to Getting To Dos
//Function B1: Get All To Dos
async function getAllTodos(req, res) {
    const currentUser = req.currentUser || req.body?.currentUser;

    var headerMessage = "HEADER: Get All To Dos";
    Functions.addHeader(headerMessage);

    var todosResponse = toDoFunctions.buildTodoResponse(currentUser);

    //STEP 1: Get All To Dos
    console.log("STEP 1: Get All To Dos");
    var todosOutcome = await ToDo.getAllTodos();

    //STEP 2: To Dos Outcome
    console.log("STEP 2: To Dos Outcome");
    todosResponse.data = todosOutcome.todos;
    todosResponse.message = "All To Dos";
    todosResponse.success = todosOutcome.success;
    todosResponse.statusCode = todosOutcome.success ? 200 : 500;
    todosResponse.errors = todosOutcome.errors;

    Functions.addFooter();
    res.json(todosResponse);
}

//Function B2: Get To Do by ID
async function getTodo(req, res) {
    const currentUser = req.currentUser || req.body?.currentUser;
    const todoID = req.params.todo_id;

    var headerMessage = "HEADER: Get To Do: " + todoID;
    Functions.addHeader(headerMessage);

    var todoResponse = toDoFunctions.buildTodoResponse(currentUser);

    //STEP 1: Get To Do
    console.log("STEP 1: Get To Do");
    var todoOutcome = await ToDo.getTodo(todoID);

    //STEP 2: To Do Outcome
    console.log("STEP 2: To Do Outcome");
    if (todoOutcome.success == true) {
        todoResponse.data = todoOutcome.todo;
        todoResponse.message = "To Do found";
        todoResponse.success = true;
        todoResponse.statusCode = 200;
    } else {
        todoResponse.message = "To Do not found";
        todoResponse.statusCode = 404;
        todoResponse.errors = todoOutcome.errors;
    }

    Functions.addFooter();
    res.json(todoResponse);
}

//Function B3: Get To Dos by Stage
async function getTodosByStage(req, res) {
    const currentUser = req.currentUser || req.body?.currentUser;
    const stage = req.params.stage;

    var headerMessage = "HEADER: Get To Dos by Stage: " + stage;
    Functions.addHeader(headerMessage);

    var todosResponse = toDoFunctions.buildTodoResponse(currentUser);

    //STEP 1: Get To Dos by Stage
    console.log("STEP 1: Get To Dos by Stage");
    var todosOutcome = await ToDo.getTodosByStage(stage);

    //STEP 2: To Dos by Stage Outcome
    console.log("STEP 2: To Dos by Stage Outcome");
    todosResponse.data = todosOutcome.todos;
    todosResponse.message = "To Dos by Stage";
    todosResponse.success = todosOutcome.success;
    todosResponse.statusCode = todosOutcome.success ? 200 : 500;
    todosResponse.errors = todosOutcome.errors;

    Functions.addFooter();
    res.json(todosResponse);
}

//Function B4: Get Open To Dos
async function getOpenTodos(req, res) {
    const currentUser = req.currentUser || req.body?.currentUser;

    var headerMessage = "HEADER: Get Open To Dos";
    Functions.addHeader(headerMessage);

    var todosResponse = toDoFunctions.buildTodoResponse(currentUser);

    //STEP 1: Get Open To Dos
    console.log("STEP 1: Get Open To Dos");
    var todosOutcome = await ToDo.getOpenTodos();

    //STEP 2: Open To Dos Outcome
    console.log("STEP 2: Open To Dos Outcome");
    todosResponse.data = todosOutcome.todos;
    todosResponse.message = "Open To Dos";
    todosResponse.success = todosOutcome.success;
    todosResponse.statusCode = todosOutcome.success ? 200 : 500;
    todosResponse.errors = todosOutcome.errors;

    Functions.addFooter();
    res.json(todosResponse);
}

//Function B5: Get Completed To Dos
async function getCompletedTodos(req, res) {
    const currentUser = req.currentUser || req.body?.currentUser;

    var headerMessage = "HEADER: Get Completed To Dos";
    Functions.addHeader(headerMessage);

    var todosResponse = toDoFunctions.buildTodoResponse(currentUser);

    //STEP 1: Get Completed To Dos
    console.log("STEP 1: Get Completed To Dos");
    var todosOutcome = await ToDo.getCompletedTodos();

    //STEP 2: Completed To Dos Outcome
    console.log("STEP 2: Completed To Dos Outcome");
    todosResponse.data = todosOutcome.todos;
    todosResponse.message = "Completed To Dos";
    todosResponse.success = todosOutcome.success;
    todosResponse.statusCode = todosOutcome.success ? 200 : 500;
    todosResponse.errors = todosOutcome.errors;

    Functions.addFooter();
    res.json(todosResponse);
}

//FUNCTIONS C: All Functions Related to To Do Actions
//Function C1: Mark To Do Complete
async function completeTodo(req, res) {
    const currentUser = req.body.currentUser || req.body.requestedByUserName || req.body.messageFrom;
    const todoID = req.body.todoID || req.body.todo_id;

    var headerMessage = "HEADER: Complete To Do: " + todoID;
    Functions.addHeader(headerMessage);

    var completeTodoOutcome = toDoFunctions.buildTodoResponse(currentUser);

    //STEP 1: Check if To Do Exists
    console.log("STEP 1: Check if To Do Exists");
    const todoExistsOutcome = await toDoFunctions.checkTodoExists(todoID);

    //STEP 2: Mark To Do Complete
    console.log("STEP 2: Mark To Do Complete");
    if (todoExistsOutcome.todoExists == true) {
        const completeOutcome = await ToDo.completeTodo(todoID);

        completeTodoOutcome.data = { todoID: todoID, status: "completed" };
        completeTodoOutcome.success = completeOutcome.success;
        completeTodoOutcome.statusCode = completeOutcome.success ? 200 : 400;
        completeTodoOutcome.message = completeOutcome.message;
        completeTodoOutcome.errors = completeOutcome.errors;
    } else {
        completeTodoOutcome.message = "To Do not found";
        completeTodoOutcome.statusCode = 404;
    }

    //STEP 3: Complete To Do Outcome
    console.log("STEP 3: Complete To Do Outcome");
    Functions.addFooter();
    res.json(completeTodoOutcome);
}

//Function C2: Mark To Do Open
async function openTodo(req, res) {
    const currentUser = req.body.currentUser || req.body.requestedByUserName || req.body.messageFrom;
    const todoID = req.body.todoID || req.body.todo_id;

    var headerMessage = "HEADER: Open To Do: " + todoID;
    Functions.addHeader(headerMessage);

    var openTodoOutcome = toDoFunctions.buildTodoResponse(currentUser);

    //STEP 1: Check if To Do Exists
    console.log("STEP 1: Check if To Do Exists");
    const todoExistsOutcome = await toDoFunctions.checkTodoExists(todoID);

    //STEP 2: Mark To Do Open
    console.log("STEP 2: Mark To Do Open");
    if (todoExistsOutcome.todoExists == true) {
        const openOutcome = await ToDo.openTodo(todoID);

        openTodoOutcome.data = { todoID: todoID, status: "open" };
        openTodoOutcome.success = openOutcome.success;
        openTodoOutcome.statusCode = openOutcome.success ? 200 : 400;
        openTodoOutcome.message = openOutcome.message;
        openTodoOutcome.errors = openOutcome.errors;
    } else {
        openTodoOutcome.message = "To Do not found";
        openTodoOutcome.statusCode = 404;
    }

    //STEP 3: Open To Do Outcome
    console.log("STEP 3: Open To Do Outcome");
    Functions.addFooter();
    res.json(openTodoOutcome);
}

module.exports = { createTodo, editTodo, deleteTodo, getAllTodos, getTodo, getTodosByStage, getOpenTodos, getCompletedTodos, completeTodo, openTodo };
