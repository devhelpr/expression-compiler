# structures

- arrays / vectors
- matrixes
- hashmaps
- linked lists
- trees
- graphs

## arrays / vectors

let x : [] = [1, 2, 3]; // deduces type to be [int] .. first element determines type
let y : [int] = [1, 2, 3];
let z : [int] = [1, 2, 3, "hello"]; // error: cannot assign string to int
let a : [float] = [1f, 2.0f, 3.0f];

let objects : [] = [{
    name: "hello",
    age: 10
}, {
    name: "world",
    age: 20
}];

let objects : [object] = [{
    name: "hello",
    age: 10
}, {
    name: "world",
    age: 20
}];

x.push(4);
y.push(4);
y.delete(0);
y[2] = 5;

a.push(4.0f);

## matrixes

- specify rows and columns

let x: matrix(2,3) = matrix[
    [1, 2, 3], 
    [4, 5, 6]
];

should mean:

(1)
|1 2 3|
|4 5 6|   

OR

(2)
|1 4|
|2 5|   
|3 6|

(1) makes more sense to me
