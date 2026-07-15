const db = require('../../../functions/conn');

class ToDo {
    constructor(todoID) {
        this.todoID = todoID;
        this.organizationID = "";
        this.projectID = "";
        this.title = "";
        this.category = "";
        this.status = "open";
    }

    //METHODS A: CREATE TO DO RELATED
    //Method A1: Create To Do
    static async createTodo(req) {
        const connection = db.getConnection();
        const organizationID = ToDo.getBodyValue(req.body, 'organizationID', 'organization_id', null);
        const projectID = ToDo.getBodyValue(req.body, 'projectID', 'project_id', null);
        const groupID = ToDo.getBodyValue(req.body, 'groupID', 'group_id', null);
        const listID = ToDo.getBodyValue(req.body, 'listID', 'list_id', null);
        const title = req.body.title;
        const description = ToDo.getBodyValue(req.body, 'description', 'description', null);
        const category = ToDo.getBodyValue(req.body, 'category', 'category', null);
        const status = ToDo.getBodyValue(req.body, 'status', 'status', 'open');
        const stage = ToDo.getBodyValue(req.body, 'stage', 'stage', 'mvp');
        const priority = ToDo.getBodyValue(req.body, 'priority', 'priority', 2);
        const displayOrder = ToDo.getBodyValue(req.body, 'displayOrder', 'display_order', 0);

        console.log("CLASS ToDo: Step 1A: Create a new To Do from ToDo Class");

        var createdTodo = {
            todoID: 0,
            organizationID: organizationID,
            projectID: projectID,
            groupID: groupID,
            listID: listID,
            title: title,
            description: description,
            category: category,
            status: status,
            stage: stage,
            priority: Number(priority),
            displayOrder: Number(displayOrder),
            createdAt: "",
            updatedAt: "",
            completedAt: null
        };

        var todoOutcome = {
            newTodo: createdTodo,
            outcome: 0,
            todoID: 0,
            errors: []
        };

        //INSERT TO DO
        return new Promise(async function(resolve, reject) {
            try {
                const queryString = "INSERT INTO todo (organization_id, project_id, group_id, list_id, title, description, category, status, stage, priority, display_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

                connection.query(queryString, [organizationID, projectID, groupID, listID, title, description, category, status, stage, priority, displayOrder], (err, results, fields) => {
                    if (!err) {
                        console.log("Step 1B: You created a new To Do with ID " + results.insertId);
                        todoOutcome.outcome = 200;
                        todoOutcome.todoID = results.insertId;
                        todoOutcome.newTodo.todoID = results.insertId;
                    } else {
                        todoOutcome.outcome = "no worky";
                        todoOutcome.errors.push(err);
                    }
                    resolve(todoOutcome);
                });

            } catch(err) {
                todoOutcome.outcome = "rejected";
                console.log("ToDo Class: error in promise " + err);
                reject(todoOutcome);
            }
        });
    }

    //METHODS B: GETTING TO DOS
    //Method B1: Get All To Dos
    static async getAllTodos() {
        const connection = db.getConnection();
        const queryString = "SELECT * FROM todo ORDER BY display_order ASC, todo_id DESC";

        var todosOutcome = {
            success: false,
            todos: [],
            errors: []
        };

        return new Promise(async function(resolve, reject) {
            try {
                connection.query(queryString, (err, rows) => {
                    if (!err) {
                        todosOutcome.todos = rows.map((row) => ToDo.buildTodo(row));
                        todosOutcome.success = true;
                        resolve(todosOutcome);
                    } else {
                        console.log("Failed to Select To Dos" + err);
                        todosOutcome.errors.push(err);
                        reject(todosOutcome);
                    }
                });
            } catch(err) {
                todosOutcome.errors.push(err);
                reject(todosOutcome);
            }
        });
    }

    //Method B2: Get To Do by ID
    static async getTodo(todoID) {
        const connection = db.getConnection();
        const queryString = "SELECT * FROM todo WHERE todo_id = ?";

        var todoOutcome = {
            success: false,
            todo: null,
            errors: []
        };

        return new Promise(async function(resolve, reject) {
            try {
                connection.query(queryString, [todoID], (err, rows) => {
                    if (!err) {
                        if (rows.length > 0) {
                            todoOutcome.todo = ToDo.buildTodo(rows[0]);
                            todoOutcome.success = true;
                        }
                        resolve(todoOutcome);
                    } else {
                        console.log("Failed to Select To Do" + err);
                        todoOutcome.errors.push(err);
                        reject(todoOutcome);
                    }
                });
            } catch(err) {
                todoOutcome.errors.push(err);
                reject(todoOutcome);
            }
        });
    }

