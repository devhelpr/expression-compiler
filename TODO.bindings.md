# Bindings

let x = 1;
let:live y = x + 1;

// y returns value 2

x = 2;

// y returns value 3

mark x or y as binding or "live value" ??
... if y is a "live value" can it then be updated or reassigned it self??
so ... should "y = 3" be allowed?
