# Custom block names

```
let a = 1;
frameUpdate {
  setControlPoint(a,a)
  a = a+deltaTime*0.05;
}
```


const frameUpdater = registerCustomBlock("frameUpdate")

frameUpdater({deltaTime: 0.1});

```
    function __ (payload) { 
        let a = 1;
        function frameUpdate(framePayload) {
            setControlPoint(a,a)
            a = a + framePayload.deltaTime*0.05;
        }
        return {
          frameUpdate          
        }
    }


    const result = __({})
    result.frameUpdate({deltaTime: 0.1});

```

## How to handle multiple blocks with the same name?

```
let a = 1;
let b = 1;
frameUpdate {
  setControlPoint1(a,a)
  a = a+deltaTime*0.05;
}

frameUpdate {
  setControlPoint2(b,b)
  b = b+deltaTime*0.05;
}
```

... in the above.. both frameUpdate blocks should be called when calling the returned frameUpdater function from registerCustomBlock
