import * as reducers from "./mockRedux/reducers"
import * as Actions from "./mockRedux/actions"
import * as R from "ramda"
import {handle_add_all_models, handle_backref, checkSchemaIntegrity} from "./utils"
import {OBJECT, BACKREF} from './consts'
const _selDB = state => R.propOr({}, 'fakeDBReducer', state)
const _selMod = (state, modelName, id) => R.pathOr({}, ['fakeDBReducer', modelName, id], state)
const _selAllMod = (state, modelName) => R.pathOr({}, ['fakeDBReducer', modelName], state)

export class DataBase {
    constructor({schema, default_query_lvl}){
        checkSchemaIntegrity(schema)
        this.db = {}
        this.schema = schema

        if (default_query_lvl === undefined) {
            default_query_lvl = 5
        }

        this.default_query_lvl = default_query_lvl
        this.reducers = reducers
        this.actions = Actions

        // redux- only variables:

        // select raw database
        this.selectDB = _selDB
        this.selectModel = _selMod
        this.selectAllModels = _selAllMod

        // resolve database into objects
        this.resolveModel = this._relMod
        this.resolveAllModels = ({state, modelName}) => {
            // returns list of strings (Object.keys) even tho integers
            let allIds = Object.keys(R.propOr({}, modelName, _selDB(state)))
            allIds = R.map(v => Number(v), allIds)
            return R.map(id => this._relMod({state, modelName, id}), allIds)
        }
    }

    _relMod({state, modelName, id}) {
        return this.getRow({modelName, id, fakeDB: _selDB(state)})
    }

    // models added directly to DataBase object are considered static, not connected to redux, and added in
    // large groups at a time, rather than one by one, as a user would add them.
    addTable({modelName, data_list, id_automatic}){
        // get table from data_list
        const table = handle_add_all_models({modelName, data_list, id_automatic})

        // add backref fields
        R.map(data => {
            this.db = handle_backref({schema: this.schema, modelName, state: this.db, data, nextId: data.id})
        }, data_list)

        this.db[modelName] = table
    }

    // used for both static and redux, to generate objects with resolved fields
    _find_instance({ modelName, backref, back_id, fakeDB, lvl }){
        const table = R.propOr({}, modelName, fakeDB)

        let result = []
        R.forEach(
            (value) => {
                if (value[backref] === back_id) {
                    // when call _find_instance(), lvl is already decremented, pass in 'lvl' here:
                    const newValue = this.getRow({modelName, id: value.id, fakeDB, lvl})
                    result = R.append(newValue, result)
                }
            },
            Object.values(table)
        )
        return result
    }

    // used for both static and redux, to generate objects with resolved fields
    getRow({modelName, id, fakeDB, lvl = this.default_query_lvl}) {

        if (id === undefined) {
            return null
        }

        let self = this
        if (!fakeDB) {
            fakeDB = this.db
        }
        const modelData = R.pathOr({}, [modelName, id], fakeDB)  // {name: 'asdf', id: 1, author: 1}

        const fields = this.schema[modelName]['fields']

        const results = {}
        R.forEach(
            (field)=>{
                const fieldData = fields[field]

                if (R.prop('type', fieldData) === OBJECT) {
                    if (lvl > 0) {
                        const newId = R.prop(field, modelData)
                        results[field] = self.getRow({
                            modelName: fieldData.modelName,
                            id: newId,
                            fakeDB,
                            lvl: (lvl - 1)
                        })
                    }
                } else if (R.prop('type', fieldData) === BACKREF) {
                    if (lvl > 0) {
                        const backref = fieldData.backref
                        results[field] = self._find_instance({
                            modelName: fieldData.modelName,
                            backref,
                            back_id: id,
                            fakeDB,
                            lvl: (lvl -1)
                        })
                    }

                } else {
                    results[field] = modelData[field]
                }
            },
            Object.keys(fields)
        )
        const model = R.path(['schema', modelName, 'model'], this)
        if (model){
            return new model(results)
        }
        return results
    }

}