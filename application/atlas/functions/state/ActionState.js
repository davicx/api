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