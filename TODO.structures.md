# structures

- arrays / vectors
- matrixes
- hashmaps
- linked lists
- trees
- graphs

## arrays / vectors

let x = [1, 2, 3];
let y : [int] = [1, 2, 3];
let z = [1, 2, 3, "hello"]; // error: cannot assign string to int
let a = [1f, 2.0f, 3.0f];

x.push(4);
y.push(4);
y.delete(0);
y[2] = 5;

a.push(4.0f);

## matrixes

- specify rows and columns

let x = [
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
