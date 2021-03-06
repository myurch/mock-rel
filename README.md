# mock-rel Documentation

Creates a Fake Database in your redux store; exposes functions to create/edit/delete/resolve rows and tables.

Gives you nested relational data, reducers/actions/resolvers to work with.

Useful for demo project which does not have backend, but needs CRUD functionality.


```bash
npm install mock-rel
```

#### Purpose 1: Fake DB inside your redux

Make fake database (with relational data) inside your redux store. 

Exposes actions to create/update/delete entries.

Exposes reducers, to merge with pre-existing redux setup in your project.


#### Purpose 2: Static Relational Data Generator (No Redux)

Generate static objects with nested, relational data to use with your UI for your demo website.


## Basic Setup

First, create your schema, detailing the desired relationships and models.

Note: you must have an 'id' field and it must be an integer.

```javascript
import { DataBase, createField, BACKREF, OBJECT } from 'mock-rel'
export const schema = {
    'Author': {
        'fields': {
            id: {},
            name: {},
            // list of books
            books: createField({type:BACKREF, modelName:'Book', backref:'author'}),
        },
    },
    'Book': {
        'fields': {
            id : {},
            name : {},
            // one author per book
            author : createField({type:OBJECT, modelName:'Author'})
        }
    }
}
```

The 'BACKREF' type lets the database know that this should be resolved as a list of references from another model.

The 'OBJECT' type lets the database know that this should be resolved as only one reference to another model.

All other fields must be listed in the schema (including id). But their field types (string, int, ect) are not explicitly defined.

Next, create your 'Manager' object

```javascript
// create object to manage your schema, actions, & reducers
const Manager = new DataBase({ schema })

// if you want to control how deeply nested your rel object will be resolved, add this parameter.
// by default, 'default_query_lvl' is 5 
const Manager = new DataBase({ schema, default_query_lvl: 3})
```

## Redux Setup

Next, add the mock-rel reducers to your already existing redux setup. Your 'Manager' object exposes the necessary reducers:

```javascript
// exposed reducers
const fakeDBReducers = Manager.reducers
// add this wherever you setup your reducers. example:
const allReducers = combineReducers({
    ...myOtherReducers,
    ...fakeDBReducers
})
```

Note: MUST have name 'fakeDBReducers' for the selectors to work properly

Finally, your 'Manager' object exposes actions which will create/edit/delete data in your fake redux 'database':

```javascript
// set up your actions to work with your redux setup
const reduxDispatchFunctions = (dispatch) => ({
    addModel: bindActionCreators(Manager.actions.addModel, dispatch),
    addAllModels: bindActionCreators(Manager.actions.addAllModels, dispatch),
    editModel: bindActionCreators(Manager.actions.editModel, dispatch),
    deleteModel: bindActionCreators(Manager.actions.deleteModel, dispatch),
    // see 'Initial State' section below
    hydrate: bindActionCreators(Manager.actions.hydrate, dispatch)
})

// ready to use in your component's submit button
const onSubmit = () => {
    return addModel({ modelName: 'Book', data: { name: 'boo', author: 2 }, schema })
}
```

### Actions added

mock-rel will add actions with the following types to your redux:

* "ADD_ALL_MODELS"
* "ADD_MODEL"
* "EDIT_MODEL"
* "DELETE_MODEL"
* "HYDRATE"

## Payloads for Actions (Redux Setup)

Note, the actions must have a specific payload:

If you want to reformat your payload in one place before it hits the reducers, see the 'Payload Reformat' section below.


### addModel() 

| prop name     | type          | info                                       |
| ------------- | ------------- | ------------------------------------------ |
| modelName     | string        | must match schema key value for your model |
| schema        | object        | your schema object (immutable)             |
| data          | object        | { fieldName : data }; see below more info  |