    //Method B3: Get To Dos by Stage
    static async getTodosByStage(stage) {
        const connection = db.getConnection();
        const queryString = "SELECT * FROM todo WHERE stage = ? ORDER BY display_order ASC, todo_id DESC";

        var todosOutcome = {
            success: false,
            todos: [],
            errors: []
        };

        return new Promise(async function(resolve, reject) {
            try {
                connection.query(queryString, [stage], (err, rows) => {
                    if (!err) {
                        todosOutcome.todos = rows.map((row) => ToDo.buildTodo(row));
                        todosOutcome.success = true;
                        resolve(todosOutcome);
                    } else {
                        console.log("Failed to Select To Dos by Stage" + err);
                        todosOutcome.errors.push(err);
                        reject(todosOutcome);
                    }
                });
            } catch(err) {
                todosOutcome.errors.push(err);
                reject(todosOutcome);
            }
        });
    }

    //Method B4: Get Open To Dos
    static async getOpenTodos() {
        return ToDo.getTodosByStatus('open');
    }

    //Method B5: Get Completed To Dos
    static async getCompletedTodos() {
        return ToDo.getTodosByStatus('completed');
    }

    //Method B6: Get To Dos by Status
    static async getTodosByStatus(status) {
        const connection = db.getConnection();
        const queryString = "SELECT * FROM todo WHERE status = ? ORDER BY display_order ASC, todo_id DESC";

        var todosOutcome = {
            success: false,
            todos: [],
            errors: []
        };

        return new Promise(async function(resolve, reject) {
            try {
                connection.query(queryString, [status], (err, rows) => {
                    if (!err) {
                        todosOutcome.todos = rows.map((row) => ToDo.buildTodo(row));
                        todosOutcome.success = true;
                        resolve(todosOutcome);
                    } else {
                        console.log("Failed to Select To Dos by Status" + err);
                        todosOutcome.errors.push(err);
                        reject(todosOutcome);
                    }
                });
            } catch(err) {
                todosOutcome.errors.push(err);
                reject(todosOutcome);
            }
        });
    }

    //METHODS C: UPDATING TO DOS
    //Method C1: Edit To Do
    static async editTodo(req) {
        const connection = db.getConnection();
        const todoID = req.body.todoID || req.body.todo_id;

        var fields = [];
        var values = [];

        ToDo.addUpdateField(fields, values, req.body, 'organizationID', 'organization_id');
        ToDo.addUpdateField(fields, values, req.body, 'projectID', 'project_id');
        ToDo.addUpdateField(fields, values, req.body, 'groupID', 'group_id');
        ToDo.addUpdateField(fields, values, req.body, 'listID', 'list_id');
        ToDo.addUpdateField(fields, values, req.body, 'title', 'title');
        ToDo.addUpdateField(fields, values, req.body, 'description', 'description');
        ToDo.addUpdateField(fields, values, req.body, 'category', 'category');
        ToDo.addUpdateField(fields, values, req.body, 'status', 'status');
        ToDo.addUpdateField(fields, values, req.body, 'stage', 'stage');
        ToDo.addUpdateField(fields, values, req.body, 'priority', 'priority');
        ToDo.addUpdateField(fields, values, req.body, 'displayOrder', 'display_order');

        var editTodoOutcome = {
            todoID: todoID,
            success: false,
            message: "",
            errors: []
        };

        if (fields.length == 0) {
            editTodoOutcome.message = "No To Do fields to update";
            return editTodoOutcome;
        }

        values.push(todoID);

        //UPDATE TO DO
        return new Promise(async function(resolve, reject) {
            try {
                const queryString = "UPDATE todo SET " + fields.join(", ") + " WHERE todo_id = ?";

                connection.query(queryString, values, (err, rows) => {
                    if (!err) {
                        if (rows.affectedRows > 0) {
                            editTodoOutcome.success = true;
                            editTodoOutcome.message = "You updated the To Do!";
                        } else {
                            editTodoOutcome.message = "To Do not found";
                        }
                    } else {
                        editTodoOutcome.message = "no worky";
                        editTodoOutcome.errors.push(err);
                    }
                    resolve(editTodoOutcome);
                });

            } catch(err) {
                editTodoOutcome.message = "rejected";
                editTodoOutcome.errors.push(err);
                console.log("REJECTED " + err);
                reject(editTodoOutcome);
            }
        });
    }

