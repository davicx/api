const ToDo = require('./classes/ToDo');

/*

FUNCTIONS A: All Functions Related to To Dos
    1) Function A1: Build To Do Response

FUNCTIONS B: All To Do Helper Functions
    1) Function B1: Check if To Do Exists

*/

//FUNCTIONS A: All Functions Related to To Dos
//Function A1: Build To Do Response
function buildTodoResponse(currentUser) {
    return {
        data: {},
        message: "",
        success: false,
        statusCode: 500,
        errors: [],
        currentUser: currentUser
    };
}

//FUNCTIONS B: All To Do Helper Functions
//Function B1: Check if To Do Exists
async function checkTodoExists(todoID) {
    var todoExistsOutcome = {
        todoID: todoID,
        todoExists: false,
        success: false,
        message: "",
        errors: []
    };

    try {
        var todoOutcome = await ToDo.getTodo(todoID);

        if (todoOutcome.success == true && todoOutcome.todo != null) {
            todoExistsOutcome.todoExists = true;
            todoExistsOutcome.success = true;
            todoExistsOutcome.message = "To Do found";
        } else {
            todoExistsOutcome.message = "To Do not found";
        }
    } catch(err) {
        todoExistsOutcome.message = "Could not check To Do";
        todoExistsOutcome.errors.push(err);
    }

    return todoExistsOutcome;
}

module.exports = { buildTodoResponse, checkTodoExists };