#### Notes for the 'data' prop:
   
   fieldName cannot be 'id', because that is automatically taken care of when creating object ( id_automatic only works for adding groups of data in addAllModels() )
   
   'OBJECT' field (author id added to Book model):
   
   {'author': 4, 'name': 'foo'}
   
   'BACKREF'  field (books id's added to Author model):
   
   {'books': [ 1, 2, 3 ], 'name': 'bar'}
   
   the added id's (under 'author' and 'books') must correspond to existing objects in the fake database
   
#### Notes for 'schema' prop:

Needed for relationship field backref's, and helper functions (such as 'validation' and 'preAction').
   

### addAllModels()

| prop name     | type                 | info                                                |
| ------------- | -------------------- | --------------------------------------------------- |
| modelName     | see above            | see above                                           |
| schema        | see above            | see above                                           |
| id_automatic  | boolean              | default: true; see below more info                  |
| data_list     | list of data objects | see above for explanation of 'data' object in list  |


#### Notes for the 'id_automatic' prop:

 if true (default), mock-rel will handle the id's in the db (and ignore any id data you provide). otherwise you must add your own id to the data object.
 
 id's start at integer 0


### editModel()

| prop name     | type          | info                                       |
| ------------- | ------------- | --------------------------- |
| modelName     | see above     | see above                   |
| id            | integer       | id of object being edited   |
| schema        | see above     | see above                   |
| data          | object        | see above & below more info |

#### Notes for the 'data' prop:

only contains fields being edited. for example, to edit a book field of the author model the edit payload would be:

   { modelName: 'Author', id: 1, data: { 'book': 4 }, schema: mySchema  }


### deleteModel()

| prop name     | type          | info                                       |
| ------------- | ------------- | ------------- |
| modelName     | see above     | see above     |
| id            | see above     | see above     |
| schema        | see above     | see above     |


## Resolving Models from the Database (Redux Setup)

When you need your data for a component, use the Manager object to access the selectors.

These selectors are used to get the data from your redux store and resolve the relationships into nested objects.

This will return an object with nested relationship fields, ready to use for you UI.

```javascript
// wherever you have access to your redux state, you have access to your fake database:

// get all instances of the Book model
const allBookData = Manager.resolveAllModels({state, modelName: 'Book'})
// get one Book with id = 3
const bookNumberThree = Manager.resolveModel({state, modelName: 'Book', id: 3})
```

## Payload Reformat (Redux Setup)

Sometimes, its inconvenient to change your action payload in the component itself: 

```javascript
// data not in correct format?
// good news! you don't need to format your payload here!
onSubmit = () => addModel(props)
```

Format your action's payload where its convenient. You can add helper functions to your schema to do so:

```javascript
const preActionFunc = ({state, action}) => {
    // do stuff with action.payload
    // return modified action
    return { state, action }
}
// add to schema:
const schema = {
    'Book': {
        'preAction': preActionFunc,
    }
}
```

This will give you a chance to reformat the data to fit mock-rel's requirements. Your preAction function will run first, before any other helper function (such as validation).


## Validation (Redux Setup)

Runs before every action (for a given model). Will exit action (will not add/delete/edit) if fails test.

```javascript
const bookValidation = ({state, action}) => {
    // return boolean true if passes, false otherwise
    return true
}
const schema = {
    'Book': {
        validation: bookValidation,
    }
}
```

Validation runs after any preAction functions


## Next Id Resolver (Redux Setup)

By default, when you create a model, the new id is the largest id in the state (for that model), incremented by 1. To override how id's are resolved:

```javascript
const bookIdResolver = ({state, modelName, data}) => {
    // custom logic
    // 'state' contains all the currently existing id's
    // return next id
    return 5
}
const schema = {
    'Book': {
        'id_resolver': bookIdResolver
    }
}
```

## Initial State (Redux Setup)

If you want to add initial data to your fake database when the app starts, use the Manager's hydration action:

```javascript
// dispatch an action when the app initializes to add books to fake redux store
// add id's to both the row entry and table keys
store.dispatch({ type: 'HYDRATE', payload: { hydration:
    {'Book': {
        3: {name: 'book_3..', author : 0, id: 3},
        4: {name: 'book_4', author : 0, id: 4}
    },'Author': {
        0: {name: 'author_0', id: 0}
    }}
}})
// or use the hydrate action:
const onClick= () => hydrate({
        hydration: {'Book': {}}
    })
```

Model order does not matter. You can add references (rel id's) to objects that don't exist yet.

## Example Data:

Important: when adding a relationship field USING AN ACTION (for example: { author: 3 }), that relationship model (author w/ id of 3) MUST already exist in the database.

```javascript
// must set id_automatic = false in the action's payload in order to register id props below;
// otherwise mock-rel assigns its own 'id' starting at 0
export const book_attr = [
    {name: 'book_4', author : 0, id: 4},
    {name: 'book_5', id: 5},
    {name: 'book_6', id: 6},
]

export const author_attr = [
    {name: 'author_0'},
    {name: 'author_1', books: [5,6]},
]
```

## Custom logic/ resolvers for fields.

It's not required to make classes for your models. Resolving models is handled for you. But if you need to add custom logic:

```javascript
// notice that every field must be added to the object, including the id.
// the constructor will override how the ENTIRE object is resolved
export class Book {
    constructor({id, name, author}) {
        this.id = id
        this.name = name + 'fooooobar' // do crazy custom logic here...
        
        // 'author' is the actual Author object, not just the id that's in the redux store
        // if a 'BACKREF' field exists, it will be passed into the constructor as a list of resolved objects
        this.author = author
        // virtual fields constructed from existing fields:
        if (author) {
            this.Foo = author.name + 'Bar'
        }
        // if no author exists, 'author' is undefined
    }
}

// now you need to add this 'Book' class to your schema under the 'model' key:

const schema = {
    'Book': {
        'fields' : {
            // ... stuff goes here...
        },
        'model': Book, // custom resolvers here...
    }
}

// ...now you're ready to save the world!
```

## No Redux

If you're not using redux and just want a way to resolve & manage static relational data:

```javascript

// create static data
export const book_attr = [
    {name: 'book_4', id: 4}, // set id_automatic = false to control the 'id' field
    {name: 'book_5', id: 5},
]
export const author_attr = [
    {name: 'author_0', books: [4,5]}
]
// create manager obj & schema the same way as before
// Custom resolvers still apply
const Manager = new DataBase({ schema })
// use the addTable() function to add data to your Manager object directly:
Manager.addTable({modelName: 'Book', data_list: book_attr, id_automatic: false})
// note: 'books' field in 'author_attr' can only be filled out after all 'book_attr' have already been added
Manager.addTable({modelName: 'Author', data_list: author_attr})
```


Your data is now stored in the 'Manager' object itself, instead of a redux state. To resolve it:

```javascript
const author1 = Manager.getRow({modelName: 'Author', id: 0})
const author2 = Manager.getRow({modelName: 'Author', id: 1})
```


## Redux- Thunk Tips

You may need to access other parts of the your redux store when saving/editing data.

Because your fake-database and form data are both in your redux store, you'll need access to the entire state during your onSubmit().

Example of how to use redux-thunk here:

```javascript
// wherever you have access to dispatch
const foo = (evt) => {
    return (dispatch, getState) => {
        // the whole state is here:
        const state = getState()
        // get data from other part of redux store
        const thing = state.thing_i_need
        dispatch(Manager.actions.addModel({ data: { thing }, ...evt }))
    }
}

const reduxDispatchFunctions = (dispatch) => ({
    addModel: bindActionCreators(foo, dispatch)
})
```