    //Method C2: Delete To Do
    static async deleteTodo(todoID) {
        const connection = db.getConnection();

        var deleteTodoOutcome = {
            todoID: todoID,
            success: false,
            message: "",
            errors: []
        };

        return new Promise(async function(resolve, reject) {
            try {
                const queryString = "DELETE FROM todo WHERE todo_id = ?";

                connection.query(queryString, [todoID], (err, rows) => {
                    if (!err) {
                        if (rows.affectedRows > 0) {
                            deleteTodoOutcome.success = true;
                            deleteTodoOutcome.message = "Successfully deleted To Do " + todoID;
                        } else {
                            deleteTodoOutcome.message = "To Do not found";
                        }
                    } else {
                        console.log("Failed to Delete To Do" + err);
                        deleteTodoOutcome.message = "Could not delete To Do " + todoID;
                        deleteTodoOutcome.errors.push(err);
                    }
                    resolve(deleteTodoOutcome);
                });
            } catch(err) {
                deleteTodoOutcome.message = "rejected";
                deleteTodoOutcome.errors.push(err);
                reject(deleteTodoOutcome);
            }
        });
    }

    //Method C3: Mark To Do Complete
    static async completeTodo(todoID) {
        return ToDo.updateTodoStatus(todoID, 'completed', true);
    }

    //Method C4: Mark To Do Open
    static async openTodo(todoID) {
        return ToDo.updateTodoStatus(todoID, 'open', false);
    }

    //METHODS D: Helper Methods
    //Method D1: Update To Do Status
    static async updateTodoStatus(todoID, status, shouldComplete) {
        const connection = db.getConnection();

        var statusOutcome = {
            todoID: todoID,
            status: status,
            success: false,
            message: "",
            errors: []
        };

        return new Promise(async function(resolve, reject) {
            try {
                const queryString = shouldComplete
                    ? "UPDATE todo SET status = ?, completed_at = CURRENT_TIMESTAMP WHERE todo_id = ?"
                    : "UPDATE todo SET status = ?, completed_at = NULL WHERE todo_id = ?";

                connection.query(queryString, [status, todoID], (err, rows) => {
                    if (!err) {
                        if (rows.affectedRows > 0) {
                            statusOutcome.success = true;
                            statusOutcome.message = "To Do status updated";
                        } else {
                            statusOutcome.message = "To Do not found";
                        }
                    } else {
                        statusOutcome.message = "no worky";
                        statusOutcome.errors.push(err);
                    }
                    resolve(statusOutcome);
                });
            } catch(err) {
                statusOutcome.message = "rejected";
                statusOutcome.errors.push(err);
                reject(statusOutcome);
            }
        });
    }

    //Method D2: Build To Do Object
    static buildTodo(row) {
        return {
            todoID: row.todo_id,
            organizationID: row.organization_id,
            projectID: row.project_id,
            groupID: row.group_id,
            listID: row.list_id,
            title: row.title,
            description: row.description,
            category: row.category,
            status: row.status,
            stage: row.stage,
            priority: row.priority,
            displayOrder: row.display_order,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            completedAt: row.completed_at
        };
    }

    //Method D3: Add Update Field
    static addUpdateField(fields, values, body, requestField, databaseField) {
        if (body[requestField] !== undefined) {
            fields.push(databaseField + " = ?");
            values.push(body[requestField]);
        } else if (body[databaseField] !== undefined) {
            fields.push(databaseField + " = ?");
            values.push(body[databaseField]);
        }
    }

    //Method D4: Get Body Value
    static getBodyValue(body, requestField, databaseField, defaultValue) {
        if (body[requestField] !== undefined) {
            return body[requestField];
        }

        if (body[databaseField] !== undefined) {
            return body[databaseField];
        }

        return defaultValue;
    }
}

module.exports = ToDo;
