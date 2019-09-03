import {handle_add_all_models, handle_add_model, handle_backref, checkSchemaIntegrity, checkValidation} from '../utils'
import * as R from 'ramda'

const initState = {}

export const fakeDBReducer = (state = initState, action) => {
    const payload = action.payload
    switch (action.type) {
        case 'ADD_ALL_MODELS': {
            // schema can be undefined
            const {modelName, data_list, id_automatic, schema} = {...payload}
            if (!(checkValidation(state, action))) {
                return state
            }
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
            const {modelName, data, schema} = {...payload}
            if (!(checkValidation(state, action))) {
                return state
            }
            checkSchemaIntegrity(schema)

            const props = handle_add_model({state, modelName, data, schema})
            state = props.state
            const nextId = props.nextId

            // if schema exists can add backref objects from list
            return handle_backref({schema, modelName, state, data, nextId})
        }
        case 'EDIT_MODEL': {
            // schema can be undefined
            const {modelName, data, id, schema} = {...payload}
            if (!(checkValidation(state, action))) {
                return state
            }
            checkSchemaIntegrity(schema)

            const props = handle_add_model({state, modelName, data, nextId: id, schema})
            state = props.state
            const nextId = props.nextId

            // if schema exists can add backref objects from list
            return handle_backref({schema, modelName, state, data, nextId})
        }
        case 'DELETE_MODEL': {
            const {modelName, id} = {...payload}
            if (!(checkValidation(state, action))) {
                return state
            }
            return R.dissocPath([modelName, id], state)
        }
        default:
            return state
    }
}