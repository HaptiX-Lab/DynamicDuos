// Keep these lines for a best effort IntelliSense of Visual Studio 2017 and higher.
/// <reference path="./../../../Packages/Beckhoff.TwinCAT.HMI.Framework.12.760.59/runtimes/native1.12-tchmi/TcHmi.d.ts" />
(function (TcHmi) {

    console.log("Inside TrackingWindow.js!")
    console.log(TcHmi)

    // Store a reference to the symbol subscription
    let timeSymbol;
    let wheelPositionSymbol; 
    let canvas, ctx;
    let freq = 4; // Hz
    let phase = 0;
    let amplitude = 100;
    let height; 
    let width;

    // Called once the HMI environment is ready 
    function setup() {
        // Create a symbol for the PLC variable. 
        // Ensure the name matches what's in the symbol configuration
        timeSymbol = new TcHmi.Symbol('%s%PLC1.GVL.MAIN_SYSTEM_TIME%/s%');
        wheelPositionSymbol = new TcHmi.Symbol('%s%PLC1.GVL.ENCODER_1_DEGREES%/s%');

        console.log("Created time symbol:", timeSymbol)

        //// 'watch' sets up a subscription so we get updates automatically 
        //timeSymbol.watch(function (data) {
        //    //console.log("Watch function callback activated", data)
        //    if (data.error === TcHmi.Errors.NONE) {
        //        var newTimeValue = data.value;
        //        updateTimeDisplay(newTimeValue);
        //    } else {
        //        console.warn("Error reading gTime:", data.error);
        //    }
        //});s
        eventLoop();
    }

    function eventLoop(timestamp) {
        requestAnimationFrame(eventLoop); // signals the JS runtime to call this function again.

        // First start by checking for canvas and creating the context
        canvas = document.getElementById('waterfallCanvas');
        if (!canvas) {
            return;
        }
        ctx = canvas.getContext("2d");
        height = canvas.height;
        width = canvas.width;

        ctx.clearRect(0, 0, width, height); 
        drawStaticSineWave(amplitude, freq, phase);
        drawWheelPosition();
        phase += 0.1;
    }

    function drawStaticSineWave(amplitude, freq, phase, numPoints=1000) {

        // y coordinate essentially a coordinate in time
        let yPoints = [];
        let yPointsNormalized = [];
        const stepSize = height/numPoints; 
        const normalizedStepSize = 5 / numPoints; 
 

        for (let i = 0; i < numPoints; i++) {
            yPoints.push(i * stepSize); 
            yPointsNormalized.push(i * normalizedStepSize);
        }

        // Then we need to generate the coordinates by evaluating the sine function 
        let xPoints = [];
        for (let i = 0; i < numPoints; i++) {
            let sineVal = (width / 2) + amplitude*Math.sin(freq*yPointsNormalized[i] + phase);
            xPoints.push(sineVal);
        }

        // Then, we need to draw lines between points 
        let lastX = xPoints[0];
        let lastY = yPoints[0];

        ctx.lineWidth = 10; 
        ctx.strokeStyle = '#03fc20';
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#7ef291';

        for (let i = 0; i < numPoints; i++) {
            ctx.beginPath();
            ctx.moveTo(lastX, lastY);
            ctx.lineTo(xPoints[i], yPoints[i]);
            ctx.stroke();
            lastX = xPoints[i];
            lastY = yPoints[i];
        } 
    }

    function drawWheelPosition() {

        // First try and read the wheel position from the PLC
        let wheelPos; 
        wheelPositionSymbol.readEx(function (data) {
            if (data.error === TcHmi.Errors.NONE) {
                wheelPos = data.value; 
            } else {
                console.error("Wheel position not found!", data.error);
                return;
            }
        })
        if (!wheelPos) {
            return;
        }

        ctx.beginPath();
        ctx.arc(width/2 + wheelPos, height/2, 10, 0, 2*Math.PI);
        ctx.fillstyle = "red";
        ctx.fill();

    }

    // Since we don't want our function to be called until everything is set up, we register a 
    // callback to wait for this to occur.
    TcHmi.EventProvider.register('onInitialized', function (e, data) {
        console.log('System Initialized!');
        setup();
        e.destroy(); // Destroy listerner for this event as it only fires once.
    });

})(TcHmi);