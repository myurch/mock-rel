# mock-rel Documentation

Useful for startup project which focuses on frontend, giving it basic CRUD functionality without needing backend.


Purpose 1: Fake DB inside your redux

Make fake database (with relational data) inside your redux store. 

Exposes actions to create/update/delete entries.

Exposes reducers, to merge with pre-existing redux setup in your project.


Purpose 2: Static Relational Data Generator

Generate objects with nested, relational data to use with your UI for your demo website.

```bash
npm install mock-rel
```

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
            books: createField({type:BACKREF, modelName:'Book', backref:'author'}), // list of books
        },
    },
    'Book': {
        'fields': {
            id : {},
            name : {},
            author : createField({type:OBJECT, modelName:'Author'}) // one author per book
        }
    }
}
const Manager = new DataBase({ schema })
```

The 'BACKREF' type lets the database know that this is a list of references from another model.

The 'OBJECT' type lest the database know that this is one reference to another model.

All other fields must be listed in the schema (including id). But their field types (string, int, ect) do not need to be explicitly defined.

Next, add the mock-rel reducers to your already existing redux setup. Your 'Manager' object exposes the necessary reducers:

```javascript
const fakeDBReducers = Manager.reducers
// add this wherever you setup your reducers
const createRootReducer = history => combineReducers({
    router: connectRouter(history),
    ...reducers,
    ...fakeDBReducers
})
```

Finally, your 'Manager' object exposes actions which will create/edit/delete data in your fake redux 'database':

```javascript
// set up your actions to work with redux
const reduxDispatchFunctions = (dispatch) => ({
    addModel: bindActionCreators(Manager.actions.addModel, dispatch),
    editModel: bindActionCreators(Manager.actions.editModel, dispatch),
    deleteModel: bindActionCreators(Manager.actions.deleteModel, dispatch),
})

// ready to use in your component
const onClick = () => {
    return addModel({ modelName: 'Book', data: { name: 'boo', author: 2 }, schema })
}
```

## Payloads for Actions

Note, the actions must have a specific payload:


addModel() 

modelName : string -> must match schema key value for your model

schema : object -> your schema object (immutable)

data: object -> { <fieldName> : <data> }

   ...where the fieldName cannot be the 'id', because that is automatically taken care of
   
   ...if the data type is 'OBJECT', the corresponding data type must contain the reference object id:
   
   for example, the data creating a book:
   
   {'author': 4, 'name': 'foo'}
   
   another example, creating an author:
   
   {'books': [ 1, 2, 3 ], 'name': 'bar'}
   

addAllModels()

modelName : see above

schema : see above

id_automatic : boolean (default: true) -> if true, mock-rel will handle adding id's to the data. otherwise you must add your own id.

data_list: list of objects -> see above for explanation of 'data' object in list

editModel()

modelName : see above

schema : see above

id: integer: id of object being edited

data : see above -> only contains fields being edited for example, to edit a book field of the author model the edit payload would be:

   { modelName: 'Author', id: 1, data: { 'book': 4 }, schema  }


deleteModel()

modelName: see above

id: see above

## Example Data:

Important: when adding a relationship field USING AN ACTION (for example: { author: 3 }), that relationship model (author w/ id of 3) MUST already exist in the database.

```javascript
// must set id_automatic = false in order to register id props below; otherwise mock-rel assigns its own 'id'
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

## Resolving Models from the Database

When you need your data for a component, use the Manager object to access the selectors.

This will return an object with nested relationship fields, ready to use for you UI.

```javascript
// wherever you have access to your redux state, you have access to your fake database:

// get all instances of one model
const allBookData = Manager.resolveAllModels(state, 'Book')
// get one instance of one model
const bookNumberThree = Manager.resolveModel(state, 'Book', 3)
```

Sometimes, you want to resolve your data by adding custom logic to fields.

First, create your resolver class:

```javascript
// notice that every field must be added to the object, including the id
export class Book {
    constructor({id, name, author}) {
        this.id = id
        this.name = name + 'fooooobar' // do crazy custom logic here...
        
        // 'author' is the actual Author object, not just the id
        if (author) {this.author = author}
    }
}

// also, add this model to your schema under the 'model' key:

const schema = {
    'Book': {
        'fields' : {
        },
        'model': Book,
    }
}

// ...now you're ready to save the world!
```