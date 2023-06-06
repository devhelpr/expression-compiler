# State variables

state variables persists between recompilation of the script.
They are initialised in an initialisation block.

state:test {
a = 1,
b = 2,
c = "hello world"
}

frameUpdate {
  a = a + 1;
  b = b + 1;
  c = c + "!";
}

## different names for the above since it's not really "state" but just something that persists

persist:test {
    a = 1,
    b = 2,
    c = "hello world"
}