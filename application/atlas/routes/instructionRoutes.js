const express = require('express');
const instructionRouter = express.Router();
const instructions = require('../logic/instructions');

/*
FUNCTIONS A: All Functions Related to Getting Instructions
    1) Route A1: Get Instructions by Action Key

*/

//FUNCTIONS A: All Functions Related to Getting Instructions
//Route A1: Get Instructions by Action Key
instructionRouter.get('/instructions/:instruction_for', function(req, res) {
    instructions.getInstructionsByAction(req, res);
});

module.exports = instructionRouter;
