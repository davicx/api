// state.js
function createDefaultState() {
  return {
    pendingAction: null,
    missing: [],
    collected: {} 
  };
}
/*

state = {
  pendingAction: {
    type: null,
    missing: [],
    collected: {}
  }
}
  */

/*
function createDefaultState() {
  return {
    pendingAction: {
      type: null,
      missing: [],
      collected: {}
    }
  };
}
*/

module.exports = {
  createDefaultState
};


/*
// state.js
const state = {
  pendingAction: null
};

module.exports = state;
*/

