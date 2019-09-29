# mock-rel Documentation

Creates a Fake Database in your redux store; exposes functions to create/edit/delete/resolve rows and tables.

Gives you nested relational data, reducers/actions/resolvers to work with.

Useful for demo project which does not have backend, but needs CRUD functionality.


```bash
npm install mock-rel
```

Purpose 1: Fake DB inside your redux

Make fake database (with relational data) inside your redux store. 

Exposes actions to create/update/delete entries.

Exposes reducers, to merge with pre-existing redux setup in your project.


Purpose 2: Static Relational Data Generator

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
// create object to represent your new database
const Manager = new DataBase({ schema })

// if you want to control how deeply nested your rel object will be resolved, add this parameter.
// by default, 'default_query_lvl' is 5 
const Manager = new DataBase({ schema, default_query_lvl: 3})
```

The 'BACKREF' type lets the database know that this is a list of references from another model.

The 'OBJECT' type lets the database know that this is only one reference to another model.

All other fields must be listed in the schema (including id). But their field types (string, int, ect) are not explicitly defined.

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

Finally, your 'Manager' object exposes actions which will create/edit/delete data in your fake redux 'database':

```javascript
// set up your actions to work with your redux setup
const reduxDispatchFunctions = (dispatch) => ({
    addModel: bindActionCreators(Manager.actions.addModel, dispatch),
    editModel: bindActionCreators(Manager.actions.editModel, dispatch),
    deleteModel: bindActionCreators(Manager.actions.deleteModel, dispatch),
})

// ready to use in your component's submit button
const onSubmit = () => {
    return addModel({ modelName: 'Book', data: { name: 'boo', author: 2 }, schema })
}
```

## Payloads for Actions

Note, the actions must have a specific payload:


addModel() 

modelName : string -> must match schema key value for your model

schema : object -> your schema object (immutable)

data: object -> { <fieldName> : <data> }

   ...where the fieldName is the string, as matches the schema
   
   ...fieldName cannot be the 'id', because that is automatically taken care of when creating object (addModel())
   
   ...if the data type is 'OBJECT', the corresponding data must contain the reference object id:
   
   for example, the data creating a book, adding an author id:
   
   {'author': 4, 'name': 'foo'}
   
   another example, creating an author, adding a collection of book id's:
   
   {'books': [ 1, 2, 3 ], 'name': 'bar'}
   
   the added object's id must correspond to an existing entry in the fake database
   

addAllModels()

modelName : see above

schema : see above

id_automatic : boolean (default: true) -> if true, mock-rel will handle adding id's to the data and ignore your id data. otherwise you must add your own id.

data_list: list of objects -> see above for explanation of 'data' object in list


editModel()

modelName : see above

schema : see above

id: integer: id of object being edited

data : see above -> only contains fields being edited. for example, to edit a book field of the author model the edit payload would be:

   { modelName: 'Author', id: 1, data: { 'book': 4 }, schema: mySchema  }


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

These selectors are used to get the data from your redux store and resolve the relationships into nested objects.

This will return an object with nested relationship fields, ready to use for you UI.

```javascript
// wherever you have access to your redux state, you have access to your fake database:

// get all instances of the Book model
const allBookData = Manager.resolveAllModels(state, 'Book')
// get one Book with id = 3
const bookNumberThree = Manager.resolveModel(state, 'Book', 3)
```

Sometimes, you want to resolve your data by adding custom logic to fields. This step is done during the resolveModel() step.

First, create your resolver class:

```javascript
// notice that every field must be added to the object, including the id. the constructor will override how the ENTIRE object is resolved
export class Book {
    constructor({id, name, author}) {
        this.id = id
        this.name = name + 'fooooobar' // do crazy custom logic here...
        
        // 'author' is the actual Author object, not just the id that's in the redux store
        // if a 'BACKREF' field exists, it will be passed into the constructor as a list of resolved objects
        if (author) {this.author = author}
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