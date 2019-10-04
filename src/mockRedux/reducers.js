import {handle_add_all_models, handle_add_model, handle_backref, checkSchemaIntegrity, checkValidation, checkPreAction} from '../utils'
import * as R from 'ramda'

const initState = {}

export const fakeDBReducer = (state = initState, action) => {
    switch (action.type) {
        case 'ADD_ALL_MODELS': {
            // schema can be undefined
            const result = checkPreAction(state, action)
            state = result.state
            action = result.action

            if (!(checkValidation(state, action))) {
                return state
            }
            const {modelName, data_list, id_automatic, schema} = {...action.payload}
            checkSchemaIntegrity(schema)

            let table = handle_add_all_models({modelName, data_list, id_automatic, state})

            R.map(data => (
                state = handle_backref({schema, modelName, state, data, nextId: data.id})
            ), data_list)

            table = R.mergeDeepLeft(table, R.propOr({}, [modelName], state))
            return R.assocPath([modelName], table, state)
        }
        case 'ADD_MODEL': {
            // schema can be undefined
            const result = checkPreAction(state, action)
            state = result.state
            action = result.action

            if (!(checkValidation(state, action))) {
                return state
            }
            const {modelName, data, schema} = {...action.payload}
            checkSchemaIntegrity(schema)

            const props = handle_add_model({state, modelName, data, schema})
            state = props.state
            const nextId = props.nextId

            // if schema exists can add backref objects from list
            return handle_backref({schema, modelName, state, data, nextId})
        }
        case 'EDIT_MODEL': {
            // schema can be undefined
            const result = checkPreAction(state, action)
            state = result.state
            action = result.action

            if (!(checkValidation(state, action))) {
                return state
            }
            const {modelName, data, id, schema} = {...action.payload}
            checkSchemaIntegrity(schema)

            const props = handle_add_model({state, modelName, data, nextId: id, schema})
            state = props.state
            const nextId = props.nextId

            // if schema exists can add backref objects from list
            return handle_backref({schema, modelName, state, data, nextId})
        }
        case 'DELETE_MODEL': {
            const result = checkPreAction(state, action)
            state = result.state
            action = result.action

            if (!(checkValidation(state, action))) {
                return state
            }
            const {modelName, id} = {...action.payload}
            return R.dissocPath([modelName, id], state)
        }
        case 'HYDRATE':
            return R.propOr(state, 'hydration', action.payload)
        default:
            return state
    }
}