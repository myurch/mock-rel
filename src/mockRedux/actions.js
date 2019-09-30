export const actionDisp = (type) => (payload) => ({type, payload})

export const addAllModels = actionDisp("ADD_ALL_MODELS")
export const addModel = actionDisp("ADD_MODEL")
export const editModel = actionDisp("EDIT_MODEL")
export const deleteModel = actionDisp("DELETE_MODEL")
export const hydrate = actionDisp("HYDRATE")