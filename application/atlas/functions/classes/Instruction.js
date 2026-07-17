const db = require('../../../functions/conn');

class Instruction {
    constructor(instructionID) {
        this.instructionID = instructionID;
        this.instructionFor = "";
        this.stepNumber = 0;
        this.title = "";
        this.instruction = "";
    }

    //METHODS A: GETTING INSTRUCTIONS
    //Method A1: Get Instructions by Action Key
    static async getInstructionsByAction(instructionFor) {
        const connection = db.getConnection();
        const queryString =
            "SELECT * FROM cloudpilot_instructions WHERE instruction_for = ? ORDER BY step_number ASC";

        var instructionsOutcome = {
            success: false,
            instructionFor: instructionFor,
            instructions: [],
            errors: []
        };

        return new Promise(async function(resolve, reject) {
            try {
                connection.query(queryString, [instructionFor], (err, rows) => {
                    if (!err) {
                        instructionsOutcome.instructions = rows.map((row) => Instruction.buildInstruction(row));
                        instructionsOutcome.success = true;
                        resolve(instructionsOutcome);
                    } else {
                        console.log("Failed to Select Instructions" + err);
                        instructionsOutcome.errors.push(err);
                        reject(instructionsOutcome);
                    }
                });
            } catch(err) {
                instructionsOutcome.errors.push(err);
                reject(instructionsOutcome);
            }
        });
    }

    //METHODS B: Helper Methods
    //Method B1: Build Instruction Object
    static buildInstruction(row) {
        return {
            instructionId: row.instruction_id,
            instructionFor: row.instruction_for,
            stepNumber: row.step_number,
            title: row.title,
            instruction: row.instruction,
            image: row.image,
            warnings: row.warnings,
            estimatedTime: row.estimated_time,
            optional: row.optional === 1 || row.optional === true,
            createdAt: row.created_at,
            updatedAt: row.updated_at
        };
    }
}

module.exports = Instruction;
