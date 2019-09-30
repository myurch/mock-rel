import * as R from 'ramda'

import {BACKREF} from './consts'

export const createField = ({type, modelName=null, backref=null}) => {
    return({
        type: type,
        backref: backref,
        modelName: modelName,
    })
}
// state can be null
export const handle_add_all_models = ({modelName, data_list, id_automatic, state}) => {
    if (!(typeof(modelName) === 'string')){
        throw TypeError('add_all_models() must take String for modelName')
    }
    if (id_automatic === undefined) {
        id_automatic = true
    }

    let table = {}
    if (id_automatic) {
        let idx = resolveNextid({state, modelName})
        R.forEach((obj)=> {
            obj.id = idx
            table = R.assoc(idx.toString(), obj, table)
            idx ++
        }, data_list)
    } else {
        R.forEach((obj)=> {
            table = R.assoc(R.prop('id', obj).toString(), obj, table)
            }, data_list)
    }
    return table
}

let objMax = (obj) => {
    if(obj) {
        let keys = Object.keys(obj);
        let arr = keys.map(key => obj[key]);
        if(arr.length > 0) {
            arr.sort(function(a, b){return a-b})
            return (arr[arr.length - 1]) + 1;
        }
    }
    return 0;
}

const resolveNextid = ({state, modelName, data, schema}) => {
    const customResolver = R.path([modelName, 'id_resolver'], schema)
    if (customResolver) {
        return customResolver({state, modelName, data})
    } else {
        // look at all id's already stored in the state; return max + 1
        const ids = R.pluck(['id'], R.propOr({}, modelName, state))
        return objMax(ids)
    }
}

export const handle_backref = ({schema, modelName, state, data, nextId}) => {
    if (schema) {
        R.map(fieldName => {
            const type = R.path([modelName, 'fields', fieldName], schema)
            if (R.prop('type', type) === BACKREF) {

                R.map(relId => {
                    // make sure id's are strings if going into assocPath()
                    const relPath = [
                        R.prop('modelName', type), // modelName
                        relId.toString(), // id
                        R.prop('backref', type), // fieldName
                    ]
                    const modelExists = R.pathOr(false,
                        R.slice(0, -1, relPath),
                        state
                    )

                    if ( typeof(modelExists) === typeof(false) ) {
                        throw TypeError(`Backref obj does not exist for model: ${modelName}, field: ${fieldName}`)
                    } else {
                        state = R.assocPath(relPath, nextId, state)
                    }
                }, R.prop(fieldName, data))
            }
        }, Object.keys(data))
    }
    return state
}

export const handle_add_model = ({state, modelName, data, nextId, schema}) => {
    if (!(typeof(modelName) === 'string')){
        throw TypeError('add_all_models() must take String for modelName')
    }
    if (!nextId){
        nextId = resolveNextid({state, modelName, data, schema})
    }
    // add associated data

    const row = R.assocPath(['id'], nextId, data)
    state = R.assocPath([modelName, nextId.toString()], row, state)
    return {state, nextId}
}

export const checkSchemaIntegrity = (schema) => {
    if (schema) {
        R.mapObjIndexed((num, key, obj) => {
            if (!(R.prop(['fields'], num))) {
                throw TypeError('mock-rel schema integrity error. Every model should have "fields" key')
            }
        }, schema)
    }
}

// return boolean true if passes
export const checkValidation = (state, action) => {
    const modelName = R.path(['payload', 'modelName'], action)
    const validation = R.path(['payload', 'schema', modelName, 'validation'], action)
    if (validation) {
        return validation({state, action})
    }
    return true
}

// return boolean true if passes
export const checkPreAction = (state, action) => {
    const modelName = R.path(['payload', 'modelName'], action)
    const preAction = R.path(['payload', 'schema', modelName, 'preAction'], action)
    if (preAction) {
        return preAction({state, action})
    }
    return { state, action }
}


