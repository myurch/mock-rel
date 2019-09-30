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
```

The 'BACKREF' type lets the database know that this is a list of references from another model.

The 'OBJECT' type lets the database know that this is only one reference to another model.

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
})

// ready to use in your component's submit button
const onSubmit = () => {
    return addModel({ modelName: 'Book', data: { name: 'boo', author: 2 }, schema })
}
```

## Payloads for Actions (Redux Setup)

Note, the actions must have a specific payload:


### addModel() 

| prop name     | type          | info                                       |
| ------------- | ------------- | ------------------------------------------ |
| modelName     | string        | must match schema key value for your model |
| schema        | object        | your schema object (immutable)             |
| data          | object        | { fieldName : data }; see below more info  |

#### Notes for the 'data' prop:
   
   fieldName cannot be 'id', because that is automatically taken care of when creating object (id_automatic only works for adding groups of data)
   
   'OBJECT' field (author id added to Book model):
   
   {'author': 4, 'name': 'foo'}
   
   'BACKREF'  field (books id's added to Author model):
   
   {'books': [ 1, 2, 3 ], 'name': 'bar'}
   
   the added id's (under 'author' and 'books') must correspond to existing objects in the fake database
   

### addAllModels()

| prop name     | type                 | info                                                |
| ------------- | -------------------- | --------------------------------------------------- |
| modelName     | see above            | see above                                           |
| schema        | see above            | see above                                           |
| id_automatic  | boolean              | default: true; see below more info                  |
| data_list     | list of data objects | see above for explanation of 'data' object in list  |


#### Notes for the 'id_automatic' prop:

 if true, mock-rel will handle adding id's to the data and ignore your id data. otherwise you must add your own id.
 
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


## Resolving Models from the Database (Redux Setup)

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

## Payload Reformat (Redux Setup)

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
// use the add_all_models() function to add data to your Manager object directly:
Manager.add_all_models({modelName: 'Book', data_list: book_attr, id_automatic: false})
// note: 'books' field in 'author_attr' can only be filled out after all 'book_attr' have already been added
Manager.add_all_models({modelName: 'Author', data_list: author_attr})
```


Your data is now stored in the 'Manager' object itself, instead of a redux state. To resolve it:

```javascript
const author_1 = Manager.get_instance({modelName: 'Author', id: 0})
const author_2 = Manager.get_instance({modelName: 'Author', id: 1})
```