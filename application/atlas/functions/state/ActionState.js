/*
EXAMPLE STATE
{
  pendingAction: "scan_ec2",
  missing: [],
  asked: {},
  collected: {
    region: "us-west-2",
    instanceId: "i-123"
  }
}

TEST: manually set state
actionState.setPendingAction(conversationID, "scan_ec2", ["region"]);

TEST
actionState.setRegion(conversationID, "us-east-1");
console.log("TEST: Updated state after region");
actionState.print(conversationID);

*/

class ActionState {
  constructor() {
    this.store = new Map();
  }

  // STEP 1: Ensure state exists
  getState(conversationId) {
    if (!this.store.has(conversationId)) {
      this.store.set(conversationId, {
        pendingAction: null,
        collected: {},
        missing: [],
        asked: {}
      });
    }

    const state = this.store.get(conversationId);

    if (!state.asked) {
      state.asked = {};
    }

    return state;
  }

  // STEP 2: Start a new action
  setPendingAction(conversationId, action, missingFields = []) {
    const state = this.getState(conversationId);

    state.pendingAction = action;
    state.missing = [...missingFields];
    state.collected = {};
    state.asked = {};
  }

  // STEP 3: Get current action status (FIXED: consistent naming)
  getActionStatus(conversationId) {
    const state = this.getState(conversationId);

    return {
      pendingAction: state.pendingAction,
      missing: state.missing,
      collected: state.collected,
      asked: state.asked
    };
  }

  // STEP 3.5: Mark missing field as already asked
  markAsked(conversationId, field) {
    const state = this.getState(conversationId);

    state.asked[field] = true;
  }

  // STEP 4: Set region (specific helper)
  setRegion(conversationId, region) {
    const state = this.getState(conversationId);

    state.collected.region = region;
    state.missing = state.missing.filter(field => field !== "region");
  }

  // STEP 5: Generic field setter
  setField(conversationId, field, value) {
    const state = this.getState(conversationId);

    state.collected[field] = value;
    state.missing = state.missing.filter(f => f !== field);
  }

  // STEP 6: Check if ready to execute
  isReady(conversationId) {
    const state = this.getState(conversationId);
    return state.pendingAction && state.missing.length === 0;
  }

  // STEP 7: Clear state after completion
  clear(conversationId) {
    this.store.delete(conversationId);
  }

  // STEP 8: Debug helper
  print(conversationId) {
    const state = this.getState(conversationId);
    console.log("STATE:", JSON.stringify(state, null, 2));
  }
}

module.exports = new ActionState();

/*
//EXAMPLE
{
  pendingAction: "scan_ec2",
  missing: [],
  collected: {
    region: "us-west-2",
    instanceId: "i-123"
  }
}


*/

/*
class ActionState {
    constructor() {
      this.store = new Map();
    }
  
    // STEP 1: Ensure state exists
    getState(conversationId) {
      if (!this.store.has(conversationId)) {
        this.store.set(conversationId, {
          pendingAction: null,
          collected: {},
          missing: []
        });
      }
  
      return this.store.get(conversationId);
    }
  
    // STEP 2: Start a new action
    setPendingAction(conversationId, action, missingFields = []) {
      const state = this.getState(conversationId);
  
      state.pendingAction = action;
      state.missing = [...missingFields];
      state.collected = {};
    }
  
    // STEP 3: Get current action status
    getActionStatus(conversationId) {
      const state = this.getState(conversationId);
  
      return {
        action: state.pendingAction,
        missing: state.missing,
        collected: state.collected
      };
    }
  
    // STEP 4: Set region (your main use case)
    setRegion(conversationId, region) {
      const state = this.getState(conversationId);
  
      state.collected.region = region;
  
      state.missing = state.missing.filter(field => field !== "region");
    }
  
    // STEP 5: Generic field setter (useful later)
    setField(conversationId, field, value) {
      const state = this.getState(conversationId);
  
      state.collected[field] = value;
  
      state.missing = state.missing.filter(f => f !== field);
    }
  
    // STEP 6: Check if ready to execute
    isReady(conversationId) {
      const state = this.getState(conversationId);
      return state.pendingAction && state.missing.length === 0;
    }
  
    // STEP 7: Clear state after completion
    clear(conversationId) {
      this.store.delete(conversationId);
    }
  
    // STEP 8: Debug helper (you’ll use this a LOT)
    print(conversationId) {
      const state = this.getState(conversationId);
      console.log("STATE:", JSON.stringify(state, null, 2));
    }
  }
  
  module.exports = new ActionState();
  */