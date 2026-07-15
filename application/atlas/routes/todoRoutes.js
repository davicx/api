const express = require('express');
const todoRouter = express.Router();
const todos = require('../logic/todo');

/*
FUNCTIONS A: All Functions Related to To Dos
    1) Route A1: Create To Do
    2) Route A2: Edit To Do
    3) Route A3: Delete To Do

FUNCTIONS B: All Functions Related to Getting To Dos
    1) Route B1: Get All To Dos
    2) Route B2: Get To Do by ID
    3) Route B3: Get To Dos by Stage
    4) Route B4: Get Open To Dos
    5) Route B5: Get Completed To Dos

FUNCTIONS C: All Functions Related to To Do Actions
    1) Route C1: Mark To Do Complete
    2) Route C2: Mark To Do Open

*/

//FUNCTIONS A: All Functions Related to To Dos
//Route A1: Create To Do
todoRouter.post('/todo/create', function(req, res) {
    todos.createTodo(req, res);
});

//Route A2: Edit To Do
todoRouter.post('/todo/edit', function(req, res) {
    todos.editTodo(req, res);
});

//Route A3: Delete To Do
todoRouter.post('/todo/delete', function(req, res) {
    todos.deleteTodo(req, res);
});


//FUNCTIONS B: All Functions Related to Getting To Dos

//Route B1: Get All To Dos
todoRouter.get('/todos', function(req, res) {
    todos.getAllTodos(req, res);
});

//Route B2: Get To Do by ID
todoRouter.get('/todo/:todo_id', function(req, res) {
    todos.getTodo(req, res);
});

//Route B3: Get To Dos by Stage
todoRouter.get('/todos/stage/:stage', function(req, res) {
    todos.getTodosByStage(req, res);
});

//Route B4: Get Open To Dos
todoRouter.get('/todos/open', function(req, res) {
    todos.getOpenTodos(req, res);
});

//Route B5: Get Completed To Dos
todoRouter.get('/todos/completed', function(req, res) {
    todos.getCompletedTodos(req, res);
});


//FUNCTIONS C: All Functions Related to To Do Actions

//Route C1: Mark To Do Complete
todoRouter.post('/todo/complete', function(req, res) {
    todos.completeTodo(req, res);
});

//Route C2: Mark To Do Open
todoRouter.post('/todo/open', function(req, res) {
    todos.openTodo(req, res);
});

module.exports = todoRouter;
