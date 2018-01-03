function initializeTestCanvas(testCanvas)
{
    testCanvas.width = 20;
    testCanvas.height = 20;
    var testCtx = testCanvas.getContext("2d");
    testCtx.fillStyle = "rgb(255, 0, 0)";
    testCtx.fillRect(0, 0, 10, 10);
    testCtx.fillStyle = "rgb(0, 255, 0)";
    testCtx.fillRect(10, 0, 10, 10);
    testCtx.fillStyle = "rgb(0, 0, 255)";
    testCtx.fillRect(0, 10, 10, 10);
    testCtx.fillStyle = "rgb(0, 0, 0)";
    testCtx.fillRect(10, 10, 10, 10);
}

function initializeImageData(imgData, width, height)
{
    for (var i = 0; i < width * height * 4; i+=4) {
        imgData.data[i] = 0;
        imgData.data[i + 1] = 0;
        imgData.data[i + 2] = 0;
        imgData.data[i + 3] = 255; //alpha channel: 255
    }
    var halfWidth = width/2;
    var halfHeight = height/2;
    // initialize to R, G, B, Black, with each one 10*10 pixels
    for (var i = 0; i < halfHeight; i++)
        for (var j = 0; j < halfWidth; j++)
            imgData.data[i * width * 4 + j * 4] = 255;
    for (var i = 0; i < halfHeight; i++)
        for (var j = halfWidth; j < width; j++)
            imgData.data[i * width * 4 + j * 4 + 1] = 255;
    for (var i = halfHeight; i < height; i++)
        for (var j = 0; j < halfWidth; j++)
            imgData.data[i * width * 4 + j * 4 + 2] = 255;
}
